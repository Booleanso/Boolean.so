'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Globe } from '../index/HeroSection/HeroSection';
import styles from './ServicesGlobeBackdrop.module.css';

export default function ServicesGlobeBackdrop() {
  const [opacity, setOpacity] = useState(0);
  const [translateY, setTranslateY] = useState(80);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      rafRef.current = null;
      const el = document.getElementById('services');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const totalTrack = Math.max(1, el.offsetHeight - vh);
      const scrolled = Math.min(Math.max(-rect.top, 0), totalTrack);
      const p = scrolled / totalTrack; // 0..1 through the sticky track

      // Visibility only when the section intersects viewport
      const visible = rect.top < vh && rect.bottom > 0;

      // Opacity: fade in during the last 40% of the track (0.6 -> 1.0)
      const fade = Math.max(0, Math.min(1, (p - 0.6) / 0.4));
      setOpacity(visible ? fade : 0);

      // Rise during last 40% as it fades in
      const tail = Math.max(0, Math.min(1, (p - 0.6) / 0.4));
      const y = 60 - tail * 120;
      setTranslateY(y);
    };

    const onScroll = () => {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
    };
    const onResize = onScroll;

    tick();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  return (
    <section className={styles.backdrop} aria-hidden>
      <div className={styles.stage} style={{ opacity, transform: `translateY(${Math.round(translateY)}px)` }}>
        <Canvas
          shadows
          camera={{ position: [0, 0, 5.5], fov: 70 }}
          gl={{ alpha: true, antialias: true, preserveDrawingBuffer: false }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
          <directionalLight position={[-5, 3, 5]} intensity={0.8} castShadow={false} />
          <directionalLight position={[0, -10, -5]} intensity={0.3} castShadow={false} />
          <Suspense fallback={null}>
            <Globe locations={[]} findMatchingProject={() => null} />
          </Suspense>
        </Canvas>
      </div>
    </section>
  );
}


