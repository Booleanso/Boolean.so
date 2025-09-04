'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './PortfolioCarousel.module.css';

interface PortfolioProject {
  slug?: string;
  title: string;
  description?: string;
  imageUrl: string;
}

export default function PortfolioCarousel() {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef<number>(0); // pixels scrolled from start (to the left)
  const cycleWidthRef = useRef<number>(0); // width of one logical cycle
  const rafRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartOffsetRef = useRef<number>(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/portfolio/projects', { cache: 'no-store' });
        if (!res.ok) return;
        const data: Array<{ imageUrl: string; title: string; slug?: string; description?: string }> = await res.json();
        if (cancelled) return;
        const items = (data || []).map((p) => ({
          slug: p.slug,
          title: p.title || 'Project',
          description: p.description || '',
          imageUrl: p.imageUrl || '/images/placeholder.png',
        }));
        setProjects(items);
      } catch {
        // ignore
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const items = useMemo(() => {
    if (!projects || projects.length === 0) return [] as PortfolioProject[];
    return projects;
  }, [projects]);

  // Duplicate list for seamless marquee
  const COPIES = 5;
  const itemsLoop = useMemo(() => {
    const loops: PortfolioProject[] = [];
    for (let i = 0; i < COPIES; i++) loops.push(...items);
    return loops;
  }, [items]);

  // Measure content width and start RAF auto-scroll
  useEffect(() => {
    const measure = () => {
      const el = trackRef.current;
      if (!el) return;
      // exact cycle width using total width divided by number of copies
      cycleWidthRef.current = el.scrollWidth / COPIES;
      applyTransformLocal();
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener('resize', measure, { passive: true });

    let last = performance.now();
    const SPEED = 28; // px/sec drift
    // start in the middle cycle so both sides are populated
    offsetRef.current = cycleWidthRef.current * Math.max(1, Math.floor(COPIES / 2));
    applyTransformLocal();
    const loop = (ts: number) => {
      const dt = (ts - last) / 1000;
      last = ts;
      if (!isDraggingRef.current) {
        offsetRef.current += SPEED * dt;
        applyTransformLocal();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [itemsLoop.length]);

  const applyTransformLocal = () => {
    const el = trackRef.current;
    const cycle = cycleWidthRef.current || 1;
    if (!el || cycle <= 0) return;
    // translate by raw offset for perfect continuity
    el.style.transform = `translateX(${-offsetRef.current}px)`;
    // rebase offset to stay within safe middle window so we never hit edges
    const lower = cycle * 1; // leave one cycle to the left
    const upper = cycle * (COPIES - 2); // and one to the right
    // bring back into [lower, upper] while preserving visual position
    while (offsetRef.current < lower) offsetRef.current += cycle;
    while (offsetRef.current > upper) offsetRef.current -= cycle;
  };

  return (
    <section className={styles.carouselSection} aria-label="Portfolio Carousel">
      <div className={styles.headerRow}>
        <div className={styles.headerTitle}>Your product is only as good as the work behind it.</div>
        <a className={styles.headerLink} href="/portfolio">See all →</a>
      </div>
      <div
        className={styles.viewport}
        ref={viewportRef}
        onPointerDown={(e) => {
          if (!trackRef.current) return;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          isDraggingRef.current = true;
          setDragging(true);
          dragStartXRef.current = e.clientX;
          dragStartOffsetRef.current = offsetRef.current;
        }}
        onPointerMove={(e) => {
          if (!isDraggingRef.current) return;
          const dx = e.clientX - dragStartXRef.current; // dragging right should move content right => decrease offset
          offsetRef.current = dragStartOffsetRef.current - dx;
          applyTransformLocal();
          e.preventDefault();
        }}
        onPointerUp={() => {
          isDraggingRef.current = false;
          setDragging(false);
          applyTransformLocal();
        }}
        onPointerCancel={() => {
          isDraggingRef.current = false;
          setDragging(false);
          applyTransformLocal();
        }}
      >
        <div ref={trackRef} className={`${styles.track} ${dragging ? styles.dragging : ''}`} aria-hidden={items.length === 0}>
          {itemsLoop.map((p, i) => {
            const sizeIdx = i % 3; // 0 small, 1 medium, 2 large
            const sizeClass = sizeIdx === 0 ? styles.sizeS : sizeIdx === 1 ? styles.sizeM : styles.sizeL;
            const isDark = (i % 7) === 2; // sprinkle some dark cards
            const isImageFocus = (i % 5) === 1; // some large image-forward cards
            const href = p.slug ? `/portfolio/projects/${p.slug}` : '#';

            return (
              <Link href={href} key={`${p.title}-${i}`} className={`${styles.card} ${sizeClass} ${isDark ? styles.dark : ''} ${isImageFocus ? styles.imageCard : ''}`} prefetch={false}>
                {isImageFocus ? (
                  <span className={styles.cardImageWrap}>
                    <Image src={p.imageUrl} alt={p.title} fill sizes="40vw" className={styles.cardImage} />
                    <span className={styles.cardImageLabel}>
                      <span className={styles.cardKicker}>{truncate(p.title, 24)}</span>
                      <span className={styles.cardCTA}>Learn more ↗</span>
                    </span>
                  </span>
                ) : (
                  <span className={styles.cardInner}>
                    <span className={styles.cardKicker}>{truncate(p.title, 28)}</span>
                    <span className={styles.cardBody}>{truncate(p.description || 'Recent project.', 96)}</span>
                    <span className={styles.cardFooter}>Explore ↗</span>
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function truncate(text: string, max: number) {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)) + '…';
}

// Auto-scroll + seamless wrap
function useMarquee(trackRef: React.RefObject<HTMLDivElement>, items: any[]) {
  const offsetRef = useRef<number>(0);
  const lastTsRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const halfWidthRef = useRef<number>(0);
  const isDraggingExternalRef = useRef<() => boolean>(() => false);

  // expose helpers to parent via closures
  // Parent will override these by assigning from its refs

  useEffect(() => {
    const measure = () => {
      const el = trackRef.current;
      if (!el) return;
      halfWidthRef.current = el.scrollWidth / 2; // because items duplicated
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener('resize', measure, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [trackRef, items.length]);

  const step = (ts: number) => {
    if (lastTsRef.current === 0) lastTsRef.current = ts;
    const dt = (ts - lastTsRef.current) / 1000; // seconds
    lastTsRef.current = ts;
    // Base speed in px/sec (slow drift)
    const SPEED = 28; // tweakable

    if (!isDraggingExternalRef.current()) {
      offsetRef.current += SPEED * dt;
      applyTransform(trackRef, offsetRef.current, halfWidthRef.current);
    }
    rafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    setExternalState: (args: { getDragging: () => boolean; getOffset: () => number; setOffset: (v: number) => void }) => {
      isDraggingExternalRef.current = args.getDragging;
      // Bridge offsetRef with parent offset
      offsetRef.current = args.getOffset();
      // Sync on each frame
      const sync = () => {
        offsetRef.current = args.getOffset();
        applyTransform(trackRef, offsetRef.current, halfWidthRef.current);
        requestAnimationFrame(sync);
      };
      requestAnimationFrame(sync);
    },
    applyOnce: () => applyTransform(trackRef, offsetRef.current, halfWidthRef.current),
  } as const;
}

function applyTransform(trackRef?: React.RefObject<HTMLDivElement> | null, rawOffset?: number, halfWidth?: number) {
  const ref = (trackRef && 'current' in trackRef) ? trackRef : null;
  const el = ref ? ref.current : null;
  if (!el || typeof rawOffset !== 'number' || !halfWidth) return;
  const wrapped = ((rawOffset % halfWidth) + halfWidth) % halfWidth; // keep in [0, halfWidth)
  el.style.transform = `translateX(${-wrapped}px)`;
}

function applyTransformExternal(el?: HTMLDivElement | null, rawOffset?: number, halfWidth?: number) {
  if (!el || typeof rawOffset !== 'number' || !halfWidth) return;
  const wrapped = ((rawOffset % halfWidth) + halfWidth) % halfWidth;
  el.style.transform = `translateX(${-wrapped}px)`;
}

// Bind parent refs to marquee behavior
function useBindMarquee(
  trackRef: React.RefObject<HTMLDivElement>,
  offsetRef: React.MutableRefObject<number>,
  halfWidthRef: React.MutableRefObject<number>,
  isDraggingRef: React.MutableRefObject<boolean>,
) {
  useEffect(() => {
    const measure = () => {
      const el = trackRef.current;
      if (!el) return;
      halfWidthRef.current = el.scrollWidth / 2;
      applyTransformExternal(el, offsetRef.current, halfWidthRef.current);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener('resize', measure, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [trackRef]);

  useEffect(() => {
    let raf: number;
    const SPEED = 28; // px/sec
    let last = performance.now();
    const loop = (ts: number) => {
      const dt = (ts - last) / 1000;
      last = ts;
      if (!isDraggingRef.current) {
        offsetRef.current += SPEED * dt;
        applyTransformExternal(trackRef.current, offsetRef.current, halfWidthRef.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [trackRef]);
}


