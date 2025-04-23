#!/usr/bin/env node

/**
 * This script checks the Firebase configuration to help troubleshoot
 * why articles aren't showing up on the blog page
 */

import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Loading environment from: ${envPath}`);
dotenv.config({ path: envPath });

// Print Firebase configuration
console.log('\n==== FIREBASE CONFIGURATION ====');
console.log('PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Not set');
console.log('PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅ Set' : '❌ Not set');
console.log('STORAGE_BUCKET:', process.env.FIREBASE_STORAGE_BUCKET);

// Check for separate Firebase client configs
console.log('\n==== FIREBASE CLIENT CONFIG ====');
console.log('NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Not set');
console.log('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Not set');
console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set');

// Compare projects
if (process.env.FIREBASE_PROJECT_ID && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  const adminProject = process.env.FIREBASE_PROJECT_ID;
  const clientProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  
  if (adminProject !== clientProject) {
    console.log('\n⚠️ WARNING: DIFFERENT PROJECT IDs DETECTED ⚠️');
    console.log(`Admin SDK uses: ${adminProject}`);
    console.log(`Client SDK uses: ${clientProject}`);
    console.log('This may be why articles aren\'t showing up in the blog!');
  } else {
    console.log('\n✅ Same project ID used for both Admin and Client SDKs');
  }
}

// Initialize Firebase admin
try {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey
  };

  if (!admin.apps.length) {
    console.log('\nInitializing Firebase Admin...');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized successfully');
  }

  const db = admin.firestore();
  
  // Check the articles collection
  console.log('\n==== CHECKING ARTICLES COLLECTION ====');
  const articlesSnapshot = await db.collection('articles').get();
  
  console.log(`Total articles in collection: ${articlesSnapshot.size}`);
  
  if (articlesSnapshot.empty) {
    console.log('❌ No articles found in the Firebase collection');
    console.log('\nPossible reasons:');
    console.log('1. Article generation script failed to save to Firestore');
    console.log('2. Articles are being saved to a different Firebase project');
    console.log('3. Articles are being saved to a different collection name');
  } else {
    console.log('✅ Articles found in the collection:');
    articlesSnapshot.docs.forEach((doc, i) => {
      const data = doc.data();
      console.log(`[${i+1}] ID: ${doc.id}`);
      console.log(`    Title: ${data.title || 'No title'}`);
      console.log(`    Published: ${data.publishedAt?.toDate?.() || data.publishedAt || 'No date'}`);
      console.log(`    Collection path: articles/${doc.id}`);
      console.log('---');
    });
  }
  
  // Create a test article to verify write access
  console.log('\n==== TESTING FIRESTORE WRITE ACCESS ====');
  try {
    const testDocRef = await db.collection('articles').add({
      title: "TEST ARTICLE - Please delete me",
      description: "This is a test article created to verify Firestore write access",
      content: "Test content",
      publishedAt: new Date(),
      category: "Test",
      readTime: 1,
      slug: "test-article-" + Date.now(),
      sourceUrl: "https://example.com"
    });
    
    console.log(`✅ Successfully created test article with ID: ${testDocRef.id}`);
    console.log('If this test article appears in your blog but others don\'t,');
    console.log('the issue may be with the article format or the query parameters.');

    // Delete the test article to clean up
    await testDocRef.delete();
    console.log('✅ Test article deleted successfully');
  } catch (error) {
    console.error('❌ Failed to create/delete test article:', error);
    console.log('This suggests the blog page may not have write access to Firestore.');
  }
  
} catch (error) {
  console.error('\n❌ Error initializing Firebase or accessing Firestore:', error);
}

console.log('\n==== RECOMMENDATIONS ====');
console.log('1. Make sure the Firebase project ID is the same in both news-scraper.ts and firebase-admin.ts');
console.log('2. Check that your Firestore database has the "articles" collection');
console.log('3. Verify that the article format in news-scraper.ts matches what the blog page expects');
console.log('4. Create the necessary Firestore indexes if mentioned in any error messages'); 