import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// In a real application, you would use a database
// For this demo, we'll use a simple JSON file
import fs from 'fs';
import path from 'path';

// Define types for our marketplace listings
export type MarketplaceListing = {
  id: number;
  name: string;
  description: string;
  price: number;
  isSubscription: boolean;
  subscriptionPrice?: number;
  imageUrl: string;
  seller: {
    username: string;
    avatarUrl: string;
  };
  stars: number;
  forks: number;
  lastUpdated: string;
  stripeProductId?: string;
  stripePriceId?: string;
};

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

export async function POST(request: Request) {
  try {
    const listing = await request.json() as MarketplaceListing;
    
    // Generate a unique ID - in a real application, this would be handled by the database
    const listings = getMarketplaceListings();
    const newId = listings.length > 0 
      ? Math.max(...listings.map(item => item.id)) + 1 
      : 1;
    
    // Create the new listing
    const newListing: MarketplaceListing = {
      ...listing,
      id: newId,
      lastUpdated: new Date().toISOString().split('T')[0] // YYYY-MM-DD
    };
    
    // Add it to our "database"
    listings.push(newListing);
    saveMarketplaceListings(listings);
    
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