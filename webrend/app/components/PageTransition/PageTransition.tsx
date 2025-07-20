"use client";

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { smoothScrollTo } from '../../utils/smooth-scroll';
import styles from './PageTransition.module.css';

type TransitionType = 'fade' | 'slide-up' | 'slide-down';

interface PageTransitionProps {
  children: React.ReactNode;
  type?: TransitionType;
  duration?: number;
}

export default function PageTransition({ 
  children, 
  type = 'fade', 
  duration = 0.5 
}: PageTransitionProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [isFirstRender, setIsFirstRender] = useState(true);
  const previousPathnameRef = useRef<string>('');
  
  // Transition configurations
  const getTransitionProps = (direction: 'in' | 'out') => {
    const fadeAmount = 0;
    const slideAmount = 15;
    const baseDuration = direction === 'in' ? duration : duration * 0.6;
    
    switch (type) {
      case 'slide-up':
        return {
          initial: { opacity: 0, y: direction === 'in' ? slideAmount : -slideAmount },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: direction === 'in' ? -slideAmount : slideAmount },
          duration: baseDuration,
          ease: direction === 'in' ? 'power2.out' : 'power2.in'
        };
      case 'slide-down':
        return {
          initial: { opacity: 0, y: direction === 'in' ? -slideAmount : slideAmount },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: direction === 'in' ? slideAmount : -slideAmount },
          duration: baseDuration,
          ease: direction === 'in' ? 'power2.out' : 'power2.in'
        };
      case 'fade':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          duration: baseDuration,
          ease: direction === 'in' ? 'power2.out' : 'power2.in'
        };
    }
  };
  
  // Handle initial page load animation
  useEffect(() => {
    const inTransition = getTransitionProps('in');
    const ctx = gsap.context(() => {
      gsap.fromTo(
        pageRef.current,
        inTransition.initial,
        { 
          ...inTransition.animate,
          duration: inTransition.duration, 
          ease: inTransition.ease
        }
      );
    });
    
    return () => ctx.revert();
  }, []);
  
  // Handle route changes
  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      previousPathnameRef.current = pathname;
      return;
    }
    
    // Only animate if the path actually changed
    if (previousPathnameRef.current === pathname) {
      return;
    }
    
    const outTransition = getTransitionProps('out');
    const inTransition = getTransitionProps('in');
    
    // Smooth scroll to top for new pages
    const shouldScrollToTop = !pathname.includes('#');
    
    // When the path changes, animate out then in
    const ctx = gsap.context(() => {
      // First animate out
      gsap.to(pageRef.current, {
        ...outTransition.exit,
        duration: outTransition.duration,
        ease: outTransition.ease,
        onComplete: () => {
          // Scroll to top if needed before animating in
          if (shouldScrollToTop) {
            smoothScrollTo(0, 400);
          }
          
          // Then animate back in
          gsap.fromTo(
            pageRef.current,
            inTransition.initial,
            {
              ...inTransition.animate,
              duration: inTransition.duration,
              ease: inTransition.ease
            }
          );
        }
      });
    });
    
    // Update previous pathname
    previousPathnameRef.current = pathname;
    
    return () => ctx.revert();
  }, [pathname, isFirstRender, type, duration]);
  
  // Handle page exit on navigation away from site
  useEffect(() => {
    const outTransition = getTransitionProps('out');
    
    const handleBeforeUnload = () => {
      gsap.to(pageRef.current, {
        ...outTransition.exit,
        duration: outTransition.duration,
        ease: outTransition.ease
      });
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [type, duration]);
  
  return (
    <div ref={pageRef} className={styles.pageTransition}>
      {children}
    </div>
  );
} 