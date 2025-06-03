'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../components/ThemeProvider/ThemeProvider';
import styles from './websites.module.css';

export default function WebsitesPage() {
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
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Optimized for speed with cutting-edge technologies like Next.js, ensuring your site loads instantly.'
    },
    {
      icon: '📱',
      title: 'Mobile First',
      description: 'Responsive design that looks perfect on every device, from phones to desktop computers.'
    },
    {
      icon: '🎨',
      title: 'Beautiful Design',
      description: 'Stunning visual designs that capture your brand and engage your audience effectively.'
    },
    {
      icon: '🔒',
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security and reliability with 99.9% uptime guarantee.'
    },
    {
      icon: '🚀',
      title: 'SEO Optimized',
      description: 'Built-in SEO best practices to help your website rank higher in search results.'
    },
    {
      icon: '🛠️',
      title: 'Easy to Maintain',
      description: 'Clean, maintainable code with comprehensive documentation for easy updates.'
    }
  ];

  const technologies = [
    'Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Firebase', 'Vercel', 'MongoDB'
  ];

  return (
    <div className={`${styles.container} ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <main ref={sectionRef}>
        {/* Hero Section */}
        <section className={`${styles.heroSection} ${isVisible ? styles.visible : ''}`}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <span className={styles.badgeText}>Website Development</span>
            </div>
            <h1 className={styles.heroTitle}>
              <span className={styles.titleLine}>Build websites that</span>
              <span className={`${styles.titleLine} ${styles.gradientText}`}>captivate and convert</span>
            </h1>
            <p className={styles.heroDescription}>
              We craft lightning-fast, beautiful websites that not only look amazing but drive real business results. 
              From concept to launch, we build digital experiences that your users will love.
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
            <h2 className={styles.sectionTitle}>Why choose our websites?</h2>
            <p className={styles.sectionDescription}>
              Every website we build is designed with performance, usability, and growth in mind.
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
            <h2 className={styles.sectionTitle}>Modern Technologies</h2>
            <p className={styles.sectionDescription}>
              We use the latest and most reliable technologies to build your website.
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
            <h2 className={styles.sectionTitle}>Our Process</h2>
            <p className={styles.sectionDescription}>
              A proven methodology that delivers exceptional results every time.
            </p>
          </div>
          <div className={styles.processSteps}>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>1</div>
              <h3 className={styles.stepTitle}>Discovery</h3>
              <p className={styles.stepDescription}>
                We dive deep into understanding your business goals, target audience, and requirements.
              </p>
            </div>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>2</div>
              <h3 className={styles.stepTitle}>Design</h3>
              <p className={styles.stepDescription}>
                Creating beautiful, user-centered designs that align with your brand and objectives.
              </p>
            </div>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>3</div>
              <h3 className={styles.stepTitle}>Development</h3>
              <p className={styles.stepDescription}>
                Building your website with clean, optimized code and the latest technologies.
              </p>
            </div>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>4</div>
              <h3 className={styles.stepTitle}>Launch</h3>
              <p className={styles.stepDescription}>
                Deploying your website and providing ongoing support to ensure optimal performance.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to build your dream website?</h2>
            <p className={styles.ctaDescription}>
              Let&apos;s discuss your project and create something amazing together.
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