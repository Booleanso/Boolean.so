import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth, db } from '../../../lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('GitHub disconnect: Processing request');
    
    // Get the session cookie
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      console.log('GitHub disconnect: No session cookie found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the session cookie to get the user
    const decodedClaims = await auth!.verifySessionCookie(sessionCookie);
    const userId = decodedClaims.uid;
    
    if (!userId) {
      console.log('GitHub disconnect: Invalid session (no userId)');
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    console.log(`GitHub disconnect: Disconnecting GitHub for user ${userId}`);

    // Check if the user actually has GitHub connected
    const userDoc = await db.collection('customers').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log(`GitHub disconnect: User document not found for ${userId}`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const userData = userDoc.data();
    
    if (!userData?.githubAccessToken) {
      console.log(`GitHub disconnect: User ${userId} doesn't have GitHub connected`);
      return NextResponse.json(
        { error: 'GitHub not connected for this user' },
        { status: 400 }
      );
    }

    // Update the user document to remove GitHub info
    try {
      await db.collection('customers').doc(userId).update({
        githubId: null,
        githubUsername: null,
        githubAccessToken: null,
        githubTokenType: null,
        githubConnectedAt: null,
        githubAvatarUrl: null,
        githubProfileUrl: null,
        githubDisconnectedAt: new Date().toISOString()
      });
      
      console.log(`GitHub disconnect: Successfully disconnected GitHub for user ${userId}`);
      return NextResponse.json({ success: true, message: 'GitHub account successfully disconnected' });
    } catch (dbError) {
      console.error('GitHub disconnect: Database update error:', dbError);
      return NextResponse.json(
        { error: 'Failed to update user record', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('GitHub disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect from GitHub', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 