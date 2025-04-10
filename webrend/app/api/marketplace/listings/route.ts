import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';

// Import the basic type
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

export async function GET() {
  try {
    // Get all listings from Firebase
    const listingsSnapshot = await db.collection('listings').get();
    
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
        id: parseInt(doc.id) || data.id,
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