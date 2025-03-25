import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Reuse the type and helper functions from our listing endpoint
import { MarketplaceListing } from '../../list-repo/route';

// This would be a database in production
const getMarketplaceDataPath = () => {
  const dataDir = path.join(process.cwd(), 'data');
  
  // Create the data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  return path.join(dataDir, 'marketplace-listings.json');
};

const getMarketplaceListings = (): MarketplaceListing[] => {
  const filePath = getMarketplaceDataPath();
  
  if (!fs.existsSync(filePath)) {
    // Return empty array if file doesn't exist yet
    return [];
  }
  
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error reading marketplace data:', error);
    return [];
  }
};

// Define the dynamic segment type in the route interface
interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  // Skip any async operations before using params
  const idStr = params.id;
  
  try {    
    if (!idStr) {
      return NextResponse.json(
        { error: 'ID parameter is required' },
        { status: 400 }
      );
    }
    
    // Try to convert to number if possible
    const id = parseInt(idStr);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    // Fetch listings and find the matching one
    const listings = getMarketplaceListings();
    
    // For demo purposes, if no listings exist yet, return a demo listing
    if (listings.length === 0) {
      // Return a demo listing based on the ID
      return NextResponse.json({
        success: true,
        listing: {
          id: id,
          name: `Demo Repository ${id}`,
          description: 'This is a demo repository for testing the marketplace.',
          price: 99.99,
          isSubscription: false,
          imageUrl: `https://placehold.co/600x400/0366d6/FFFFFF/png?text=Demo+Repository+${id}`,
          seller: {
            username: 'demouser',
            avatarUrl: 'https://placehold.co/100/24292e/FFFFFF/png?text=DU'
          },
          stars: 42,
          forks: 13,
          lastUpdated: new Date().toISOString().split('T')[0],
          stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'price_1PyLAxGLCrtq5FJQGTHIslNj' // Fallback to a test price ID
        }
      });
    }
    
    // Find the listing with the matching ID
    const listing = listings.find(item => item.id === id);
    
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      listing
    });
  } catch (error) {
    console.error('Error fetching marketplace listing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch listing';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 