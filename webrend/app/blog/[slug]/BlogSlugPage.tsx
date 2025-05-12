'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import styles from './page.module.css';

interface Article {
  title: string;
  description: string;
  content: string;
  publishedAt: string;
  imageUrl?: string;
  category: string;
  readTime: number;
  sourceUrl: string;
  slug: string;
}

interface BlogSlugPageProps {
  article: Article;
  formattedDate: string;
}

export default function BlogSlugPage({ article, formattedDate }: BlogSlugPageProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  // Set mounted state when component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Set up a listener for theme changes to ensure proper styling
  useEffect(() => {
    if (!isMounted) return;
    
    const handleThemeChange = () => {
      const isDarkMode = document.documentElement.classList.contains('dark-theme');
      const containerElement = document.querySelector(`.${styles.container}`);
      
      if (containerElement) {
        // Apply appropriate class based on theme
        if (isDarkMode) {
          containerElement.classList.add(styles.darkTheme);
        } else {
          containerElement.classList.remove(styles.darkTheme);
        }
      }
    };
    
    // Check theme on mount
    handleThemeChange();
    
    // Create observer to watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          handleThemeChange();
        }
      });
    });
    
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => {
      observer.disconnect();
    };
  }, [isMounted, styles.container, styles.darkTheme]);

  // Use the ISO string directly for the datetime attribute
  const formattedDateTime = article.publishedAt;
  
  // For SSR compatibility, render a simplified version initially
  if (!isMounted) {
    return (
      <div className={styles.container} style={{ backgroundColor: 'var(--page-bg)' }}>
        <div className={styles.articleHeader}>
          <Link href="/blog" className={styles.backLink}>
            Back to Blog
          </Link>
          
          <div className={styles.categoryAndDate}>
            <span className={styles.category}>{article.category}</span>
            <span className={styles.dot}>•</span>
            <time dateTime={formattedDateTime}>{formattedDate}</time>
            <span className={styles.dot}>•</span>
            <span>{article.readTime} min read</span>
          </div>
          
          <h1 className={styles.title}>{article.title}</h1>
          <p className={styles.description}>{article.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${styles.container} ${document.documentElement.classList.contains('dark-theme') ? styles.darkTheme : ''}`}
      style={{ backgroundColor: 'var(--page-bg)' }}
    >
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
          <time dateTime={formattedDateTime}>{formattedDate}</time>
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
  );
} 