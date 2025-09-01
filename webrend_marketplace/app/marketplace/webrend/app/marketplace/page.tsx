import { Metadata } from 'next';
import { db } from '@/app/lib/firebase-admin';
import ListingsClient from './listings-client';
import { MarketplaceListing } from '../api/marketplace/list-repo/route';

export const metadata: Metadata = {
  title: 'GitHub Repository Marketplace | WebRend',
  description: 'Browse and purchase web development resources and GitHub repositories on WebRend Marketplace',
  openGraph: {
    title: 'GitHub Repository Marketplace | WebRend',
    description: 'Discover high-quality GitHub repositories and web development resources for sale',
    images: [
      {
        url: 'https://webrend.com/og-marketplace.jpg',
        width: 1200,
        height: 630,
        alt: 'WebRend Marketplace'
      }
    ]
  }
};

export default async function MarketplacePage() {
  // Server-side data fetching from Firestore
  const listingsSnapshot = await db.collection('listings')
    .orderBy('lastUpdated', 'desc')
    .get();
  
  // Convert snapshot to listings array with proper typing
  const listings = listingsSnapshot.docs.map(doc => {
    const data = doc.data();
    
    // Format timestamps if needed
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
  
  // Pass pre-fetched data to client component for interactivity
  return <ListingsClient initialListings={listings} />;
}
