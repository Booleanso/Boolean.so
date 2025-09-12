/**
 * Enhanced Smooth Scroll Utilities for WebRend
 * Provides better performance and control than CSS-only smooth scrolling
 */

// Custom easing function for smoother animations
export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// Enhanced smooth scroll to element
export const smoothScrollToElement = (
  elementId: string,
  options: {
    duration?: number;
    offset?: number;
    easing?: (t: number) => number;
  } = {}
): void => {
  const {
    duration = 800,
    offset = -80, // Account for fixed navbar
    easing = easeInOutCubic
  } = options;

  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element with id "${elementId}" not found`);
    return;
  }

  const startPosition = window.pageYOffset;
  const targetPosition = element.getBoundingClientRect().top + window.pageYOffset + offset;
  const distance = targetPosition - startPosition;
  let startTime: number | null = null;

  const animation = (currentTime: number) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const run = easing(timeElapsed / duration);
    window.scrollTo(0, startPosition + (distance * run));
    
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  };

  requestAnimationFrame(animation);
};

// Smooth scroll to top
export const smoothScrollToTop = (duration: number = 600): void => {
  const startPosition = window.pageYOffset;
  const distance = -startPosition;
  let startTime: number | null = null;

  const animation = (currentTime: number) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const run = easeInOutCubic(timeElapsed / duration);
    window.scrollTo(0, startPosition + (distance * run));
    
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  };

  requestAnimationFrame(animation);
};

// Smooth scroll with custom target position
export const smoothScrollTo = (
  targetY: number,
  duration: number = 800,
  easing: (t: number) => number = easeInOutCubic
): void => {
  const startPosition = window.pageYOffset;
  const distance = targetY - startPosition;
  let startTime: number | null = null;

  const animation = (currentTime: number) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const run = easing(timeElapsed / duration);
    window.scrollTo(0, startPosition + (distance * run));
    
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  };

  requestAnimationFrame(animation);
};

// Get scroll progress (0-1) for animations
export const getScrollProgress = (): number => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  return Math.min(scrollTop / scrollHeight, 1);
};

// Check if element is in viewport
export const isElementInViewport = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

// Enhanced scroll event listener with throttling
export const addScrollListener = (
  callback: (scrollY: number, progress: number) => void,
  // _throttleMs: number = 16
): (() => void) => {
  let ticking = false;
  
  const handleScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.pageYOffset;
        const progress = getScrollProgress();
        callback(scrollY, progress);
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Return cleanup function
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}; 