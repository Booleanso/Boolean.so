'use client'

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import styles from './ComingSoonTrack.module.css';

export default function ComingSoonTrack() {
  const trackRef = useRef<HTMLDivElement>(null);
  // Progress MotionValue with spring smoothing for buttery animations
  const progress = useMotionValue(0);
  const smoothProgress = useSpring(progress, { stiffness: 120, damping: 24, mass: 0.6 });
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const onScroll = () => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = Math.max(1, rect.height - vh);
      const p = Math.max(0, Math.min(1, -rect.top / total));
      progress.set(p);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [progress]);

  // Fade title in first 35% of the track, then keep it visible
  const titleOpacity = useTransform(smoothProgress, [0, 0.35], [0, 1]);
  
  // Scale down and round corners between 45% → 90%
  const scale = useTransform(smoothProgress, (v) => {
    const start = 0.45; const end = 0.9;
    const r = v <= start ? 0 : v >= end ? 1 : (v - start) / (end - start);
    return 1 - r * 0.12;
  });
  const radius = useTransform(smoothProgress, (v) => {
    const start = 0.45; const end = 0.9;
    const r = v <= start ? 0 : v >= end ? 1 : (v - start) / (end - start);
    return `${Math.round(r * 24)}px`;
  });
  const boxShadow = useTransform(smoothProgress, (v) => {
    const start = 0.45; const end = 0.9;
    const r = v <= start ? 0 : v >= end ? 1 : (v - start) / (end - start);
    const shadowOpacity = 0.25 * r;
    return `0 30px 80px rgba(0,0,0,${shadowOpacity})`;
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setMessage('Enter a valid email');
      return;
    }
    try {
      setStatus('loading');
      setMessage('');
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      setStatus('success');
      setMessage('Thanks! You\'re on the list.');
      setEmail('');
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Something went wrong');
    }
  };

  return (
    <section ref={trackRef} className={styles.section}>
      <div className={styles.sticky}>
        <motion.div
          className={styles.frame}
          style={{ scale, borderRadius: radius, boxShadow }}
        >
          <video
            className={styles.video}
            src="/videos/hero.mp4"
            autoPlay
            muted
            playsInline
            loop
          />
          <motion.div className={styles.overlay} style={{ opacity: titleOpacity }}>
            <div className={styles.badge}>COMING SOON</div>
            <h3 className={styles.title}>Full AI project generation is on the way.</h3>
            <form className={styles.form} onSubmit={onSubmit}>
              <input
                className={styles.input}
                type="email"
                name="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading'}
                aria-label="Email address"
                required
              />
              <button className={styles.button} type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Joining...' : 'Notify me'}
              </button>
            </form>
            {message && (
              <div className={`${styles.note} ${status === 'success' ? styles.success : ''} ${status === 'error' ? styles.error : ''}`}>{message}</div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}


