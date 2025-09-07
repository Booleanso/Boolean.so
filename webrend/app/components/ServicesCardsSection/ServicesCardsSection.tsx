'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './ServicesCardsSection.module.css';

const services = [
  {
    title: 'Website Development',
    description: 'Building lightning-fast, responsive websites with cutting-edge technologies.',
    icon: '💻',
    iconImg: '/images/services/chrome.png',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: '#f093fb',
    images: [
      '/images/services/website-dev-1.png',
      '/images/services/website-dev-2.png',
      '/images/services/website-dev-3.png'
    ],
    href: '/services/websites',
    available: true,
    slotsLeft: 2
  },
  {
    title: 'Mobile App Development',
    description: 'Creating native and cross-platform mobile experiences that users love.',
    icon: '📱',
    iconImg: '/images/services/appstore.png',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: '#4facfe',
    images: [
      '/images/services/mobile-app-1.png',
      '/images/services/mobile-app-2.png',
      '/images/services/mobile-app-3.png'
    ],
    href: '/services/apps',
    available: true,
    slotsLeft: 4
  },
  {
    title: 'Software Development',
    description: 'Engineering robust, scalable solutions that power your business forward.',
    icon: '⚙️',
    iconImg: '/images/services/cursor.png',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    color: '#43e97b',
    images: [
      '/images/services/software-dev-1.png',
      '/images/services/software-dev-2.png',
      '/images/services/software-dev-3.png'
    ],
    href: '/services/software',
    available: true,
    slotsLeft: 3
  },
  {
    title: 'Firmware Development',
    description: 'Bringing hardware to life with optimized embedded systems and IoT solutions.',
    icon: '🔩',
    iconImg: '/images/services/c.png',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    color: '#fa709a',
    images: [
      '/images/services/firmware-dev-1.png',
      '/images/services/firmware-dev-2.png',
      '/images/services/firmware-dev-3.png'
    ],
    href: '/services/firmware',
    available: true,
    slotsLeft: 2
  }
];

