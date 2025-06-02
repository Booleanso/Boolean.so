// lib/firebase-client.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Check if we have valid Firebase client configuration
const hasValidFirebaseClientConfig = !!(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'fallback-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'webrend-fallback.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'webrend-fallback',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'webrend-fallback.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef123456',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-ABCDEF1234'
};

let app: any = null;
let firebaseAuth: any = null;
let firebaseDb: any = null;
let firebaseStorage: any = null;

// Only initialize Firebase if we have valid configuration
if (hasValidFirebaseClientConfig) {
  try {
    // Initialize Firebase
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

    // Get Firebase services
    firebaseAuth = getAuth(app);
    firebaseDb = getFirestore(app);
    firebaseStorage = getStorage(app);
  } catch (error) {
    console.warn('Firebase client initialization failed. Running in fallback mode:', error);
  }
}

// Create mock implementations for when Firebase is not available
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: (callback: any) => {
    callback(null);
    return () => {}; // unsubscribe function
  },
  signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase Auth not configured')),
  signOut: () => Promise.reject(new Error('Firebase Auth not configured')),
  createUserWithEmailAndPassword: () => Promise.reject(new Error('Firebase Auth not configured')),
};

const mockFirestore = {
  collection: () => ({
    doc: () => ({
      get: () => Promise.resolve({ exists: false, data: () => null }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      delete: () => Promise.resolve(),
      onSnapshot: (callback: any) => {
        callback({ exists: false, data: () => null });
        return () => {}; // unsubscribe function
      },
    }),
    add: () => Promise.resolve({ id: 'mock-id' }),
    get: () => Promise.resolve({ docs: [], empty: true }),
    where: () => mockFirestore.collection(),
    orderBy: () => mockFirestore.collection(),
    limit: () => mockFirestore.collection(),
    onSnapshot: (callback: any) => {
      callback({ docs: [], empty: true });
      return () => {}; // unsubscribe function
    },
  }),
  doc: () => mockFirestore.collection().doc(),
};

const mockStorage = {
  ref: () => ({
    put: () => Promise.reject(new Error('Firebase Storage not configured')),
    putString: () => Promise.reject(new Error('Firebase Storage not configured')),
    getDownloadURL: () => Promise.reject(new Error('Firebase Storage not configured')),
    delete: () => Promise.resolve(),
  }),
};

// Create final exports with fallbacks
const auth = firebaseAuth || mockAuth;
const db = firebaseDb || mockFirestore;
const storage = firebaseStorage || mockStorage;

// Export with proper syntax
export { 
  auth, 
  db, 
  storage,
  hasValidFirebaseClientConfig
};

// Helper function to check if Firebase client is properly configured
export function isFirebaseClientConfigured(): boolean {
  return hasValidFirebaseClientConfig;
}