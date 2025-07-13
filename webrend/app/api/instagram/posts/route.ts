import { NextResponse } from 'next/server';

// Instagram Graph API configuration
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;

// Account information for the two Instagram accounts
const ACCOUNTS = {
  webrendhq: {
    username: 'webrendhq',
    userId: process.env.WEBRENDHQ_USER_ID,
    accessToken: process.env.WEBRENDHQ_ACCESS_TOKEN,
  },
  vincelawliet: {
    username: 'vincelawliet',
    userId: process.env.VINCELAWLIET_USER_ID,
    accessToken: process.env.VINCELAWLIET_ACCESS_TOKEN,
  }
};

interface InstagramPost {
  id: string;
  caption: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  username: string;
  account: string;
}

async function fetchInstagramPosts(account: string, userId: string, accessToken: string): Promise<InstagramPost[]> {
  try {
    const response = await fetch(
      `https://graph.instagram.com/${userId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${accessToken}&limit=6`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.data.map((post: any) => ({
      id: post.id,
      caption: post.caption || '',
      media_type: post.media_type,
      media_url: post.media_url,
      thumbnail_url: post.thumbnail_url,
      permalink: post.permalink,
      timestamp: post.timestamp,
      username: account,
      account: account,
    }));
  } catch (error) {
    console.error(`Error fetching Instagram posts for ${account}:`, error);
    return [];
  }
}

export async function GET() {
  try {
    // Check if required environment variables are set
    if (!ACCOUNTS.webrendhq.accessToken || !ACCOUNTS.vincelawliet.accessToken) {
      return NextResponse.json({
        error: 'Instagram API credentials not configured',
        posts: []
      }, { status: 500 });
    }

    // Fetch posts from both accounts
    const [webrendhqPosts, vincelawlietPosts] = await Promise.all([
      fetchInstagramPosts(
        ACCOUNTS.webrendhq.username,
        ACCOUNTS.webrendhq.userId || '',
        ACCOUNTS.webrendhq.accessToken
      ),
      fetchInstagramPosts(
        ACCOUNTS.vincelawliet.username,
        ACCOUNTS.vincelawliet.userId || '',
        ACCOUNTS.vincelawliet.accessToken
      )
    ]);

    // Combine and sort posts by timestamp (most recent first)
    const allPosts = [...webrendhqPosts, ...vincelawlietPosts];
    allPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      posts: allPosts,
      totalPosts: allPosts.length,
    });

  } catch (error) {
    console.error('Error in Instagram posts API:', error);
    return NextResponse.json({
      error: 'Failed to fetch Instagram posts',
      posts: []
    }, { status: 500 });
  }
} 