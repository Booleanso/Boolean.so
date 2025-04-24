import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';

// Re-use the interface definition
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

type FirestoreTimestamp = {
  toDate: () => Date;
};

export async function GET() {
  try {
    // Fetch all portfolio projects, ordered by date descending
    const projectsSnapshot = await db.collection('portfolioProjects')
      .orderBy('dateCompleted', 'desc')
      .get();

    if (projectsSnapshot.empty) {
      return NextResponse.json({ projects: [] });
    }

    const projects = projectsSnapshot.docs.map(doc => {
      const data = doc.data();
      let dateCompleted = data.dateCompleted;
      if (typeof dateCompleted === 'object' && dateCompleted?.toDate) {
        dateCompleted = (dateCompleted as FirestoreTimestamp).toDate();
      }
      
      return {
        id: doc.id,
        title: data.title || 'Untitled Project',
        description: data.description || '',
        imageUrl: data.imageUrl || '/images/placeholder.png',
        tags: data.tags || [],
        projectUrl: data.projectUrl || null,
        dateCompleted,
        featured: data.featured || false,
      } as PortfolioProject;
    });

    return NextResponse.json({ projects });

  } catch (error) {
    console.error('Error fetching all portfolio projects:', error);
    const errorString = String(error);
    // Log index error if needed
    if (errorString.includes('https://console.firebase.google.com/')) {
      const indexUrlMatch = errorString.match(/(https:\/\/console\.firebase\.google\.com\/[^\s"]+)/);
      if (indexUrlMatch && indexUrlMatch[1]) {
        console.log('\n\n---\n⚠️ FIREBASE INDEX NEEDED (Portfolio Projects - All) ⚠️\n---');
        console.log(`Firestore requires an index for this query. Please create it:`);
        console.log(indexUrlMatch[1].replace(/\\n/g, '').replace(/\\"/g, '"'));
        console.log('---\n\n');
      }
    }
    return NextResponse.json(
      { error: 'Failed to fetch portfolio projects', message: errorString },
      { status: 500 }
    );
  }
} 