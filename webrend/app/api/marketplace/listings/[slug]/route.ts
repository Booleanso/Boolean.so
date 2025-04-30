import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';

interface RouteContext {
  params: {
    slug: string;
  };
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Access the slug directly from the context
    const slug = context.params.slug;
    
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }
    
    // Try to fetch by slug first
    let listingQuery = await db.collection('listings').where('slug', '==', slug).limit(1).get();
    
    // If not found by slug, try to fetch directly by ID (for backward compatibility)
    if (listingQuery.empty) {
      // Check if it might be a document ID instead
      try {
        const docLookup = await db.collection('listings').doc(slug).get();
        if (docLookup.exists) {
          // Return the document if found by ID
          const listing = {
            ...docLookup.data(),
            docId: docLookup.id,
            id: docLookup.id
          };
          return NextResponse.json({ listing });
        }
      } catch (docError) {
        console.error('Error looking up by document ID:', docError);
        // Continue to 404 if neither slug nor ID works
      }
      
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    
    // Format the listing data from slug lookup
    const listingDoc = listingQuery.docs[0];
    const listing = {
      ...listingDoc.data(),
      docId: listingDoc.id,
      id: listingDoc.id
    };
    
    return NextResponse.json({ listing });
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
} 