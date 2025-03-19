import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth, db } from '../../../lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      console.log('GitHub status: No session cookie found');
      return NextResponse.json(
        { error: 'Authentication required', connected: false },
        { status: 401 }
      );
    }
    
    // Verify the session cookie to get the user
    const decodedClaims = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedClaims.uid;
    
    if (!userId) {
      console.log('GitHub status: Invalid session (no userId)');
      return NextResponse.json(
        { error: 'Invalid session', connected: false },
        { status: 401 }
      );
    }

    console.log(`GitHub status: Checking status for user ${userId}`);

    // Get the user document to check GitHub connection
    const userDoc = await db.collection('customers').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log(`GitHub status: User document not found for ${userId}`);
      return NextResponse.json({
        connected: false,
        githubUsername: null,
        githubAvatarUrl: null,
        githubProfileUrl: null,
        githubConnectedAt: null
      });
    }
    
    const userData = userDoc.data() || {};
    console.log(`GitHub status: User data fetched, github username: ${userData.githubUsername || 'none'}`);
    
    // Check if the user has a GitHub connection
    const isConnected = !!userData.githubUsername;
    
    return NextResponse.json({
      connected: isConnected,
      githubUsername: userData.githubUsername || null,
      githubAvatarUrl: userData.githubAvatarUrl || null,
      githubProfileUrl: userData.githubProfileUrl || null,
      githubConnectedAt: userData.githubConnectedAt || null
    });
  } catch (error) {
    console.error('GitHub status check error:', error);
    // Return a more descriptive error for debugging
    return NextResponse.json(
      { 
        error: 'Failed to check GitHub connection status', 
        message: error instanceof Error ? error.message : 'Unknown error',
        connected: false
      },
      { status: 500 }
    );
  }
} 