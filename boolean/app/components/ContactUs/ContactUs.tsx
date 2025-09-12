'use client';

import { useRef, useEffect, useState } from 'react';
import styles from './ContactUs.module.css';

export default function ContactUs() {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const sectionTop = sectionRef.current.getBoundingClientRect().top;
        const sectionHeight = sectionRef.current.offsetHeight;
        const viewportHeight = window.innerHeight;
        
        // Calculate how far we've scrolled into the section
        // 0 = just entered, 1 = passed midpoint
        let progress = 0;
        
        // When the section top is at viewport middle, progress should be ~0.5
        // When the section is fully visible, progress should be ~1
        if (sectionTop <= viewportHeight / 2) {
          progress = Math.min(1, (viewportHeight / 2 - sectionTop) / (sectionHeight / 2));
        }
        
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initialize on mount
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Calculate styles based on scroll progress
  const dynamicStyles = {
    backgroundColor: `rgba(${255 - (scrollProgress * 255)}, ${255 - (scrollProgress * 255)}, ${255 - (scrollProgress * 255)}, 1)`,
    color: scrollProgress > 0.5 ? '#ffffff' : '#1d1d1f',
  };
  
  const secondaryButtonStyles = {
    backgroundColor: scrollProgress > 0.5 
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.05)',
    color: scrollProgress > 0.5 ? '#ffffff' : '#000000',
    border: scrollProgress > 0.5 
      ? '1px solid rgba(255, 255, 255, 0.3)'
      : '1px solid rgba(0, 0, 0, 0.2)',
  };

  // Calculate content opacity based on scroll progress
  const contentOpacity = Math.min(1, scrollProgress * 2); // Starts fading in at 0%, fully visible at 50%

  return (
    <section 
      ref={sectionRef} 
      className={styles.contactSection}
      style={dynamicStyles}
    >
      <div className={styles.container}>
        <div 
          className={styles.contentWrapper}
          style={{ 
            opacity: contentOpacity,
            transform: `translateY(${Math.max(0, 30 - (contentOpacity * 30))}px)` 
          }}
        >
          <h2 className={styles.heading}>
            Let&apos;s work<br />together
          </h2>
          <p className={styles.description}>
            Ready to take the next step with your project? We&apos;re here to help you build, launch, and scale your vision.
          </p>
          <div className={styles.buttonGroup}>
            <a 
              href="mailto:hello@webrend.com" 
              className={styles.secondaryButton}
              style={secondaryButtonStyles}
            >
              hello@webrend.com
            </a>
          </div>
        </div>
      </div>
    </section>
  );
} 