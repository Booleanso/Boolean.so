import { db } from '../../lib/firebase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata, ResolvingMetadata } from 'next';
import ReactMarkdown from 'react-markdown';
import styles from './page.module.css';

// Types for our article
interface Article {
  title: string;
  description: string;
  content: string;
  publishedAt: Date | { toDate: () => Date };
  imageUrl?: string;
  category: string;
  readTime: number;
  sourceUrl: string;
  slug: string;
}

type PageProps = {
  params: {
    slug: string;
  };
};

// Generate metadata for the page
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    // Await the params promise to get the slug
    const { slug } = await params;
    
    if (!slug) {
      return {
        title: 'Article Not Found - WebRend Blog',
        description: 'The requested article could not be found.',
      };
    }

    const article = await getArticleBySlug(slug);
    
    if (!article) {
      return {
        title: 'Article Not Found - WebRend Blog',
        description: 'The requested article could not be found.',
      };
    }

    // Format the date for meta tags
    const publishDate = article.publishedAt instanceof Date 
      ? article.publishedAt 
      : article.publishedAt.toDate();
    
    return {
      title: `${article.title} - WebRend Blog`,
      description: article.description,
      keywords: [article.category, 'web development', 'webrend', 'tech news', article.title.split(' ').join(', ')],
      openGraph: {
        title: article.title,
        description: article.description,
        images: article.imageUrl ? [article.imageUrl] : [],
        type: 'article',
        publishedTime: publishDate.toISOString(),
        authors: ['WebRend'],
        tags: [article.category, 'technology', 'web development'],
      },
      twitter: {
        card: 'summary_large_image',
        title: article.title,
        description: article.description,
        images: article.imageUrl ? [article.imageUrl] : [],
      },
      alternates: {
        canonical: `https://webrend.com/blog/${article.slug}`,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: 'Article Not Found - WebRend Blog',
      description: 'The requested article could not be found.',
    };
  }
}

// Generate static paths for all blog articles
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const articlesSnapshot = await db.collection('articles').get();
    
    if (articlesSnapshot.empty) {
      console.log('No articles found for static path generation');
      return [];
    }

    const params = articlesSnapshot.docs
      .filter(doc => {
        const data = doc.data();
        return typeof data.slug === 'string' && data.slug.trim() !== '';
      })
      .map(doc => {
        const data = doc.data();
        return { slug: String(data.slug) };
      });
    
    console.log(`Generated static paths for ${params.length} articles`);
    return params;
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Helper to get an article by its slug
async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    if (!slug) {
      console.error('getArticleBySlug called with empty slug');
      return null;
    }

    const articleQuery = await db
      .collection('articles')
      .where('slug', '==', slug)
      .limit(1)
      .get();
    
    if (articleQuery.empty) {
      console.log(`No article found with slug "${slug}"`);
      return null;
    }
    
    const articleData = articleQuery.docs[0].data() as Article;
    return articleData;
  } catch (error) {
    console.error(`Error fetching article with slug "${slug}":`, error);
    return null;
  }
}

// Format the date for display
function formatDate(date: Date | { toDate: () => Date }): string {
  const dateObj = date instanceof Date ? date : date.toDate();
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }).format(dateObj);
}

export default async function BlogArticlePage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  try {
    // Await the params promise to get the slug
    const { slug } = await params;
    
    if (!slug) {
      return notFound();
    }

    // Fetch the article data using the slug
    const article = await getArticleBySlug(slug);
    
    if (!article) {
      return notFound();
    }
    
    // Convert timestamp to Date if needed
    const publishDate = article.publishedAt instanceof Date 
      ? article.publishedAt 
      : article.publishedAt.toDate();
    
    // Structured data for SEO
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'headline': article.title,
      'description': article.description,
      'image': article.imageUrl,
      'datePublished': publishDate.toISOString(),
      'dateModified': publishDate.toISOString(),
      'author': {
        '@type': 'Organization',
        'name': 'WebRend',
        'url': 'https://webrend.com'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'WebRend',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://webrend.com/logo/logo.png'
        }
      },
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': `https://webrend.com/blog/${article.slug}`
      },
      'keywords': [article.category, 'web development', 'technology']
    };
    
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <div className={styles.container}>
          <div className={styles.articleHeader}>
            <Link href="/blog" className={styles.backLink}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Blog
            </Link>
            
            <div className={styles.categoryAndDate}>
              <span className={styles.category}>{article.category}</span>
              <span className={styles.dot}>•</span>
              <time dateTime={publishDate.toISOString()}>{formatDate(publishDate)}</time>
              <span className={styles.dot}>•</span>
              <span>{article.readTime} min read</span>
            </div>
            
            <h1 className={styles.title}>{article.title}</h1>
            <p className={styles.description}>{article.description}</p>
          </div>
          
          {article.imageUrl && (
            <div className={styles.imageContainer}>
              <img 
                src={article.imageUrl} 
                alt={article.title} 
                className={styles.featuredImage}
                width={1200}
                height={630}
              />
            </div>
          )}
          
          <div className={styles.content}>
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>
          
          <div className={styles.footer}>
            <div className={styles.sourceLink}>
              <p>Original Source: <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">{new URL(article.sourceUrl).hostname}</a></p>
            </div>
            
            <div className={styles.share}>
              <p>Share this article:</p>
              <div className={styles.shareButtons}>
                <a 
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://webrend.com'}/blog/${article.slug}`)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.shareButton}
                  aria-label="Share on Twitter"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23 3.01s-2.018 1.192-3.14 1.53a4.48 4.48 0 00-7.86 3v1a10.66 10.66 0 01-9-4.53s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5 0-.278-.028-.556-.08-.83C21.94 5.674 23 3.01 23 3.01z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
                <a 
                  href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://webrend.com'}/blog/${article.slug}`)}&title=${encodeURIComponent(article.title)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.shareButton}
                  aria-label="Share on LinkedIn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="2" y="9" width="4" height="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className={styles.relatedSection}>
            <h2>Continue Reading</h2>
            <div className={styles.relatedLink}>
              <Link href="/blog">
                View all articles
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error("Error rendering blog article:", error);
    return notFound();
  }
} 