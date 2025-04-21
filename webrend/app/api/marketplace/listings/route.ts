import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '../../../lib/firebase-admin';
import { CollectionReference, Query, DocumentData } from 'firebase-admin/firestore';

// Import the types
import { MarketplaceListing } from '../list-repo/route';

// Define new type for Firestore timestamps
type FirestoreTimestamp = {
  toDate: () => Date;
};

// Interface for document as stored in Firestore
interface FirestoreDocument extends Omit<MarketplaceListing, 'createdAt' | 'updatedAt'> {
  createdAt?: string | FirestoreTimestamp;
  updatedAt?: string | FirestoreTimestamp;
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    
    // Start with base query
    let listingsQuery: CollectionReference<DocumentData> | Query<DocumentData> = db.collection('listings');
    
    // Filter by username if provided
    if (username) {
      listingsQuery = listingsQuery.where('seller.username', '==', username);
    }
    
    // Execute the query
    const listingsSnapshot = await listingsQuery.get();
    
    if (listingsSnapshot.empty) {
      // Return empty array when no listings found
      console.log('No listings found in Firestore');
      return NextResponse.json({
        success: true,
        listings: []
      });
    }
    
    // Convert Firebase snapshot to listings array
    const listings = listingsSnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreDocument;
      
      // Convert Firestore timestamp to ISO string if needed
      const createdAt = typeof data.createdAt === 'object' && data.createdAt?.toDate 
        ? data.createdAt.toDate().toISOString() 
        : data.createdAt;
        
      const updatedAt = typeof data.updatedAt === 'object' && data.updatedAt?.toDate
        ? data.updatedAt.toDate().toISOString()
        : data.updatedAt;
      
      // Return the normalized listing
      return {
        ...data,
        id: doc.id,
        docId: doc.id,
        createdAt,
        updatedAt
      } as MarketplaceListing;
    });
    
    return NextResponse.json({
      success: true,
      listings
    });
    
  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch listings';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 