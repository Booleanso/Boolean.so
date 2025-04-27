'use client';

import React, { useRef, useState, useEffect } from 'react';
import styles from './VideoSection.module.css';

export default function VideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section className={styles.videoSection}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.heading}>
            See it in <span className={styles.headingHighlight}>action</span>
          </h2>
          <p className={styles.sectionIntro}>
            Watch how our platform helps developers monetize their code and reach a global audience of businesses and other developers.
          </p>
        </div>
        
        <div className={styles.videoContainer}>
          <div className={styles.videoWrapper}>
            <video 
              className={styles.video}
              ref={videoRef}
              poster="/images/video-poster.jpg"
              playsInline
              onClick={togglePlay}
            >
              <source src="/videos/marketplace-demo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <button 
              className={`${styles.playButton} ${isPlaying ? styles.hidden : ''}`}
              onClick={togglePlay}
              aria-label="Play video"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5.14V19.14L19 12.14L8 5.14Z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className={styles.featuresGrid}>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>💰</div>
            <h3 className={styles.featureTitle}>Monetize Your Work</h3>
            <p className={styles.featureDescription}>
              Transform side projects and open source work into a sustainable source of income with our marketplace.
            </p>
          </div>
          
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>🌍</div>
            <h3 className={styles.featureTitle}>Global Reach</h3>
            <p className={styles.featureDescription}>
              Connect with buyers across the globe looking for exactly what you've built, expanding your market reach.
            </p>
          </div>
          
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>🔒</div>
            <h3 className={styles.featureTitle}>Secure Transactions</h3>
            <p className={styles.featureDescription}>
              Every transaction is protected with state-of-the-art security and escrow protection for peace of mind.
            </p>
          </div>
          
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>✨</div>
            <h3 className={styles.featureTitle}>Beautiful Showcase</h3>
            <p className={styles.featureDescription}>
              Present your projects with stunning visuals and comprehensive documentation to attract more buyers.
            </p>
          </div>
        </div>
        
        <div className={styles.ctaContainer}>
          <a href="/marketplace" className={styles.ctaButton}>
            Explore Marketplace
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 0L6.59 1.41L12.17 7H0V9H12.17L6.59 14.59L8 16L16 8L8 0Z" fill="currentColor" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
} 