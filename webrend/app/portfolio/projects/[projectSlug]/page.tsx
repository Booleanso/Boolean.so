import { db } from '../../../lib/firebase-admin';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './caseStudy.module.css';
import { Metadata, ResolvingMetadata } from 'next';
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
  { params }: Props,
  parent: ResolvingMetadata
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

      {/* --- Main Content Sections --- */}
      <div className={styles.mainContent}>
        
        {/* Project Goal */}
        <section className={styles.contentSection}>
          <h2 className={styles.sectionTitle}>Project Goal</h2>
          <p className={styles.sectionText}>{project.projectGoal}</p>
        </section>

        {/* Solution */}
        <section className={styles.contentSection}>
          <h2 className={styles.sectionTitle}>Solution</h2>
          <p className={styles.sectionText}>{project.solution}</p>
        </section>

        {/* Key Features (Optional) */}
        {project.keyFeatures && project.keyFeatures.length > 0 && (
          <section className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>Key Features</h2>
            <ul className={styles.featureList}>
              {project.keyFeatures.map((feature, index) => (
                <li key={index} className={styles.featureItem}>{feature}</li>
              ))}
            </ul>
          </section>
        )}
        
        {/* Challenges (Optional) */}
        {project.challenges && (
           <section className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>Challenges</h2>
            <p className={styles.sectionText}>{project.challenges}</p>
          </section>
        )}

        {/* Results (Optional) */}
        {project.results && (
           <section className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>Results</h2>
            <p className={styles.sectionText}>{project.results}</p>
          </section>
        )}

        {/* Testimonial (Optional) */}
        {project.testimonialText && (
          <section className={`${styles.contentSection} ${styles.testimonialSection}`}>
            <blockquote className={styles.testimonialBlockquote}>
              <p className={styles.testimonialText}>"{project.testimonialText}"</p>
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
          <section className={styles.gallerySection}>
            <h2 className={styles.sectionTitle}>Gallery</h2>
            <div className={styles.galleryGrid}>
              {validGalleryImages.map((img, index) => (
                <div key={index} className={styles.galleryItem}>
                  <Image 
                    src={img.validated} 
                    alt={`${project.title} - Gallery Image ${index + 1}`}
                    width={800} 
                    height={600}
                    className={styles.galleryImage}
                    sizes="(max-width: 768px) 100vw, 50vw"
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