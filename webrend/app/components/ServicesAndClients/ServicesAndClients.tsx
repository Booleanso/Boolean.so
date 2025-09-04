'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './ServicesAndClients.module.css';
 

export default function ServicesAndClients() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const bricksStageRef = useRef<HTMLDivElement>(null);
  const specialBrickRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [placedBricks, setPlacedBricks] = useState<Array<{ w: number; h: number; x: number; y: number; speed: number; dir: 1 | -1; amp: number }>>([]);
  const [projectImages, setProjectImages] = useState<Array<{ src: string; title: string; slug?: string }>>([]);
  const [hoveredServiceIdx, setHoveredServiceIdx] = useState<number | null>(null);
  const [serviceIconPlacements, setServiceIconPlacements] = useState<Array<{ x: number; y: number; size: number; speed: number; dir: 1 | -1; amp: number; rotSeed: number; rotDir: 1 | -1; rotSpeed: number }>>([]);
  const serviceIcons = [
    { emoji: '💻', img: '/images/services/chrome.png', title: 'Websites', desc: 'Blazing‑fast responsive sites.', images: ['/images/services/website-dev-1.png','/images/services/website-dev-2.png','/images/services/website-dev-3.png'] },
    { emoji: '📱', img: '/images/services/appstore.png', title: 'Mobile Apps', desc: 'Native & cross‑platform.', images: ['/images/services/mobile-app-1.png','/images/services/mobile-app-2.png','/images/services/mobile-app-3.png'] },
    { emoji: '⚙️', img: '/images/services/cursor.png', title: 'Software', desc: 'Scalable systems & APIs.', images: ['/images/services/software-dev-1.png','/images/services/software-dev-2.png','/images/services/software-dev-3.png'] },
    { emoji: '🔩', img: '/images/services/c.png', title: 'Firmware', desc: 'Embedded & IoT.', images: ['/images/services/firmware-dev-1.png','/images/services/firmware-dev-2.png','/images/services/firmware-dev-3.png'] },
  ];
  const pageGlowColors = [
    '#4DA6FF', // Onboarding – Soft Blue
    '#6C63FF', // Blueprinting – Purple/Indigo
    '#1E2A38', // Repo Creation – Dark Navy
    '#FF9800', // Milestones – Vibrant Orange
    '#00BFA6', // Transparency – Teal
    '#3ED598', // Delivery – Bright Green
  ];

  const getGlowColor = (idx: number) => {
    if (idx <= 0) return '#8EC6FF'; // softer, lighter blue for onboarding
    return pageGlowColors[Math.min(pageGlowColors.length - 1, Math.max(0, idx))];
  };
  

  // Shuffle helper
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const sectionTop = sectionRef.current.offsetTop;
      const sectionHeight = sectionRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;

      // Calculate when section is in viewport
      const sectionStart = sectionTop;
      // const sectionEnd = sectionTop + sectionHeight;
      // const viewportTop = scrollY;
      // const viewportBottom = scrollY + viewportHeight;

      // Start animation when section is 80% above viewport entry
      const offsetStart = sectionStart - (viewportHeight * 0.8); // 80% offset above entry
      
              // Check if we should start animating (80% before section enters viewport)
        if (scrollY >= offsetStart) {
          // Calculate progress from 80% above entry through the entire section
          const totalAnimationDistance = sectionHeight + (viewportHeight * 0.8);
        const progress = Math.max(0, Math.min(1, (scrollY - offsetStart) / totalAnimationDistance));
        setScrollProgress(progress);
      } else {
        setScrollProgress(0);
      }

      // iPhone track moved to separate component
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // iPhone removed from this section

  // Fetch portfolio project images for bricks
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/portfolio/projects', { cache: 'no-store' });
        if (!res.ok) return;
        const data: Array<{ imageUrl: string; title: string; slug?: string }> = await res.json();
        if (cancelled) return;
        const images = (data || [])
          .map((p) => ({ src: p.imageUrl || '/images/placeholder.png', title: p.title || 'Project', slug: p.slug }))
          .filter(Boolean);
        setProjectImages(images);
      } catch {
        // ignore
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // No scaling logic needed for the iPhone frame

  // Calculate transform values based on scroll progress
  // Keep sizes fixed; only shadow may still ease out if desired
  const scaleProgress = Math.min(1, scrollProgress / 0.3);
  const borderRadius = 16; // Fixed border radius (no change on scroll)
  const shadowIntensity = 1 - scaleProgress; // Shadow still fades; adjust if needed

  // Build a pool of brick sizes (deterministic across mounts)
  const brickPool = useMemo(() => {
    const totalCount = 10;
    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    const pool: Array<{ w: number; h: number }> = [];

    // One extra-large near-square block
    {
      const w = rand(620, 860);
      const h = w * rand(1.0, 1.06);
      pool.push({ w, h });
    }
    // Big squares (2)
    for (let i = 0; i < 2; i++) {
      const w = rand(320, 440);
      const h = w * rand(1.0, 1.08);
      pool.push({ w, h });
    }
    // Wide near-squares (1–2)
    const wideCount = Math.random() < 0.5 ? 2 : 1;
    for (let i = 0; i < wideCount; i++) {
      const w = rand(420, 560);
      const h = w * rand(1.05, 1.18);
      pool.push({ w, h });
    }
    // Remaining tall-first bricks
    while (pool.length < totalCount) {
      const boost = Math.random() < 0.35 ? 1.4 : 1.0;
      const w = rand(140, 260) * boost;
      const h = w * rand(1.3, 2.2);
      pool.push({ w, h });
    }

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.map(({ w, h }) => ({ w: Math.round(w), h: Math.round(h) }));
  }, []);

  // Measure stage and place bricks after mount to avoid hydration mismatch
  useEffect(() => {
    const measure = () => {
      const el = bricksStageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setStageSize({ width: rect.width, height: rect.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (bricksStageRef.current) ro.observe(bricksStageRef.current);
    window.addEventListener('resize', measure, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    if (stageSize.width === 0 || stageSize.height === 0 || brickPool.length === 0) return;

    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    // Minimal padding so bricks can go close to or slightly past the edges
    const padding = Math.max(4, Math.round(stageSize.width * 0.005));
    const gap = Math.max(22, Math.round(stageSize.width * 0.02));
    const results: Array<{ w: number; h: number; x: number; y: number; speed: number; dir: 1 | -1; amp: number }> = [];

    const fits = (x: number, y: number, w: number, h: number) =>
      x >= padding &&
      y >= padding &&
      x + w <= stageSize.width - padding &&
      y + h <= stageSize.height - padding &&
      results.every(b => x + w + gap <= b.x || b.x + b.w + gap <= x || y + h + gap <= b.y || b.y + b.h + gap <= y);

    brickPool.forEach(({ w: baseW, h: baseH }) => {
      let w = baseW;
      let h = baseH;
      let attempts = 0;
      while (attempts < 80) {
        const x = rand(padding - w * 0.1, Math.max(padding, stageSize.width - w + w * 0.1)); // allow slight overhang
        const y = rand(padding, Math.max(padding, stageSize.height - h - padding));
        if (fits(x, y, w, h)) {
          const dir = Math.random() < 0.5 ? -1 : 1; // some up, some down
          const amp = rand(stageSize.height * 0.18, stageSize.height * 0.38); // stronger motion
          results.push({ w, h, x, y, speed: rand(0.25, 0.6), dir, amp });
          return; // placed
        }
        attempts++;
        // Occasionally shrink slightly to improve fit
        if (attempts % 20 === 0) {
          w *= 0.95;
          h *= 0.95;
        }
      }
    });

    setPlacedBricks(results);

    // Place service icons using the same collision/packing logic so they feel part of the grid
    const iconResults: Array<{ x: number; y: number; size: number; speed: number; dir: 1 | -1; amp: number; rotSeed: number; rotDir: 1 | -1; rotSpeed: number }> = [];
    const occupied: Array<{ x: number; y: number; w: number; h: number }> = results.map((r) => ({ x: r.x, y: r.y, w: r.w, h: r.h }));
    const iconCenters: Array<{ cx: number; cy: number; r: number }> = [];
    const minCenterDist = 190; // slightly closer grouping than before

    const fitsIcon = (x: number, y: number, size: number) =>
      x >= padding &&
      y >= padding &&
      x + size <= stageSize.width - padding &&
      y + size <= stageSize.height - padding &&
      // keep out of iPhone reserved bottom area
      
      // avoid bricks and other occupied rectangles
      occupied.every(b => x + size + gap <= b.x || b.x + b.w + gap <= x || y + size + gap <= b.y || b.y + b.h + gap <= y) &&
      // keep icons separated from each other (Poisson‑like spacing)
      (() => {
        const cx = x + size / 2;
        const cy = y + size / 2;
        return iconCenters.every(c => {
          const d = Math.hypot(cx - c.cx, cy - c.cy);
          const desired = Math.max(minCenterDist, (size / 2 + c.r) + gap * 0.6);
          return d >= desired;
        });
      })();

    const iconCount = Math.min(serviceIcons.length, 6);
    // Define a central band for icon placement (bring closer to middle)
    const centerBandXMin = Math.max(padding, Math.round(stageSize.width * 0.18));
    const centerBandXMax = Math.max(centerBandXMin + 1, Math.round(stageSize.width * 0.82));
    const centerBandYMin = Math.max(padding, Math.round(stageSize.height * 0.15));
    const centerBandYMax = Math.max(centerBandYMin + 1, Math.round(stageSize.height * 0.8));
    for (let i = 0; i < iconCount; i++) {
      const sizeBase = Math.random() < 0.5 ? 110 : 130;
      let size = sizeBase + Math.round(Math.random() * 14) - 7; // small variance
      let attempts = 0;
      while (attempts < 80) {
        // sample within central band to cluster nearer the center
        const x = rand(
          centerBandXMin,
          Math.max(centerBandXMin, Math.min(stageSize.width - size - padding, centerBandXMax - size))
        );
        const y = rand(
          centerBandYMin,
          Math.max(centerBandYMin, Math.min(stageSize.height - size - padding, centerBandYMax - size))
        );
        if (fitsIcon(x, y, size)) {
          const dir = -1 as const; // always drift upward as you scroll
          const amp = rand(stageSize.height * 0.16, stageSize.height * 0.32); // a bit more upward travel
          const speed = rand(0.25, 0.55);
          const rotSeed = rand(-20, 20);
          const rotDir = Math.random() < 0.5 ? -1 : 1; // clockwise or counter‑clockwise
          const rotSpeed = rand(80, 220); // degrees across the full scrollProgress 0..1
          iconResults.push({ x, y, size, speed, dir, amp, rotSeed, rotDir, rotSpeed });
          occupied.push({ x, y, w: size, h: size });
          iconCenters.push({ cx: x + size / 2, cy: y + size / 2, r: size / 2 });
          break;
        }
        attempts++;
        if (attempts % 20 === 0) size *= 0.95;
      }
    }
    setServiceIconPlacements(iconResults);
  }, [stageSize.width, stageSize.height, brickPool]);

  // Choose a unique random image for each visible brick (no repeats)
  const assignedImages = useMemo(() => {
    if (!projectImages || projectImages.length === 0) return [] as Array<{ src: string; title: string; slug?: string }>;
    const count = Math.min(projectImages.length, placedBricks.length);
    return shuffle(projectImages).slice(0, count);
  }, [projectImages, placedBricks.length]);

  return (
    <section ref={sectionRef} className={styles.showcaseSection}>
      {/* Removed popup */}
      <div className={styles.showcaseContent}>
        <div className={styles.imageContainer}>
          <div className={styles.showcaseImageContainer}>
            <div 
                className={styles.imageWrapper}
                style={{
                  borderRadius: `${borderRadius}px`,
                  boxShadow: `0 25px 50px -12px rgba(0, 0, 0, ${0.15 * shadowIntensity})`,
                  transform: `translateY(${Math.round(-scrollProgress * 140)}px)`,
                }}
              >
              <Image 
                src="/images/marketplace.png" 
                alt="WebRend Marketplace Preview" 
                width={1200}
                height={700}
                className={styles.showcaseImage}
                priority
                style={{ borderRadius: `${borderRadius}px` }}
              />
              <div 
                className={styles.imageOverlay} 
                style={{
                  borderRadius: `${borderRadius}px`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Floating bricks after the image, varied sizes/positions with subtle parallax */}
        <div ref={bricksStageRef} className={styles.bricksStage}>
          {placedBricks
            .slice(0, assignedImages.length || placedBricks.length)
            .map((b, index) => {
            const offset = scrollProgress * b.amp * b.speed * b.dir;
            const img = assignedImages[index] || { src: '/images/placeholder.png', title: 'Project' };
            const href = img.slug ? `/portfolio/projects/${img.slug}` : '#';
            const innerDir = (index % 2 === 0) ? 1 : -1;
            const innerMagY = Math.min(140, Math.round((b.h || 220) * 0.24));
            const innerY = -(scrollProgress * innerMagY * innerDir);
            return (
              <div
                key={index}
                className={styles.floatingBrick}
                style={{
                  width: `${Math.round(b.w)}px`,
                  height: `${Math.round(b.h)}px`,
                  transform: `translate(${Math.round(b.x)}px, ${Math.round(b.y + offset)}px)`,
                }}
              >
                <Link href={href} className={styles.brickLink} aria-label={img.title} prefetch={false}>
                  <div className={styles.brickParallax} style={{ transform: `translateY(${Math.round(innerY)}px)` }}>
                    <Image 
                      src={img.src}
                      alt={img.title}
                      width={Math.round(b.w)}
                      height={Math.round(b.h)}
                      className={styles.brickImage}
                      priority={index < 3}
                    />
                  </div>
                </Link>
              </div>
            );
          })}

          {/* Overlay randomized services icons integrated with bricks layout */}
          <div className={`${styles.servicesIconsLayer} ${hoveredServiceIdx !== null ? styles.dimOthers : ''}`} aria-hidden>
            {serviceIconPlacements.map((p, i) => {
              const svc = serviceIcons[i % serviceIcons.length];
              const offset = scrollProgress * p.amp * p.speed * p.dir;
              const rot = (scrollProgress * p.rotSpeed * p.rotDir + p.rotSeed) % 360;
              return (
                <div
                  key={i}
                  className={`${styles.serviceIconItem} ${hoveredServiceIdx === i ? styles.hovered : ''}`}
                  style={{ width: p.size, height: p.size, transform: `translate(${Math.round(p.x)}px, ${Math.round(p.y + offset)}px) rotate(${rot}deg)` }}
                  onMouseEnter={() => setHoveredServiceIdx(i)}
                  onMouseLeave={() => setHoveredServiceIdx(null)}
                >
                  <div className={styles.serviceIconTile}>
                    {('img' in svc && (svc as any).img) ? (
                      <img src={(svc as any).img} alt={svc.title} className={styles.serviceImgIcon} />
                    ) : (
                      <span className={styles.serviceEmoji}>{svc.emoji}</span>
                    )}
                  </div>
                  {/* Floating images + overlay behind them */}
                  <div className={`${styles.iconImageReveal} ${hoveredServiceIdx === i ? styles.active : ''}`}>
                    {(svc.images || []).slice(0, 3).map((src: string, k: number) => (
                      <div key={k} className={styles.floatingImage}>
                        <img src={src} alt="preview" className={styles.serviceImage} />
                      </div>
                    ))}
                    {/* Topmost gradient overlay to fade images into white/black near the bottom */}
                    <div className={styles.revealFadeOverlay} />
                  </div>
                  {/* Text sits above everything and below the icon (outside reveal) */}
                  <div className={`${styles.serviceText} ${hoveredServiceIdx === i ? styles.active : ''}`}>
                    <div className={styles.textTitle}>{svc.title}</div>
                    <div className={styles.textDesc}>{svc.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stage-level blur overlays must sit behind the floating images */}
          <div className={`${styles.stageGlobalBlur} ${hoveredServiceIdx !== null ? styles.active : ''}`} aria-hidden />
          <div className={`${styles.stageBlurOverlay} ${hoveredServiceIdx !== null ? styles.active : ''}`} aria-hidden />

          

        </div>
        
      </div>
    </section>
  );
} 

 