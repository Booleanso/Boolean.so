'use client';

import Link from 'next/link';
import styles from './ServicesCardsSection.module.css';

const services = [
  {
    title: 'UI/UX Design',
    description: 'Crafting intuitive and beautiful user experiences for your application.',
    icon: '🎨' // Placeholder icon
  },
  {
    title: 'Website Development',
    description: 'Building responsive, high-performance websites tailored to your needs.',
    icon: '💻' // Placeholder icon
  },
  {
    title: 'Mobile App Development',
    description: 'Developing native or cross-platform mobile apps for iOS and Android.',
    icon: '📱' // Placeholder icon
  },
  {
    title: 'Software Development',
    description: 'Custom software solutions to streamline your operations and growth.',
    icon: '⚙️' // Placeholder icon
  },
  {
    title: 'Firmware Development',
    description: 'Expertise in embedded systems and low-level programming for your hardware.',
    icon: '🔩' // Placeholder icon
  },
  {
    title: 'Advising & Consultation',
    description: 'Strategic guidance to navigate technical challenges and opportunities.',
    icon: '💡' // Placeholder icon
  },
  {
    title: 'Fractional CTO/Co-founder', 
    description: 'High-level technical leadership and partnership on a flexible basis.',
    icon: '🤝' // Placeholder icon
  }
];

export default function ServicesCardsSection() {
  // Calculate center index for 7 cards (index 3)
  const centerIndex = Math.floor(services.length / 2); 

  return (
    <section className={styles.servicesSection}>
      <div className={styles.headerContent}>
        <h2 className={styles.heading}>
          Need a hand with your project?
        </h2>
        <p className={styles.description}>
          Acquired a repository but need expert help to integrate, customize, or scale it? Our team offers a range of services to bring your vision to life.
        </p>
      </div>
      
      {/* Wrapper for positioning cards and potential hand graphic */}
      <div className={styles.cardsContainerWrapper}>
        <div className={styles.cardsContainer}>
          {services.map((service, index) => (
            <Link 
              href="/services" 
              key={index} 
              className={styles.serviceCard}
              // Optional: Use inline style for dynamic fanning if needed, 
              // CSS :nth-child is updated for 7 cards.
              // style={{
              //   transform: `translateX(${(index - centerIndex) * 60}%) rotate(${(index - centerIndex) * 10}deg)`,
              //   zIndex: services.length - Math.abs(index - centerIndex)
              // }}
            >
              <div className={styles.cardIcon}>{service.icon}</div>
              <h3 className={styles.cardTitle}>{service.title}</h3>
              <p className={styles.cardDescription}>{service.description}</p>
              <div className={styles.cardLink}>
                Learn More
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 0L4.9425 1.0575L9.1275 5.25H0V6.75H9.1275L4.9425 10.9425L6 12L12 6L6 0Z" fill="currentColor"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
} 