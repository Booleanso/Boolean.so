import Link from 'next/link';
import { Metadata } from 'next';
import styles from './page.module.css';
import { db } from '../lib/firebase-admin';

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
      <main className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>WebRend Blog</h1>
          <p className={styles.subtitle}>
            Insights, tips, and inspiration for web developers and designers
          </p>
        </div>

        {articles.length > 0 ? (
          <div className={styles.bentoGrid}>
            {articles.map((article, index) => (
              <Link 
                href={`/blog/${article.slug || article.id}`} 
                key={article.id} 
                className={`
                  ${styles.bentoItem} 
                  ${index === 0 ? styles.bentoItemFeatured : ''}
                  ${index === 1 ? styles.bentoItemWide : ''}
                  ${index === 2 ? styles.bentoItemTall : ''}
                `}
              >
                <div 
                  className={styles.articleImage}
                  style={{ backgroundImage: article.imageUrl ? `url(${article.imageUrl})` : 'none' }}
                >
                  <div className={styles.category}>{article.category}</div>
                </div>
                <div className={styles.articleContent}>
                  <h2 className={styles.articleTitle}>{article.title}</h2>
                  <p className={styles.articleDescription}>{article.description}</p>
                  <div className={styles.articleMeta}>
                    <span>{article.publishedAt instanceof Date 
                      ? article.publishedAt.toLocaleDateString() 
                      : new Date(article.publishedAt).toLocaleDateString()}</span>
                    <span>{article.readTime} min read</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h2>No articles available</h2>
            <p>There are currently no blog articles to display.</p>
          </div>
        )}
      </main>
    </>
  );
} 