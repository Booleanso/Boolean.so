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
            {project.clientName && <span>Client: {project.clientName}</span>}
            <span>Completed: {formattedDate}</span>
          </div>
          <div className={styles.tagsContainer}>
            {project.tags.map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
          {project.projectUrl && (
            <Link href={project.projectUrl} target="_blank" rel="noopener noreferrer" className={styles.liveLinkButton}>
              Visit Live Site &rarr;
            </Link>
          )}
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
              {project.clientName && <p><strong>Client:</strong> {project.clientName}</p>}
              <p><strong>Timeline:</strong> Completed {formattedDate}</p>
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

        {/* Challenges (Optional) */}
        {project.challenges && (
           <section className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>Challenges & Approach</h2>
            <div className={styles.sectionText}>
              <p>{project.challenges}</p>
            </div>
          </section>
        )}

        {/* Results (Optional) */}
        {project.results && (
           <section className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>Results & Impact</h2>
            <div className={styles.sectionText}>
              <p>{project.results}</p>
            </div>
          </section>
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

        {/* Gallery (Optional) */}
        {validGalleryImages.length > 0 && (
          <section className={`${styles.contentSection} ${styles.gallerySection}`}>
            <h2 className={styles.sectionTitle}>Project Gallery</h2>
            <div className={styles.galleryGrid}>
              {validGalleryImages.map((img, index) => (
                <div key={index} className={styles.galleryItem}>
                  <Image 
                    src={img.validated} 
                    alt={`${project.title} - Gallery Image ${index + 1}`}
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