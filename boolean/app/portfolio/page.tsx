// Server component (no 'use client' directive)
import { db } from '../lib/firebase-admin';
import PortfolioClientPage from './components/PortfolioClientPage';
import { DocumentData, Timestamp } from 'firebase-admin/firestore';

// Define the type for our data - make it match the client component
interface PortfolioProject {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  projectUrl?: string;
  tags: string[];
  projectType?: string | null;
  projectTypes?: string[];
  dateCompleted: Date;
  featured: boolean;
  inProgress?: boolean;
}

// Server-side data fetching
async function getPortfolioProjects(): Promise<PortfolioProject[]> {
  try {
    // Fetch all portfolio projects, ordered by dateCompleted descending
    const projectsSnapshot = await db.collection('portfolioProjects')
      .orderBy('dateCompleted', 'desc')
      .get();

    if (projectsSnapshot.empty) {
      return [];
    }

    // Convert the Firestore data to our PortfolioProject type
    return projectsSnapshot.docs.map((doc: DocumentData) => {
      const data = doc.data();
      
      // Handle Firestore timestamp conversion
      let dateCompleted = data.dateCompleted;
      if (dateCompleted instanceof Timestamp) {
        dateCompleted = dateCompleted.toDate();
      }
      
      return {
        id: doc.id,
        slug: data.slug || doc.id,
        title: data.title || 'Untitled Project',
        description: data.description || '',
        imageUrl: data.imageUrl || '/images/placeholder.png',
        tags: data.tags || [],
        projectUrl: data.projectUrl || null,
        projectType: data.projectType || null,
        projectTypes: Array.isArray(data.projectTypes) ? data.projectTypes : [],
        dateCompleted: dateCompleted instanceof Date ? dateCompleted : new Date(),
        featured: data.featured || false,
        inProgress: !!data.inProgress,
      } as PortfolioProject;
    });
  } catch (error) {
    console.error('Error fetching portfolio projects:', error);
    return []; // Return empty array in case of error
  }
}

// Extract unique tags from projects
function extractTags(projects: PortfolioProject[]): string[] {
  const allTags = new Set<string>();
  
  projects.forEach((project: PortfolioProject) => {
    project.tags.forEach(tag => {
      allTags.add(tag);
    });
  });
  
  return Array.from(allTags);
}

export default async function Portfolio() {
  // Fetch data on the server
  const projects = await getPortfolioProjects();
  
  // Remove featured concept; show all projects in grid
  const featuredProject = null;
  const nonFeaturedProjects = projects;
  
  // Get unique tags for filtering
  const allTags = extractTags(projects);
  
  // Pass data to the client component
  return (
    <PortfolioClientPage 
      initialProjects={nonFeaturedProjects}
      featuredProject={featuredProject}
      allTags={allTags}
    />
  );
} 