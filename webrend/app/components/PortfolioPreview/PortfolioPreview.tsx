'use client';

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
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn('Image failed to load:', e.currentTarget.src);
    e.currentTarget.src = '/images/placeholder.png';
  };

  const renderContent = () => {
    if (projects.length === 0) {
      return <div className={styles.emptyState}>No featured projects to display yet.</div>;
    }
    
    return (
      <div className={styles.gridContainer}>
        {projects.map((project) => (
          <div key={project.id} className={styles.projectCard}>
            <Link 
              href={`/portfolio/projects/${project.slug}`}
              className={styles.imageLink}
            >
              <div className={styles.imageWrapper}>
                <Image
                  src={project.imageUrl}
                  alt={project.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className={styles.projectImage}
                  onError={handleImageError}
                />
                <div className={styles.overlay}></div>
              </div>
            </Link>
            <div className={styles.contentWrapper}>
              <Link href={`/portfolio/projects/${project.slug}`} className={styles.titleLink}>
                <h3 className={styles.projectTitle}>{project.title}</h3>
              </Link>
              <p className={styles.projectDescription}>{project.description}</p>
              <div className={styles.tagsContainer}>
                {project.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
              {project.projectUrl && (
                <div className={styles.liveSiteContainer}>
                  <a 
                    href={project.projectUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={styles.liveSiteLink}
                  >
                    View Live Site
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className={styles.portfolioSection}>
      <div className={styles.headerContent}>
        <h2 className={styles.heading}>Recent Work</h2>
        <p className={styles.subheading}>
          Our latest projects showcasing cutting-edge solutions and results.
        </p>
        <Link href="/portfolio" className={styles.viewAllLink}>
          View All Projects
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0L4.9425 1.0575L9.1275 5.25H0V6.75H9.1275L4.9425 10.9425L6 12L12 6L6 0Z" fill="currentColor"/></svg>
        </Link>
      </div>
      {renderContent()}
    </section>
  );
} 