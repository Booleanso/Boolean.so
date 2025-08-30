'use client';

import React from 'react';
import styles from './ctaStickyTrack.module.scss';
import Link from 'next/link';
import Image from 'next/image';
import { useScroll, useMotionValueEvent } from 'framer-motion';

export default function CTAStickyTrack() {
  const [icons, setIcons] = React.useState<Array<{ src?: string; label: string }>>([]);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [yBase, setYBase] = React.useState<number>(0);

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ['end end', 'end 35%']
  });

  // Tie framer-motion's scroll progress to a CSS variable for GPU-friendly transforms
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const el = wrapperRef.current;
    if (el) el.style.setProperty('--p', Number.isFinite(v) ? v.toFixed(3) : '0');
  });

  // Seeded RNG so layout is consistent within a load but different per reload
  const [rndSeed] = React.useState<number>(() => {
    try {
      const buf = new Uint32Array(1);
      if (typeof crypto !== 'undefined' && (crypto as any).getRandomValues) {
        (crypto as any).getRandomValues(buf);
        return buf[0];
      }
    } catch {}
    return Math.floor(Math.random() * 1e9);
  });
  const rand = React.useMemo(() => {
    function mulberry32(a: number) {
      return function() {
        let t = (a += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    const r = mulberry32(rndSeed >>> 0);
    return {
      next: () => r(),
      range: (min: number, max: number) => min + (max - min) * r(),
    };
  }, [rndSeed]);

  React.useEffect(() => {
    let cancelled = false;
    const loadIcons = async () => {
      try {
        // Try private locations first (has iconUrl)
        const res = await fetch('/api/private-locations', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data?.success && Array.isArray(data.locations)) {
            const arr = data.locations
              .filter((l: any) => l?.repoName)
              .slice(0, 14)
              .map((l: any) => ({ src: l.iconUrl as string | undefined, label: String(l.repoName || 'App') }));
            if (arr.length > 0) { setIcons(arr); return; }
          }
        }
      } catch {}
      // Fallback: small set of placeholders
      if (!cancelled) {
        setIcons([
          { src: '/logo/logo.png', label: 'WebRend' },
          { src: '/images/testimonials/logo1.png', label: 'App' },
          { src: '/images/testimonials/logo2.png', label: 'Tool' },
          { src: '/images/testimonials/logo3.png', label: 'Kit' },
          { src: undefined, label: 'W' },
          { src: undefined, label: 'R' },
          { src: undefined, label: 'D' },
        ]);
      }
    };
    loadIcons();
    return () => { cancelled = true; };
  }, []);

  // Compute a baseline so explosion originates from the "floor" (bottom)
  React.useEffect(() => {
    const compute = () => {
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
      const el = wrapperRef.current;
      const h = el ? el.getBoundingClientRect().height : 300;
      // place base slightly above the bottom of the app cloud area
      const base = Math.max(vh * 0.34, h * 0.45) + 90;
      setYBase(base);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  // Removed manual scroll listener; Framer Motion's useScroll drives progress

  // Precompute random seeds/targets for each icon
  const targets = React.useMemo(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const minDim = Math.min(vw, vh);
    // Explosion outward from the floor: upward-biased directions
    const rMin = 200;
    const rMax = Math.min(minDim * 0.64, 520); // much farther and wider spread
    const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ~2.399963
    const count = icons.length || 1;
    return icons.map((_, i) => {
      // Upward half-disc spread [-PI, 0], evenly distributed with golden-angle and a touch of jitter
      let angle = ((i * GOLDEN_ANGLE) % Math.PI) - Math.PI; // [-PI, 0]
      angle += rand.range(-0.18, 0.18); // small jitter to avoid uniform look
      const rNorm = Math.sqrt((i + 0.5) / (count + 0.5));
      const rJitter = rand.range(-0.08, 0.08);
      const radius = rMin + (rMax - rMin) * Math.min(1, Math.max(0, rNorm + rJitter));
      const tx = Math.cos(angle) * radius;
      // Force upward movement only so icons never go below the floor
      const ty = -Math.abs(Math.sin(angle) * radius);
      const rot = rand.range(-60, 60).toFixed(1);
      const delay = String(Math.floor(rand.range(0, 160)));
      return { tx, ty, rot, delay };
    });
  }, [icons, rand]);

  const seeds = React.useMemo(() => {
    return icons.map(() => ({
      sx: rand.range(-26, 26).toFixed(1),
      sy: rand.range(-26, 26).toFixed(1),
      srot: rand.range(-14, 14).toFixed(1),
      delay: String(Math.floor(rand.range(0, 220)))
    }));
  }, [icons, rand]);

  const normalizeIconSrc = (src?: string) => {
    if (!src) return undefined;
    const s = src.trim();
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    if (s.startsWith('/')) return s;
    return undefined;
  };

  const pickColorFromLabel = (label: string) => {
    const colors = ['#007AFF','#34C759','#FF9500','#5AC8FA','#FFCC00','#FF2D55','#AF52DE','#5856D6'];
    const str = label || 'A';
    const hash = str.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const base = colors[hash % colors.length];
    // lighten/darken
    const lighten = (hex: string, amt: number) => {
      let col = hex.replace('#','');
      if (col.length === 3) col = col.split('').map(c=>c+c).join('');
      const num = parseInt(col,16);
      let r = Math.min(255, Math.max(0, (num >> 16) + amt));
      let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
      let b = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
      const toHex = (n:number)=>('0'+n.toString(16)).slice(-2);
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };
    return { c1: base, c2: lighten(base, -20) };
  };

  return (
    <div className={styles.grid}>
      <div ref={wrapperRef} className={styles.ctaWrapper}>
        {/* Decorative app icons around CTA */}
        <div className={styles.appCloud} aria-hidden>
          {icons.map((icon, idx) => {
            const t = targets[idx] || { tx: 0, ty: 0, rot: '0', delay: '0' };
            const validSrc = normalizeIconSrc(icon.src);
            const { c1, c2 } = pickColorFromLabel(icon.label);
            const hx = t.tx / 2;
            const hy = t.ty / 2;
            const hrot = parseFloat(t.rot) / 2;
            return (
              <div
                key={idx}
                className={styles.appIcon}
                style={{
                  // @ts-ignore CSS vars
                  '--tx': `${t.tx}px`, '--ty': `${t.ty}px`, '--rot': `${t.rot}deg`,
                  '--hx': `${hx.toFixed(1)}px`, '--hy': `${hy.toFixed(1)}px`, '--hrot': `${hrot.toFixed(1)}deg`,
                  '--ybase': `${yBase.toFixed(1)}px`, '--bg1': c1, '--bg2': c2
                } as any}
              >
                {validSrc ? (
                  <Image src={validSrc} alt={icon.label} width={48} height={48} {...(validSrc.startsWith('http') ? { unoptimized: true } as any : {})} />
                ) : (
                  <span className={styles.fallbackGlyph}>{icon.label?.charAt(0) || 'A'}</span>
                )}
              </div>
            );
          })}
          {/* sentinel removed; framer-motion scroll drives progress */}
        </div>

        {/* CTA core */}
        <div className={styles.card}>
          <h2 className={styles.title}><span className={styles.gradText}>Ready to build something great?</span></h2>
          <p className={styles.subtitle}>Join us for a quick discovery session and get a tailored plan.</p>
          <div className={styles.actions}>
            <Link href="/discovery" className={styles.primaryBtn}>Book a call</Link>
            <Link href="/portfolio" className={styles.secondaryBtn}>View work</Link>
          </div>
        </div>
      </div>
    </div>
  );
}


