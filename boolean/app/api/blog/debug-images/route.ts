import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';

export async function GET() {
  try {
    // Fetch all articles to check their image URLs
    const articlesSnapshot = await db.collection('articles')
      .orderBy('publishedAt', 'desc')
      .limit(10)
      .get();

    if (articlesSnapshot.empty) {
      return NextResponse.json({ 
        articles: [],
        message: 'No articles found' 
      });
    }

    const articleImageData = articlesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || 'Untitled',
        imageUrl: data.imageUrl || '',
        category: data.category || 'Uncategorized',
        hasGoogleUrl: (data.imageUrl || '').includes('google.com'),
        urlDomain: data.imageUrl ? new URL(data.imageUrl).hostname : 'no-url'
      };
    });

    return NextResponse.json({ 
      articles: articleImageData,
      totalArticles: articlesSnapshot.size,
      googleUrlCount: articleImageData.filter(a => a.hasGoogleUrl).length
    });
  } catch (error) {
    console.error('Error fetching article image data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article image data: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 