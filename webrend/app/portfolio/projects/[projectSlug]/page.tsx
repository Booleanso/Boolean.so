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

// Firestore raw data interface
interface FirestoreProjectData {
  slug?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  projectUrl?: string;
  tags?: string[];
  dateCompleted?: Timestamp;
  featured?: boolean;
  createdAt?: Timestamp;
  clientName?: string;
  clientLinkedIn?: string;
  clientInstagram?: string;
  clientX?: string;
  projectLength?: string;
  projectGoal?: string;
  solution?: string;
  keyFeatures?: string[];
  challenges?: string;
  results?: string;
  testimonialText?: string;
  testimonialAuthor?: string;
  testimonialTitle?: string;
  galleryImages?: string[];
  videoUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  // New extended case study fields
  industry?: string;
  companyStage?: string; // Pre-seed, Seed, Series A, etc.
  fundingRaised?: string; // e.g., "$1.2M Seed"
  location?: string;
  partners?: string[]; // key partners
  integrations?: string[]; // tech or platform integrations
  targetAudience?: string;
  whyNow?: string;
  marketSize?: string; // TAM/SAM/SOM summary
  industryTrends?: string;
  competitiveLandscape?: string;
  timeConstraints?: string; // deadlines, launch windows
  fundingAndPartnerImpact?: string; // narrative summary
  strategicPartnerships?: string[]; // list of partnerships
  accelerators?: string[]; // accelerator/incubator participation
  valuationChange?: string; // before/after or delta
  investorLogos?: string[]; // image URLs
  mediaCoverage?: { title: string; url: string }[];
  awards?: string[];
  founderStory?: string;
  scalability?: string; // how it scales long-term
  defensibility?: string; // moat/defensibility
  barriersToEntry?: string;
  techAdvantages?: string;
  ctaText?: string;
  ctaLink?: string;
}

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
  // New extended case study fields
  industry?: string | null;
  companyStage?: string | null;
  fundingRaised?: string | null;
  location?: string | null;
  partners?: string[];
  integrations?: string[];
  targetAudience?: string | null;
  whyNow?: string | null;
  marketSize?: string | null;
  industryTrends?: string | null;
  competitiveLandscape?: string | null;
  timeConstraints?: string | null;
  fundingAndPartnerImpact?: string | null;
  strategicPartnerships?: string[];
  accelerators?: string[];
  valuationChange?: string | null;
  investorLogos?: string[];
  mediaCoverage?: { title: string; url: string }[];
  awards?: string[];
  founderStory?: string | null;
  scalability?: string | null;
  defensibility?: string | null;
  barriersToEntry?: string | null;
  techAdvantages?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
}

// Helper function to fetch project data
async function getProjectBySlug(slug: string): Promise<PortfolioProject | null> {
  console.log(`Fetching project with slug: ${slug}`);
  try {
    // First, try to find by exact slug match
    const projectsRef = db!.collection('portfolioProjects');
    const querySnapshot = await projectsRef.where('slug', '==', slug).limit(1).get();

    if (!querySnapshot.empty) {
      console.log(`Found project by exact slug match: ${slug}`);
      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data();
      if (data) {
        return convertFirestoreDataToProject(docSnap.id, data);
      }
    }

    // If no exact slug match, try to find by repository name matching
    console.log(`No exact slug match found for: ${slug}. Trying repository name matching...`);
    
    // Get all projects to search through
    const allProjectsSnapshot = await projectsRef.get();
    
    if (allProjectsSnapshot.empty) {
      console.log('No projects found in database');
      return null;
    }

    // Convert slug back to potential repository name for matching
    const potentialRepoName = slug.replace(/-/g, ' ').toLowerCase();
    
    // Try to find a project that matches the repository name
    for (const doc of allProjectsSnapshot.docs) {
      const data = doc.data();
      const projectTitle = (data.title || '').toLowerCase();
      
      // Try exact title match (case insensitive, normalized)
      const normalizedTitle = projectTitle.replace(/[^\w\s]/g, '').replace(/\s+/g, '');
      const normalizedRepoName = potentialRepoName.replace(/[^\w\s]/g, '').replace(/\s+/g, '');
      
      if (normalizedTitle === normalizedRepoName) {
        console.log(`Found exact title match for repo name ${slug}: ${data.title}`);
        return convertFirestoreDataToProject(doc.id, data);
      }
      
      // Try keyword matching
      const repoWords = potentialRepoName.split(/[-_\s]+/).filter(word => word.length > 2);
      const titleWords = projectTitle.split(/\s+/);
      
      const hasKeywordMatch = repoWords.some(repoWord => 
        titleWords.some((titleWord: string) => titleWord.includes(repoWord) || repoWord.includes(titleWord))
      );
      
      if (hasKeywordMatch) {
        console.log(`Found keyword match for repo name ${slug}: ${data.title}`);
        return convertFirestoreDataToProject(doc.id, data);
      }
    }

    // If still no match, return null to trigger 404
    console.log(`No project found matching slug: ${slug}`);
    return null;

  } catch (error) {
    console.error(`Error fetching project with slug ${slug}:`, error);
    return null;
  }
}

