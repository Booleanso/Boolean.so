import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailClient from './product-detail-client';
import { db } from '@/app/lib/firebase-admin';
import { MarketplaceListing } from '@/app/api/marketplace/list-repo/route';

// Extended type for the listing data
interface ExtendedMarketplaceListing extends MarketplaceListing {
  slug: string;
  docId: string;
}

// Define a typesafe placeholder for metadata
const defaultMetadata = {
  title: 'Marketplace Listing | WebRend',
  description: 'View this repository on WebRend Marketplace'
};

// Fetch listing function - extracts the data fetching logic
async function getListingBySlug(slug: string): Promise<ExtendedMarketplaceListing | null> {
  try {
    // Use the slug to query Firestore
    const listingQuery = await db.collection('listings').where('slug', '==', slug).limit(1).get();
    
    if (listingQuery.empty) {
      return null;
    }
    
    const listingDoc = listingQuery.docs[0];
    const listingData = listingDoc.data();
    
    return {
      ...(listingData as MarketplaceListing),
      docId: listingDoc.id,
      slug: slug
    };
  } catch (error) {
    console.error('Error fetching listing:', error);
    return null;
  }
}

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Server component with proper params handling
export default async function BuyPage(props: PageProps) {
  // Await params before accessing slug
  const params = await props.params;
  const slug = params.slug;
  
  // Fetch listing data using our helper function
  const listing = await getListingBySlug(slug);
  
  // Handle the case where no listing is found
  if (!listing) {
    notFound();
  }
  
  // Return the client component with the listing data
  return <ProductDetailClient initialListing={listing} />;
}

// Generate dynamic metadata based on the listing
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  // Await params before accessing slug
  const params = await props.params;
  const slug = params.slug;
  
  // Get listing data
  const listing = await getListingBySlug(slug);
  
  // Return default metadata if no listing found
  if (!listing) {
    return defaultMetadata;
  }
  
  // Generate listing-specific metadata
  return {
    title: `${listing.name} | WebRend Marketplace`,
    description: listing.description || 'A web development resource available on WebRend Marketplace',
    openGraph: {
      title: `${listing.name} | WebRend Marketplace`,
      description: listing.description || 'A web development resource available on WebRend Marketplace',
      images: [
        {
          url: listing.imageUrl || 'https://webrend.com/default-og-image.jpg',
          width: 1200,
          height: 630,
          alt: listing.name
        }
      ]
    }
  };
} 