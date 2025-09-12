'use client'

import { useEffect, useRef, useState } from 'react';
import styles from './FallingTrack.module.css';

export default function FallingTrack() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = Math.max(1, rect.height - vh);
      const p = Math.max(0, Math.min(1, -rect.top / total));
      setProgress(p);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section ref={trackRef} className={styles.section}>
      <div className={styles.sticky}>
        <div className={styles.content}>
          <div className={styles.left}>
            <div className={styles.label}>Falling Focus</div>
            <h3 className={styles.title}>High‑velocity builds, full momentum.</h3>
            <p className={styles.desc}>We keep shipping while you keep seeing progress — fast feedback, tight loops, and visible movement every day.</p>
          </div>
          <div className={styles.right}>
            <div
              className={styles.icon}
              style={{
                transform: `translateX(${Math.sin(progress * Math.PI * 4) * 70}px) translateY(${progress * 80}vh) rotate(${progress * 2160}deg)`
              }}
            >
              <div className={styles.iconInner}>WR</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


