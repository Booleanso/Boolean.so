#!/usr/bin/env node

import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Initialize Firebase admin
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: privateKey
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Query articles collection and print results
console.log('==== CHECKING ARTICLES IN FIRESTORE ====');
console.log('Using project ID:', process.env.FIREBASE_PROJECT_ID);

db.collection('articles').get()
  .then(snapshot => {
    console.log(`Total articles: ${snapshot.size}`);
    if (snapshot.empty) {
      console.log('No articles found in the database');
    } else {
      snapshot.docs.forEach((doc, i) => {
        const data = doc.data();
        console.log(`[${i+1}] ID: ${doc.id}`);
        console.log(`    Title: ${data.title}`);
        console.log(`    Published: ${data.publishedAt?.toDate?.() || data.publishedAt}`);
        console.log(`    Slug: ${data.slug}`);
        console.log('---');
      });
    }
  })
  .catch(error => {
    console.error('Error fetching articles:', error);
  }); 