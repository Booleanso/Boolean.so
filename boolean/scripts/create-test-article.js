#!/usr/bin/env node

/**
 * This script creates a test article directly in Firestore
 * to verify that the blog page can display articles properly
 */

import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Loading environment from: ${envPath}`);
dotenv.config({ path: envPath });

// Initialize Firebase admin
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: privateKey
};

console.log(`Using Firebase Project ID: ${process.env.FIREBASE_PROJECT_ID}`);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized successfully');
}

const db = admin.firestore();

// Create a test article
async function createTestArticle() {
  try {
    // Create unique title and slug
    const timestamp = Date.now();
    const title = `Test Article ${timestamp}`;
    const slug = `test-article-${timestamp}`;
    
    console.log(`Creating test article: "${title}"`);
    
    // Test article data
    const article = {
      title: title,
      description: "This is a test article created to verify articles are properly displayed on the blog page",
      content: `
# Test Article
      
This is a test article created programmatically to verify that articles can be displayed on the blog page.

## What's Included

- Test content
- Formatted with Markdown
- Published with the current timestamp
- Has all required fields

## Next Steps

If this article appears on your blog page, it means the issue is with the article generation process,
not with the Firebase connection or the blog page itself. You'll need to add valid API keys for either:

1. NewsAPI (https://newsapi.org/)
2. GNews (https://gnews.io/)

Add your API key to the .env.local file as either:
- NEWS_API_KEY=your_key_here
- GNEWS_API_KEY=your_key_here
      `,
      publishedAt: new Date(),
      imageUrl: "https://source.unsplash.com/random/1200x630/?technology",
      category: "Test",
      readTime: 3,
      slug: slug,
      sourceUrl: "https://example.com"
    };
    
    // Check if a document with this slug already exists
    const existingDocs = await db.collection('articles')
      .where('slug', '==', slug)
      .limit(1)
      .get();
    
    if (!existingDocs.empty) {
      console.log(`Article with slug "${slug}" already exists. Skipping creation.`);
      return existingDocs.docs[0].id;
    }
    
    // Add the article to Firestore
    const docRef = await db.collection('articles').add(article);
    console.log(`✅ Test article created successfully with ID: ${docRef.id}`);
    console.log('Article data:', JSON.stringify({
      title: article.title,
      publishedAt: article.publishedAt.toISOString(),
      slug: article.slug,
      category: article.category
    }, null, 2));
    
    console.log('\nPlease check your blog page to see if this article appears.');
    console.log('If it does, you need to add a NEWS_API_KEY or GNEWS_API_KEY to your .env.local file.');
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating test article:', error);
    throw error;
  }
}

// Run the function
createTestArticle().catch(console.error); 