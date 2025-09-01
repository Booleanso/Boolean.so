'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './MarketplaceFeatures.module.css';

export default function MarketplaceFeatures() {
  const [animationProgress, setAnimationProgress] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const sectionTop = sectionRef.current.offsetTop;
      const viewportHeight = window.innerHeight;
      const viewportTop = window.scrollY;
      
      // Calculate how far the section top is from the viewport top
      // Animation starts when section is approaching and completes when section top hits viewport top
      const distanceFromTop = sectionTop - viewportTop;
      const animationRange = viewportHeight; // Animation happens over one viewport height
      
      // Progress goes from 0 (far away) to 1 (section top at viewport top)
      const progress = Math.max(0, Math.min(1, 1 - (distanceFromTop / animationRange)));
      
      setAnimationProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Calculate individual word visibility based on animation progress
  const getWordStyle = (index: number, totalWords: number, direction: 'left' | 'right' | 'scale') => {
    const wordProgress = Math.max(0, Math.min(1, (animationProgress * totalWords * 1.2) - index));
    
    if (direction === 'scale') {
      return {
        opacity: wordProgress,
        transform: `scale(${0.3 + (wordProgress * 0.7)})`,
        transition: 'all 0.3s ease-out'
      };
    }
    
    const translateValue = direction === 'left' ? -100 : 100;
    return {
      opacity: wordProgress,
      transform: `translateX(${translateValue * (1 - wordProgress)}px)`,
      transition: 'all 0.3s ease-out'
    };
  };

  const badgeProgress = Math.max(0, Math.min(1, animationProgress * 3));

  return (
    <section ref={sectionRef} className={styles.featuresSection}>
      <div className={styles.featuresContent}>
        <div className={styles.headerContent}>
          <div 
            className={styles.badge}
            style={{
              opacity: badgeProgress,
              transform: `translateY(${20 * (1 - badgeProgress)}px)`,
              transition: 'all 0.3s ease-out'
            }}
          >
            Empowering Developers
          </div>
        </div>
        
        <div className={styles.heroText}>
          <h2 className={styles.flowingText}>
            <span 
              className={styles.wordFromLeft}
              style={getWordStyle(0, 19, 'left')}
            >
              Premium
            </span>{' '}
            <span 
              className={styles.iconBadge}
              style={getWordStyle(1, 19, 'scale')}
            >
              ⭐
            </span>{' '}
            <span 
              className={styles.wordFromRight}
              style={getWordStyle(2, 19, 'right')}
            >
              repositories.
            </span>{' '}
            <span 
              className={styles.wordFromLeft}
              style={getWordStyle(3, 19, 'left')}
            >
              One-time
            </span>{' '}
            <span 
              className={styles.iconBadge}
              style={getWordStyle(4, 19, 'scale')}
            >
              💰
            </span>{' '}
            <span 
              className={styles.wordFromRight}
              style={getWordStyle(5, 19, 'right')}
            >
              purchases
            </span>{' '}
            <span 
              className={styles.wordFromLeft}
              style={getWordStyle(6, 19, 'left')}
            >
              or
            </span>{' '}
            <span 
              className={styles.wordFromRight}
              style={getWordStyle(7, 19, 'right')}
            >
              flexible
            </span>{' '}
            <span 
              className={styles.iconBadge}
              style={getWordStyle(8, 19, 'scale')}
            >
              🔄
            </span>{' '}
            <span 
              className={styles.wordFromLeft}
              style={getWordStyle(9, 19, 'left')}
            >
              subscriptions.
            </span>{' '}
            <span 
              className={styles.wordFromRight}
              style={getWordStyle(10, 19, 'right')}
            >
              Deploy
            </span>{' '}
            <span 
              className={styles.wordFromLeft}
              style={getWordStyle(11, 19, 'left')}
            >
              directly
            </span>{' '}
            <span 
              className={styles.wordFromRight}
              style={getWordStyle(12, 19, 'right')}
            >
              to
            </span>{' '}
            <span 
              className={styles.wordFromLeft}
              style={getWordStyle(13, 19, 'left')}
            >
              your
            </span>{' '}
            <span 
              className={styles.wordFromRight}
              style={getWordStyle(14, 19, 'right')}
            >
              project
            </span>{' '}
            <span 
              className={styles.wordFromLeft}
              style={getWordStyle(15, 19, 'left')}
            >
              with
            </span>{' '}
            <span 
              className={styles.wordFromRight}
              style={getWordStyle(16, 19, 'right')}
            >
              zero
            </span>{' '}
            <span 
              className={styles.iconBadge}
              style={getWordStyle(17, 19, 'scale')}
            >
              ⚡
            </span>{' '}
            <span 
              className={styles.wordFromLeft}
              style={getWordStyle(18, 19, 'left')}
            >
              configuration.
            </span>
          </h2>
        </div>
      </div>
    </section>
  );
} 