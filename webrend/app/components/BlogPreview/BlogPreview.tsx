'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './BlogPreview.module.css';

interface BlogPost {
  id: string;
  title: string;
  description: string;
  publishedAt: number | Date;
  imageUrl?: string;
  category: string;
  readTime: number;
  slug?: string;
}

export default function BlogPreview() {
  const [latestPosts, setLatestPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch latest blog posts
        const response = await fetch('/api/blog/latest');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setLatestPosts(data.articles || []);
      } catch (err) {
        console.error('Error fetching latest blog posts:', err);
        setError('Failed to load latest blog posts.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLatestPosts();
  }, []);

  // Format date to "MMM D, YYYY" (e.g., "Oct 15, 2023")
  const formatDate = (date: Date | number) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Truncate description to 100 words
  const truncateDescription = (description: string) => {
    const words = description.split(' ');
    if (words.length > 100) {
      return words.slice(0, 100).join(' ') + '...';
    }
    return description;
  };

  return (
    <section className={styles.blogPreviewSection}>
      <div className={styles.sectionHeader}>
        <h2>Latest from our Blog</h2>
        <Link href="/blog" className={styles.seeAllLink}>See All</Link>
      </div>
      
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingBar}></div>
          <span>Loading latest articles</span>
        </div>
      ) : error ? (
        <div className={styles.error}>
          {error}
        </div>
      ) : latestPosts.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No articles available at the moment. Check back soon!</p>
        </div>
      ) : (
        <div className={styles.blogGrid}>
          {latestPosts.map((post, index) => (
            <Link href={`/blog/${post.slug || post.id}`} key={post.id} className={styles.blogCard}>
              <div className={styles.blogImageWrapper}>
                <Image 
                  src={post.imageUrl || '/images/blog-placeholder.jpg'} 
                  alt={post.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className={styles.blogImage}
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const img = e.target as HTMLImageElement;
                    if (img.src !== '/images/blog-placeholder.jpg') {
                      img.src = '/images/blog-placeholder.jpg';
                    }
                  }}
                />
              </div>
              <div className={styles.blogContent}>
                <div className={styles.blogMeta}>
                  <span className={styles.blogCategory}>{post.category}</span>
                  <span className={styles.blogDate}>{formatDate(post.publishedAt)}</span>
                </div>
                <h3 className={styles.blogTitle}>{post.title}</h3>
                <p className={styles.blogDescription}>{truncateDescription(post.description)}</p>
                <div className={styles.blogFooter}>
                  <span className={styles.readTime}>{post.readTime} min read</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
} 