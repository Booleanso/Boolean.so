'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useAnimation } from 'framer-motion';
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
  const back1 = useAnimation();
  const back2 = useAnimation();
  const topFrame = useAnimation();
  const safeIndex = (index % data.length + data.length) % data.length;
  const current = data[safeIndex];

  const openStack = async () => {
    await Promise.all([
      back1.start({ rotate: -14, x: -22, y: 16, transition: { duration: 0.25, ease: [0.22, 0.61, 0.36, 1] } }),
      back2.start({ rotate: 12, x: 22, y: -14, transition: { duration: 0.25, ease: [0.22, 0.61, 0.36, 1] } }),
      topFrame.start({ scale: 1.02, y: -6, transition: { duration: 0.2, ease: [0.22, 0.61, 0.36, 1] } })
    ]);
  };
  const closeStack = async () => {
    await Promise.all([
      back1.start({ rotate: -8, x: -10, y: 8, transition: { duration: 0.28, ease: [0.22, 0.61, 0.36, 1] } }),
      back2.start({ rotate: 6, x: 10, y: -6, transition: { duration: 0.28, ease: [0.22, 0.61, 0.36, 1] } }),
      topFrame.start({ scale: 1, y: 0, transition: { duration: 0.24, ease: [0.22, 0.61, 0.36, 1] } })
    ]);
  };
  const go = async (dir: -1 | 1) => {
    await openStack();
    setIndex((i) => (i + dir + data.length) % data.length);
    await closeStack();
  };
  const prev = () => { void go(-1); };
  const next = () => { void go(1); };

  return (
    <div className={`${styles.wrap} ${className || ''}`} style={style}>
      <div className={styles.cardRow}>
        <div className={styles.photoStack} aria-hidden>
          <motion.div className={`${styles.stackCard} ${styles.stackBack1}`} animate={back1} initial={{ rotate: -8, x: -10, y: 8 }} />
          <motion.div className={`${styles.stackCard} ${styles.stackBack2}`} animate={back2} initial={{ rotate: 6, x: 10, y: -6 }} />
          <motion.div className={styles.photoCard} animate={topFrame} initial={{ scale: 1, y: 0 }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.img
                key={safeIndex}
                src={current.avatar}
                alt={current.name}
                className={styles.photoImg}
                initial={{ opacity: 0, y: 12, scale: 0.98, rotate: -2 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, y: -12, scale: 0.98, rotate: 2 }}
                transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
              />
            </AnimatePresence>
          </motion.div>
        </div>
        <div className={styles.copy}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`name-${safeIndex}`}
              className={styles.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              {current.name}
            </motion.div>
            <motion.div
              key={`title-${safeIndex}`}
              className={styles.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, delay: 0.05 }}
            >
              {current.title}{current.company ? ` at ${current.company}` : ''}
            </motion.div>
            <motion.div
              key={`quote-${safeIndex}`}
              className={styles.quote}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, delay: 0.1 }}
            >
              {current.quote}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
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
  );
}


