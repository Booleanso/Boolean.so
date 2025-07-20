'use client';

import React, { useState, useEffect } from 'react';
import { smoothScrollToTop } from '../../utils/smooth-scroll';
import styles from './ScrollToTop.module.css';

interface ScrollToTopProps {
  showAfter?: number; // Show button after scrolling this many pixels
  className?: string;
}

export default function ScrollToTop({ showAfter = 300, className = '' }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsVisible(scrollTop > showAfter);
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Check initial scroll position
    handleScroll();

    // Cleanup
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfter]);

  const handleClick = () => {
    smoothScrollToTop(600);
  };

  return (
    <button
      className={`${styles.scrollToTop} ${isVisible ? styles.visible : ''} ${className}`}
      onClick={handleClick}
      aria-label="Scroll to top"
      type="button"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
} 