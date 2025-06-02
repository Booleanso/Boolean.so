import { auth, hasValidFirebaseConfig } from '../lib/firebase-admin';
import { cookies } from 'next/headers';

// Define a type for the simplified user data needed by the client
export type SimpleUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
} | null;

/**
 * Verify user authentication from cookies
 * @returns Firebase user object or null if not authenticated
 */
export async function verifyUser() {
  try {
    // Check if Firebase is properly configured
    if (!hasValidFirebaseConfig) {
      console.warn('Firebase is not configured. Authentication disabled.');
      return null;
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return null;
    }
    
    // Verify the session cookie
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    // Get the user record
    const user = await auth.getUser(decodedClaims.uid);
    
    return user;
  } catch (error) {
    // Log the error but don't throw - allow the app to continue loading
    console.warn('Error verifying user authentication:', error);
    return null;
  }
}

// Helper function to create the simplified user object
export function simplifyUser(user: import('firebase-admin/auth').UserRecord | null): SimpleUser {
  if (!user) {
    return null;
  }
  return {
    uid: user.uid,
    email: user.email || null,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
  };
}

// Helper function to check if authentication is available
export function isAuthenticationAvailable(): boolean {
  return hasValidFirebaseConfig;
} 