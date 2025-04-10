import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '../../../../../lib/firebase-admin';

// Import helpers
import { MarketplaceListing } from '../../../list-repo/route';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = parseInt(params.id);
    
    if (isNaN(listingId)) {
      return NextResponse.json(
        { error: 'Invalid listing ID' },
        { status: 400 }
      );
    }
    
    // Get the listing document from Firestore
    const listingDoc = await db.collection('listings').doc(listingId.toString()).get();
    
    if (!listingDoc.exists) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }
    
    // Mark the listing as sold
    await db.collection('listings').doc(listingId.toString()).update({
      sold: true,
      updatedAt: new Date().toISOString()
    });
    
    // Get the updated listing
    const updatedDoc = await db.collection('listings').doc(listingId.toString()).get();
    const updatedListing = updatedDoc.data() as MarketplaceListing;
    
    return NextResponse.json({
      success: true,
      message: 'Listing marked as sold',
      listing: updatedListing
    });
    
  } catch (error) {
    console.error('Error marking listing as sold:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 