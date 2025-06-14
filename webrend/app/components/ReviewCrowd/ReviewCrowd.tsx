'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ReviewCrowd.module.css';



export default function ReviewCrowd() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        {/* Header */}
        <div className={`${styles.headerContent} ${isVisible ? styles.visible : ''}`}>
          <div className={styles.badge}>
            <span className={styles.badgeText}>Testimonials</span>
          </div>
          <h2 className={styles.heading}>
            <span className={styles.headingLine}>What our clients say.</span>
            <span className={styles.headingLine}>
              <span className={styles.gradientText}>Real testimonials.</span>
            </span>
          </h2>
          <p className={styles.description}>
            Don&apos;t just take our word for it. Here&apos;s what our clients have to say about working with WebRend.
          </p>
        </div>

        {/* Spline 3D Element */}
        <div className={`${styles.splineContainer} ${isVisible ? styles.visible : ''}`}>
          <iframe 
            src="https://my.spline.design/untitled-de1d6f8a3c6d7edcbbda08e97b3b2d75/" 
            frameBorder="0" 
            className={styles.splineFrame}
            title="3D Testimonials Scene"
          />
        </div>


      </div>
    </section>
  );
} 