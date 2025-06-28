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

  // Get only the 3 most recent projects
  const recentProjects = projects
    .sort((a, b) => new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime())
    .slice(0, 3);

  const renderContent = () => {
    if (recentProjects.length === 0) {
      return <div className={styles.emptyState}>No featured projects to display yet.</div>;
    }
    
    return (
      <div className={styles.gridContainer}>
        {recentProjects.map((project) => (
          <Link 
            href={`/portfolio/projects/${project.slug}`}
            key={project.id} 
            className={styles.projectCard}
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
            </div>
            <div className={styles.contentWrapper}>
              <h3 className={styles.projectTitle}>{project.title}</h3>
              <div className={styles.projectDetails}>
                <p className={styles.projectDescription}>{project.description}</p>
                <div className={styles.projectMeta}>
                  <div className={styles.tagsContainer}>
                    {project.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                  {project.projectUrl && (
                    <div className={styles.liveSiteContainer}>
                      <span className={styles.liveSiteLink}>
                        View Live
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
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