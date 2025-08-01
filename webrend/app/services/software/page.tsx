'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../components/ThemeProvider/ThemeProvider';
import styles from './software.module.css';

export default function SoftwarePage() {
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
      icon: '🏗️',
      title: 'Enterprise Architecture',
      description: 'Scalable, maintainable software architectures designed to grow with your business and handle millions of users.'
    },
    {
      icon: '☁️',
      title: 'Cloud-Native Solutions',
      description: 'Modern cloud applications built for AWS, Azure, and Google Cloud with microservices and containerization.'
    },
    {
      icon: '🔄',
      title: 'API Development',
      description: 'RESTful and GraphQL APIs with comprehensive documentation, testing, and version management.'
    },
    {
      icon: '📊',
      title: 'Data Engineering',
      description: 'ETL pipelines, data warehouses, and analytics solutions to unlock the power of your data.'
    },
    {
      icon: '🛡️',
      title: 'Security First',
      description: 'Built-in security measures including authentication, authorization, encryption, and compliance standards.'
    },
    {
      icon: '⚙️',
      title: 'DevOps Integration',
      description: 'CI/CD pipelines, automated testing, monitoring, and deployment strategies for reliable software delivery.'
    }
  ];

  const technologies = [
    'Python', 'Node.js', 'Java', 'Go', 'Docker', 'Kubernetes', 'PostgreSQL', 'Redis'
  ];

  return (
    <div className={`${styles.container} ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <main ref={sectionRef}>
        {/* Hero Section */}
        <section className={`${styles.heroSection} ${isVisible ? styles.visible : ''}`}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <span className={styles.badgeText}>Software Development</span>
            </div>
            <h1 className={styles.heroTitle}>
              <span className={styles.titleLine}>Engineer software that</span>
              <span className={`${styles.titleLine} ${styles.gradientText}`}>powers your business</span>
            </h1>
            <p className={styles.heroDescription}>
              We build robust, scalable software solutions that drive business growth. From enterprise applications 
              to cloud-native systems, we create the technology infrastructure that powers modern organizations.
            </p>
            <div className={styles.ctaButtons}>
              <a href="/contact" className={styles.primaryButton}>
                <span>Start Your Project</span>
              </a>
              <a href="/portfolio" className={styles.secondaryButton}>
                <span>View Our Solutions</span>
              </a>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className={styles.featuresSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Enterprise-grade development</h2>
            <p className={styles.sectionDescription}>
              Every solution is architected for scalability, security, and maintainability using industry best practices.
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
            <h2 className={styles.sectionTitle}>Battle-tested technologies</h2>
            <p className={styles.sectionDescription}>
              We leverage proven technologies and frameworks to deliver reliable, high-performance software.
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
            <h2 className={styles.sectionTitle}>From concept to production</h2>
            <p className={styles.sectionDescription}>
              Our proven methodology ensures successful delivery of complex software projects on time and on budget.
            </p>
          </div>
          <div className={styles.processSteps}>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>1</div>
              <h3 className={styles.stepTitle}>Planning</h3>
              <p className={styles.stepDescription}>
                Comprehensive requirement analysis, technical architecture design, and project roadmap creation.
              </p>
            </div>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>2</div>
              <h3 className={styles.stepTitle}>Development</h3>
              <p className={styles.stepDescription}>
                Agile development with continuous integration, automated testing, and regular stakeholder feedback.
              </p>
            </div>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>3</div>
              <h3 className={styles.stepTitle}>Testing</h3>
              <p className={styles.stepDescription}>
                Comprehensive quality assurance including unit tests, integration tests, and performance testing.
              </p>
            </div>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>4</div>
              <h3 className={styles.stepTitle}>Deployment</h3>
              <p className={styles.stepDescription}>
                Seamless production deployment with monitoring, documentation, and ongoing maintenance support.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to build something amazing?</h2>
            <p className={styles.ctaDescription}>
              Let&apos;s discuss your software requirements and create a solution that drives your business forward.
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