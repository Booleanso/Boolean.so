'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ReviewBallpit.module.css';

// Review data with LinkedIn profiles
const reviews = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "CTO at TechFlow",
    image: "/images/reviewers/sarah-chen.jpg",
    quote: "WebRend delivered our platform 2 weeks ahead of schedule. Incredible team!",
    linkedinUrl: "https://linkedin.com/in/sarahchen-tech"
  },
  {
    id: 2,
    name: "Marcus Rodriguez",
    role: "Founder at StartupLab",
    image: "/images/reviewers/marcus-rodriguez.jpg",
    quote: "The attention to detail and code quality exceeded our expectations completely.",
    linkedinUrl: "https://linkedin.com/in/marcusrodriguez"
  },
  {
    id: 3,
    name: "Emily Watson",
    role: "Product Manager at InnovateCorp",
    image: "/images/reviewers/emily-watson.jpg",
    quote: "Best development experience we've had. Professional and responsive throughout.",
    linkedinUrl: "https://linkedin.com/in/emilywatson-pm"
  },
  {
    id: 4,
    name: "David Kim",
    role: "CEO at NextGen Solutions",
    image: "/images/reviewers/david-kim.jpg",
    quote: "WebRend turned our vision into reality with stunning precision and speed.",
    linkedinUrl: "https://linkedin.com/in/davidkim-nextgen"
  },
  {
    id: 5,
    name: "Lisa Thompson",
    role: "Director of Engineering",
    image: "/images/reviewers/lisa-thompson.jpg",
    quote: "Outstanding technical expertise paired with excellent communication skills.",
    linkedinUrl: "https://linkedin.com/in/lisathompson-eng"
  },
  {
    id: 6,
    name: "Alex Foster",
    role: "Startup Founder",
    image: "/images/reviewers/alex-foster.jpg",
    quote: "They delivered exactly what we needed, when we needed it. Highly recommend!",
    linkedinUrl: "https://linkedin.com/in/alexfoster-founder"
  },
  {
    id: 7,
    name: "Michael Johnson",
    role: "Tech Lead at CloudBase",
    image: "/images/reviewers/michael-johnson.jpg",
    quote: "Their modern approach to development saved us months of work.",
    linkedinUrl: "https://linkedin.com/in/michaeljohnson-tech"
  },
  {
    id: 8,
    name: "Rachel Green",
    role: "Design Director",
    image: "/images/reviewers/rachel-green.jpg",
    quote: "Beautiful designs brought to life with perfect functionality. Amazing team!",
    linkedinUrl: "https://linkedin.com/in/rachelgreen-design"
  },
  {
    id: 9,
    name: "James Wilson",
    role: "COO at FinTech Pro",
    image: "/images/reviewers/james-wilson.jpg",
    quote: "Professional, reliable, and delivered beyond expectations. Top-notch work!",
    linkedinUrl: "https://linkedin.com/in/jameswilson-coo"
  },
  {
    id: 10,
    name: "Amanda Davis",
    role: "Marketing Manager",
    image: "/images/reviewers/amanda-davis.jpg",
    quote: "Our conversion rates increased 40% after the redesign. Incredible results!",
    linkedinUrl: "https://linkedin.com/in/amandadavis-marketing"
  },
  {
    id: 11,
    name: "Robert Taylor",
    role: "Founder at EcomGrowth",
    image: "/images/reviewers/robert-taylor.jpg",
    quote: "They transformed our outdated site into a modern, high-performing platform.",
    linkedinUrl: "https://linkedin.com/in/roberttaylor-ecom"
  },
  {
    id: 12,
    name: "Kevin Martinez",
    role: "CTO at MedTech Solutions",
    image: "/images/reviewers/kevin-martinez.jpg",
    quote: "Security-first approach with beautiful UI. Perfect for our healthcare platform.",
    linkedinUrl: "https://linkedin.com/in/kevinmartinez-medtech"
  }
];

export default function ReviewCards() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection observer for visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [containerRef]);

  const handleCardClick = (review: typeof reviews[0]) => {
    window.open(review.linkedinUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className={styles.cardsSection}>
      <div className={styles.container} ref={containerRef}>
        {/* Header */}
        <div className={`${styles.headerContent} ${isVisible ? styles.visible : ''}`}>
          <div className={styles.badge}>
            <span className={styles.badgeText}>Client Reviews</span>
          </div>
          <h2 className={styles.heading}>
            <span className={styles.headingLine}>What our clients say.</span>
            <span className={styles.headingLine}>
              <span className={styles.gradientText}>Real testimonials.</span>
            </span>
          </h2>
          <p className={styles.description}>
            Don&apos;t just take our word for it. Here&apos;s what our clients have to say about working with WebRend.
          </p>
        </div>

        {/* Cards Grid */}
        <div className={`${styles.cardsGrid} ${isVisible ? styles.visible : ''}`}>
          {reviews.map((review, index) => (
            <div
              key={review.id}
              className={styles.reviewCard}
              style={{
                animationDelay: `${index * 0.1}s`
              }}
              onClick={() => handleCardClick(review)}
            >
              <div className={styles.cardBackground} style={{ backgroundImage: `url(${review.image})` }} />
              <div className={styles.cardOverlay} />
              <div className={styles.cardContent}>
                <p className={styles.quote}>&ldquo;{review.quote}&rdquo;</p>
                <div className={styles.reviewer}>
                  <span className={styles.name}>{review.name}</span>
                  <span className={styles.role}>{review.role}</span>
                </div>
              </div>
              <div className={styles.linkedinHint}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Instruction text */}
        <div className={`${styles.instructionText} ${isVisible ? styles.visible : ''}`}>
          <p>💡 Click any review to view LinkedIn profile</p>
        </div>
      </div>
    </section>
  );
} 