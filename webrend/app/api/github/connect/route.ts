import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '../../../lib/firebase-admin';

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_URL}/api/github/callback`;

export async function GET(request: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the session cookie to get the user
    const decodedClaims = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedClaims.uid;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Generate a random state parameter to prevent CSRF attacks
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
    
    // GitHub OAuth authorization URL
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.append('client_id', GITHUB_CLIENT_ID || '');
    githubAuthUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    githubAuthUrl.searchParams.append('scope', 'read:user repo'); // Adjust scopes as needed
    githubAuthUrl.searchParams.append('state', state);
    
    return NextResponse.redirect(githubAuthUrl);
  } catch (error) {
    console.error('GitHub connect error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to GitHub' },
      { status: 500 }
    );
  }
} 