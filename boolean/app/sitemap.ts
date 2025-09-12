import { MetadataRoute } from 'next';
import { db } from './lib/firebase-admin';

// interface Article {
//   slug: string;
//   publishedAt: { seconds: number } | Date;
// }

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://webrend.com';
  
  // Generate static routes
  const staticRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/marketplace`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/marketplace/sell`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ] as MetadataRoute.Sitemap;
  
  try {
    // Fetch all listings from Firestore
    const listingsSnapshot = await db.collection('listings').where('sold', '==', false).get();
    
    // Generate dynamic routes for marketplace listings
    const listingRoutes = listingsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        url: `${baseUrl}/marketplace/buy/${data.slug}`,
        lastModified: data.updatedAt 
          ? new Date(data.updatedAt) 
          : new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      };
    }) as MetadataRoute.Sitemap;
    
    // Combine static and dynamic routes
    return [...staticRoutes, ...listingRoutes];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticRoutes;
  }
} 