export default function ServicesCardsSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Random entry offsets per card (computed once)
  const entryOffsetsRef = useRef<Array<{ dx: number; dy: number; rot: number }>>([]);
  const cardRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [fallProgress, setFallProgress] = useState(0); // 0..1 as section reaches middle

  useEffect(() => {
    const computeOffsets = () => {
      const el = sectionRef.current;
      if (!el) return;
      const sectionRect = el.getBoundingClientRect();
      const rand = (min: number, max: number) => min + Math.random() * (max - min);
      entryOffsetsRef.current = services.map((_, i) => {
        const card = cardRefs.current[i];
        if (!card) return { dx: 0, dy: 0, rot: 0 };
        const cardRect = card.getBoundingClientRect();
        const dy = (sectionRect.top - cardRect.top) - 24;
        const dx = rand(-24, 24);
        const rot = rand(-12, 12);
        return { dx, dy, rot };
      });
    };
    computeOffsets();
    window.addEventListener('resize', computeOffsets);
    const t = setTimeout(computeOffsets, 50);
    return () => {
      window.removeEventListener('resize', computeOffsets);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  // Track scroll within this section only to drive the fall-in animation
  useEffect(() => {
    const handleScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const viewportCenter = vh / 2;
      // Start when section top hits the viewport bottom;
      // Finish when section top reaches ~60% of viewport height (match screenshot)
      const start = vh; // section just enters viewport (top == bottom)
      const end = vh * 0.1; // adjust this fraction to fine‑tune
      const denom = Math.max(1, start - end);
      let p = (start - rect.top) / denom;
      if (rect.top >= start) p = 0; // not started until enters viewport
      if (rect.top <= end) p = 1;   // finished when section center is at viewport center
      p = Math.max(0, Math.min(1, p));
      setFallProgress(p);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = 'none';
  };

  return (
    <section ref={sectionRef} className={styles.servicesSection}>
      <div className={styles.stickyTrack}>
        <div className={styles.stickyInner}>
          <div className={styles.container}>
        <div className={`${styles.blurOverlay} ${hoveredIndex !== null ? styles.active : ''}`} />
        <div className={`${styles.sectionBlurOverlay} ${hoveredIndex !== null ? styles.active : ''}`} />
        <div className={`${styles.headerContent} ${isVisible ? styles.visible : ''} ${hoveredIndex !== null ? styles.headerDim : ''}`}>
          <div className={styles.badge}>
            <span className={styles.badgeText}>Our Services</span>
          </div>
          <h2 className={styles.heading}>
            <span className={styles.headingLine}>Extraordinary experiences.</span>
            <span className={styles.headingLine}>
              <span className={styles.gradientText}>Expertly crafted.</span>
            </span>
          </h2>
          <p className={styles.description}>
            From concept to launch, we transform your vision into reality with our comprehensive suite of services.
          </p>
        </div>

        <div className={styles.servicesGrid}>
          {services.map((service, index) => {
            const offsets = entryOffsetsRef.current[index] || { dx: 0, dy: 0, rot: 0 };
            // Ease-in-out (smoothstep) so motion starts slow, speeds up, then slows near target
            const t = Math.max(0, Math.min(1, fallProgress));
            const eased = t * t * (3 - 2 * t);
            const inv = 1 - eased;
            const opacity = eased; // fade in with progress
            const tx = offsets.dx * inv;
            const ty = offsets.dy * inv;
            const r = offsets.rot * inv;
            return (
              <Link
                href={service.available ? service.href : '#'}
                key={index}
                ref={(el) => { cardRefs.current[index] = el; }}
                className={`${styles.serviceCard} ${isVisible ? styles.visible : ''} ${
                  hoveredIndex !== null && hoveredIndex !== index ? styles.blurred : ''
                } ${!service.available ? styles.unavailable : ''}`}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  '--card-gradient': service.gradient,
                  '--card-color': service.color
                } as React.CSSProperties}
                onMouseEnter={() => service.available && setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={(e) => {
                  if (!service.available) {
                    e.preventDefault();
                  }
                }}
              >
                <div
                  className={styles.iconContainer}
                  style={{
                    transform: `translate(${Math.round(tx)}px, ${Math.round(ty)}px) rotate(${r.toFixed(2)}deg)`,
                    opacity
                  }}
                >
                  <div className={styles.iconWrapper}>
                    {service.iconImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={service.iconImg} alt={service.title} className={styles.cardIconImg} />
                    ) : (
                      <span className={styles.cardIcon}>{service.icon}</span>
                    )}
                    <div className={styles.iconGlow} />
                  </div>
                  <div className={`${styles.imageReveal} ${hoveredIndex === index ? styles.active : ''}`}
                       style={{ zIndex: hoveredIndex === index ? 50 : 5 }}>
                    {service.images.map((imagePath, imgIndex) => (
                      <div key={imgIndex} className={styles.floatingImage}>
                        <Image
                          src={imagePath}
                          alt={`${service.title} preview ${imgIndex + 1}`}
                          fill
                          className={styles.serviceImage}
                          onError={handleImageError}
                          sizes="200px"
                        />
                      </div>
                    ))}
                    <div className={styles.shadowOverlay} />
                  </div>
                </div>
                <h3 className={styles.cardTitle}>{service.title}</h3>
                <p className={styles.cardDescription}>{service.description}</p>
                <div className={`${styles.availabilityPill} ${!service.available ? styles.unavailablePill : ''}`}>
                  {service.available 
                    ? `${service.slotsLeft} slot${service.slotsLeft !== 1 ? 's' : ''} left`
                    : 'Currently unavailable'
                  }
                </div>
              </Link>
            );
          })}
        </div>
          </div>
        </div>
      </div>
    </section>
  );
} 