// Helper function to convert Firestore data to PortfolioProject
function convertFirestoreDataToProject(docId: string, data: FirestoreProjectData): PortfolioProject {
  // Convert Timestamps
  const dateCompleted = (data.dateCompleted as Timestamp)?.toDate();
  const createdAt = (data.createdAt as Timestamp)?.toDate();

  return {
    id: docId,
    slug: data.slug || docId,
    title: data.title || 'Untitled Project',
    description: data.description || '',
    imageUrl: data.imageUrl || '/images/placeholder.png',
    projectUrl: data.projectUrl || null,
    tags: data.tags || [],
    dateCompleted: dateCompleted || new Date(),
    featured: data.featured || false,
    createdAt: createdAt || new Date(),
    clientName: data.clientName || null,
    clientLinkedIn: data.clientLinkedIn || null,
    clientInstagram: data.clientInstagram || null,
    clientX: data.clientX || null,
    projectLength: data.projectLength || null,
    projectGoal: data.projectGoal || 'No goal specified.',
    solution: data.solution || 'No solution specified.',
    keyFeatures: data.keyFeatures || [],
    challenges: data.challenges || null,
    results: data.results || null,
    testimonialText: data.testimonialText || null,
    testimonialAuthor: data.testimonialAuthor || null,
    testimonialTitle: data.testimonialTitle || null,
    galleryImages: data.galleryImages || [],
    videoUrl: data.videoUrl || null,
    seoTitle: data.seoTitle || data.title || 'Project Case Study',
    seoDescription: data.seoDescription || data.description || '',
    seoKeywords: data.seoKeywords || data.tags || [],
    // Extended fields
    industry: data.industry || null,
    companyStage: data.companyStage || null,
    fundingRaised: data.fundingRaised || null,
    location: data.location || null,
    partners: data.partners || [],
    integrations: data.integrations || [],
    targetAudience: data.targetAudience || null,
    whyNow: data.whyNow || null,
    marketSize: data.marketSize || null,
    industryTrends: data.industryTrends || null,
    competitiveLandscape: data.competitiveLandscape || null,
    timeConstraints: data.timeConstraints || null,
    fundingAndPartnerImpact: data.fundingAndPartnerImpact || null,
    strategicPartnerships: data.strategicPartnerships || [],
    accelerators: data.accelerators || [],
    valuationChange: data.valuationChange || null,
    investorLogos: data.investorLogos || [],
    mediaCoverage: data.mediaCoverage || [],
    awards: data.awards || [],
    founderStory: data.founderStory || null,
    scalability: data.scalability || null,
    defensibility: data.defensibility || null,
    barriersToEntry: data.barriersToEntry || null,
    techAdvantages: data.techAdvantages || null,
    ctaText: data.ctaText || null,
    ctaLink: data.ctaLink || null,
  } as PortfolioProject;
}

