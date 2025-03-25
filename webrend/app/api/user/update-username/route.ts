import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth, db } from '../../../lib/firebase-admin';

export async function POST(request: NextRequest) {
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

    // Get the requested username from the request body
    const { username } = await request.json();
    
    if (!username || typeof username !== 'string' || username.trim() === '') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }
    
    // Remove any @ symbol that might have been submitted and convert to lowercase
    const cleanUsername = username.replace('@', '').toLowerCase().trim();
    
    // Check if username contains only allowed characters (Instagram-like standards)
    // Allow only letters, numbers, periods, and underscores
    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, underscores, and periods' },
        { status: 400 }
      );
    }
    
    // Check if username is between 3 and 30 characters (common standard)
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return NextResponse.json(
        { error: 'Username must be between 3 and 30 characters long' },
        { status: 400 }
      );
    }
    
    // Check if username doesn't start or end with a period (Instagram-like rule)
    if (cleanUsername.startsWith('.') || cleanUsername.endsWith('.')) {
      return NextResponse.json(
        { error: 'Username cannot start or end with a period' },
        { status: 400 }
      );
    }
    
    // Check if username doesn't contain consecutive periods (Instagram-like rule)
    if (cleanUsername.includes('..')) {
      return NextResponse.json(
        { error: 'Username cannot contain consecutive periods' },
        { status: 400 }
      );
    }
    
    // Check if username is already taken by another user
    const usernameQuery = await db.collection('users')
      .where('username', '==', cleanUsername)
      .get();
      
    // If there are results and none of them belong to the current user, username is taken
    if (!usernameQuery.empty) {
      const isUsernameOwnedByCurrentUser = usernameQuery.docs.some(doc => doc.id === userId);
      
      if (!isUsernameOwnedByCurrentUser) {
        return NextResponse.json(
          { error: 'This username is already taken. Please choose a different one.' },
          { status: 409 } // Conflict
        );
      }
    }
    
    // 1. Update Firestore - store the username
    await db.collection('users').doc(userId).set({
      username: cleanUsername,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    // 2. Update Auth Profile - update the displayName
    try {
      await auth.updateUser(userId, {
        displayName: cleanUsername
      });
    } catch (authUpdateError) {
      console.warn('Could not update Auth profile, but Firestore was updated:', authUpdateError);
      // Continue even if auth update fails - Firestore is our source of truth
    }
    
    // Update succeeded
    return NextResponse.json({
      success: true,
      username: cleanUsername
    });
    
  } catch (error) {
    console.error('Error updating username:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 