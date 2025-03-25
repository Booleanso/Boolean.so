import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth, db } from '../../../lib/firebase-admin';

// GitHub repository interface
interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log('GitHub repos: Processing request');
    
    // Get the session cookie
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      console.log('GitHub repos: No session cookie found');
      return NextResponse.json(
        { error: 'Authentication required', repos: [] },
        { status: 401 }
      );
    }
    
    // Verify the session cookie to get the user
    let decodedClaims;
    try {
      decodedClaims = await auth.verifySessionCookie(sessionCookie);
    } catch (sessionError) {
      console.error('GitHub repos: Failed to verify session:', sessionError);
      return NextResponse.json(
        { error: 'Invalid session cookie', repos: [] },
        { status: 401 }
      );
    }
    
    const userId = decodedClaims.uid;
    
    if (!userId) {
      console.log('GitHub repos: Invalid session (no userId)');
      return NextResponse.json(
        { error: 'Invalid session', repos: [] },
        { status: 401 }
      );
    }

    console.log(`GitHub repos: Getting repos for user ${userId}`);

    // Get the user document to check GitHub connection
    const userDoc = await db.collection('customers').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log(`GitHub repos: User document not found for ${userId}`);
      return NextResponse.json(
        { error: 'User not found', repos: [] },
        { status: 404 }
      );
    }
    
    const userData = userDoc.data() || {};
    
    // Check if the user has a GitHub connection
    if (!userData.githubAccessToken) {
      console.log(`GitHub repos: No GitHub token for user ${userId}`);
      return NextResponse.json(
        { error: 'GitHub account not connected', repos: [] },
        { status: 400 }
      );
    }
    
    console.log('GitHub repos: Fetching repositories from GitHub API');
    
    // Get the stored auth method (default to trying both if not specified)
    const authMethod = userData.githubTokenType || 'bearer';
    console.log(`GitHub repos: Using auth method: ${authMethod}`);

    // Fetch the repositories
    try {
      // Use the stored authentication method
      const authHeader = authMethod.toLowerCase() === 'bearer' 
        ? `Bearer ${userData.githubAccessToken}`
        : `token ${userData.githubAccessToken}`;
        
      const reposResponse = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'WebRend-App'
        }
      });
      
      // If stored method fails, try the other method
      if (reposResponse.status === 401) {
        console.log(`GitHub repos: ${authMethod} auth failed, trying alternate method`);
        
        // Try opposite method
        const alternateAuthHeader = authMethod.toLowerCase() === 'bearer'
          ? `token ${userData.githubAccessToken}`
          : `Bearer ${userData.githubAccessToken}`;
          
        const alternateResponse = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
          headers: {
            'Authorization': alternateAuthHeader,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'WebRend-App'
          }
        });
        
        if (alternateResponse.ok) {
          // Update stored auth method
          const newAuthMethod = authMethod.toLowerCase() === 'bearer' ? 'token' : 'bearer';
          console.log(`GitHub repos: Updating auth method to ${newAuthMethod}`);
          
          await db.collection('customers').doc(userId).update({
            githubTokenType: newAuthMethod
          });
          
          const repos = await alternateResponse.json();
          
          if (!Array.isArray(repos)) {
            console.error('GitHub repos: Non-array response from GitHub API', repos);
            return NextResponse.json(
              { error: 'Invalid GitHub API response', repos: [] },
              { status: 500 }
            );
          }
          
          console.log(`GitHub repos: Successfully fetched ${repos.length} repositories with alternate auth`);
          
          // Filter and format the repositories
          const formattedRepos = repos.map((repo: GitHubRepo) => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            url: repo.html_url,
            isPrivate: repo.private,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            language: repo.language,
            updatedAt: repo.updated_at
          }));
          
          return NextResponse.json({ repos: formattedRepos });
        } else {
          // Both methods failed
          const errorText = await alternateResponse.text().catch(() => '');
          console.error(`GitHub repos: Both auth methods failed: ${alternateResponse.status}`, errorText);
          
          // Clear the invalid token
          console.log('GitHub repos: Token is invalid, clearing from database');
          await db.collection('customers').doc(userId).update({
            githubAccessToken: null,
            githubConnectedAt: null,
            githubDisconnectedAt: new Date().toISOString()
          });
          
          return NextResponse.json(
            { error: 'GitHub token expired or revoked', message: 'Please reconnect your GitHub account', repos: [] },
            { status: 401 }
          );
        }
      }
      
      if (!reposResponse.ok) {
        const errorText = await reposResponse.text().catch(() => '');
        console.error(`GitHub repos: GitHub API error: ${reposResponse.status}`, errorText);
        
        throw new Error(`GitHub API error: ${reposResponse.status} - ${errorText || 'No response body'}`);
      }
      
      const repos = await reposResponse.json();
      
      if (!Array.isArray(repos)) {
        console.error('GitHub repos: Non-array response from GitHub API', repos);
        return NextResponse.json(
          { error: 'Invalid GitHub API response', repos: [] },
          { status: 500 }
        );
      }
      
      console.log(`GitHub repos: Successfully fetched ${repos.length} repositories with Bearer auth`);
      
      // Filter and format the repositories
      const formattedRepos = repos.map((repo: GitHubRepo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        isPrivate: repo.private,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        updatedAt: repo.updated_at
      }));
      
      return NextResponse.json({ repos: formattedRepos });
    } catch (apiError) {
      console.error('GitHub repos: Error fetching from GitHub API:', apiError);
      
      // Token might be expired or revoked
      if (apiError instanceof Error && 
          (apiError.message.includes('401') || apiError.message.includes('Unauthorized'))) {
        // Clear the token so user can reconnect
        await db.collection('customers').doc(userId).update({
          githubAccessToken: null,
          githubConnectedAt: null,
          githubDisconnectedAt: new Date().toISOString()
        });
        
        return NextResponse.json(
          { error: 'GitHub token expired or invalid', message: 'Please reconnect your GitHub account', repos: [] },
          { status: 401 }
        );
      }
      
      throw apiError; // Rethrow for the outer catch block
    }
  } catch (error) {
    console.error('GitHub repos fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch GitHub repositories',
        message: error instanceof Error ? error.message : 'Unknown error',
        repos: []
      },
      { status: 500 }
    );
  }
} 