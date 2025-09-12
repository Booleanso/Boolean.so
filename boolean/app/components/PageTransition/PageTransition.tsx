"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  const pathname = usePathname();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayedChildren, setDisplayedChildren] = useState<React.ReactNode>(children);
  const isFirstRenderRef = useRef(true);

  const getTransitionProps = useCallback((direction: 'in' | 'out') => {
    const slideAmount = 15;
    const baseDuration = direction === 'in' ? duration : duration * 0.6;
    switch (type) {
      case 'slide-up':
        return {
          initial: { opacity: 0, y: slideAmount },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -slideAmount },
          duration: baseDuration,
          ease: direction === 'in' ? 'power2.out' : 'power2.in'
        } as const;
      case 'slide-down':
        return {
          initial: { opacity: 0, y: -slideAmount },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: slideAmount },
          duration: baseDuration,
          ease: direction === 'in' ? 'power2.out' : 'power2.in'
        } as const;
      case 'fade':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          duration: baseDuration,
          ease: direction === 'in' ? 'power2.out' : 'power2.in'
        } as const;
    }
  }, [type, duration]);

  // Keep displayed children in sync and animate in on pathname change
  useEffect(() => {
    setDisplayedChildren(children);
  }, [children]);

  useEffect(() => {
    if (!containerRef.current) return;
    const inProps = getTransitionProps('in');
    gsap.fromTo(containerRef.current, inProps.initial, { 
      ...inProps.animate, 
      duration: inProps.duration, 
      ease: inProps.ease,
      onComplete: () => {
        document.dispatchEvent(new CustomEvent('page-transition-complete'));
      }
    });
    isFirstRenderRef.current = false;
  }, [pathname, getTransitionProps]);

  // Intercept internal link clicks to run fade-out BEFORE navigation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function isModifiedEvent(e: MouseEvent) {
      return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (e as any).button !== 0;
    }

    function onClickCapture(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute('href') || '';
      if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (isModifiedEvent(e)) return;
      if (href.startsWith('#')) return; // let in-page anchors pass
      // Prevent default and animate out
      e.preventDefault();
      const outProps = getTransitionProps('out');
      const shouldHardReloadHome = href === '/' && pathname !== '/';
      gsap.to(containerRef.current, {
        ...outProps.exit,
        duration: outProps.duration,
        ease: outProps.ease,
        onComplete: () => {
          // Scroll to top just before navigation
          if (!href.includes('#')) smoothScrollTo(0, 0);
          if (shouldHardReloadHome) {
            window.location.assign('/');
          } else {
            router.push(href);
          }
        }
      });
    }

    el.addEventListener('click', onClickCapture, true);
    return () => el.removeEventListener('click', onClickCapture, true);
  }, [getTransitionProps, router]);

  return (
    <div key={pathname} ref={containerRef} className={styles.pageTransition}>
      {displayedChildren}
    </div>
  );
} 