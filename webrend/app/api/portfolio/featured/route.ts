import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';

// Define the structure of a Portfolio Project
interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  projectUrl?: string;
  dateCompleted: number | Date; // Firestore timestamp will be converted
  featured: boolean;
}

// Firestore Timestamp conversion type
type FirestoreTimestamp = {
  toDate: () => Date;
};

export async function GET() {
  try {
    // Fetch featured portfolio projects, ordered by date descending, limit to 4
    const projectsSnapshot = await db.collection('portfolioProjects')
      .where('featured', '==', true)
      .orderBy('dateCompleted', 'desc')
      .limit(4) // Show up to 4 featured projects on the homepage
      .get();

    if (projectsSnapshot.empty) {
      return NextResponse.json({ projects: [] });
    }

    const projects = projectsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Handle Firestore timestamp conversion
      let dateCompleted = data.dateCompleted;
      if (typeof dateCompleted === 'object' && dateCompleted?.toDate) {
        dateCompleted = (dateCompleted as FirestoreTimestamp).toDate();
      }
      
      return {
        id: doc.id,
        title: data.title || 'Untitled Project',
        description: data.description || '',
        imageUrl: data.imageUrl || '/images/placeholder.png', // Provide a default placeholder
        tags: data.tags || [],
        projectUrl: data.projectUrl || null,
        dateCompleted,
        featured: data.featured || false,
      } as PortfolioProject;
    });

    return NextResponse.json({ projects });

  } catch (error) {
    console.error('Error fetching featured portfolio projects:', error);
    
    // Basic check for indexing errors - log URL if found
    const errorString = String(error);
    if (errorString.includes('https://console.firebase.google.com/')) {
      const indexUrlMatch = errorString.match(/(https:\/\/console\.firebase\.google\.com\/[^\s"]+)/);
      if (indexUrlMatch && indexUrlMatch[1]) {
        console.log('\n\n---\n⚠️ FIREBASE INDEX NEEDED (Portfolio Projects) ⚠️\n---');
        console.log(`Firestore requires an index for this query. Please create it:`);
        console.log(indexUrlMatch[1].replace(/\\n/g, '').replace(/\\"/g, '"'));
        console.log('---\n\n');
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch featured portfolio projects', message: errorString },
      { status: 500 }
    );
  }
} 