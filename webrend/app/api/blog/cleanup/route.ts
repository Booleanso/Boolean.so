import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';

// This API route removes all articles from the database
export async function GET(request: Request) {
  try {
    // Get all articles
    const articlesSnapshot = await db.collection('articles').get();
      
    if (articlesSnapshot.empty) {
      return NextResponse.json({ 
        message: 'No articles found in the database' 
      });
    }
    
    // Delete all articles
    const deletePromises = articlesSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
    
    return NextResponse.json({ 
      message: `Successfully removed all ${articlesSnapshot.size} articles from the database` 
    });
  } catch (error) {
    console.error('Error removing articles:', error);
    return NextResponse.json(
      { error: 'Failed to remove articles: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 