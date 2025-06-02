// /api/lib/firebase-admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

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

let app: any = null;
let db: any = null;
let auth: any = null;
let storage: any = null;

if (hasValidFirebaseConfig) {
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
    console.warn('Firebase Admin initialization failed. Running in fallback mode:', error);
    if (hasValidFirebaseConfig) {
      console.warn('This is expected if Firebase environment variables are not properly configured.');
    }
  }
}

// Create mock implementations for when Firebase is not available
const mockFirestore = {
  collection: () => ({
    doc: () => ({
      get: () => Promise.resolve({ exists: false, data: () => null }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      delete: () => Promise.resolve(),
    }),
    add: () => Promise.resolve({ id: 'mock-id' }),
    get: () => Promise.resolve({ docs: [], empty: true }),
    where: () => mockFirestore.collection(),
    orderBy: () => mockFirestore.collection(),
    limit: () => mockFirestore.collection(),
  }),
  doc: () => mockFirestore.collection().doc(),
  runTransaction: (callback: any) => Promise.resolve(callback({ 
    get: () => Promise.resolve({ exists: false }), 
    set: () => {}, 
    update: () => {}, 
    delete: () => {} 
  })),
};

const mockAuth = {
  verifySessionCookie: () => Promise.reject(new Error('Firebase Auth not configured')),
  getUser: () => Promise.reject(new Error('Firebase Auth not configured')),
  createSessionCookie: () => Promise.reject(new Error('Firebase Auth not configured')),
  verifyIdToken: () => Promise.reject(new Error('Firebase Auth not configured')),
};

const mockStorage = {
  bucket: () => ({
    file: () => ({
      save: () => Promise.resolve(),
      download: () => Promise.reject(new Error('Firebase Storage not configured')),
      delete: () => Promise.resolve(),
      getSignedUrl: () => Promise.reject(new Error('Firebase Storage not configured')),
    }),
  }),
};

// Export either real Firebase instances or mocks
const finalDb = db || mockFirestore;
const finalAuth = auth || mockAuth;
const finalStorage = storage || mockStorage;

export { 
  finalDb as db, 
  finalAuth as auth, 
  finalStorage as storage,
  hasValidFirebaseConfig 
};

// Helper function to check if Firebase is properly configured
export function isFirebaseConfigured(): boolean {
  return hasValidFirebaseConfig;
}