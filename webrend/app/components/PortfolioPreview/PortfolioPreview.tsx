'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './PortfolioPreview.module.css';

// Match the interface from the portfolio system
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
  const [recentProjects, setRecentProjects] = useState<PortfolioProject[]>([]);

  useEffect(() => {
    // Get the 6 most recent projects
    const sortedProjects = [...projects]
      .sort((a, b) => new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime())
      .slice(0, 6);
    setRecentProjects(sortedProjects);
  }, [projects]);

  const renderContent = () => {
    if (recentProjects.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p>No recent projects to display.</p>
        </div>
      );
    }

    return (
      <div className={styles.projectGrid}>
        {recentProjects.map((project) => (
          <div key={project.id} className={styles.projectCard}>
            <div className={styles.imageWrapper}>
              <Image
                src={project.imageUrl}
                alt={project.title}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className={styles.projectImage}
              />
              
              {/* Hover overlay with button */}
              <div className={styles.imageOverlay}>
                <Link 
                  href={`/portfolio/projects/${project.slug}`}
                  className={styles.hoverButton}
                >
                  → View Project
                </Link>
              </div>
              
              {/* Top corner overlay elements */}
              <div className={styles.topOverlay}>
                <span className={styles.websiteLabel}>WEBSITE</span>
              </div>
              
              {/* Corner action buttons */}
              <div className={styles.cornerActions}>
                <Link 
                  href={`/portfolio/projects/${project.slug}`}
                  className={styles.actionButton}
                  title="View Project"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15,3 21,3 21,9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </Link>
                {project.projectUrl && (
                  <a 
                    href={project.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.actionButton}
                    title="View Live Site"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12V7a5 5 0 0 1 10 0v5"/>
                      <rect x="3" y="12" width="18" height="8" rx="2"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
            
            <div className={styles.contentWrapper}>
              <div className={styles.projectTitle}>{project.title}</div>
              <div className={styles.projectDescription}>{project.description}</div>
              <div className={styles.projectMeta}>
                <div className={styles.tagsContainer}>
                  {project.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div className={styles.projectStats}>
                  <span>Project</span>
                  {project.projectUrl && <span>Live Site</span>}
                </div>
              </div>
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
          Discover our latest projects and innovative solutions across various industries and technologies.
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