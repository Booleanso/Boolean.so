'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ReviewBallpit.module.css';

// Review data with LinkedIn profiles
const reviews = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "CTO at TechFlow",
    image: "/images/reviewers/sarah-chen.jpg", // You'll need to add these images
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
  },
  {
    id: 13,
    name: "Nina Patel",
    role: "Product Owner at EdTech Plus",
    image: "/images/reviewers/nina-patel.jpg",
    quote: "User experience improved dramatically. Students love the new interface!",
    linkedinUrl: "https://linkedin.com/in/ninapatel-edtech"
  },
  {
    id: 14,
    name: "Chris Evans",
    role: "CEO at StartupHub",
    image: "/images/reviewers/chris-evans.jpg",
    quote: "From MVP to Series A ready in record time. Outstanding development partner!",
    linkedinUrl: "https://linkedin.com/in/chrisevans-startup"
  },
  {
    id: 15,
    name: "Maria Garcia",
    role: "Operations Director",
    image: "/images/reviewers/maria-garcia.jpg",
    quote: "Streamlined our entire workflow with custom tools. Massive productivity boost!",
    linkedinUrl: "https://linkedin.com/in/mariagarcia-ops"
  },
  {
    id: 16,
    name: "Jason Clark",
    role: "Technical Architect",
    image: "/images/reviewers/jason-clark.jpg",
    quote: "Scalable architecture that grows with our business. Forward-thinking approach!",
    linkedinUrl: "https://linkedin.com/in/jasonclark-architect"
  },
  {
    id: 17,
    name: "Grace Kim",
    role: "Startup Advisor",
    image: "/images/reviewers/grace-kim.jpg",
    quote: "Best development team I've worked with across 50+ startups. Exceptional!",
    linkedinUrl: "https://linkedin.com/in/gracekim-advisor"
  }
];

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  review: typeof reviews[0];
}

