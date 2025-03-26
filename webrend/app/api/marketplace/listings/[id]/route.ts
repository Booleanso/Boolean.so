import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// Import helpers
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

const saveMarketplaceListings = (listings: MarketplaceListing[]) => {
  const filePath = getMarketplaceDataPath();
  fs.writeFileSync(filePath, JSON.stringify(listings, null, 2), 'utf8');
};

// GET a single listing by ID
export async function GET(
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
    const listing = listings.find(l => l.id === listingId);
    
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
    console.error('Error fetching listing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE a listing by ID
export async function DELETE(
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
    const listingIndex = listings.findIndex(l => l.id === listingId);
    
    if (listingIndex === -1) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }
    
    // Remove the listing
    const [removedListing] = listings.splice(listingIndex, 1);
    
    // Save the updated listings
    saveMarketplaceListings(listings);
    
    return NextResponse.json({
      success: true,
      message: 'Listing removed successfully',
      listing: removedListing
    });
    
  } catch (error) {
    console.error('Error removing listing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// UPDATE a listing by ID
export async function PUT(
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
    
    const updateData = await request.json();
    
    const listings = getMarketplaceListings();
    const listingIndex = listings.findIndex(l => l.id === listingId);
    
    if (listingIndex === -1) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }
    
    // Update the listing
    listings[listingIndex] = {
      ...listings[listingIndex],
      ...updateData,
      id: listingId // Ensure ID doesn't change
    };
    
    // Save the updated listings
    saveMarketplaceListings(listings);
    
    return NextResponse.json({
      success: true,
      message: 'Listing updated successfully',
      listing: listings[listingIndex]
    });
    
  } catch (error) {
    console.error('Error updating listing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 