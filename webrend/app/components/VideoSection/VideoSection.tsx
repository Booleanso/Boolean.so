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
          <div className={styles.featureCard}>
            <div className={styles.iconContainer}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.featureTitle}>Monetize Your Work</h3>
              <p className={styles.featureDescription}>
                Transform side projects and open source work into a sustainable source of income with our marketplace.
              </p>
            </div>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.iconContainer}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M8 12L16 12M12 8L12 16" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.featureTitle}>Global Reach</h3>
              <p className={styles.featureDescription}>
                Connect with buyers across the globe looking for exactly what you've built, expanding your market reach.
              </p>
            </div>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.iconContainer}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M7 11V7A5 5 0 0 1 17 7V11" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.featureTitle}>Secure Transactions</h3>
              <p className={styles.featureDescription}>
                Every transaction is protected with state-of-the-art security and escrow protection for peace of mind.
              </p>
            </div>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.iconContainer}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor"/>
              </svg>
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.featureTitle}>Beautiful Showcase</h3>
              <p className={styles.featureDescription}>
                Present your projects with stunning visuals and comprehensive documentation to attract more buyers.
              </p>
            </div>
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