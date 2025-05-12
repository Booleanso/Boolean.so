import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db, auth as adminAuth } from '@/app/lib/firebase-admin';
import { MarketplaceListing } from '@/app/api/marketplace/list-repo/route';
import ProductDetailClient from './product-detail-client-static';

// Extended type for the listing data
interface ExtendedMarketplaceListing extends MarketplaceListing {
  slug: string;
  docId: string;
  tags?: string[];
  lastUpdated?: string;
  language?: string;
  size?: number;
  repoId?: string | number;
}

// Type for GitHub repo details
interface GitHubRepoDetails {
  languages: Record<string, number>;
  license?: {
    name: string;
    spdx_id: string;
  };
  size: number;
  default_branch: string;
  open_issues: number;
  created_at: string;
  updated_at: string;
}

// Type for related repos and more from developer
interface RelatedRepo {
  id: string | number;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  seller: {
    username: string;
    avatarUrl: string;
  };
  slug: string;
}

// Type for the developer's info
interface DeveloperInfo {
  username: string;
  avatarUrl?: string;
  email?: string;
  createdAt?: string;
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

// Fetch GitHub repo details
async function getRepoDetails(repoId: string | number): Promise<GitHubRepoDetails | null> {
  try {
    // This would typically be an internal API call or direct GitHub API call with server credentials
    // For demonstration, we'll simulate the response structure
    // In production, you'd use the GitHub API with proper authentication
    const repoData = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/github/repo-details?repoId=${repoId}`, { 
      next: { revalidate: 3600 } // Revalidate every hour
    });
    
    if (!repoData.ok) {
      return null;
    }

    const data = await repoData.json();
    return data.repoDetails;
  } catch (error) {
    console.error('Error fetching repo details:', error);
    return null;
  }
}

// Fetch developer info from Firebase
async function getDeveloperInfo(userId: string): Promise<DeveloperInfo | null> {
  try {
    try {
      // Get user data from Firebase Auth
      const userRecord = await adminAuth.getUser(userId);
      
      // Get additional data from Firestore if needed
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : {};
      
      return {
        username: userData?.username || userRecord.displayName || 'Anonymous',
        avatarUrl: userRecord.photoURL || userData?.avatarUrl,
        email: userRecord.email,
        createdAt: userRecord.metadata.creationTime
      };
    } catch (error) {
      console.error('Error fetching developer info:', error);
      return null;
    }
  } catch (error) {
    console.error('Error fetching developer info:', error);
    return null;
  }
}

// Fetch more listings from the same developer
async function getMoreFromDeveloper(sellerId: string, excludeId: string | number): Promise<RelatedRepo[]> {
  try {
    // Query Firestore directly instead of using an API endpoint
    const listingsQuery = await db.collection('listings')
      .where('seller.id', '==', sellerId)
      .where('sold', '==', false)
      .limit(4)
      .get();

    if (listingsQuery.empty) {
      return [];
    }

    const listings = listingsQuery.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          description: data.description,
          imageUrl: data.imageUrl,
          price: data.price || data.subscriptionPrice,
          seller: {
            username: data.seller.username,
            avatarUrl: data.seller.avatarUrl || ''
          },
          slug: data.slug
        };
      })
      .filter(listing => String(listing.id) !== String(excludeId));

    return listings.slice(0, 3); // Return at most 3 listings
  } catch (error) {
    console.error('Error fetching developer listings:', error);
    return [];
  }
}

// Fetch related listings based on tags or other criteria
async function getRelatedRepos(listingId: string | number): Promise<RelatedRepo[]> {
  try {
    // This would typically be a more sophisticated query based on tags, category, etc.
    // For now, we'll just get a few random listings
    const query = db.collection('listings')
      .where('sold', '==', false)
      .limit(4);
    
    // If we have tags, we could use them for more relevant results
    // Note: Firestore doesn't directly support array-contains-any with other conditions, so this is simplified
    
    const listingsQuery = await query.get();
    
    if (listingsQuery.empty) {
      return [];
    }
    
    const listings = listingsQuery.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          description: data.description,
          imageUrl: data.imageUrl,
          price: data.price || data.subscriptionPrice,
          seller: {
            username: data.seller.username,
            avatarUrl: data.seller.avatarUrl || ''
          },
          slug: data.slug
        };
      })
      .filter(listing => String(listing.id) !== String(listingId));
      
    return listings;
  } catch (error) {
    console.error('Error fetching related repos:', error);
    return [];
  }
}

interface PageProps {
  params: {
    slug: string;
  };
}

// Server component with proper params handling
export default async function BuyPage({ params }: PageProps) {
  const slug = params.slug;
  
  // Fetch listing data using our helper function
  const listing = await getListingBySlug(slug);
  
  // Handle the case where no listing is found
  if (!listing) {
    notFound();
  }
  
  // Fetch additional data in parallel
  const [repoDetails, developerInfo, moreFromDeveloper, relatedRepos] = await Promise.all([
    getRepoDetails(listing.repoId || listing.id),
    getDeveloperInfo(listing.seller.id),
    getMoreFromDeveloper(listing.seller.id, listing.id),
    getRelatedRepos(listing.id)
  ]);
  
  // Return the client component with all data pre-fetched
  return (
    <ProductDetailClient 
      listing={listing}
      repoDetails={repoDetails}
      developerInfo={developerInfo}
      moreFromDeveloper={moreFromDeveloper}
      relatedRepos={relatedRepos}
    />
  );
}

// Generate dynamic metadata based on the listing
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
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