// --- Dynamic Metadata Generation ---
type Props = {
  params: Promise<{ projectSlug: string }>
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { projectSlug } = await params;
  const project = await getProjectBySlug(projectSlug);

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
  const { projectSlug } = await params;
  const project = await getProjectBySlug(projectSlug);

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
  
  // No iframes for this modern case study; we'll use static imagery only
  
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
          {/* Minimal hero: hide title/description/meta visually */}
          {/* Tags removed from hero for a cleaner header */}
          
          {/* Remove CTA buttons entirely */}
          {/* Intentionally blank to keep spacing minimal */}
        </div>
      </header>

      {/* --- Case Study Document Layout --- */}
      <div className={styles.mainContent}>
        <section className={styles.docSection}>
          <div className={styles.docGrid}>
            <div>
              <p className={styles.kicker}>Executive summary</p>
              <h2 className={styles.docTitle}>{project.title}</h2>
              <div className={styles.body}><p>{project.description}</p></div>
            </div>
            <aside className={styles.metaCard}>
              <div className={styles.metaRow}><span>Client</span><strong>{project.clientName || '—'}</strong></div>
              <div className={styles.metaRow}><span>Completed</span><strong>{formattedDate}</strong></div>
              {project.projectLength && (<div className={styles.metaRow}><span>Timeline</span><strong>{project.projectLength}</strong></div>)}
              {project.projectUrl && (
                <div className={styles.metaRow}><span>Live</span><a href={project.projectUrl} target="_blank" rel="noopener noreferrer">Visit site</a></div>
              )}
              {project.industry && (<div className={styles.metaRow}><span>Industry</span><strong>{project.industry}</strong></div>)}
              {project.companyStage && (<div className={styles.metaRow}><span>Company Stage</span><strong>{project.companyStage}</strong></div>)}
              {project.fundingRaised && (<div className={styles.metaRow}><span>Funding Raised</span><strong>{project.fundingRaised}</strong></div>)}
              {project.location && (<div className={styles.metaRow}><span>Location</span><strong>{project.location}</strong></div>)}
            </aside>
          </div>
        </section>

        <section className={styles.docSection}>
          <p className={styles.kicker}>Objectives</p>
          <div className={styles.body}><p>{project.projectGoal}</p></div>
        </section>

        {(project.targetAudience || project.whyNow || project.marketSize || project.industryTrends || project.competitiveLandscape) && (
          <section className={styles.docSection}>
            <p className={styles.kicker}>Market & Opportunity</p>
            {project.marketSize && (<div className={styles.body}><p><strong>Market size</strong>: {project.marketSize}</p></div>)}
            {project.industryTrends && (<div className={styles.body}><p><strong>Industry trends</strong>: {project.industryTrends}</p></div>)}
            {project.competitiveLandscape && (<div className={styles.body}><p><strong>Competitive landscape</strong>: {project.competitiveLandscape}</p></div>)}
            {project.targetAudience && (<div className={styles.body}><p><strong>Target audience</strong>: {project.targetAudience}</p></div>)}
            {project.whyNow && (<div className={styles.body}><p><strong>Why now</strong>: {project.whyNow}</p></div>)}
          </section>
        )}

        {/* De-emphasized preview: full-bleed image with soft center fade */}
        <section className={styles.websitePreviewSection}>
          <h2 className={styles.centeredSectionTitle}>Case Study</h2>
          <p className={styles.centeredDescription}>A minimal, high-focus overview of the craft behind {project.title}.</p>
          <div className={styles.websitePreviewWrapper}>
            <Image
              src={heroImageUrl}
              alt={`${project.title} preview`}
              fill
              sizes="100vw"
              className={styles.heroImage}
              priority={false}
            />
          </div>
        </section>

        {/* Solution Section -> Approach */}
        <section className={styles.solutionFeaturesSection}>
          <div className={styles.solutionText}>
            <h2 className={styles.sectionTitle}>Approach</h2>
            <div className={styles.sectionText}>
              <p>{project.solution}</p>
            </div>
          </div>
          
          <div className={styles.solutionFeatures}>
            <div className={styles.solutionVideo}>
              <Image 
                src={heroImageUrl}
                alt={`${project.title} solution visual`}
                fill
                sizes="100vw"
                className={styles.heroImage}
                priority={false}
              />
            </div>
            
            {project.keyFeatures && project.keyFeatures.length > 0 && (
              <ul className={styles.featureList}>
                {project.keyFeatures.map((feature, index) => (
                  <li key={index} className={styles.featureItem}>{feature}</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {(project.challenges || project.results) && (
          <section className={styles.docSection}>
            {project.challenges && (
              <>
                <p className={styles.kicker}>Challenges</p>
                <div className={styles.body}><p>{project.challenges}</p></div>
              </>
            )}
            {project.results && (
              <>
                <p className={styles.kicker}>Results</p>
                <div className={styles.body}><p>{project.results}</p></div>
              </>
            )}
          </section>
        )}

        {(project.fundingAndPartnerImpact || (project.strategicPartnerships && project.strategicPartnerships.length) || (project.accelerators && project.accelerators.length) || project.valuationChange) && (
          <section className={styles.docSection}>
            <p className={styles.kicker}>Funding & Partner Impact</p>
            {project.fundingAndPartnerImpact && (<div className={styles.body}><p>{project.fundingAndPartnerImpact}</p></div>)}
            {project.valuationChange && (<div className={styles.body}><p><strong>Valuation</strong>: {project.valuationChange}</p></div>)}
            {project.strategicPartnerships && project.strategicPartnerships.length > 0 && (
              <div className={styles.stackRow}>
                {project.strategicPartnerships.map((p, i) => (<span key={i} className={styles.stackTag}>{p}</span>))}
              </div>
            )}
            {project.accelerators && project.accelerators.length > 0 && (
              <div className={styles.stackRow}>
                {project.accelerators.map((a, i) => (<span key={i} className={styles.stackTag}>{a}</span>))}
              </div>
            )}
          </section>
        )}

        {(project.investorLogos && project.investorLogos.length > 0) || (project.mediaCoverage && project.mediaCoverage.length > 0) || (project.awards && project.awards.length > 0) ? (
          <section className={styles.docSection}>
            <p className={styles.kicker}>Credibility</p>
            {project.investorLogos && project.investorLogos.length > 0 && (
              <div className={styles.stackRow}>
                {project.investorLogos.map((logo, i) => (
                  <img key={i} src={logo} alt={`logo-${i}`} style={{ height: 28, width: 'auto', opacity: 0.8 }} />
                ))}
              </div>
            )}
            {project.mediaCoverage && project.mediaCoverage.length > 0 && (
              <div className={styles.body}>
                <ul>
                  {project.mediaCoverage.map((m, i) => (
                    <li key={i}><a href={m.url} target="_blank" rel="noopener noreferrer">{m.title || m.url}</a></li>
                  ))}
                </ul>
              </div>
            )}
            {project.awards && project.awards.length > 0 && (
              <div className={styles.stackRow}>
                {project.awards.map((award, i) => (<span key={i} className={styles.stackTag}>{award}</span>))}
              </div>
            )}
          </section>
        ) : null}

        {project.founderStory && (
          <section className={styles.docSection}>
            <p className={styles.kicker}>Founder story</p>
            <div className={styles.body}><p>{project.founderStory}</p></div>
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

        {(project.scalability || project.defensibility || project.barriersToEntry || project.techAdvantages) && (
          <section className={styles.docSection}>
            <p className={styles.kicker}>Scalability & Defensibility</p>
            {project.scalability && (<div className={styles.body}><p><strong>Scalability</strong>: {project.scalability}</p></div>)}
            {project.defensibility && (<div className={styles.body}><p><strong>Defensibility</strong>: {project.defensibility}</p></div>)}
            {project.barriersToEntry && (<div className={styles.body}><p><strong>Barriers to entry</strong>: {project.barriersToEntry}</p></div>)}
            {project.techAdvantages && (<div className={styles.body}><p><strong>Tech advantages</strong>: {project.techAdvantages}</p></div>)}
          </section>
        )}

        {(project.ctaText || project.ctaLink) && (
          <section className={styles.docSection}>
            <div className={styles.body}>
              <p>{project.ctaText}</p>
              {project.ctaLink && (<p><a href={project.ctaLink} target="_blank" rel="noopener noreferrer">Learn more →</a></p>)}
            </div>
          </section>
        )}

      </div>
    </article>
  );
} 