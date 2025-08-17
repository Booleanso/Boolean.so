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

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // If image fails to load, hide the image element
    e.currentTarget.style.display = 'none';
  };

  return (
    <section ref={sectionRef} className={styles.servicesSection}>
      <div className={styles.container}>
        {/* Global blur overlay that covers entire page */}
        <div className={`${styles.blurOverlay} ${hoveredIndex !== null ? styles.active : ''}`} />
        
        {/* Section-specific blur overlay that covers just this section's background content */}
        <div className={`${styles.sectionBlurOverlay} ${hoveredIndex !== null ? styles.active : ''}`} />
        
        {/* Header with Apple-style animation */}
        <div className={`${styles.headerContent} ${isVisible ? styles.visible : ''}`}>
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

        {/* Services grid with icon-based design */}
        <div className={styles.servicesGrid}>
          {services.map((service, index) => (
            <Link
              href={service.available ? service.href : '#'}
              key={index}
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
              {/* Icon container */}
              <div className={styles.iconContainer}>
                <div className={styles.iconWrapper}>
                  <span className={styles.cardIcon}>{service.icon}</span>
                  <div className={styles.iconGlow} />
                </div>
                
                {/* Images that appear on hover */}
                <div className={`${styles.imageReveal} ${hoveredIndex === index ? styles.active : ''}`}
                     style={{ zIndex: hoveredIndex === index ? 50 : 5 }}>
                  {/* PNG Images */}
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
                  {/* Single shadow overlay covering all cards */}
                  <div className={styles.shadowOverlay} />
                </div>
              </div>
              
              {/* Title and description */}
              <h3 className={styles.cardTitle}>{service.title}</h3>
              <p className={styles.cardDescription}>{service.description}</p>
              
              {/* Availability pill */}
              <div className={`${styles.availabilityPill} ${!service.available ? styles.unavailablePill : ''}`}>
                {service.available 
                  ? `${service.slotsLeft} slot${service.slotsLeft !== 1 ? 's' : ''} left`
                  : 'Currently unavailable'
                }
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
} 