import { auth } from '../lib/firebase-admin';
import { cookies } from 'next/headers';

/**
 * Verify user authentication from cookies
 * @returns Firebase user object or null if not authenticated
 */
export async function verifyUser() {
  try {
    const cookieStore = cookies();
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
    console.error('Error verifying user authentication:', error);
    return null;
  }
} 