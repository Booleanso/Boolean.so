// /api/lib/firebase-admin.ts
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';

// Environment variables with fallbacks
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'webrend-fallback';
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || 'fallback@webrend-fallback.iam.gserviceaccount.com';
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDFALLOAOFALLOA\n-----END PRIVATE KEY-----\n';
const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'webrend-fallback.appspot.com';

// Check if we have valid Firebase configuration
const hasValidFirebaseConfig = !!(
  process.env.FIREBASE_PROJECT_ID && 
  process.env.FIREBASE_CLIENT_EMAIL && 
  process.env.FIREBASE_PRIVATE_KEY && 
  process.env.FIREBASE_STORAGE_BUCKET
);

let app: App | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: Storage | null = null;

if (!hasValidFirebaseConfig) {
  console.error('Firebase configuration is missing!', {
    projectId: !!process.env.FIREBASE_PROJECT_ID,
    clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    storageBucket: !!process.env.FIREBASE_STORAGE_BUCKET
  });
  throw new Error('Firebase configuration is incomplete. Check your environment variables.');
}

try {
  const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

  const firebaseAdminConfig = {
    credential: cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    storageBucket: FIREBASE_STORAGE_BUCKET
  };

  /**
   * Gets or initializes the Firebase Admin app
   * @returns The Firebase Admin app instance
   */
  function getOrInitializeApp() {
    return !getApps().length ? initializeApp(firebaseAdminConfig) : getApps()[0];
  }

  app = getOrInitializeApp();
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
} catch (error) {
  console.error('Firebase Admin initialization FAILED:', error);
  console.error('Environment check:', {
    hasValidConfig: hasValidFirebaseConfig,
    projectId: !!process.env.FIREBASE_PROJECT_ID,
    clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    storageBucket: !!process.env.FIREBASE_STORAGE_BUCKET
  });
  throw error; // Don't silently fail
}

// Export real Firebase instances (guaranteed to exist or app would crash)
if (!db || !auth || !storage) {
  throw new Error('Firebase services failed to initialize');
}

export { 
  db, 
  auth, 
  storage,
  hasValidFirebaseConfig 
};

// Helper function to check if Firebase is properly configured
export function isFirebaseConfigured(): boolean {
  return hasValidFirebaseConfig;
}