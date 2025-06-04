'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './BenefitsSection.module.css';

const benefits = [
  // Row 1 (left to right)
  [
    {
      icon: '🌐',
      title: 'Free Hosting Included',
      description: 'Your project comes with complimentary hosting since everything is expertly coded and deployment-ready.',
    },
    {
      icon: '⚡',
      title: '30-Minute Fix Guarantee',
      description: 'Critical issues resolved within 30 minutes of notice. Your uptime is our priority.',
    },
    {
      icon: '🧪',
      title: 'Free Experimental Features',
      description: 'Code snippets, experimental additions, and innovative features at no extra charge.',
    }
  ],
  // Row 2 (right to left)
  [
    {
      icon: '🔧',
      title: 'WebRend Software License',
      description: 'Access to our proprietary software suite completely free for all project members.',
    },
    {
      icon: '📱',
      title: 'Portfolio Showcase',
      description: 'Your project gets featured on our website, giving you additional exposure and credibility.',
    },
    {
      icon: '📊',
      title: 'Transparent Development',
      description: 'Detailed Lucid charts, accurate pricing, and complete functionality breakdown before development starts.',
    }
  ],
  // Row 3 (left to right)
  [
    {
      icon: '💬',
      title: '24/7 Communication',
      description: 'Round-the-clock availability for questions, updates, and support throughout your project.',
    },
    {
      icon: '🚀',
      title: 'Investor Introductions',
      description: 'Direct connections to VCs and investors in our network to help scale your business.',
    }
  ]
];

export default function BenefitsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
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
    <section ref={sectionRef} className={styles.benefitsSection}>
      <div className={styles.container}>
        {/* Header */}
        <div className={`${styles.headerContent} ${isVisible ? styles.visible : ''}`}>
          <div className={styles.badge}>
            <span className={styles.badgeText}>What You Get</span>
          </div>
          <h2 className={styles.heading}>
            <span className={styles.headingLine}>Beyond development.</span>
            <span className={styles.headingLine}>
              <span className={styles.gradientText}>Complete partnership.</span>
            </span>
          </h2>
          <p className={styles.description}>
            We don&apos;t just build your project – we provide a comprehensive ecosystem of benefits that ensure your success from launch to scale.
          </p>
        </div>

        {/* Benefits Marquee Rows */}
        <div className={styles.benefitsMarquee}>
          {benefits.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={`${styles.marqueeRow} ${
                rowIndex % 2 === 0 ? styles.leftToRight : styles.rightToLeft
              }`}
            >
              <div className={styles.marqueeContent}>
                {/* Duplicate content for seamless loop */}
                {[...row, ...row].map((benefit, index) => (
                  <div
                    key={index}
                    className={`${styles.benefitCard} ${styles.greyCard} ${isVisible ? styles.visible : ''}`}
                    style={{
                      animationDelay: `${(rowIndex * 3 + index) * 0.1}s`,
                    }}
                    onMouseEnter={() => setHoveredIndex(rowIndex * 10 + index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Icon Container */}
                    <div className={styles.iconContainer}>
                      <div className={styles.iconBackground} />
                      <span className={styles.icon}>{benefit.icon}</span>
                      <div 
                        className={`${styles.iconGlow} ${hoveredIndex === rowIndex * 10 + index ? styles.active : ''}`}
                      />
                    </div>

                    {/* Content */}
                    <div className={styles.cardContent}>
                      <h3 className={styles.benefitTitle}>{benefit.title}</h3>
                      <p className={styles.benefitDescription}>{benefit.description}</p>
                    </div>

                    {/* Hover Effect */}
                    <div 
                      className={`${styles.cardGlow} ${hoveredIndex === rowIndex * 10 + index ? styles.active : ''}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className={`${styles.ctaSection} ${isVisible ? styles.visible : ''}`}>
          <p className={styles.ctaText}>
            Ready to experience the WebRend advantage?
          </p>
          <a href="https://calendly.com/webrend/discovery" className={styles.ctaButton} target="_blank" rel="noopener noreferrer">
            <span>Start Your Project</span>
            <div className={styles.ctaGlow} />
          </a>
        </div>
      </div>
    </section>
  );
} 