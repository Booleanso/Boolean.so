'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './MarketplaceShowcase.module.css';

export default function MarketplaceShowcase() {
  return (
    <section className={styles.showcaseSection}>
      <div className={styles.showcaseContent}>
        <div className={styles.headerContent}>
          <h2 className={styles.heading}>
            Build powerful projects
            <span className={styles.headingHighlight}>incredibly fast</span>
          </h2>
          
          <p className={styles.description}>
            Whether you're a solo developer or part of a large team, WebRend's marketplace puts the power of premium code repositories in your hands—ready to use and customize. Transform your workflow with our curated collection of high-quality repositories.
          </p>
          
          <div className={styles.ctaContainer}>
            <Link href="/marketplace" className={styles.primaryButton}>
              Explore Marketplace
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 0L6.59 1.41L12.17 7H0V9H12.17L6.59 14.59L8 16L16 8L8 0Z" fill="currentColor" />
              </svg>
            </Link>
            <Link href="/marketplace/categories" className={styles.secondaryButton}>
              Browse Categories
            </Link>
          </div>
        </div>
        
        <div className={styles.imageContainer}>
          <div className={styles.showcaseImageContainer}>
            <div className={styles.imageWrapper}>
              <Image 
                src="/images/marketplace.png" 
                alt="WebRend Marketplace Preview" 
                width={1200}
                height={700}
                className={styles.showcaseImage}
                priority
              />
              <div className={styles.imageOverlay} />
            </div>
            
            <div className={styles.showcaseCard}>
              <div className={styles.cardIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1C5.9 1 1 5.9 1 12C1 18.1 5.9 23 12 23C18.1 23 23 18.1 23 12C23 5.9 18.1 1 12 1ZM12 21C7 21 3 17 3 12C3 7 7 3 12 3C17 3 21 7 21 12C21 17 17 21 12 21Z" fill="currentColor"/>
                  <path d="M12 6.5C11.2 6.5 10.5 7.2 10.5 8C10.5 8.8 11.2 9.5 12 9.5C12.8 9.5 13.5 8.8 13.5 8C13.5 7.2 12.8 6.5 12 6.5Z" fill="currentColor"/>
                  <path d="M12 11C11.4 11 11 11.4 11 12V16C11 16.6 11.4 17 12 17C12.6 17 13 16.6 13 16V12C13 11.4 12.6 11 12 11Z" fill="currentColor"/>
                </svg>
              </div>
              <div className={styles.cardContent}>
                <span className={styles.cardTitle}>Premium Repositories</span>
                <p className={styles.cardDescription}>Access our growing collection of fully-vetted, high-quality repositories ready for immediate use.</p>
              </div>
            </div>
            
            <div className={styles.featuresGrid}>
              <div className={styles.featureItem}>
                <span className={styles.featureTitle}>Instant Access</span>
                <span className={styles.featureDescription}>Deploy code instantly</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureTitle}>Well Documented</span>
                <span className={styles.featureDescription}>Easy to understand</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureTitle}>Premium Support</span>
                <span className={styles.featureDescription}>Expert assistance</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 