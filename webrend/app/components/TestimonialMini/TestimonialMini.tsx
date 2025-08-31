'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import styles from './TestimonialMini.module.css';

export type TestimonialItem = {
  id: string;
  name: string;
  title: string;
  company?: string;
  quote: string;
  avatar: string;
};

interface TestimonialMiniProps {
  items?: TestimonialItem[];
  className?: string;
  style?: React.CSSProperties;
}

export default function TestimonialMini({ items, className, style }: TestimonialMiniProps) {
  const data = useMemo<TestimonialItem[]>(() => (
    items && items.length > 0 ? items : [
      {
        id: 'sarah',
        name: 'Sarah Chen',
        title: 'Product Manager',
        company: 'TechFlow',
        quote: 'The attention to detail and innovative features have completely transformed our workflow. This is exactly what we\'ve been looking for.',
        avatar: '/testimonials/1.png'
      },
      {
        id: 'michael',
        name: 'Michael Patel',
        title: 'Founder',
        company: 'BrightLabs',
        quote: 'Fast delivery and clean architecture. The team exceeded expectations across the board.',
        avatar: '/testimonials/2.png'
      },
      {
        id: 'lena',
        name: 'Lena Ortiz',
        title: 'CTO',
        company: 'Nimbus AI',
        quote: 'Reliable, modern, and thoughtfully designed. It felt like adding a senior team overnight.',
        avatar: '/testimonials/3.png'
      }
    ]
  ), [items]);

  const [index, setIndex] = useState(0);
  const current = data[(index % data.length + data.length) % data.length];

  const prev = () => setIndex((i) => (i - 1 + data.length) % data.length);
  const next = () => setIndex((i) => (i + 1) % data.length);

  return (
    <div className={`${styles.wrap} ${className || ''}`} style={style}>
      <div className={styles.cardRow}>
        <div className={styles.photoStack} aria-hidden>
          <div className={`${styles.stackCard} ${styles.stackBack1}`} />
          <div className={`${styles.stackCard} ${styles.stackBack2}`} />
          <div className={styles.photoCard}>
            <Image src={current.avatar} alt={current.name} width={220} height={220} className={styles.photoImg} />
          </div>
        </div>
        <div className={styles.copy}>
          <div className={styles.name}>{current.name}</div>
          <div className={styles.title}>{current.title}{current.company ? ` at ${current.company}` : ''}</div>
          <div className={styles.quote}>{current.quote}</div>
          <div className={styles.controls}>
            <button onClick={prev} aria-label="Previous" className={styles.navBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button onClick={next} aria-label="Next" className={styles.navBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


