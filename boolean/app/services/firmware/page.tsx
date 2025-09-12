'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../components/ThemeProvider/ThemeProvider';
import styles from './firmware.module.css';

export default function FirmwarePage() {
  const [isVisible, setIsVisible] = useState(false);
  const { theme } = useTheme();
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

  const isDarkMode = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const features = [
    {
      icon: '🔧',
      title: 'Embedded Systems',
      description: 'Expert development for microcontrollers, ARM processors, and specialized embedded hardware platforms.'
    },
    {
      icon: '🌐',
      title: 'IoT Solutions',
      description: 'Connected devices with WiFi, Bluetooth, LoRa, and cellular connectivity for the Internet of Things.'
    },
    {
      icon: '⚡',
      title: 'Real-Time Systems',
      description: 'Low-latency, deterministic firmware for critical applications requiring precise timing and reliability.'
    },
    {
      icon: '🛡️',
      title: 'Secure Bootloaders',
      description: 'Protected firmware updates with encryption, authentication, and secure boot processes.'
    },
    {
      icon: '🔋',
      title: 'Power Optimization',
      description: 'Ultra-low power design for battery-operated devices with advanced sleep modes and energy harvesting.'
    },
    {
      icon: '📡',
      title: 'Communication Protocols',
      description: 'Implementation of UART, SPI, I2C, CAN, Modbus, and custom communication protocols.'
    }
  ];

  const technologies = [
    'C/C++', 'Rust', 'Arduino', 'ESP32', 'STM32', 'Raspberry Pi', 'FreeRTOS', 'Zephyr'
  ];

  return (
    <div className={`${styles.container} ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <main ref={sectionRef}>
        {/* Hero Section */}
        <section className={`${styles.heroSection} ${isVisible ? styles.visible : ''}`}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <span className={styles.badgeText}>Firmware Development</span>
            </div>
            <h1 className={styles.heroTitle}>
              <span className={styles.titleLine}>Bring hardware to life</span>
              <span className={`${styles.titleLine} ${styles.gradientText}`}>with intelligent firmware</span>
            </h1>
            <p className={styles.heroDescription}>
              We develop robust, efficient firmware for embedded systems and IoT devices. From microcontrollers 
              to complex embedded systems, we create the software that powers your hardware innovations.
            </p>
            <div className={styles.ctaButtons}>
              <a href="/contact" className={styles.primaryButton}>
                <span>Start Your Project</span>
              </a>
              <a href="/portfolio" className={styles.secondaryButton}>
                <span>View Our Work</span>
              </a>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className={styles.featuresSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Embedded excellence</h2>
            <p className={styles.sectionDescription}>
              Every line of code is optimized for performance, reliability, and efficiency in resource-constrained environments.
            </p>
          </div>
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={styles.featureCard}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Technologies Section */}
        <section className={styles.techSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Proven Technologies</h2>
            <p className={styles.sectionDescription}>
              We work with industry-standard tools and platforms to deliver reliable embedded solutions.
            </p>
          </div>
          <div className={styles.techGrid}>
            {technologies.map((tech, index) => (
              <div 
                key={index} 
                className={styles.techCard}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {tech}
              </div>
            ))}
          </div>
        </section>

        {/* Process Section */}
        <section className={styles.processSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Hardware to software</h2>
            <p className={styles.sectionDescription}>
              Our systematic approach ensures your firmware meets all requirements and performs flawlessly.
            </p>
          </div>
          <div className={styles.processSteps}>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>1</div>
              <h3 className={styles.stepTitle}>Analysis</h3>
              <p className={styles.stepDescription}>
                Review hardware specifications, power requirements, and performance constraints to define optimal architecture.
              </p>
            </div>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>2</div>
              <h3 className={styles.stepTitle}>Architecture</h3>
              <p className={styles.stepDescription}>
                Design firmware architecture with proper abstraction layers, drivers, and application logic separation.
              </p>
            </div>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>3</div>
              <h3 className={styles.stepTitle}>Implementation</h3>
              <p className={styles.stepDescription}>
                Write efficient, maintainable code with comprehensive testing and debugging on target hardware.
              </p>
            </div>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>4</div>
              <h3 className={styles.stepTitle}>Validation</h3>
              <p className={styles.stepDescription}>
                Thorough testing including stress tests, power consumption analysis, and certification support.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to power your hardware?</h2>
            <p className={styles.ctaDescription}>
              Let&apos;s discuss your embedded project and create firmware that brings your vision to life.
            </p>
            <a href="/contact" className={styles.ctaButton}>
              <span>Get Started Today</span>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
} 