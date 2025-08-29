'use client';

import React from 'react';
import styles from './ctaStickyTrack.module.scss';
import Link from 'next/link';
import FAQ from '../FAQ/FAQ';

export default function CTAStickyTrack() {
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = React.useState<number>(0); // 0..1

  React.useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        // Start fade when the track enters the viewport; end when roughly halfway through
        const start = Math.min(1, Math.max(0, (vh - rect.top) / vh));
        // Full-opacity when the sticky section is fully in view
        const p = Math.min(1, Math.max(0, start));
        setProgress(p);
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className={styles.grid}>
      <div ref={trackRef} className={styles.track} aria-hidden={false}>
        <div className={styles.sticky} style={{ opacity: progress }}>
          <div className={styles.card}>
            <h2 className={styles.title}>Ready to build something great?</h2>
            <p className={styles.subtitle}>Join us for a quick discovery session and get a tailored plan.</p>
            <div className={styles.actions}>
              <Link href="/discovery" className={styles.primaryBtn}>Book a call</Link>
              <Link href="/portfolio" className={styles.secondaryBtn}>View work</Link>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.faqCol}>
        <FAQ />
      </div>
    </div>
  );
}


