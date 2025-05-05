import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '../../../lib/firebase-admin';
import { generateSlug } from '../../../lib/utils';

// Define types for our marketplace listings
export interface MarketplaceListing {
  id: string | number;
  docId?: string; // Add explicit document ID field for Firestore
  name: string;
  description: string;
  price?: number;
  subscriptionPrice?: number;
  isSubscription: boolean;
  imageUrl: string;
  seller: {
    id: string; // Make sure id is required
    username: string;
    avatarUrl?: string;
  };
  repoUrl: string;
  stars: number;
  forks: number;
  stripeProductId?: string;
  stripePriceId?: string;
  sold?: boolean;
  createdAt?: string;
  updatedAt?: string;
  slug?: string; // Make slug optional to match its usage
  tags?: string[]; // Optional tags array
}

export async function POST(request: Request) {
  try {
    const listing = await request.json() as MarketplaceListing;
    
    // Generate a unique ID
    const listingsSnapshot = await db.collection('listings').orderBy('id', 'desc').limit(1).get();
    const lastId = listingsSnapshot.empty ? 0 : listingsSnapshot.docs[0].data().id || 0;
    const newId = lastId + 1;
    
    // Generate slug if not provided
    const slug = listing.slug || generateSlug(listing.name);
    
    // Create the new listing
    const newListing: MarketplaceListing = {
      ...listing,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sold: false,
      slug
    };
    
    // Add it to Firestore
    await db.collection('listings').doc(newId.toString()).set(newListing);
    
    // Revalidate the marketplace page to show the new listing
    revalidatePath('/marketplace');
    
    return NextResponse.json({ 
      success: true, 
      listing: newListing 
    });
    
  } catch (error) {
    console.error('Error creating marketplace listing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create listing';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 