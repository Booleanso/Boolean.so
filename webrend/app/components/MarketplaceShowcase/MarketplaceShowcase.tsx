'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, ContactShadows, OrbitControls, Center, useGLTF, Html } from '@react-three/drei';
import styles from './MarketplaceShowcase.module.css';

export default function MarketplaceShowcase() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const bricksStageRef = useRef<HTMLDivElement>(null);
  const specialBrickRef = useRef<HTMLDivElement>(null);
  const phoneTrackRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [placedBricks, setPlacedBricks] = useState<Array<{ w: number; h: number; x: number; y: number; speed: number; dir: 1 | -1; amp: number }>>([]);
  const [projectImages, setProjectImages] = useState<Array<{ src: string; title: string; slug?: string }>>([]);
  // iPhone frame sizing (static)
  const PHONE_WIDTH = 440;
  const PHONE_HEIGHT = 950;
  const [phoneEaseY, setPhoneEaseY] = useState<number>(60);
  const [phoneOpacity, setPhoneOpacity] = useState<number>(0);
  const [phoneTrackProgress, setPhoneTrackProgress] = useState<number>(0);
  const [timelineOpacity, setTimelineOpacity] = useState<number>(0);
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
  // Delayed step switching across the phone track
  const steps = 6;
  const SWITCH_DELAY_MS: number = 0; // remove dwell for snappier response
  const [currentStep, setCurrentStep] = useState(0);
  const [pendingStep, setPendingStep] = useState(0);
  const [pendingStartedAt, setPendingStartedAt] = useState<number | null>(null);

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

      // iPhone uses sticky positioning to rest at the center; no scroll math needed
      if (phoneTrackRef.current) {
        const rect = phoneTrackRef.current.getBoundingClientRect();
        const vh = window.innerHeight;
        const total = Math.max(1, rect.height - vh);
        const progress = Math.max(0, Math.min(1, -rect.top / total));

        // Gate timings: start after sticky fully engaged; fade only near end
        const START_GUARD = 0.1;
        const END_FADE_START = 0.98;

        // Ease into sticky at start
        let translate = 0;
        if (progress <= START_GUARD) {
          translate = (1 - progress / START_GUARD) * 60; // from 60px to 0px
        } else {
          translate = 0;
        }
        setPhoneEaseY(translate);

        // Fade in at start, hold, then fade near end
        let op = 1;
        if (progress <= START_GUARD) {
          op = progress / START_GUARD;
        } else if (progress >= END_FADE_START) {
          op = 1 - (progress - END_FADE_START) / (1 - END_FADE_START);
        } else {
          op = 1;
        }
        setPhoneOpacity(Math.max(0, Math.min(1, op)));
        // Timeline opacity: start after phone fully faded in
        const TIMELINE_FADE_LEN = 0.08; // fade-in length after start guard
        let tl = 0;
        if (progress > START_GUARD) {
          tl = Math.min(1, (progress - START_GUARD) / TIMELINE_FADE_LEN);
        } else {
          tl = 0;
        }
        setTimelineOpacity(tl);
        // Adjusted progress for timeline/pages
        const adjusted = progress <= START_GUARD
          ? 0
          : progress >= END_FADE_START
            ? 1
            : (progress - START_GUARD) / (END_FADE_START - START_GUARD);
        setPhoneTrackProgress(adjusted);

        // Only start stepping once the sticky parent has reached the top
        if (rect.top > 0) {
          if (currentStep !== 0) setCurrentStep(0);
          return;
        }

        // Determine which segment user is in (0..steps-1) based on adjusted
        const rawIndex = Math.min(steps - 1, Math.floor(adjusted * steps));
        if (SWITCH_DELAY_MS === 0) {
          // Immediate switching
          if (currentStep !== rawIndex) setCurrentStep(rawIndex);
        } else {
          // Time-gated switching: require dwell time before switching to new step
          if (rawIndex !== pendingStep) {
            setPendingStep(rawIndex);
            setPendingStartedAt(Date.now());
          } else if (currentStep !== pendingStep && pendingStartedAt) {
            const elapsed = Date.now() - pendingStartedAt;
            if (elapsed >= SWITCH_DELAY_MS) {
              setCurrentStep(pendingStep);
            }
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
    const minCenterDist = 240; // keep icons visually spread out

    const fitsIcon = (x: number, y: number, size: number) =>
      x >= padding &&
      y >= padding &&
      x + size <= stageSize.width - padding &&
      y + size <= stageSize.height - padding &&
      // keep out of iPhone reserved bottom area
      y + size <= Math.max(0, stageSize.height - (PHONE_HEIGHT + 160)) &&
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
    for (let i = 0; i < iconCount; i++) {
      const sizeBase = Math.random() < 0.5 ? 110 : 130;
      let size = sizeBase + Math.round(Math.random() * 14) - 7; // small variance
      let attempts = 0;
      while (attempts < 80) {
        const x = rand(padding, Math.max(padding, stageSize.width - size - padding));
        const y = rand(padding, Math.max(padding, stageSize.height - size - padding));
        if (fitsIcon(x, y, size)) {
          const dir = Math.random() < 0.5 ? -1 : 1;
          const amp = rand(stageSize.height * 0.14, stageSize.height * 0.3);
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
      <div className={styles.showcaseContent}>
        <div className={styles.imageContainer}>
          <div className={styles.showcaseImageContainer}>
            <div 
                className={styles.imageWrapper}
                style={{
                  borderRadius: `${borderRadius}px`,
                  boxShadow: `0 25px 50px -12px rgba(0, 0, 0, ${0.15 * shadowIntensity})`,
                }}
              >
              <Image 
                src="/images/marketplace.png" 
                alt="WebRend Marketplace Preview" 
                width={1200}
                height={700}
                className={styles.showcaseImage}
                priority
                style={{
                  borderRadius: `${borderRadius}px`,
                }}
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
            // keep bricks above the reserved iPhone area
            .filter((b) => b.y + b.h <= Math.max(0, stageSize.height - (PHONE_HEIGHT + 160)))
            .slice(0, assignedImages.length || placedBricks.length)
            .map((b, index) => {
            const offset = scrollProgress * b.amp * b.speed * b.dir;
            const img = assignedImages[index] || { src: '/images/placeholder.png', title: 'Project' };
            const href = img.slug ? `/portfolio/projects/${img.slug}` : '#';
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
                  <Image 
                    src={img.src}
                    alt={img.title}
                    width={Math.round(b.w)}
                    height={Math.round(b.h)}
                    className={styles.brickImage}
                    priority={index < 3}
                  />
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

          {/* Guard space so bricks end before the iPhone frame */}
          <div className={styles.bricksEndGuard} style={{ height: `${PHONE_HEIGHT + 160}px` }} />

        </div>

        {/* New full-viewport track with sticky parent holding the iPhone */}
        <div ref={phoneTrackRef} className={styles.phoneTrack}>
          <div className={styles.phoneStickyParent} style={{ transform: `translateY(${Math.round(phoneEaseY)}px)`, opacity: phoneOpacity }}>
            {/* Timeline progress indicator */}
            <div className={styles.timelineWrapper} aria-hidden style={{ opacity: timelineOpacity }}>
              <div className={styles.timeline}>
                {Array.from({ length: 6 }).map((_, i) => {
                  const rawIndex = Math.min(5, Math.floor(phoneTrackProgress * 6));
                  const segmentProgress = (phoneTrackProgress * 6) - rawIndex; // 0..1 within segment
                  const isActive = i <= rawIndex;
                  const fillBetween = i < rawIndex ? 100 : i === rawIndex ? segmentProgress * 100 : 0;
                  // Tail after the last dot, tracks progress through final segment
                  const tailFill = Math.max(0, Math.min(100, (phoneTrackProgress * 6 - 5) * 100));

                  return (
                    <div key={i} className={styles.timelineStep}>
                      <div className={`${styles.timelineDot} ${isActive ? styles.active : ''}`} />
                      {i < 5 ? (
                        <div className={styles.timelineLine}>
                          <div className={styles.timelineLineFill} style={{ width: `${fillBetween}%` }} />
                        </div>
                      ) : (
                        <div className={styles.timelineLine}>
                          <div className={styles.timelineLineFill} style={{ width: `${tailFill}%` }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Left-side onboarding copy that changes with the phone screen */}
            <div className={styles.phoneCopyWrapper} aria-hidden>
              <div className={`${styles.phoneCopyCard} ${screenTitleIndex(phoneTrackProgress, 6) === 0 ? styles.active : ''}`}>
                <div className={styles.phoneCopyTitle}>Onboarding</div>
                <div className={styles.phoneCopyDesc}>Tell us your idea — as rough or as detailed as you want.</div>
              </div>
              <div className={`${styles.phoneCopyCard} ${screenTitleIndex(phoneTrackProgress, 6) === 1 ? styles.active : ''}`}>
                <div className={styles.phoneCopyTitle}>Blueprinting</div>
                <div className={styles.phoneCopyDesc}>We map it into something real.</div>
              </div>
              <div className={`${styles.phoneCopyCard} ${screenTitleIndex(phoneTrackProgress, 6) === 2 ? styles.active : ''}`}>
                <div className={styles.phoneCopyTitle}>Repo Creation</div>
                <div className={styles.phoneCopyDesc}>Your project gets its own GitHub repo.</div>
              </div>
              <div className={`${styles.phoneCopyCard} ${screenTitleIndex(phoneTrackProgress, 6) === 3 ? styles.active : ''}`}>
                <div className={styles.phoneCopyTitle}>Milestones</div>
                <div className={styles.phoneCopyDesc}>Features are built in milestones — you see every step.</div>
              </div>
              <div className={`${styles.phoneCopyCard} ${screenTitleIndex(phoneTrackProgress, 6) === 4 ? styles.active : ''}`}>
                <div className={styles.phoneCopyTitle}>Transparency</div>
                <div className={styles.phoneCopyDesc}>Commits, checklists, updates — all visible in real‑time.</div>
              </div>
              <div className={`${styles.phoneCopyCard} ${screenTitleIndex(phoneTrackProgress, 6) === 5 ? styles.active : ''}`}>
                <div className={styles.phoneCopyTitle}>Delivery</div>
                <div className={styles.phoneCopyDesc}>Demo‑ready product in your hands in weeks, not months.</div>
              </div>
            </div>
            <div className={styles.iphoneWrapper}>
              {/* Back glow crossfading between steps based on segment progress */}
              {(() => {
                const stepsCount = 6;
                const rawIndex = Math.min(stepsCount - 1, Math.floor(phoneTrackProgress * stepsCount));
                const segmentProgress = Math.max(0, Math.min(1, phoneTrackProgress * stepsCount - rawIndex));
                const nextIndex = Math.min(stepsCount - 1, rawIndex + 1);
                const currentColor = getGlowColor(rawIndex);
                const nextColor = getGlowColor(nextIndex);
                const baseStyle = {} as React.CSSProperties;
                return (
                  <>
                    <div
                      className={styles.iphoneGlow}
                      style={{
                        ...baseStyle,
                        opacity: timelineOpacity * phoneOpacity * (1 - segmentProgress),
                        background: `radial-gradient(55% 55% at 50% 50%, ${currentColor} 0%, rgba(0,0,0,0) 75%)`
                      }}
                    />
                    <div
                      className={styles.iphoneGlow}
                      style={{
                        ...baseStyle,
                        opacity: timelineOpacity * phoneOpacity * segmentProgress,
                        background: `radial-gradient(55% 55% at 50% 50%, ${nextColor} 0%, rgba(0,0,0,0) 75%)`
                      }}
                    />
                  </>
                );
              })()}
              <div
                ref={specialBrickRef}
                className={styles.specialBrick}
                style={{ width: '100vw', height: '100vh' }}
              >
                <Canvas camera={{ position: [0, 0, 45], fov: 35 }} dpr={[1, 2]}>
                  <ambientLight intensity={0.6} />
                  <directionalLight position={[5, 5, 5]} intensity={1.1} />
                  <directionalLight position={[-5, -3, -4]} intensity={0.4} />
                  <IPhoneGLBInteractive trackProgress={phoneTrackProgress} />
                  <Environment preset="studio" />
                  <ContactShadows position={[0, -2.2, 0]} opacity={0.3} scale={6} blur={2.5} far={4} />
                  <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
                </Canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 

// Placeholder app screens sized to the phone screen container
function PhoneSlideOne() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg,#111827,#0b1220)', color: '#e5e7eb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Welcome</div>
      <div style={{ opacity: 0.8 }}>This is screen 1</div>
    </div>
  );
}

// Helper to compute which copy card is active without duplicating state
function screenTitleIndex(progress: number, steps: number) {
  return Math.min(steps - 1, Math.floor(progress * steps));
}

function PhoneSlideTwo() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg,#0f766e,#064e3b)', color: '#ecfeff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Features</div>
      <div style={{ opacity: 0.9 }}>This is screen 2</div>
    </div>
  );
}

function PhoneSlideThree() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg,#1f2937,#111827)', color: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Get Started</div>
      <div style={{ opacity: 0.85 }}>This is screen 3</div>
    </div>
  );
}

function PhoneSlideFour() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg,#0a2540,#0a0f1f)', color: '#dbeafe', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Connect</div>
      <div style={{ opacity: 0.9 }}>This is screen 4</div>
    </div>
  );
}

function PhoneSlideFive() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg,#312e81,#1e1b4b)', color: '#ede9fe', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Configure</div>
      <div style={{ opacity: 0.9 }}>This is screen 5</div>
    </div>
  );
}

function PhoneSlideSix() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg,#064e3b,#052e2b)', color: '#d1fae5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Finish</div>
      <div style={{ opacity: 0.9 }}>This is screen 6</div>
    </div>
  );
}
// GLB loader with cursor-tracking tilt
function IPhoneGLBInteractive({ trackProgress }: { trackProgress: number }) {
  const gltf = useGLTF('/iphone/iphone.glb');
  const groupRef = useRef<any>(null);
  const { pointer } = useThree();
  const [isHovering, setIsHovering] = useState(false);
  const BASE_TILT_X = 0; // face camera directly

  useFrame(() => {
    if (!groupRef.current) return;
    const rot = groupRef.current.rotation;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    // Always face camera directly (no tracking)
    rot.x = lerp(rot.x, BASE_TILT_X, 0.12);
    rot.y = lerp(rot.y, 0, 0.12);
    rot.z = lerp(rot.z, 0, 0.12);
  });

  // Compute which app screen to show based on track progress (6 screens)
  const steps = 6;
  const screenIndex = Math.min(steps - 1, Math.floor(trackProgress * steps));
  const innerProgress = (trackProgress * steps) % 1; // 0..1 within each segment

  // Positions for crossfade slide effect
  const offsetY = (1 - innerProgress) * 0.02; // subtle slide

  return (
    <Center position={[0, 0, 0]}>
      <group
        ref={groupRef}
        onPointerOver={(e) => { e.stopPropagation(); setIsHovering(true); }}
        onPointerOut={() => setIsHovering(false)}
      >
        <primitive object={gltf.scene} scale={1.2} />
        {/* Overlay HTML that matches iPhone screen area (sits above glass) */}
        <Html transform position={[0, 0, 0.5]} distanceFactor={1.2} zIndexRange={[1000, 0]}>
          <div
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            style={{ width: 2700, height: 5750, borderRadius: 375, overflow: 'hidden', background: '#000', position: 'relative', boxShadow: '0 0 0 1px rgba(255,255,255,0.05) inset' }}
          >
            {/* Simple track with 6 full-screen slides */}
            <div style={{ position: 'absolute', inset: 0 }}>
              <div style={{ position: 'absolute', inset: 0, opacity: screenIndex === 0 ? 1 : 0, transform: `translateY(${screenIndex === 0 ? 0 : -offsetY * 100}%)`, transition: 'opacity 400ms ease, transform 400ms ease' }}>
                <PhoneSlideOne />
              </div>
              <div style={{ position: 'absolute', inset: 0, opacity: screenIndex === 1 ? 1 : 0, transform: `translateY(${screenIndex === 1 ? 0 : -offsetY * 100}%)`, transition: 'opacity 400ms ease, transform 400ms ease' }}>
                <PhoneSlideTwo />
              </div>
              <div style={{ position: 'absolute', inset: 0, opacity: screenIndex === 2 ? 1 : 0, transform: `translateY(${screenIndex === 2 ? 0 : -offsetY * 100}%)`, transition: 'opacity 400ms ease, transform 400ms ease' }}>
                <PhoneSlideThree />
              </div>
              <div style={{ position: 'absolute', inset: 0, opacity: screenIndex === 3 ? 1 : 0, transform: `translateY(${screenIndex === 3 ? 0 : -offsetY * 100}%)`, transition: 'opacity 400ms ease, transform 400ms ease' }}>
                <PhoneSlideFour />
              </div>
              <div style={{ position: 'absolute', inset: 0, opacity: screenIndex === 4 ? 1 : 0, transform: `translateY(${screenIndex === 4 ? 0 : -offsetY * 100}%)`, transition: 'opacity 400ms ease, transform 400ms ease' }}>
                <PhoneSlideFive />
              </div>
              <div style={{ position: 'absolute', inset: 0, opacity: screenIndex === 5 ? 1 : 0, transform: `translateY(${screenIndex === 5 ? 0 : -offsetY * 100}%)`, transition: 'opacity 400ms ease, transform 400ms ease' }}>
                <PhoneSlideSix />
              </div>
            </div>
          </div>
        </Html>
      </group>
    </Center>
  );
}