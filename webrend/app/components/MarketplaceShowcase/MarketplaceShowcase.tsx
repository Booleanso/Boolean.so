'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, ContactShadows, OrbitControls, Center, useGLTF } from '@react-three/drei';
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

        // Ease into sticky at start (first 15%) and ease out at end (last 15%)
        let translate = 0;
        if (progress <= 0.15) {
          translate = (1 - progress / 0.15) * 60; // from 60px to 0px
        } else if (progress >= 0.85) {
          translate = ((progress - 0.85) / 0.15) * 60; // from 0px to 60px
        } else {
          translate = 0;
        }
        setPhoneEaseY(translate);

        // Subtle fade in/out around the edges
        let op = 1;
        if (progress <= 0.1) {
          op = progress / 0.1;
        } else if (progress >= 0.9) {
          op = 1 - (progress - 0.9) / 0.1;
        } else {
          op = 1;
        }
        setPhoneOpacity(Math.max(0, Math.min(1, op)));
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

          {/* Guard space so bricks end before the iPhone frame */}
          <div className={styles.bricksEndGuard} style={{ height: `${PHONE_HEIGHT + 160}px` }} />

        </div>

        {/* New full-viewport track with sticky parent holding the iPhone */}
        <div ref={phoneTrackRef} className={styles.phoneTrack}>
          <div className={styles.phoneStickyParent} style={{ transform: `translateY(${Math.round(phoneEaseY)}px)`, opacity: phoneOpacity }}>
            <div className={styles.iphoneWrapper}>
              <div
                ref={specialBrickRef}
                className={styles.specialBrick}
                style={{ width: '100vw', height: '100vh' }}
              >
                <Canvas camera={{ position: [0, 0, 45.2], fov: 35 }} dpr={[1, 2]}>
                  <ambientLight intensity={0.6} />
                  <directionalLight position={[5, 5, 5]} intensity={1.1} />
                  <directionalLight position={[-5, -3, -4]} intensity={0.4} />
                  <IPhoneGLBInteractive />
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

// GLB loader with cursor-tracking tilt
function IPhoneGLBInteractive() {
  const gltf = useGLTF('/iphone/iphone.glb');
  const groupRef = useRef<any>(null);
  const { pointer } = useThree();

  useFrame(() => {
    if (!groupRef.current) return;
    const maxTiltX = 0.25; // up/down tilt
    const maxTiltY = 0.35; // left/right tilt
    const targetX = -pointer.y * maxTiltX;
    const targetY = pointer.x * maxTiltY;
    // Smoothly ease towards target
    groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.08;
    groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.08;
  });

  return (
    <Center>
      <group ref={groupRef}>
        <primitive object={gltf.scene} scale={1.2} />
      </group>
    </Center>
  );
}