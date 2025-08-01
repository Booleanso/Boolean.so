'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
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

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.section}>
      {/* Background Image */}
      <div className={`${styles.backgroundImage} ${isVisible ? styles.visible : ''}`}>
        <Image
          src="/images/video-poster.jpg"
          alt="Testimonials background"
          fill
          className={styles.backgroundImg}
          style={{ objectFit: 'cover' }}
          priority={false}
        />
      </div>

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
      </div>
    </section>
  );
} 