'use client';

import { useEffect, useRef } from 'react';

interface SmoothScrollProviderProps {
  children: React.ReactNode;
  ease?: number; // 0.01 (slow) to 0.3 (fast), default 0.1
  disabled?: boolean;
}

export default function SmoothScrollProvider({ 
  children, 
  ease = 0.1,
  disabled = false 
}: SmoothScrollProviderProps) {
  const rafRef = useRef<number | null>(null);
  const currentScrollRef = useRef(0);
  const targetScrollRef = useRef(0);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    if (disabled || typeof window === 'undefined') return;

    // Check if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let isRunning = true;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      // Update target scroll position
      const delta = e.deltaY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      
      targetScrollRef.current += delta * 0.8; // Reduce sensitivity
      targetScrollRef.current = Math.max(0, Math.min(maxScroll, targetScrollRef.current));
      
      isScrollingRef.current = true;
    };

    const isEditableTarget = (evt: KeyboardEvent) => {
      // Prefer the actively focused element; fallback to event target
      const el = (document.activeElement as HTMLElement | null) || (evt.target as HTMLElement | null);
      if (!el) return false;
      if ((el as any).isContentEditable) return true;
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
      if (el instanceof HTMLInputElement) {
        const textLike = ['text','search','email','url','password','number','tel'];
        if (textLike.includes(el.type)) return true;
      }
      // ARIA textbox (e.g., some UI libs)
      if (el.getAttribute && el.getAttribute('role') === 'textbox') return true;
      return false;
    };

    const handleKeydown = (e: KeyboardEvent) => {
      const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
      if (keys.includes(e.key)) {
        // Do not hijack typing in inputs/textareas/contenteditable
        if (isEditableTarget(e)) return;
        e.preventDefault();
        
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        let delta = 0;
        
        switch (e.key) {
          case 'ArrowUp':
            delta = -40;
            break;
          case 'ArrowDown':
          case ' ':
            delta = 40;
            break;
          case 'PageUp':
            delta = -window.innerHeight * 0.8;
            break;
          case 'PageDown':
            delta = window.innerHeight * 0.8;
            break;
          case 'Home':
            targetScrollRef.current = 0;
            return;
          case 'End':
            targetScrollRef.current = maxScroll;
            return;
        }
        
        targetScrollRef.current += delta;
        targetScrollRef.current = Math.max(0, Math.min(maxScroll, targetScrollRef.current));
        isScrollingRef.current = true;
      }
    };

    const animate = () => {
      if (!isRunning) return;

      // Smooth interpolation
      const diff = targetScrollRef.current - currentScrollRef.current;
      
      if (Math.abs(diff) > 0.1) {
        currentScrollRef.current += diff * ease;
        
        // Actually scroll the window (this preserves all your existing scroll animations)
        window.scrollTo(0, currentScrollRef.current);
        
        isScrollingRef.current = true;
      } else {
        // Snap to target when very close
        if (isScrollingRef.current) {
          currentScrollRef.current = targetScrollRef.current;
          window.scrollTo(0, currentScrollRef.current);
          isScrollingRef.current = false;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    // Handle direct scroll events (from scrollbar, touch, etc.)
    const handleScroll = () => {
      // Only update if this isn't from our smooth scrolling
      if (!isScrollingRef.current) {
        const scrollY = window.pageYOffset;
        currentScrollRef.current = scrollY;
        targetScrollRef.current = scrollY;
      }
    };

    // Initialize scroll positions
    currentScrollRef.current = window.pageYOffset;
    targetScrollRef.current = window.pageYOffset;

    // Add event listeners
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeydown, { passive: false });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Start animation loop
    animate();

    return () => {
      isRunning = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [ease, disabled]);

  return <>{children}</>;
}