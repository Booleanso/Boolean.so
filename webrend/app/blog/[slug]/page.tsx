import { db } from '../../lib/firebase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata, ResolvingMetadata } from 'next';
import ReactMarkdown from 'react-markdown';
import styles from './page.module.css';
import BlogSlugPage from './BlogSlugPage';

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
      title: `${article.title} - WebRend's AI Blog`,
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
    
    // Create a serializable version of the article (important for Firestore objects)
    const serializedArticle = {
      ...article,
      publishedAt: publishDate.toISOString(),
    };
    
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
        <div className="w-full min-h-screen" style={{ backgroundColor: 'var(--page-bg, #000)' }}>
          <BlogSlugPage 
            article={serializedArticle} 
            formattedDate={formatDate(publishDate)} 
          />
        </div>
      </>
    );
  } catch (error) {
    console.error("Error rendering blog article:", error);
    return notFound();
  }
} 