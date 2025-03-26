import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// Import helpers
import { MarketplaceListing } from '../../../list-repo/route';

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

const saveMarketplaceListings = (listings: MarketplaceListing[]) => {
  const filePath = getMarketplaceDataPath();
  fs.writeFileSync(filePath, JSON.stringify(listings, null, 2), 'utf8');
};

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
    
    const listings = getMarketplaceListings();
    
    // Find the listing to mark as sold
    const listingIndex = listings.findIndex(listing => listing.id === listingId);
    
    if (listingIndex === -1) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }
    
    // Mark the listing as sold
    listings[listingIndex].isSold = true;
    
    // Save the updated listings
    saveMarketplaceListings(listings);
    
    return NextResponse.json({
      success: true,
      message: 'Listing marked as sold',
      listing: listings[listingIndex]
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