export default function ReviewBallpit() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const gravityLevelRef = useRef(1); // 1 = normal gravity
  const lastScrollY = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize balls
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    const initialBalls: Ball[] = reviews.map((review) => ({
      id: review.id,
      x: Math.random() * (containerWidth - 500) + 250,
      y: Math.random() * (containerHeight - 500) + 250,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      radius: 80 + Math.random() * 140, // Better range: 80-220px radius (160-440px diameter)
      review
    }));

    setBalls(initialBalls);
  }, []);

  // Handle scroll-based gravity control
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      if (scrollDelta > 0) {
        // Scrolling down - decrease gravity, allow negative (anti-gravity lifts balls)
        gravityLevelRef.current = Math.max(-2, gravityLevelRef.current - 0.1);
      } else if (scrollDelta < 0) {
        // Scrolling up - increase gravity (balls stick to ground)
        gravityLevelRef.current = Math.min(3, gravityLevelRef.current + 0.1);
      }
      
      // Set timeout to reset gravity to normal when scrolling stops
      scrollTimeoutRef.current = setTimeout(() => {
        gravityLevelRef.current = 1; // Reset to normal downward gravity
      }, 300); // 300ms after scrolling stops
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Physics animation loop
  useEffect(() => {
    if (balls.length === 0 || !containerRef.current) return;

    const animate = () => {
      setBalls(prevBalls => {
        const container = containerRef.current;
        if (!container) return prevBalls;

        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        
        // Gravity controlled by scroll direction
        const baseGravity = 0.05;
        const gravity = baseGravity * gravityLevelRef.current; // Direct gravity control
        
        const friction = 0.998; // Even less friction for more bouncing
        const bounce = 0.6; // Increased base bounce for walls

        // Create a copy of balls for collision detection
        const newBalls = prevBalls.map(ball => ({ ...ball }));

        // Apply physics to each ball
        newBalls.forEach(ball => {
          // Calculate mass based on radius (larger balls = more mass)
          const mass = (ball.radius / 100) * (ball.radius / 100); // Quadratic relationship
          const massGravityMultiplier = 0.5 + (mass * 1.5); // Bigger balls fall faster
          const massBounceReduction = Math.max(0.4, 1 - (mass * 0.3)); // Bigger balls bounce less but still bouncy

          ball.vx = ball.vx * friction;
          ball.vy = ball.vy * friction + (gravity * massGravityMultiplier);

          ball.x += ball.vx;
          ball.y += ball.vy;

          // Boundary collisions with mass-based bounce
          const wallBounce = bounce * massBounceReduction;
          
          if (ball.x <= ball.radius) {
            ball.x = ball.radius;
            ball.vx *= -wallBounce;
          } else if (ball.x >= containerWidth - ball.radius) {
            ball.x = containerWidth - ball.radius;
            ball.vx *= -wallBounce;
          }

          if (ball.y <= ball.radius) {
            ball.y = ball.radius;
            ball.vy *= -wallBounce;
          } else if (ball.y >= containerHeight - ball.radius) {
            ball.y = containerHeight - ball.radius;
            ball.vy *= -wallBounce;
          }
        });

        // Ball-to-ball collision detection and response
        for (let i = 0; i < newBalls.length; i++) {
          for (let j = i + 1; j < newBalls.length; j++) {
            const ball1 = newBalls[i];
            const ball2 = newBalls[j];

            // Calculate masses
            const mass1 = (ball1.radius / 100) * (ball1.radius / 100);
            const mass2 = (ball2.radius / 100) * (ball2.radius / 100);

            // Calculate distance between ball centers
            const dx = ball2.x - ball1.x;
            const dy = ball2.y - ball1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = ball1.radius + ball2.radius;

            // Check for collision
            if (distance < minDistance && distance > 0) {
              // Normalize the collision vector
              const nx = dx / distance;
              const ny = dy / distance;

              // Separate balls to prevent overlap
              const overlap = minDistance - distance;
              const totalMass = mass1 + mass2;
              const separationX = (overlap * 0.5) * nx;
              const separationY = (overlap * 0.5) * ny;
              
              // Heavier balls move less during separation
              const mass1Ratio = mass2 / totalMass;
              const mass2Ratio = mass1 / totalMass;

              ball1.x -= separationX * mass1Ratio;
              ball1.y -= separationY * mass1Ratio;
              ball2.x += separationX * mass2Ratio;
              ball2.y += separationY * mass2Ratio;

              // Calculate relative velocity
              const relativeVx = ball2.vx - ball1.vx;
              const relativeVy = ball2.vy - ball1.vy;

              // Calculate relative velocity along the collision normal
              const velAlongNormal = relativeVx * nx + relativeVy * ny;

              // Don't resolve if velocities are separating
              if (velAlongNormal > 0) continue;

              // Mass-based restitution - lighter balls bounce more
              const avgMass = (mass1 + mass2) / 2;
              const restitution = Math.max(0.3, Math.min(0.9, 1.4 - avgMass)); // More bounce overall, lighter = even more bounce

              // Collision response with mass
              const j = -(1 + restitution) * velAlongNormal / totalMass * (mass1 * mass2);

              // Apply impulse based on mass ratios
              const impulseX = j * nx;
              const impulseY = j * ny;

              ball1.vx -= impulseX / mass1;
              ball1.vy -= impulseY / mass1;
              ball2.vx += impulseX / mass2;
              ball2.vy += impulseY / mass2;
            }
          }
        }

        return newBalls;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [balls.length]);

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

  const handleBallClick = (review: typeof reviews[0]) => {
    window.open(review.linkedinUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className={styles.ballpitSection}>
      <div className={styles.container}>
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

        {/* Ballpit Container */}
        <div 
          ref={containerRef}
          className={`${styles.ballpitContainer} ${isVisible ? styles.visible : ''}`}
        >
          {balls.map(ball => (
            <div
              key={ball.id}
              className={styles.reviewBall}
              style={{
                transform: `translate(${ball.x - ball.radius}px, ${ball.y - ball.radius}px)`,
                width: ball.radius * 2,
                height: ball.radius * 2,
                backgroundImage: `url(${ball.review.image})`,
              }}
              onClick={() => handleBallClick(ball.review)}
            >
              <div className={styles.ballOverlay} />
              <div className={styles.ballContent}>
                <p className={styles.quote}>&ldquo;{ball.review.quote}&rdquo;</p>
                <div className={styles.reviewer}>
                  <span className={styles.name}>{ball.review.name}</span>
                  <span className={styles.role}>{ball.review.role}</span>
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
          <p>💡 Scroll down to lift balls • Scroll up for heavy gravity • Balls fall naturally when you stop</p>
        </div>
      </div>
    </section>
  );
} 