import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth, db } from '../../../lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get the session cookie for authentication
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the session cookie to get the user
    let decodedClaims;
    try {
      decodedClaims = await auth.verifySessionCookie(sessionCookie);
    } catch (sessionError) {
      console.error('Failed to verify session:', sessionError);
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }
    
    const userId = decodedClaims.uid;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid session (no userId)' },
        { status: 401 }
      );
    }

    // Get user data from Firebase Auth
    const userRecord = await auth.getUser(userId);
    
    // Get user data from Firestore
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
    const userData = userDoc.exists ? userDoc.data() : {};
    
    // Return the user data
    return NextResponse.json({
      auth: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        emailVerified: userRecord.emailVerified,
        createdAt: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
      },
      firestore: userData
    });
    
  } catch (error) {
    console.error('Error fetching user data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 