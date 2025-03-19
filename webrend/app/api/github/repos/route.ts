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
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the session cookie to get the user
    const decodedClaims = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedClaims.uid;
    
    if (!userId) {
      console.log('GitHub repos: Invalid session (no userId)');
      return NextResponse.json(
        { error: 'Invalid session' },
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
    
    // Fetch the repositories
    try {
      const reposResponse = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': `token ${userData.githubAccessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
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
      
      console.log(`GitHub repos: Successfully fetched ${repos.length} repositories`);
      
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