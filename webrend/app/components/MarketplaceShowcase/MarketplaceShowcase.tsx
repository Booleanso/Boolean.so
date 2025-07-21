'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './MarketplaceShowcase.module.css';

export default function MarketplaceShowcase() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const sectionTop = sectionRef.current.offsetTop;
      const sectionHeight = sectionRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;

      // Calculate when section is in viewport
      const sectionStart = sectionTop;
      const sectionEnd = sectionTop + sectionHeight;
      const viewportTop = scrollY;
      const viewportBottom = scrollY + viewportHeight;

      // Start animation when section is 80% above viewport entry
      const offsetStart = sectionStart - (viewportHeight * 0.8); // 80% offset above entry
      
              // Check if we should start animating (80% before section enters viewport)
        if (scrollY >= offsetStart) {
          // Calculate progress from 80% above entry through the entire section
          const totalAnimationDistance = sectionHeight + (viewportHeight * 0.8);
        const progress = Math.max(0, Math.min(1, (scrollY - offsetStart) / totalAnimationDistance));
        setScrollProgress(progress);
      } else {
        setScrollProgress(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  // Calculate transform values based on scroll progress
  // Scale faster - complete scaling in first 30% of the animation
  const scaleProgress = Math.min(1, scrollProgress / 0.3); // Scale completes at 30% progress
  
  // Scale to fill viewport and beyond - calculate how much we need to scale
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const containerWidth = 1200; // max-width of container
  const containerHeight = containerWidth * (10/16); // aspect ratio 16:10
  
  const scaleX = viewportWidth / containerWidth;
  const scaleY = viewportHeight / containerHeight;
  const baseScale = Math.max(scaleX, scaleY); // Base scale to fill viewport
  const targetScale = baseScale * 1.1; // Scale just 10% larger than viewport
  
  const imageScale = 1 + (scaleProgress * (targetScale - 1));
  const borderRadius = 16 * (1 - scaleProgress); // Remove border radius
  const shadowIntensity = 1 - scaleProgress; // Remove shadow

  return (
    <section ref={sectionRef} className={styles.showcaseSection}>
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
                          <div 
                className={styles.imageWrapper}
                style={{
                  transform: `scale(${imageScale})`,
                  borderRadius: `${borderRadius}px`,
                  boxShadow: `0 25px 50px -12px rgba(0, 0, 0, ${0.15 * shadowIntensity})`,
                }}
              >
              <Image 
                src="/images/marketplace.png" 
                alt="WebRend Marketplace Preview" 
                width={1200}
                height={700}
                className={styles.showcaseImage}
                priority
                style={{
                  borderRadius: `${borderRadius}px`,
                }}
              />
              <div 
                className={styles.imageOverlay} 
                style={{
                  borderRadius: `${borderRadius}px`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 