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

    // Get the profile data to update
    const profileData = await request.json();
    
    if (!profileData || typeof profileData !== 'object') {
      return NextResponse.json(
        { error: 'Profile data is required' },
        { status: 400 }
      );
    }
    
    // Add a timestamp
    const dataToUpdate = {
      ...profileData,
      updatedAt: new Date().toISOString()
    };
    
    // 1. Update Firestore - store profile data
    await db.collection('users').doc(userId).set(dataToUpdate, { merge: true });
    
    // 2. Update Auth Profile - update the displayName if provided
    if (profileData.username) {
      try {
        await auth.updateUser(userId, {
          displayName: profileData.username
        });
      } catch (authUpdateError) {
        console.warn('Could not update Auth profile, but Firestore was updated:', authUpdateError);
        // Continue even if auth update fails - Firestore is our source of truth
      }
    }
    
    // Update succeeded
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: dataToUpdate
    });
    
  } catch (error) {
    console.error('Error updating profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 