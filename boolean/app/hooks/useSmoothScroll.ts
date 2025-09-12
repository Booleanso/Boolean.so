'use client';

import { useCallback, useRef, useEffect } from 'react';
import { 
  smoothScrollToElement, 
  smoothScrollToTop, 
  smoothScrollTo,
  addScrollListener
} from '../utils/smooth-scroll';

export const useSmoothScroll = () => {
  // Scroll to element by ID
  const scrollToElement = useCallback((elementId: string, options?: {
    duration?: number;
    offset?: number;
  }) => {
    smoothScrollToElement(elementId, options);
  }, []);

  // Scroll to top of page
  const scrollToTop = useCallback((duration?: number) => {
    smoothScrollToTop(duration);
  }, []);

  // Scroll to specific Y position
  const scrollTo = useCallback((targetY: number, duration?: number) => {
    smoothScrollTo(targetY, duration);
  }, []);

  // Scroll to next section (useful for single-page layouts)
  const scrollToNextSection = useCallback(() => {
    const currentScrollY = window.pageYOffset;
    const windowHeight = window.innerHeight;
    const nextSectionY = Math.ceil((currentScrollY + windowHeight) / windowHeight) * windowHeight;
    
    smoothScrollTo(nextSectionY, 800);
  }, []);

  // Scroll to previous section
  const scrollToPreviousSection = useCallback(() => {
    const currentScrollY = window.pageYOffset;
    const windowHeight = window.innerHeight;
    const prevSectionY = Math.floor(currentScrollY / windowHeight) * windowHeight;
    
    smoothScrollTo(Math.max(0, prevSectionY), 800);
  }, []);

  return {
    scrollToElement,
    scrollToTop,
    scrollTo,
    scrollToNextSection,
    scrollToPreviousSection,
  };
};

// Hook for scroll-based animations and effects
export const useScrollAnimation = (callback: (scrollY: number, progress: number) => void) => {
  const callbackRef = useRef(callback);
  
  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const cleanup = addScrollListener((scrollY, progress) => {
      callbackRef.current(scrollY, progress);
    });

    return cleanup;
  }, []);
};

// Hook for detecting scroll direction
export const useScrollDirection = () => {
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down'>('down');

  const updateScrollDirection = useCallback((scrollY: number) => {
    if (scrollY > lastScrollY.current) {
      scrollDirection.current = 'down';
    } else if (scrollY < lastScrollY.current) {
      scrollDirection.current = 'up';
    }
    lastScrollY.current = scrollY;
    return scrollDirection.current;
  }, []);

  return updateScrollDirection;
}; 