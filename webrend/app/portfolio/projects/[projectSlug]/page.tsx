import { db } from '../../../lib/firebase-admin';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './caseStudy.module.css';
import { Metadata } from 'next';
import { Timestamp } from 'firebase-admin/firestore';
import { isValidImageUrl } from '../../../utils/url-utils';

const PLACEHOLDER_IMAGE_URL = 'https://placehold.co/800x600/eee/ccc?text=Image+Not+Available';
const GALLERY_PLACEHOLDER_IMAGE_URL = 'https://placehold.co/800x600/eee/ccc?text=Image+Not+Available';

// Define the type for the full project data including new fields
interface PortfolioProject {
  id: string;
  slug: string;
  title: string;
  description: string; // Short description
  imageUrl: string;    // Hero image
  projectUrl?: string;
  tags: string[];
  dateCompleted: Date; // Converted from Timestamp
  featured: boolean;
  createdAt: Date;     // Converted from Timestamp
  // New fields
  clientName?: string | null;
  clientLinkedIn?: string | null; // Client LinkedIn URL
  clientInstagram?: string | null; // Client Instagram URL
  clientX?: string | null; // Client X/Twitter URL
  projectLength?: string | null; // Add project length information
  projectGoal: string;
  solution: string;
  keyFeatures?: string[];
  challenges?: string | null;
  results?: string | null;
  testimonialText?: string | null;
  testimonialAuthor?: string | null;
  testimonialTitle?: string | null;
  galleryImages?: string[];
  videoUrl?: string | null; // Add video URL field
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

// Helper function to fetch project data
async function getProjectBySlug(slug: string): Promise<PortfolioProject | null> {
  console.log(`Fetching project with slug: ${slug}`);
  try {
    // Query Firestore using the slug field
    // NOTE: Requires a single-field index on 'slug' in Firestore!
    const projectsRef = db.collection('portfolioProjects');
    const querySnapshot = await projectsRef.where('slug', '==', slug).limit(1).get();

    if (querySnapshot.empty) {
      console.log(`No project found with slug: ${slug}`);
      return null;
    }

    const docSnap = querySnapshot.docs[0]; // Get the first document
    const data = docSnap.data();
    if (!data) return null;

    // Convert Timestamps
    const dateCompleted = (data.dateCompleted as Timestamp)?.toDate();
    const createdAt = (data.createdAt as Timestamp)?.toDate();

    return {
      id: docSnap.id, // Keep the document ID
      slug: data.slug, // Include the slug
      title: data.title || 'Untitled Project',
      description: data.description || '',
      imageUrl: data.imageUrl || '/images/placeholder.png',
      projectUrl: data.projectUrl || null,
      tags: data.tags || [],
      dateCompleted: dateCompleted || new Date(),
      featured: data.featured || false,
      createdAt: createdAt || new Date(),
      clientName: data.clientName || null,
      clientLinkedIn: data.clientLinkedIn || null, // Pull LinkedIn URL from data
      clientInstagram: data.clientInstagram || null, // Pull Instagram URL from data
      clientX: data.clientX || null, // Pull X/Twitter URL from data
      projectLength: data.projectLength || null, // Pull project length from data
      projectGoal: data.projectGoal || 'No goal specified.',
      solution: data.solution || 'No solution specified.',
      keyFeatures: data.keyFeatures || [],
      challenges: data.challenges || null,
      results: data.results || null,
      testimonialText: data.testimonialText || null,
      testimonialAuthor: data.testimonialAuthor || null,
      testimonialTitle: data.testimonialTitle || null,
      galleryImages: data.galleryImages || [],
      videoUrl: data.videoUrl || null, // Add the videoUrl field
      seoTitle: data.seoTitle || data.title || 'Project Case Study',
      seoDescription: data.seoDescription || data.description || '',
      seoKeywords: data.seoKeywords || data.tags || [],
    } as PortfolioProject;
  } catch (error) {
    console.error(`Error fetching project with slug ${slug}:`, error);
    return null;
  }
}

// --- Dynamic Metadata Generation ---
type Props = {
  params: { projectSlug: string }
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const project = await getProjectBySlug(params.projectSlug);

  if (!project) {
    return {
      title: 'Project Not Found',
      description: 'The requested project could not be found.',
    }
  }

  // Validate hero image for metadata
  const metaImageUrl = isValidImageUrl(project.imageUrl) ? project.imageUrl : undefined;

  return {
    title: project.seoTitle,
    description: project.seoDescription,
    keywords: project.seoKeywords,
    alternates: {
      canonical: `/portfolio/projects/${project.slug}`,
    },
    openGraph: {
      title: project.seoTitle,
      description: project.seoDescription,
      url: `/portfolio/projects/${project.slug}`,
      images: metaImageUrl ? [
        {
          url: metaImageUrl,
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ] : [],
    },
    twitter: {
      card: metaImageUrl ? 'summary_large_image' : 'summary',
      title: project.seoTitle,
      description: project.seoDescription,
      images: metaImageUrl ? [metaImageUrl] : [],
    },
  }
}

// --- Page Component ---
export default async function ProjectPage({ params }: Props) {
  const project = await getProjectBySlug(params.projectSlug);

  if (!project) {
    notFound(); // Trigger 404 page
  }

  // Validate hero image URL *before* passing to Image component
  const heroImageUrl = isValidImageUrl(project.imageUrl) 
    ? project.imageUrl 
    : PLACEHOLDER_IMAGE_URL;
  if (!isValidImageUrl(project.imageUrl)) {
     console.warn(`Invalid hero image URL, using placeholder: ${project.imageUrl}`);
  }
  
  // Set fallback video URL
  const FALLBACK_VIDEO_URL = "https://player.vimeo.com/video/76979871?autoplay=1&loop=1&muted=1&background=1";
  
  // Get video URL from project data and add autoplay parameters if needed
  let videoUrl = project.videoUrl || FALLBACK_VIDEO_URL;
  
  // If videoUrl doesn't already have autoplay parameters, add them
  if (videoUrl && !videoUrl.includes('autoplay=')) {
    // Add appropriate parameters based on the video platform
    if (videoUrl.includes('vimeo.com')) {
      // For Vimeo links
      videoUrl = videoUrl.includes('?') 
        ? `${videoUrl}&autoplay=1&loop=1&muted=1&background=1` 
        : `${videoUrl}?autoplay=1&loop=1&muted=1&background=1`;
    } else if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      // For YouTube links
      videoUrl = videoUrl.includes('?') 
        ? `${videoUrl}&autoplay=1&mute=1&loop=1&playlist=${getYouTubeID(videoUrl)}` 
        : `${videoUrl}?autoplay=1&mute=1&loop=1&playlist=${getYouTubeID(videoUrl)}`;
    }
  }
  
  // Helper function to extract YouTube video ID
  function getYouTubeID(url: string): string {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : '';
  }
  
  // Validate gallery image URLs *before* mapping
  const validGalleryImages = (project.galleryImages || []).map(url => ({
    original: url,
    validated: isValidImageUrl(url) ? url : GALLERY_PLACEHOLDER_IMAGE_URL
  }));
  validGalleryImages.forEach(img => {
      if (!isValidImageUrl(img.original)) {
          console.warn(`Invalid gallery image URL, using placeholder: ${img.original}`);
      }
  });

  const formattedDate = project.dateCompleted.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <article className={styles.caseStudyContainer}>
      {/* --- Hero Section --- */}
      <header className={styles.heroSection}>
        <div className={styles.heroImageWrapper}>
          <Image 
            src={heroImageUrl} 
            alt={`${project.title} - Hero Image`}
            fill
            priority
            className={styles.heroImage}
            sizes="100vw"
          />
          <div className={styles.heroOverlay}></div>
        </div>
        <div className={styles.heroContent}>
          <h1 className={styles.projectTitle}>{project.title}</h1>
          <p className={styles.projectSubtitle}>{project.description}</p>
          <div className={styles.metaInfo}>
            {project.clientName && (
              <span className={styles.clientInfo}>
                Client: {project.clientName}
                {project.clientLinkedIn && (
                  <a href={project.clientLinkedIn} target="_blank" rel="noopener noreferrer" className={styles.linkedInLink}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.linkedInIcon}>
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                )}
              </span>
            )}
            <span>Completed: {formattedDate}</span>
            {project.projectLength && <span>Project Timeline: {project.projectLength}</span>}
          </div>
          <div className={styles.tagsContainer}>
            {project.tags.map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
          
          <div className={styles.heroButtons}>
            {project.projectUrl && (
              <Link href={project.projectUrl} target="_blank" rel="noopener noreferrer" className={styles.liveLinkButton}>
                Visit Live Site &rarr;
              </Link>
            )}
            {project.clientLinkedIn && (
              <Link href={project.clientLinkedIn} target="_blank" rel="noopener noreferrer" className={styles.linkedInButton}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.socialIcon}>
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                LinkedIn
              </Link>
            )}
            {project.clientInstagram && (
              <Link href={project.clientInstagram} target="_blank" rel="noopener noreferrer" className={styles.instagramButton}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.socialIcon}>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram
              </Link>
            )}
            {project.clientX && (
              <Link href={project.clientX} target="_blank" rel="noopener noreferrer" className={styles.xButton}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.socialIcon}>
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
                X
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* --- Behance Style Main Content Sections --- */}
      <div className={styles.mainContent}>
        
        {/* Two-column grid for Overview and Project Goals */}
        <div className={styles.twoColumnGrid}>
          {/* Overview Section */}
          <section className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>Overview</h2>
            <div className={styles.sectionText}>
              <p>{project.description}</p>
              {project.clientName && (
                <p>
                  <strong>Client:</strong> {project.clientName}
                  {project.clientLinkedIn && (
                    <a href={project.clientLinkedIn} target="_blank" rel="noopener noreferrer" className={styles.inlineLinkedIn}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.linkedInIcon}>
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </a>
                  )}
                </p>
              )}
              <p><strong>Timeline:</strong> {project.projectLength || `Completed ${formattedDate}`}</p>
            </div>
          </section>

          {/* Project Goal */}
          <section className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>Project Goals</h2>
            <div className={styles.sectionText}>
              <p>{project.projectGoal}</p>
            </div>
          </section>
        </div>

        {/* Website Preview Section */}
        <section className={styles.websitePreviewSection}>
          <h2 className={styles.centeredSectionTitle}>Website Preview</h2>
          <p className={styles.centeredDescription}>Experience the original website below to see how we transformed it in our solution.</p>
          
          <div className={styles.websitePreviewWrapper}>
            {project.projectUrl ? (
              <iframe
                src={project.projectUrl}
                className={styles.websitePreview}
                title={`${project.title} - Website Preview`}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className={styles.noPreview}>
                <p>Website preview not available</p>
              </div>
            )}
          </div>
        </section>

        {/* Solution Section with Features on right side */}
        <section className={styles.solutionFeaturesSection}>
          <div className={styles.solutionText}>
            <h2 className={styles.sectionTitle}>Our Solution</h2>
            <div className={styles.sectionText}>
              <p>{project.solution}</p>
            </div>
          </div>
          
          <div className={styles.solutionFeatures}>
            {/* Solution Video */}
            <div className={styles.solutionVideo}>
              <iframe 
                src={videoUrl}
                width="100%" 
                height="100%" 
                frameBorder="0" 
                allow="autoplay; fullscreen; picture-in-picture; loop" 
                allowFullScreen
                title="Project Solution Video"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              ></iframe>
            </div>
            
            {/* Key Features without title, directly as badges */}
            {project.keyFeatures && project.keyFeatures.length > 0 && (
              <ul className={styles.featureList}>
                {project.keyFeatures.map((feature, index) => (
                  <li key={index} className={styles.featureItem}>{feature}</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Challenges and Results in a two-column grid */}
        {(project.challenges || project.results) && (
          <div className={styles.twoColumnGrid}>
            {/* Challenges (Optional) */}
            {project.challenges ? (
              <section className={styles.contentSection}>
                <h2 className={styles.sectionTitle}>Challenges & Approach</h2>
                <div className={styles.sectionText}>
                  <p>{project.challenges}</p>
                </div>
              </section>
            ) : (
              // Empty placeholder to maintain grid layout if only results are present
              <section className={styles.contentSection}></section>
            )}

            {/* Results (Optional) */}
            {project.results ? (
              <section className={styles.contentSection}>
                <h2 className={styles.sectionTitle}>Results & Impact</h2>
                <div className={styles.sectionText}>
                  <p>{project.results}</p>
                </div>
              </section>
            ) : (
              // Empty placeholder to maintain grid layout if only challenges are present
              <section className={styles.contentSection}></section>
            )}
          </div>
        )}

        {/* Testimonial (Optional) */}
        {project.testimonialText && (
          <section className={`${styles.contentSection} ${styles.testimonialSection}`}>
            <blockquote className={styles.testimonialBlockquote}>
              <p className={styles.testimonialText}>{project.testimonialText}</p>
              {(project.testimonialAuthor || project.testimonialTitle) && (
                <footer className={styles.testimonialFooter}>
                  {project.testimonialAuthor}
                  {project.testimonialAuthor && project.testimonialTitle && ', '}
                  {project.testimonialTitle}
                </footer>
              )}
            </blockquote>
          </section>
        )}

        {/* Process (Optional) - Full Width */}
        {validGalleryImages.length > 0 && (
          <section className={`${styles.contentSection} ${styles.processSection}`}>
            <h2 className={`${styles.sectionTitle} ${styles.processTitle}`}>PROCESS</h2>
            <div className={styles.masonryGrid}>
              {validGalleryImages.map((img, index) => (
                <div key={index} className={styles.masonryItem}>
                  <Image 
                    src={img.validated} 
                    alt={`${project.title} - Process Image ${index + 1}`}
                    width={800} 
                    height={600}
                    className={styles.galleryImage}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </article>
  );
} 