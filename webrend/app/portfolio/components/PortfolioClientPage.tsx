'use client';

import { useState, useMemo, useEffect, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import styles from './portfolio.module.css'; // We'll create this CSS module next
import { isValidImageUrl } from '../../utils/url-utils'; // Import the validator
// import SplineViewer from './SplineViewer'; // Commented out - Spline scene removed
import { Globe } from '../../components/index/HeroSection/HeroSection';

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
  projectType?: string | null;
  projectTypes?: string[];
  inProgress?: boolean;
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

  const ALLOWED_FILTERS = ['All', 'Websites', 'Apps', 'Software', 'Firmware'];

  // Globe + locations state (reuse Hero behavior)
  type EnhancedLocation = { lat: number; lng: number; name: string; repoName: string; iconUrl?: string; isPrivate?: boolean };
  const [locations, setLocations] = useState<EnhancedLocation[]>([]);
  const [loadingGlobe, setLoadingGlobe] = useState(true);
  const [errorGlobe, setErrorGlobe] = useState<string | null>(null);
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([]);
  const globeContainerRef = useRef<HTMLDivElement>(null);

  // Memoize filtered projects to avoid recalculation on every render
  const filteredProjects = useMemo(() => {
    if (activeFilter === 'All') return initialProjects;
    const target = activeFilter.toLowerCase();
    return initialProjects.filter(project => {
      // Prefer projectTypes array
      if (Array.isArray(project.projectTypes) && project.projectTypes.length > 0) {
        const lowers = project.projectTypes.map(t => (t || '').toLowerCase());
        if (lowers.includes(target)) return true;
      }
      // Fallback to single projectType
      const type = (project.projectType || '').toLowerCase();
      if (type && type === target) return true;
      // Fallback to visible tags if projectType not set yet
      const tags = Array.isArray(project.tags) ? project.tags : [];
      return tags.some(t => (t || '').toLowerCase() === target);
    });
  }, [initialProjects, activeFilter]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (e.currentTarget.src !== PLACEHOLDER_IMAGE_URL) {
      console.warn(`Image failed to load (onError), replacing with placeholder: ${e.currentTarget.src}`);
      e.currentTarget.src = PLACEHOLDER_IMAGE_URL;
      e.currentTarget.classList.add(styles.imageError);
    }
  };

  // Load portfolio projects for mapping (independent of initialProjects)
  useEffect(() => {
    // Fade in from black on portfolio page mount
    if (typeof window !== 'undefined' && (window as any).__fadeFromBlack) {
      (window as any).__fadeFromBlack();
    }
    const fetchPortfolioProjects = async () => {
      try {
        const response = await fetch('/api/portfolio/projects');
        if (response.ok) {
          const data = await response.json();
          setPortfolioProjects(data.projects || []);
        }
      } catch (err) {
        console.error('Error fetching portfolio projects:', err);
      }
    };
    fetchPortfolioProjects();
  }, []);

  // Fetch locations (mirrors Hero logic, simplified)
  useEffect(() => {
    async function fetchLocations() {
      try {
        let allLocations: EnhancedLocation[] = [];

        // Public repos in org
        try {
          const reposResponse = await axios.get('https://api.github.com/orgs/WebRendHQ/repos?per_page=100');
          const repos = reposResponse.data || [];
          const publicLocationPromises = repos.map(async (repo: { name: string; default_branch?: string }) => {
            const branchesToTry = [repo.default_branch, 'main', 'master', 'development', 'dev'].filter(Boolean) as string[];
            for (const branch of branchesToTry) {
              try {
                const url = `https://raw.githubusercontent.com/WebRendHQ/${repo.name}/${branch}/location.json`;
                const locationResponse = await axios.get(url, { timeout: 5000 });
                if (locationResponse.status === 200 && locationResponse.data) {
                  const d = locationResponse.data;
                  if (d.location && typeof d.latitude === 'number' && typeof d.longitude === 'number') {
                    return { lat: d.latitude, lng: d.longitude, name: d.location, repoName: repo.name, iconUrl: d.iconUrl, isPrivate: false } as EnhancedLocation;
                  }
                }
              } catch {}
            }
            return null;
          });
          const publicLocationResults = await Promise.allSettled(publicLocationPromises);
          const validPublic = publicLocationResults.filter((r): r is PromiseFulfilledResult<EnhancedLocation | null> => r.status === 'fulfilled').map(r => r.value).filter(Boolean) as EnhancedLocation[];
          allLocations = [...allLocations, ...validPublic];
        } catch (err) {
          console.log('Error fetching public repos locations:', err);
        }

        // Local private locations via API
        try {
          const response = await fetch('/api/private-locations');
          if (response.ok) {
            const data = await response.json();
            const localPrivate = (data.locations || [])
              .filter((repo: any) => repo.repoName && repo.location && typeof repo.latitude === 'number' && typeof repo.longitude === 'number')
              .map((repo: any): EnhancedLocation => ({ lat: repo.latitude, lng: repo.longitude, name: repo.location, repoName: repo.repoName, iconUrl: repo.iconUrl, isPrivate: true }));
            allLocations = [...allLocations, ...localPrivate];
          }
        } catch (err) {
          console.log('Error fetching local private locations:', err);
        }

        if (allLocations.length === 0) {
          setErrorGlobe('No location data found.');
          setLocations([{ lat: 40.7128, lng: -74.0060, name: 'New York', repoName: 'Example Repo', isPrivate: false }]);
        } else {
          setLocations(allLocations);
        }
      } catch (error) {
        console.error('Error fetching location data:', error);
        setErrorGlobe('Failed to fetch location data.');
        setLocations([{ lat: 40.7128, lng: -74.0060, name: 'New York', repoName: 'Example Repo', isPrivate: false }]);
      } finally {
        setLoadingGlobe(false);
      }
    }
    fetchLocations();
  }, []);

  // Find best matching project for a repo
  const findMatchingProject = (repoName: string) => {
    if (portfolioProjects.length === 0) return null as any;
    let match = portfolioProjects.find((p: PortfolioProject) => p.title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '') === repoName.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ''));
    if (match) return match as any;
    const repoWords = repoName.toLowerCase().split(/[-_\s]+/).filter(w => w.length > 2);
    match = portfolioProjects.find((p: PortfolioProject) => {
      const titleWords = p.title.toLowerCase().split(/\s+/);
      return repoWords.some(rw => titleWords.some(tw => tw.includes(rw) || rw.includes(tw)));
    });
    return (match || portfolioProjects[0] || null) as any;
  };

  return (
    <main className={styles.portfolioPage}>

      {/* Main Project Grid Section */}
      <section className={styles.gridSection}>
        <div className={styles.gridHeader}>
          <h2 className={styles.gridTitle}>Our Work</h2>
          {/* Filter Buttons */}
          <div className={styles.filters}>
            {ALLOWED_FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`${styles.filterButton} ${activeFilter === filter ? styles.active : ''}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>


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
                    <div className={`${styles.cardImageWrapper} ${project.inProgress ? styles.inProgress : ''}`}>
                        <Image 
                          src={imageSrc} 
                          alt={project.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className={`${styles.cardImage} ${project.inProgress ? styles.cardImageBlur : ''}`}
                          onError={handleImageError} 
                        />
                        <div className={styles.cardOverlay}></div>
                        {project.inProgress && (
                          <div className={styles.inProgressBadge} aria-label="In Progress">In Progress</div>
                        )}
                        {project.projectUrl && (
                          <span
                            className={styles.liveSiteIconLink}
                            role="link"
                            tabIndex={0}
                            aria-label="Open live site"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.open(project.projectUrl as string, '_blank', 'noopener,noreferrer');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                window.open(project.projectUrl as string, '_blank', 'noopener,noreferrer');
                              }
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                              <path d="M15 3h6v6"/>
                              <path d="M10 14L21 3"/>
                            </svg>
                          </span>
                        )}
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
                    {/* Live site icon moved into image overlay above */}
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