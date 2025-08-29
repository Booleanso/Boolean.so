'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './BlogPreview.module.css';
import marketplaceStyles from '../../marketplace/marketplace.module.scss';

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
        <div className={styles.gridWrap}>
          <div className={marketplaceStyles.grid}>
          {latestPosts.map((post) => (
            <Link href={`/blog/${post.slug || post.id}`} key={post.id} className={marketplaceStyles.card}>
              <div className={marketplaceStyles.cardImage}>
                <Image 
                  src={post.imageUrl || '/images/blog-placeholder.jpg'} 
                  alt={post.title}
                  width={600}
                  height={400}
                />
              </div>
              <div className={marketplaceStyles.cardContent}>
                <div className={marketplaceStyles.cardHeader}>
                  <h2 className={marketplaceStyles.repoName}>{post.title}</h2>
                </div>
                <p className={marketplaceStyles.description}>{truncateDescription(post.description)}</p>
                <div className={marketplaceStyles.tags}>
                  <span className={marketplaceStyles.tag}>{post.category}</span>
                </div>
                <div className={marketplaceStyles.cardFooter}>
                  <div className={marketplaceStyles.stats}>
                    <div className={marketplaceStyles.stat}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      {formatDate(post.publishedAt)}
                    </div>
                    <div className={marketplaceStyles.readTimeInline}>{post.readTime} min</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          </div>
        </div>
      )}
    </section>
  );
} 