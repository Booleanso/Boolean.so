'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../components/ThemeProvider/ThemeProvider';
import styles from './apps.module.css';

export default function AppsPage() {
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

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const isDarkMode = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const features = [
    {
      icon: '📱',
      title: 'Native Performance',
      description: 'Build truly native apps for iOS and Android with platform-specific optimizations and smooth 60fps animations.'
    },
    {
      icon: '🔄',
      title: 'Cross-Platform',
      description: 'Develop once, deploy everywhere with React Native and Flutter for maximum efficiency and reach.'
    },
    {
      icon: '🎨',
      title: 'Intuitive Design',
      description: 'Beautiful, user-friendly interfaces that follow platform guidelines and enhance user experience.'
    },
    {
      icon: '🔐',
      title: 'Secure & Private',
      description: 'Enterprise-grade security with biometric authentication, encryption, and privacy-first architecture.'
    },
    {
      icon: '⚡',
      title: 'Offline Support',
      description: 'Apps that work seamlessly offline with smart data synchronization when connectivity returns.'
    },
    {
      icon: '📊',
      title: 'Analytics Ready',
      description: 'Built-in analytics and crash reporting to help you understand user behavior and improve your app.'
    }
  ];

  const platforms = [
    'iOS', 'Android', 'React Native', 'Flutter', 'SwiftUI', 'Kotlin', 'Firebase', 'App Store Connect'
  ];

  return (
    <div className={`${styles.container} ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <main ref={sectionRef}>
        {/* Hero Section */}
        <section className={`${styles.heroSection} ${isVisible ? styles.visible : ''}`}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <span className={styles.badgeText}>Mobile App Development</span>
            </div>
            <h1 className={styles.heroTitle}>
              <span className={styles.titleLine}>Create apps that</span>
              <span className={`${styles.titleLine} ${styles.gradientText}`}>users absolutely love</span>
            </h1>
            <p className={styles.heroDescription}>
              We develop native and cross-platform mobile applications that deliver exceptional user experiences. 
              From iOS to Android, we bring your app idea to life with cutting-edge technologies and beautiful design.
            </p>
            <div className={styles.ctaButtons}>
              <a href="/contact" className={styles.primaryButton}>
                <span>Start Your App</span>
              </a>
              <a href="/portfolio" className={styles.secondaryButton}>
                <span>See Our Apps</span>
              </a>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className={styles.featuresSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Built for mobile excellence</h2>
            <p className={styles.sectionDescription}>
              Every app we create is optimized for performance, usability, and the unique capabilities of mobile devices.
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

        {/* Platforms Section */}
        <section className={styles.techSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Native & Cross-Platform</h2>
            <p className={styles.sectionDescription}>
              We work with the best technologies to deliver apps that feel truly native on every platform.
            </p>
          </div>
          <div className={styles.techGrid}>
            {platforms.map((platform, index) => (
              <div 
                key={index} 
                className={styles.techCard}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {platform}
              </div>
            ))}
          </div>
        </section>

        {/* Process Section */}
        <section className={styles.processSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>From idea to App Store</h2>
            <p className={styles.sectionDescription}>
              Our proven process ensures your app launches successfully and reaches your target audience.
            </p>
          </div>
          <div className={styles.processSteps}>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>1</div>
              <h3 className={styles.stepTitle}>Strategy</h3>
              <p className={styles.stepDescription}>
                Define your app&apos;s purpose, target audience, and key features through comprehensive market research.
              </p>
            </div>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>2</div>
              <h3 className={styles.stepTitle}>Design</h3>
              <p className={styles.stepDescription}>
                Create intuitive user interfaces and experiences that follow platform guidelines and best practices.
              </p>
            </div>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>3</div>
              <h3 className={styles.stepTitle}>Development</h3>
              <p className={styles.stepDescription}>
                Build your app with clean, maintainable code and rigorous testing for optimal performance.
              </p>
            </div>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>4</div>
              <h3 className={styles.stepTitle}>Launch</h3>
              <p className={styles.stepDescription}>
                Deploy to app stores with optimized listings and provide ongoing support and updates.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to build your mobile app?</h2>
            <p className={styles.ctaDescription}>
              Transform your idea into a powerful mobile experience that engages users and drives growth.
            </p>
            <a href="/contact" className={styles.ctaButton}>
              <span>Start Building Today</span>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
} 