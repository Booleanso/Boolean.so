'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './portfolio.module.css'; // We'll create this CSS module next
import { isValidImageUrl } from '../../utils/url-utils'; // Import the validator
import SplineViewer from './SplineViewer';

const PLACEHOLDER_IMAGE_URL = 'https://placehold.co/600x400/eee/ccc?text=Image+Not+Available';

// Interface should match the one used in page.tsx and API routes
interface PortfolioProject {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  projectUrl?: string;
  dateCompleted: number | Date;
  featured: boolean;
}

interface PortfolioClientPageProps {
  initialProjects: PortfolioProject[];
  featuredProject: PortfolioProject | null;
  allTags: string[];
}

export default function PortfolioClientPage({ 
  initialProjects,
  featuredProject,
  allTags
}: PortfolioClientPageProps) {
  const [activeFilter, setActiveFilter] = useState('All'); // Default to 'All'

  // State to track image errors for the featured project
  const [featuredImageError, setFeaturedImageError] = useState(false);

  // Memoize filtered projects to avoid recalculation on every render
  const filteredProjects = useMemo(() => {
    if (activeFilter === 'All') {
      return initialProjects;
    }
    return initialProjects.filter(project => 
      project.tags.includes(activeFilter)
    );
  }, [initialProjects, activeFilter]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (e.currentTarget.src !== PLACEHOLDER_IMAGE_URL) {
      console.warn(`Image failed to load (onError), replacing with placeholder: ${e.currentTarget.src}`);
      e.currentTarget.src = PLACEHOLDER_IMAGE_URL;
      e.currentTarget.classList.add(styles.imageError);
    }
  };
  
  const handleFeaturedImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn(`Featured image failed to load (onError): ${e.currentTarget.src}`);
    setFeaturedImageError(true);
    e.currentTarget.parentElement?.classList.add(styles.featuredImageErrorState);
  };

  // Validate the featured image URL *before* rendering
  const featuredImageUrl = featuredProject && isValidImageUrl(featuredProject.imageUrl)
    ? featuredProject.imageUrl
    : PLACEHOLDER_IMAGE_URL;
  // If the original URL was invalid, treat it as an error from the start
  if (featuredProject && !isValidImageUrl(featuredProject.imageUrl) && !featuredImageError) {
     console.warn(`Initial featured image URL invalid, using placeholder: ${featuredProject.imageUrl}`);
     setFeaturedImageError(true); // Set error state immediately if invalid
  }

  return (
    <main className={styles.portfolioPage}>
      {/* Optional: Featured Project Hero Section */}
      {featuredProject && (
        <section className={styles.featuredSection}>
          <div className={`${styles.featuredImageWrapper} ${featuredImageError ? styles.featuredImageErrorState : ''}`}>
            {!featuredImageError && (
              <Image 
                src={featuredImageUrl} // Use validated URL
                alt={`${featuredProject.title} featured project`}
                fill
                priority
                className={styles.featuredImage}
                sizes="100vw"
                onError={handleFeaturedImageError} // Keep as fallback
              />
            )}
            {/* Optionally show placeholder text/background if image fails */} 
            {featuredImageError && (
              <div className={styles.featuredImagePlaceholder}>Image Unavailable</div>
            )}
            <div className={styles.featuredOverlay}></div>
          </div>
          <div className={styles.featuredContent}>
            <span className={styles.featuredLabel}>Featured Project</span>
            <h1 className={styles.featuredTitle}>{featuredProject.title}</h1>
            <p className={styles.featuredDescription}>{featuredProject.description}</p>
            <Link 
              href={`/portfolio/projects/${featuredProject.slug}`}
              className={styles.featuredLink}
            >
              View Case Study
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 0L6.59 1.41L12.17 7H0V9H12.17L6.59 14.59L8 16L16 8L8 0Z" fill="currentColor"/></svg>
            </Link>
            {featuredProject.projectUrl && (
              <a 
                href={featuredProject.projectUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`${styles.featuredLink} ${styles.liveSiteLink}`}
              >
                View Live Site
              </a>
            )}
          </div>
        </section>
      )}

      {/* Main Project Grid Section */}
      <section className={styles.gridSection}>
        <div className={styles.gridHeader}>
          <h2 className={styles.gridTitle}>Our Work</h2>
          {/* Filter Buttons */}
          <div className={styles.filters}>
            <button
              onClick={() => setActiveFilter('All')}
              className={`${styles.filterButton} ${activeFilter === 'All' ? styles.active : ''}`}
            >
              All
            </button>
            {allTags.sort().map(tag => (
              <button
                key={tag}
                onClick={() => setActiveFilter(tag)}
                className={`${styles.filterButton} ${activeFilter === tag ? styles.active : ''}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Model Viewer */}
        <SplineViewer />

        {/* Project Grid */}
        {filteredProjects.length > 0 ? (
          <div className={styles.projectGrid}>
            {filteredProjects.map(project => {
              const imageSrc = isValidImageUrl(project.imageUrl) 
                ? project.imageUrl 
                : PLACEHOLDER_IMAGE_URL;
                
              if (!isValidImageUrl(project.imageUrl)) {
                  console.warn(`Invalid grid image URL, using placeholder: ${project.imageUrl}`);
              }

              return (
                // Use a div as the main clickable element for the card link
                <div key={project.id} className={styles.projectCardContainer}>
                  {/* Link covers the image */}
                  <Link 
                    href={`/portfolio/projects/${project.slug}`}
                    className={styles.cardImageLinkWrapper} // New style for link covering image
                  >
                    <div className={styles.cardImageWrapper}>
                        <Image 
                          src={imageSrc} 
                          alt={project.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className={styles.cardImage}
                          onError={handleImageError} 
                        />
                        <div className={styles.cardOverlay}></div>
                      </div>
                  </Link>
                  {/* Content area below image */}
                  <div className={styles.cardContentArea}> 
                    <h3 className={styles.cardTitle}>
                      {/* Link only the title to the case study */}
                      <Link href={`/portfolio/projects/${project.slug}`} className={styles.cardTitleLink}> 
                         {project.title}
                      </Link>
                     </h3>
                    <div className={styles.cardTags}>
                      {project.tags.slice(0, 3).map(tag => (
                        <span key={tag} className={styles.cardTag}>{tag}</span>
                      ))}
                    </div>
                    {/* Live site button is NOT nested in the main link anymore */}
                    {project.projectUrl && (
                      <div className={styles.liveSiteButtonContainer}> 
                        <a 
                          href={project.projectUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={styles.liveSiteButton} 
                          // No stopPropagation needed now
                        >
                          View Live Site
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyGridState}>
            <p>No projects found matching &quot;{activeFilter}&quot;.</p>
            <button onClick={() => setActiveFilter('All')} className={styles.resetFilterButton}>
              Show All Projects
            </button>
          </div>
        )}
      </section>

      {/* Optional: Contact Section (If you want to keep it) */}
      {/* 
      <section id="contact" className={styles.contactSection}>
        <h2>Get In Touch</h2>
        ...
      </section> 
      */}
    </main>
  );
} 