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
      '/images/services/web-1.jpg',
      '/images/services/web-2.jpg',
      '/images/services/web-3.jpg'
    ]
  },
  {
    title: 'Mobile App Development',
    description: 'Creating native and cross-platform mobile experiences that users love.',
    icon: '📱',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: '#4facfe',
    images: [
      '/images/services/mobile-1.jpg',
      '/images/services/mobile-2.jpg',
      '/images/services/mobile-3.jpg'
    ]
  },
  {
    title: 'Software Development',
    description: 'Engineering robust, scalable solutions that power your business forward.',
    icon: '⚙️',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    color: '#43e97b',
    images: [
      '/images/services/software-1.jpg',
      '/images/services/software-2.jpg',
      '/images/services/software-3.jpg'
    ]
  },
  {
    title: 'Firmware Development',
    description: 'Bringing hardware to life with optimized embedded systems and IoT solutions.',
    icon: '🔩',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    color: '#fa709a',
    images: [
      '/images/services/firmware-1.jpg',
      '/images/services/firmware-2.jpg',
      '/images/services/firmware-3.jpg'
    ]
  },
  {
    title: 'Advising & Consultation',
    description: 'Strategic technical guidance to navigate challenges and seize opportunities.',
    icon: '💡',
    gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    color: '#30cfd0',
    images: [
      '/images/services/advising-1.jpg',
      '/images/services/advising-2.jpg',
      '/images/services/advising-3.jpg'
    ]
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

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

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
              href="/services"
              key={index}
              className={`${styles.serviceCard} ${isVisible ? styles.visible : ''} ${
                hoveredIndex !== null && hoveredIndex !== index ? styles.blurred : ''
              }`}
              style={{
                animationDelay: `${index * 0.1}s`,
                '--card-gradient': service.gradient,
                '--card-color': service.color
              } as React.CSSProperties}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Icon container */}
              <div className={styles.iconContainer}>
                <div className={styles.iconWrapper}>
                  <span className={styles.cardIcon}>{service.icon}</span>
                  <div className={styles.iconGlow} />
                </div>
                
                {/* Images that appear on hover */}
                <div className={`${styles.imageReveal} ${hoveredIndex === index ? styles.active : ''}`}>
                  {service.images.map((image, imgIndex) => (
                    <div 
                      key={imgIndex} 
                      className={styles.floatingImage}
                      style={{
                        animationDelay: `${imgIndex * 0.1}s`
                      }}
                    >
                      {/* Using placeholder images for now */}
                      <div className={styles.imagePlaceholder} style={{
                        background: service.gradient
                      }} />
                    </div>
                  ))}
                  {/* White blur gradient at bottom */}
                  <div className={styles.imageBlur} />
                </div>
              </div>
              
              {/* Title and description */}
              <h3 className={styles.cardTitle}>{service.title}</h3>
              <p className={styles.cardDescription}>{service.description}</p>
            </Link>
          ))}
        </div>

        {/* Call to action */}
        <div className={`${styles.ctaSection} ${isVisible ? styles.visible : ''}`}>
          <p className={styles.ctaText}>
            Ready to bring your ideas to life?
          </p>
          <Link href="/contact" className={styles.ctaButton}>
            <span>Start Your Project</span>
            <div className={styles.ctaGlow} />
          </Link>
        </div>
      </div>
    </section>
  );
} 