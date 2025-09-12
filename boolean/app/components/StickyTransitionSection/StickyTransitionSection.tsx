'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './StickyTransitionSection.module.css';

interface StickyTransitionSectionProps {
  children: React.ReactNode[];
  sectionHeight?: string; // Total height of the track (e.g., '400vh')
}

export default function StickyTransitionSection({ 
  children, 
  sectionHeight = '300vh' 
}: StickyTransitionSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const section = sectionRef.current;
      const rect = section.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      const viewportHeight = window.innerHeight;

      // Calculate scroll progress through the section
      // 0 = section just entered viewport, 1 = section just left viewport
      let progress = 0;
      
      if (sectionTop <= 0 && sectionTop > -sectionHeight + viewportHeight) {
        // We're scrolling through the section
        progress = Math.abs(sectionTop) / (sectionHeight - viewportHeight);
        progress = Math.max(0, Math.min(1, progress));
      } else if (sectionTop > 0) {
        // Section hasn't entered yet
        progress = 0;
      } else {
        // Section has passed
        progress = 1;
      }

      setScrollProgress(progress);

      // Determine which component should be active based on scroll progress
      const totalComponents = children.length;
      const componentIndex = Math.floor(progress * totalComponents);
      const clampedIndex = Math.max(0, Math.min(totalComponents - 1, componentIndex));
      
      setActiveIndex(clampedIndex);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [children.length]);

  return (
    <section 
      ref={sectionRef} 
      className={styles.section}
      style={{ height: sectionHeight }}
    >
      <div className={styles.track}>
        <div className={styles.container}>
          <div className={styles.contentWrapper}>
            {children.map((child, index) => {
              // Calculate opacity based on scroll progress - instant transitions
              let opacity = 0;
              const progressPerComponent = 1 / children.length;
              const componentStart = index * progressPerComponent;
              const componentEnd = (index + 1) * progressPerComponent;
              
              if (scrollProgress >= componentStart && scrollProgress <= componentEnd) {
                // Component is in its active range - make transitions sharper
                const localProgress = (scrollProgress - componentStart) / progressPerComponent;
                
                if (localProgress <= 0.3) {
                  // Quick fade in - complete by 30%
                  opacity = Math.min(1, localProgress * 3.33);
                } else if (localProgress >= 0.7) {
                  // Quick fade out - start at 70%
                  opacity = Math.max(0, (1 - localProgress) * 3.33);
                } else {
                  // Fully visible in the middle
                  opacity = 1;
                }
              }

              return (
                <div
                  key={index}
                  className={styles.componentWrapper}
                  style={{ 
                    opacity: Math.max(0, Math.min(1, opacity)),
                    pointerEvents: index === activeIndex ? 'auto' : 'none'
                  }}
                >
                  {child}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}