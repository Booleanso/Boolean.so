import { MetadataRoute } from 'next';
import { db } from './lib/firebase-admin';

interface Article {
  slug: string;
  publishedAt: { seconds: number } | Date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base URL for the site
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://webrend.com';
  
  // Get all articles from Firebase
  let articleEntries: MetadataRoute.Sitemap = [];
  
  try {
    // Get all articles sorted by published date
    const articlesSnapshot = await db.collection('articles')
      .orderBy('publishedAt', 'desc')
      .get();
    
    if (!articlesSnapshot.empty) {
      articleEntries = articlesSnapshot.docs.map(doc => {
        const data = doc.data() as Article;
        
        // Parse the date correctly whether it's a Firestore timestamp or Date
        let lastModified: Date;
        if (data.publishedAt instanceof Date) {
          lastModified = data.publishedAt;
        } else if (typeof data.publishedAt === 'object' && data.publishedAt?.seconds) {
          lastModified = new Date(data.publishedAt.seconds * 1000);
        } else {
          lastModified = new Date(); // Fallback to current date
        }
        
        // Use slug or doc ID
        const slug = data.slug || doc.id;
        
        return {
          url: `${baseUrl}/blog/${slug}`,
          lastModified,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        };
      });
    }
  } catch (error) {
    console.error('Error generating sitemap entries for blog articles:', error);
  }
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/portfolio`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/marketplace`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];
  
  // Combine static pages with dynamic articles
  return [...staticPages, ...articleEntries];
} 