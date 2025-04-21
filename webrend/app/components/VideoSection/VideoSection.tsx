import React from 'react';
import styles from './VideoSection.module.css';

export default function VideoSection() {
  return (
    <section className={styles.videoSection}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2>Showcase Your Vision</h2>
          <p className={styles.sectionIntro}>
            Watch how our platform helps developers monetize their code and reach a global audience of potential buyers.
          </p>
        </div>
        
        <div className={styles.contentContainer}>
          <div className={styles.textContent}>
            <h3>Transform Your Code Into Revenue</h3>
            <p>
              WebRend.com provides a seamless marketplace where developers can list, showcase, and sell their GitHub repositories to businesses and other developers worldwide.
            </p>
            <ul className={styles.featuresList}>
              <li>
                <span className={styles.featureIcon}>✓</span>
                Monetize your side projects and open source work
              </li>
              <li>
                <span className={styles.featureIcon}>✓</span>
                Reach a global audience of potential buyers
              </li>
              <li>
                <span className={styles.featureIcon}>✓</span>
                Secure transactions with escrow protection
              </li>
              <li>
                <span className={styles.featureIcon}>✓</span>
                Showcase your work with beautiful project pages
              </li>
            </ul>
            <a href="/marketplace" className={styles.ctaButton}>
              Explore Marketplace
            </a>
          </div>
          <div className={styles.videoWrapper}>
            <video 
              className={styles.video}
              controls
              poster="/images/video-poster.jpg"
            >
              <source src="/videos/marketplace-demo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </section>
  );
} 