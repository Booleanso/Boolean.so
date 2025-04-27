'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './MarketplaceFeatures.module.css';

export default function MarketplaceFeatures() {
  return (
    <section className={styles.featuresSection}>
      <div className={styles.featuresContent}>
        <div className={styles.headerContent}>
          <h2 className={styles.heading}>
            Flexible solutions
            <span className={styles.headingHighlight}>for every need</span>
          </h2>
          
          <p className={styles.description}>
            WebRend offers multiple ways to acquire and deploy our marketplace products, giving you the flexibility to choose what works best for your project scope, timeline, and budget.
          </p>
        </div>
        
        <div className={styles.featuresContainer}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <span className={styles.headerEmoji}>💰</span>
            </div>
            <h3 className={styles.featureTitle}>One-Time Purchase</h3>
            <p className={styles.featureDescription}>
              Buy once, own forever. Get full access to premium code with a single payment and no recurring fees. Perfect for specific project needs with a defined scope.
            </p>
            <div className={styles.featureHighlights}>
              <div className={styles.featureHighlight}>
                <span className={styles.emojiIcon}>🔑</span>
                <span className={styles.highlightText}>Lifetime access</span>
              </div>
              <div className={styles.featureHighlight}>
                <span className={styles.emojiIcon}>👑</span>
                <span className={styles.highlightText}>Full ownership</span>
              </div>
              <div className={styles.featureHighlight}>
                <span className={styles.emojiIcon}>🔄</span>
                <span className={styles.highlightText}>Free updates</span>
              </div>
            </div>
            <Link href="/marketplace?filter=onetime" className={styles.featureButton}>
              View Purchasable Products
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 0L6.59 1.41L12.17 7H0V9H12.17L6.59 14.59L8 16L16 8L8 0Z" fill="currentColor" />
              </svg>
            </Link>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <span className={styles.headerEmoji}>🔄</span>
            </div>
            <h3 className={styles.featureTitle}>Subscription & Leasing</h3>
            <p className={styles.featureDescription}>
              Access our entire catalog with flexible subscription plans. Try before you buy or lease for specific project timelines with budget-friendly monthly payments.
            </p>
            <div className={styles.featureHighlights}>
              <div className={styles.featureHighlight}>
                <span className={styles.emojiIcon}>💸</span>
                <span className={styles.highlightText}>Lower upfront cost</span>
              </div>
              <div className={styles.featureHighlight}>
                <span className={styles.emojiIcon}>🔓</span>
                <span className={styles.highlightText}>Access to all products</span>
              </div>
              <div className={styles.featureHighlight}>
                <span className={styles.emojiIcon}>⚡️</span>
                <span className={styles.highlightText}>Continuous updates</span>
              </div>
            </div>
            <Link href="/marketplace?filter=subscription" className={styles.featureButton}>
              Explore Subscription Options
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 0L6.59 1.41L12.17 7H0V9H12.17L6.59 14.59L8 16L16 8L8 0Z" fill="currentColor" />
              </svg>
            </Link>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <span className={styles.headerEmoji}>🚀</span>
            </div>
            <h3 className={styles.featureTitle}>Direct In-Web Deployment</h3>
            <p className={styles.featureDescription}>
              Deploy directly to your project with zero configuration. Our one-click deployment technology saves time and eliminates setup headaches for seamless integration.
            </p>
            <div className={styles.featureHighlights}>
              <div className={styles.featureHighlight}>
                <span className={styles.emojiIcon}>👆</span>
                <span className={styles.highlightText}>One-click setup</span>
              </div>
              <div className={styles.featureHighlight}>
                <span className={styles.emojiIcon}>⚡️</span>
                <span className={styles.highlightText}>Instant integration</span>
              </div>
              <div className={styles.featureHighlight}>
                <span className={styles.emojiIcon}>🛠️</span>
                <span className={styles.highlightText}>No configuration</span>
              </div>
            </div>
            <Link href="/marketplace?filter=all" className={styles.featureButton}>
              Learn About Deployment
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 0L6.59 1.41L12.17 7H0V9H12.17L6.59 14.59L8 16L16 8L8 0Z" fill="currentColor" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
} 