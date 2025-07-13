'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './PortfolioPreview.module.css';

// Match the interface from the portfolio page
interface PortfolioProject {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  projectUrl?: string;
  dateCompleted: Date;
  featured: boolean;
}

interface PortfolioPreviewProps {
  projects: PortfolioProject[];
}

export default function PortfolioPreview({ projects }: PortfolioPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(1); // Start with middle card selected
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn('Image failed to load:', e.currentTarget.src);
    e.currentTarget.src = '/images/placeholder.png';
  };

  // Get the most recent projects
  const recentProjects = projects
    .sort((a, b) => new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime())
    .slice(0, 5); // Show up to 5 projects

  // Handle swipe gestures
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      navigateRight();
    } else if (isRightSwipe) {
      navigateLeft();
    }
  };

  const navigateLeft = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : recentProjects.length - 1));
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const navigateRight = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev < recentProjects.length - 1 ? prev + 1 : 0));
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const navigateToIndex = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigateLeft();
      } else if (e.key === 'ArrowRight') {
        navigateRight();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const renderContent = () => {
    if (recentProjects.length === 0) {
      return <div className={styles.emptyState}>No featured projects to display yet.</div>;
    }

    return (
      <div className={styles.carouselContainer}>
        {/* Navigation Arrows */}
        <button 
          className={`${styles.navButton} ${styles.navLeft}`}
          onClick={navigateLeft}
          disabled={isTransitioning}
          aria-label="Previous project"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button 
          className={`${styles.navButton} ${styles.navRight}`}
          onClick={navigateRight}
          disabled={isTransitioning}
          aria-label="Next project"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Cards Container */}
        <div 
          className={styles.cardsContainer}
          ref={carouselRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {recentProjects.map((project, index) => {
            const position = index - currentIndex;
            const isActive = index === currentIndex;
            const isVisible = Math.abs(position) <= 2;

            if (!isVisible) return null;

            return (
              <div
                key={project.id}
                className={`${styles.cardWrapper} ${isActive ? styles.active : ''}`}
                style={{
                  transform: `translateX(${position * 100}%) scale(${isActive ? 1 : 0.8})`,
                  zIndex: isActive ? 10 : 5 - Math.abs(position),
                  opacity: isActive ? 1 : 0.6,
                }}
                onClick={() => !isActive && navigateToIndex(index)}
              >
                <Link 
                  href={`/portfolio/projects/${project.slug}`}
                  className={styles.projectCard}
                  onClick={(e) => !isActive && e.preventDefault()}
                >
                  <div className={styles.imageWrapper}>
                    <Image
                      src={project.imageUrl}
                      alt={project.title}
                      fill
                      sizes="(max-width: 768px) 90vw, 40vw"
                      className={styles.projectImage}
                      onError={handleImageError}
                      priority={isActive}
                    />
                    <div className={styles.imageOverlay} />
                  </div>
                  
                  <div className={styles.contentWrapper}>
                    <h3 className={styles.projectTitle}>{project.title}</h3>
                    <p className={styles.projectDescription}>{project.description}</p>
                    
                    <div className={styles.projectMeta}>
                      <div className={styles.tagsContainer}>
                        {project.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className={styles.tag}>{tag}</span>
                        ))}
                      </div>
                      
                      {isActive && (
                        <div className={styles.actionHint}>
                          <span>Click to explore</span>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Floating glow effect */}
                  <div className={`${styles.cardGlow} ${isActive ? styles.activeGlow : ''}`} />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Dots Indicator */}
        <div className={styles.dotsContainer}>
          {recentProjects.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`}
              onClick={() => navigateToIndex(index)}
              aria-label={`Go to project ${index + 1}`}
            />
          ))}
        </div>

        {/* Swipe Hint */}
        <div className={styles.swipeHint}>
          <span>Swipe or use arrow keys to navigate</span>
        </div>
      </div>
    );
  };

  return (
    <section className={styles.portfolioSection}>
      <div className={styles.headerContent}>
        <h2 className={styles.heading}>Recent Work</h2>
        <p className={styles.subheading}>
          Swipe through our latest projects and discover innovative solutions.
        </p>
      </div>
      
      {renderContent()}
      
      <div className={styles.viewAllContainer}>
        <Link href="/portfolio" className={styles.viewAllButton}>
          View All Projects
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 0L5.645 1.355L10.09 5.8H0V7.8H10.09L5.645 12.245L7 13.6L14 6.6L7 0Z" fill="currentColor"/>
          </svg>
        </Link>
      </div>
    </section>
  );
} 