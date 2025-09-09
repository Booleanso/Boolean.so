import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';
import { DocumentData, Timestamp } from 'firebase-admin/firestore';

interface PortfolioProject {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  projectUrl?: string;
  projectType?: string | null;
  projectTypes?: string[];
  dateCompleted: Date;
  featured: boolean;
}

export async function GET() {
  try {
    // Fetch all portfolio projects, ordered by dateCompleted descending
    const projectsSnapshot = await db!.collection('portfolioProjects')
      .orderBy('dateCompleted', 'desc')
      .get();

    if (projectsSnapshot.empty) {
      return NextResponse.json([]);
    }

    // Convert the Firestore data to our PortfolioProject type
    const projects = projectsSnapshot.docs.map((doc: DocumentData) => {
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
      } as PortfolioProject;
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching portfolio projects:', error);
    
    // Log Firebase index error if needed
    const errorString = String(error);
    if (errorString.includes('https://console.firebase.google.com/')) {
      const indexUrlMatch = errorString.match(/(https:\/\/console\.firebase\.google\.com\/[^\s"]+)/);
      if (indexUrlMatch && indexUrlMatch[1]) {
        console.log('\n\n---\n⚠️ FIREBASE INDEX NEEDED (Portfolio API) ⚠️\n---');
        console.log(`Firestore requires an index for this query. Please create it:`);
        console.log(indexUrlMatch[1].replace(/\\n/g, '').replace(/\\"/g, '"'));
        console.log('---\n\n');
      }
    }
    
    return NextResponse.json([], { status: 500 });
  }
} 