'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './PortfolioPreview.module.css';

// Match the interface from the API route
interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  projectUrl?: string;
  dateCompleted: number | Date;
  featured: boolean;
}

export default function PortfolioPreview() {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/portfolio/featured');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProjects(data.projects || []);
      } catch (err) {
        console.error('Error fetching featured projects:', err);
        setError('Failed to load featured projects.');
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedProjects();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <span>Loading projects...</span>
        </div>
      );
    }
    if (error) {
      return <div className={styles.errorState}>{error}</div>;
    }
    if (projects.length === 0) {
      return <div className={styles.emptyState}>No featured projects to display yet.</div>;
    }
    return (
      <div className={styles.gridContainer}>
        {projects.map((project) => (
          <Link 
            href={project.projectUrl || `/portfolio/projects/${project.id}`} // Link to project URL or a detail page 
            key={project.id} 
            className={styles.projectCard}
            target={project.projectUrl ? '_blank' : '_self'}
            rel={project.projectUrl ? 'noopener noreferrer' : ''}
          >
            <div className={styles.imageWrapper}>
              <Image
                src={project.imageUrl}
                alt={project.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className={styles.projectImage}
              />
              <div className={styles.overlay}></div>
            </div>
            <div className={styles.contentWrapper}>
              <h3 className={styles.projectTitle}>{project.title}</h3>
              <p className={styles.projectDescription}>{project.description}</p>
              <div className={styles.tagsContainer}>
                {project.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
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
        <h2 className={styles.heading}>Featured Work</h2>
        <p className={styles.subheading}>
A selection of projects showcasing our expertise and results.
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