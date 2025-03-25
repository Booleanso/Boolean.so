import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Reuse the type and helper functions from our listing endpoint
import { MarketplaceListing } from '../list-repo/route';

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

export async function GET() {
  try {
    // Get all listings
    const listings = getMarketplaceListings();
    
    // If no listings exist yet, return demo data
    if (listings.length === 0) {
      // Create demo listings for testing
      const demoListings: MarketplaceListing[] = [
        {
          id: 1,
          name: 'E-Commerce Platform',
          description: 'A complete e-commerce solution with React frontend and Node.js backend. Includes shopping cart, user authentication, and payment processing.',
          price: 499,
          isSubscription: false,
          imageUrl: 'https://placehold.co/600x400/0366d6/FFFFFF/png?text=E-Commerce+Platform',
          seller: {
            username: 'techdev',
            avatarUrl: 'https://placehold.co/100/24292e/FFFFFF/png?text=TD'
          },
          stars: 45,
          forks: 12,
          lastUpdated: '2023-12-15',
          stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'price_1PyLAxGLCrtq5FJQGTHIslNj'
        },
        {
          id: 2,
          name: 'Dashboard UI Kit',
          description: 'Modern dashboard components built with React and Tailwind CSS. Fully customizable and responsive design elements.',
          price: 29,
          isSubscription: true,
          subscriptionPrice: 9.99,
          imageUrl: 'https://placehold.co/600x400/0366d6/FFFFFF/png?text=Dashboard+UI+Kit',
          seller: {
            username: 'designstudio',
            avatarUrl: 'https://placehold.co/100/24292e/FFFFFF/png?text=DS'
          },
          stars: 87,
          forks: 33,
          lastUpdated: '2024-01-21',
          stripePriceId: process.env.NEXT_PUBLIC_YEARLY_STRIPE_PRICE_ID || 'price_1PyLDZGLCrtq5FJQFF2KfzW5'
        }
      ];
      
      return NextResponse.json({
        success: true,
        listings: demoListings
      });
    }
    
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