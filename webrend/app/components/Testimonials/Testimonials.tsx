'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './Testimonials.module.css';

export type Testimonial = {
  id: string;
  name: string;
  title: string;
  company?: string;
  quote: string;
  avatar: string;
};

interface TestimonialsProps {
  items?: Testimonial[];
  className?: string;
  style?: React.CSSProperties;
}

export default function Testimonials({ items, className, style }: TestimonialsProps) {
  const data = useMemo<Testimonial[]>(() => (
    items && items.length > 0 ? items : [
      { id: 'sarah', name: 'Sarah Chen', title: 'Product Manager', company: 'TechFlow', quote: 'The attention to detail and innovative features transformed our workflow.', avatar: '/testimonials/1.png' },
      { id: 'michael', name: 'Michael Patel', title: 'Founder', company: 'BrightLabs', quote: 'Fast delivery and clean architecture. The team exceeded expectations.', avatar: '/testimonials/2.png' },
      { id: 'lena', name: 'Lena Ortiz', title: 'CTO', company: 'Nimbus AI', quote: 'Reliable, modern, and thoughtfully designed. Like adding a senior team overnight.', avatar: '/testimonials/3.png' },
      { id: 'devon', name: 'Devon Brooks', title: 'Head of Ops', company: 'Northstar', quote: 'Communication was clear and proactive. We shipped faster than planned.', avatar: '/testimonials/4.png' },
      { id: 'amira', name: 'Amira Khan', title: 'Design Lead', company: 'Studio 9', quote: 'Pixel-perfect execution with thoughtful UX. Truly a partner, not a vendor.', avatar: '/testimonials/5.png' },
      { id: 'kyle', name: 'Kyle Nguyen', title: 'Engineering Manager', company: 'Vectorly', quote: 'Type-safe, well-tested, and scalable. Handover was effortless for our team.', avatar: '/testimonials/6.png' },
      { id: 'sofia', name: 'Sofia Martinez', title: 'Founder', company: 'OpenGrid', quote: 'Transparent process with real momentum. We felt in the loop the whole time.', avatar: '/testimonials/7.png' },
    ]
  ), [items]);

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const topTrackRef = useRef<HTMLDivElement | null>(null);
  const middleTrackRef = useRef<HTMLDivElement | null>(null);
  const bottomTrackRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const targetNXRef = useRef<number>(0);
  const currentNXRef = useRef<number>(0);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    const onMove = (e: MouseEvent) => {
      const rect = sectionEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const nx = Math.max(-1, Math.min(1, (x / Math.max(1, rect.width)) * 2 - 1));
      targetNXRef.current = nx;
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
    };

    const tick = () => {
      rafRef.current = null;
      // Smooth follow
      const cur = currentNXRef.current;
      const tgt = targetNXRef.current;
      const next = cur + (tgt - cur) * 0.12; // easing
      currentNXRef.current = next;

      const maxShift = 80; // px
      const topShift = Math.round(next * -maxShift); // opposite directions
      const middleShift = Math.round(next * -maxShift * 0.6);
      const bottomShift = Math.round(next * maxShift);

      if (topTrackRef.current) {
        topTrackRef.current.style.transform = `translate3d(${topShift}px,0,0)`;
      }
      if (middleTrackRef.current) {
        middleTrackRef.current.style.transform = `translate3d(${middleShift}px,0,0)`;
      }
      if (bottomTrackRef.current) {
        bottomTrackRef.current.style.transform = `translate3d(${bottomShift}px,0,0)`;
      }

      // Continue if not settled
      if (Math.abs(tgt - next) > 0.001) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    sectionEl.addEventListener('mousemove', onMove);
    return () => {
      sectionEl.removeEventListener('mousemove', onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  return (
    <section ref={sectionRef} className={`${styles.section} ${className || ''}`} style={style}>
      <div className={styles.header}>
        <div className={styles.badge}>Testimonials</div>
        <h2 className={styles.title}>What clients say</h2>
        <p className={styles.subtitle}>Trusted by founders, PMs, and engineering leaders across startups and enterprises.</p>
      </div>

      <div className={styles.marquee}>
        <div className={`${styles.row} ${styles.rowTop}`}>
          <div ref={topTrackRef} className={styles.track} aria-hidden>
            {data.map((t, i) => (
              <article key={`top-${t.id}-${i}`} className={styles.card}>
                <div className={styles.cardHead}>
                  <div className={styles.avatarWrap}>
                    <Image src={t.avatar} alt={t.name} width={48} height={48} className={styles.avatar} />
                  </div>
                  <div className={styles.person}>
                    <div className={styles.name}>{t.name}</div>
                    <div className={styles.meta}>{t.title}{t.company ? ` · ${t.company}` : ''}</div>
                  </div>
                </div>
                <div className={styles.quote}>“{t.quote}”</div>
              </article>
            ))}
          </div>
        </div>

        <div className={`${styles.row} ${styles.rowMiddle}`}>
          <div ref={middleTrackRef} className={styles.track} aria-hidden>
            {data.map((t, i) => (
              <article key={`middle-${t.id}-${i}`} className={styles.card}>
                <div className={styles.cardHead}>
                  <div className={styles.avatarWrap}>
                    <Image src={t.avatar} alt={t.name} width={48} height={48} className={styles.avatar} />
                  </div>
                  <div className={styles.person}>
                    <div className={styles.name}>{t.name}</div>
                    <div className={styles.meta}>{t.title}{t.company ? ` · ${t.company}` : ''}</div>
                  </div>
                </div>
                <div className={styles.quote}>“{t.quote}”</div>
              </article>
            ))}
          </div>
        </div>

        <div className={`${styles.row} ${styles.rowBottom}`}>
          <div ref={bottomTrackRef} className={styles.track} aria-hidden>
            {data.map((t, i) => (
              <article key={`bottom-${t.id}-${i}`} className={styles.card}>
                <div className={styles.cardHead}>
                  <div className={styles.avatarWrap}>
                    <Image src={t.avatar} alt={t.name} width={48} height={48} className={styles.avatar} />
                  </div>
                  <div className={styles.person}>
                    <div className={styles.name}>{t.name}</div>
                    <div className={styles.meta}>{t.title}{t.company ? ` · ${t.company}` : ''}</div>
                  </div>
                </div>
                <div className={styles.quote}>“{t.quote}”</div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


