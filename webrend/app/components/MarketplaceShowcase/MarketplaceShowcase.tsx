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
            


          </div>
        </div>
      </div>
    </section>
  );
} 