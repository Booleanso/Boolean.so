import { Metadata } from 'next';
import { db } from '../lib/firebase-admin';
import BlogPageClient from './components/BlogPageClient';

// Define SEO metadata for the blog index page
export const metadata: Metadata = {
  title: 'WebRend Blog - Web Development Insights and Tutorials',
  description: 'Explore the latest articles, tutorials, and insights on web development, design, and technology from the WebRend team.',
  keywords: ['web development', 'design', 'technology', 'tutorials', 'WebRend', 'blog'],
  alternates: {
    canonical: 'https://webrend.com/blog',
  },
  openGraph: {
    title: 'WebRend Blog - Web Development Insights and Tutorials',
    description: 'Explore the latest articles, tutorials, and insights on web development, design, and technology from the WebRend team.',
    url: 'https://webrend.com/blog',
    siteName: 'WebRend',
    images: [
      {
        url: 'https://webrend.com/logo/logo.png',
        width: 800,
        height: 600,
        alt: 'WebRend Blog',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WebRend Blog - Web Development Insights',
    description: 'Explore the latest articles, tutorials, and insights on web development, design, and technology.',
    images: ['https://webrend.com/logo/logo.png'],
  },
};

interface Article {
  id: string;
  title: string;
  description: string;
  publishedAt: number | Date;
  imageUrl?: string;
  category: string;
  readTime: number;
  slug?: string;
  content?: string;
}

// For Firestore timestamp conversion
type FirestoreTimestamp = {
  toDate: () => Date;
};

async function getArticles(): Promise<Article[]> {
  try {
    // Create an index on the server if needed
    try {
      await db.collection('articles').orderBy('publishedAt', 'desc').limit(1).get();
    } catch (error) {
      console.warn('Collection index may need to be created:', error);
      
      // Extract and log the index creation URL if it's a Firebase indexing error
      const errorString = String(error);
      if (errorString.includes('https://console.firebase.google.com/')) {
        const indexUrlMatch = errorString.match(/(https:\/\/console\.firebase\.google\.com\/[^\s"]+)/);
        if (indexUrlMatch && indexUrlMatch[1]) {
          console.log('\n\n-------------------------------------------');
          console.log('⚠️ FIREBASE INDEX NEEDED');
          console.log('-------------------------------------------');
          console.log('Please create the required index by visiting:');
          console.log(indexUrlMatch[1].replace(/\\n/g, '').replace(/\\"/g, '"'));
          console.log('-------------------------------------------\n\n');
        } else {
          console.log('Firebase index needed, but could not extract URL from error message');
        }
      }
    }

    // Fetch the articles
    const articlesSnapshot = await db.collection('articles')
      .orderBy('publishedAt', 'desc')
      .limit(10)
      .get();

    if (articlesSnapshot.empty) {
      console.log('No articles found in database - returning default content');
      return getDefaultArticles();
    }

    return articlesSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Handle Firestore timestamp conversion
      let publishedAt = data.publishedAt;
      if (typeof publishedAt === 'object' && publishedAt?.toDate) {
        publishedAt = (publishedAt as FirestoreTimestamp).toDate();
      }
      
      // Generate a slug from title if it doesn't exist
      let slug = data.slug;
      if (!slug && data.title) {
        slug = data.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
      }
      
      return {
        id: doc.id,
        title: data.title || 'Untitled',
        description: data.description || '',
        publishedAt,
        imageUrl: data.imageUrl || '',
        category: data.category || 'Uncategorized',
        readTime: data.readTime || 5,
        slug: slug || doc.id
      } as Article;
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    console.log('Returning default articles due to error');
    
    // Handle the case where the main query fails due to missing index
    const errorString = String(error);
    if (errorString.includes('https://console.firebase.google.com/')) {
      const indexUrlMatch = errorString.match(/(https:\/\/console\.firebase\.google\.com\/[^\s"]+)/);
      if (indexUrlMatch && indexUrlMatch[1]) {
        console.log('\n\n-------------------------------------------');
        console.log('⚠️ FIREBASE INDEX NEEDED');
        console.log('-------------------------------------------');
        console.log('Please create the required index by visiting:');
        console.log(indexUrlMatch[1].replace(/\\n/g, '').replace(/\\"/g, '"'));
        console.log('-------------------------------------------\n\n');
      }
    }
    
    return getDefaultArticles();
  }
}

// Provide default articles if the database doesn't have any
function getDefaultArticles(): Article[] {
  // Return empty array instead of default articles
  return [];
}

export default async function BlogPage() {
  const articles = await getArticles();

  // Extract unique categories from articles for the categories bar
  const uniqueCategories = Array.from(
    new Set(articles.map(article => article.category))
  );

  // Generate structured data for the blog page
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    'headline': 'WebRend Blog',
    'description': 'Insights, tips, and inspiration for web developers and designers',
    'url': 'https://webrend.com/blog',
    'publisher': {
      '@type': 'Organization',
      'name': 'WebRend',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://webrend.com/logo/logo.png'
      }
    },
    'blogPost': articles.map(article => {
      const publishDate = article.publishedAt instanceof Date 
        ? article.publishedAt 
        : new Date(article.publishedAt);
      
      return {
        '@type': 'BlogPosting',
        'headline': article.title,
        'description': article.description,
        'datePublished': publishDate.toISOString(),
        'url': `https://webrend.com/blog/${article.slug || article.id}`,
        'image': article.imageUrl,
        'author': {
          '@type': 'Organization',
          'name': 'WebRend'
        }
      };
    })
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="w-full min-h-screen bg-[#f5f5f7] p-0 m-0">
        <BlogPageClient articles={articles} uniqueCategories={uniqueCategories} />
      </main>
    </>
  );
} 