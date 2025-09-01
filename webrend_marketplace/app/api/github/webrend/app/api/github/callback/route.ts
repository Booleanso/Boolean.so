import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '../../../lib/firebase-admin';

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_URL}/api/github/callback`;

export async function GET(request: NextRequest) {
  try {
    console.log('GitHub callback: Processing OAuth callback');
    
    // Get the authorization code and state from the query parameters
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    if (!code || !state) {
      console.error('GitHub callback: Missing code or state parameter');
      return NextResponse.redirect(new URL('/profile?error=github_auth_failed', request.url));
    }
    
    // Decode the state parameter to get the user ID
    let userId;
    try {
      const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = decodedState.userId;
      console.log(`GitHub callback: Decoded state, userId: ${userId}`);
    } catch (e) {
      console.error('GitHub callback: Failed to decode state parameter', e);
      return NextResponse.redirect(new URL('/profile?error=invalid_state_format', request.url));
    }
    
    if (!userId) {
      console.error('GitHub callback: No userId in state parameter');
      return NextResponse.redirect(new URL('/profile?error=invalid_state', request.url));
    }
    
    // Exchange the code for an access token
    console.log('GitHub callback: Exchanging code for access token');
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'WebRend-App'
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI
      })
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text().catch(() => '');
      console.error(`GitHub callback: Token exchange error: ${tokenResponse.status}`, errorText);
      return NextResponse.redirect(new URL(`/profile?error=github_token_failed&message=${encodeURIComponent(`HTTP ${tokenResponse.status}`)}`, request.url));
    }
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.error('GitHub callback: No access token in response', tokenData);
      return NextResponse.redirect(new URL('/profile?error=github_token_failed', request.url));
    }
    
    // Fetch the user's GitHub profile
    console.log('GitHub callback: Fetching user profile from GitHub API');
    let userResponse;

    // First try Bearer token authentication (preferred)
    userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'WebRend-App'
      }
    });

    // Track which auth method actually worked
    let authMethod = 'bearer';

    // If Bearer token fails, try with token authentication as fallback
    if (userResponse.status === 401) {
      console.log('GitHub callback: Bearer token failed, trying with token auth');
      userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'WebRend-App'
        }
      });
      
      if (userResponse.ok) {
        authMethod = 'token';
      }
    }

    if (!userResponse.ok) {
      const errorText = await userResponse.text().catch(() => '');
      console.error(`GitHub callback: User profile fetch error: ${userResponse.status}`, errorText);
      return NextResponse.redirect(new URL(`/profile?error=github_user_fetch_failed&message=${encodeURIComponent(`HTTP ${userResponse.status}`)}`, request.url));
    }
    
    const githubUser = await userResponse.json();
    
    if (!githubUser.id || !githubUser.login) {
      console.error('GitHub callback: Invalid user data from GitHub API', githubUser);
      return NextResponse.redirect(new URL('/profile?error=github_user_data_failed', request.url));
    }
    
    // Store the GitHub account information in Firestore
    console.log(`GitHub callback: Storing GitHub data for user ${userId}, GitHub username: ${githubUser.login}`);
    const userData = {
      githubId: githubUser.id,
      githubUsername: githubUser.login,
      githubAccessToken: tokenData.access_token,
      githubTokenType: authMethod,
      githubConnectedAt: new Date().toISOString(),
      githubAvatarUrl: githubUser.avatar_url,
      githubProfileUrl: githubUser.html_url,
      githubDisconnectedAt: null
    };
    
    try {
      await db!.collection('customers').doc(userId).set(userData, { merge: true });
      console.log('GitHub callback: Successfully stored GitHub data in Firestore');
    } catch (dbError) {
      console.error('GitHub callback: Error storing data in Firestore', dbError);
      return NextResponse.redirect(new URL('/profile?error=database_update_failed', request.url));
    }
    
    // Redirect back to the profile page with success message
    console.log('GitHub callback: GitHub connection successful, redirecting to profile page');
    return NextResponse.redirect(new URL('/profile?github=connected', request.url));
  } catch (error) {
    console.error('GitHub callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(new URL(`/profile?error=github_connection_failed&message=${encodeURIComponent(errorMessage)}`, request.url));
  }
} 