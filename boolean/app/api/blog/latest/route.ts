import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';

interface Article {
  id: string;
  title: string;
  description: string;
  publishedAt: number | Date;
  imageUrl?: string;
  category: string;
  readTime: number;
  slug?: string;
}

// For Firestore timestamp conversion
type FirestoreTimestamp = {
  toDate: () => Date;
};

export async function GET() {
  try {
    // Fetch the latest articles
    const articlesSnapshot = await db!.collection('articles')
      .orderBy('publishedAt', 'desc')
      .limit(3) // Limit to 3 latest articles
      .get();

    if (articlesSnapshot.empty) {
      return NextResponse.json({ 
        articles: [],
        message: 'No articles found' 
      });
    }

    const articles = articlesSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Handle Firestore timestamp conversion
      let publishedAt = data.publishedAt;
      if (typeof publishedAt === 'object' && publishedAt?.toDate) {
        publishedAt = (publishedAt as FirestoreTimestamp).toDate();
      }
      
      // Generate a slug from title if it doesn't exist
      let slug = data.slug;
      if (!slug && data.title) {
        slug = data.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
      }
      
      return {
        id: doc.id,
        title: data.title || 'Untitled',
        description: data.description || '',
        publishedAt,
        imageUrl: data.imageUrl || '',
        category: data.category || 'Uncategorized',
        readTime: data.readTime || 5,
        slug: slug || doc.id
      } as Article;
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Error fetching latest articles:', error);
    
    // Handle the case where the query fails due to missing index
    const errorString = String(error);
    if (errorString.includes('https://console.firebase.google.com/')) {
      const indexUrlMatch = errorString.match(/(https:\/\/console\.firebase\.google\.com\/[^\s"]+)/);
      if (indexUrlMatch && indexUrlMatch[1]) {
        console.log('\n\n-------------------------------------------');
        console.log('⚠️ FIREBASE INDEX NEEDED');
        console.log('-------------------------------------------');
        console.log('Please create the required index by visiting:');
        console.log(indexUrlMatch[1].replace(/\\n/g, '').replace(/\\"/g, '"'));
        console.log('-------------------------------------------\n\n');
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch latest blog posts', message: errorString },
      { status: 500 }
    );
  }
} 