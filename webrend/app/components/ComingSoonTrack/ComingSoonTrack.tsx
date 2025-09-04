'use client'

import { useEffect, useRef, useState } from 'react';
import styles from './ComingSoonTrack.module.css';

export default function ComingSoonTrack() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = Math.max(1, rect.height - vh);
      const p = Math.max(0, Math.min(1, -rect.top / total));
      setProgress(p);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fade title in first 35% of the track, then keep it visible
  const titleOpacity = Math.min(1, progress / 0.35);
  // Scale down between 45% → 90%
  const scaleStart = 0.45;
  const scaleEnd = 0.9;
  const t = progress <= scaleStart ? 0 : progress >= scaleEnd ? 1 : (progress - scaleStart) / (scaleEnd - scaleStart);
  const scale = 1 - t * 0.12; // shrink up to 12%
  const radius = Math.round(t * 24); // up to 24px radius
  const shadowOpacity = 0.25 * t;

  return (
    <section ref={trackRef} className={styles.section}>
      <div className={styles.sticky}>
        <div
          className={styles.frame}
          style={{
            transform: `scale(${scale})`,
            borderRadius: `${radius}px`,
            boxShadow: `0 30px 80px rgba(0,0,0,${shadowOpacity})`
          }}
        >
          <video
            className={styles.video}
            src="/videos/hero.mp4"
            autoPlay
            muted
            playsInline
            loop
          />
          <div className={styles.overlay} style={{ opacity: titleOpacity }}>
            <div className={styles.badge}>COMING SOON</div>
            <h3 className={styles.title}>Something new is landing.</h3>
          </div>
        </div>
      </div>
    </section>
  );
}


