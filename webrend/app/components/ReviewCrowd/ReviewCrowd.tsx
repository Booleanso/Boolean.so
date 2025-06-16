'use client';

import { useEffect, useRef, useState } from 'react';
import { Application } from '@splinetool/runtime';
import styles from './ReviewCrowd.module.css';



export default function ReviewCrowd() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  useEffect(() => {
    if (!isVisible || !canvasRef.current) return;

    let splineApp: Application | null = null;

    const loadSpline = async () => {
      try {
        splineApp = new Application(canvasRef.current!);
        await splineApp.load('https://prod.spline.design/btEcYHbw0ItE0gKl/scene.splinecode');
        console.log('Spline scene loaded successfully');
      } catch (error) {
        console.error('Failed to load Spline scene:', error);
      }
    };

    loadSpline();

    return () => {
      if (splineApp) {
        splineApp.dispose();
      }
    };
  }, [isVisible]);

  return (
    <section ref={sectionRef} className={styles.section}>
      {/* Spline 3D Background */}
      <div className={`${styles.splineContainer} ${isVisible ? styles.visible : ''}`}>
        <canvas 
          ref={canvasRef}
          className={styles.splineFrame}
          id="spline-canvas"
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