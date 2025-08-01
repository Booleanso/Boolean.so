import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth, db } from '../../../lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('GitHub revoke: Processing access revocation request');
    
    // Get the session cookie
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      console.log('GitHub revoke: No session cookie found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the session cookie to get the seller's user ID
    const decodedClaims = await auth!.verifySessionCookie(sessionCookie);
    const sellerId = decodedClaims.uid;
    
    if (!sellerId) {
      console.log('GitHub revoke: Invalid session (no userId)');
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get request body
    const { subscriptionId, buyerId, repoId } = await request.json();
    
    if (!subscriptionId || !buyerId || !repoId) {
      return NextResponse.json(
        { error: 'Missing required information' },
        { status: 400 }
      );
    }

    console.log(`GitHub revoke: Revoking access for repo ${repoId}, buyer ${buyerId}, subscription ${subscriptionId}`);

    // Get buyer and seller GitHub information
    const buyerDoc = await db!.collection('customers').doc(buyerId).get();
    if (!buyerDoc.exists) {
      return NextResponse.json(
        { error: 'Buyer account not found' },
        { status: 404 }
      );
    }
    const buyerData = buyerDoc.data() || {};
    
    const sellerDoc = await db!.collection('customers').doc(sellerId).get();
    if (!sellerDoc.exists) {
      return NextResponse.json(
        { error: 'Seller account not found' },
        { status: 404 }
      );
    }
    const sellerData = sellerDoc.data() || {};
    
    // Check if both accounts have GitHub connected
    if (!sellerData.githubAccessToken) {
      return NextResponse.json(
        { error: 'Seller GitHub account not connected' },
        { status: 400 }
      );
    }

    // Get subscription document to validate the relationship
    const subscriptionDoc = await db!.collection('subscriptions').doc(subscriptionId).get();
    if (!subscriptionDoc.exists) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }
    
    const subscriptionData = subscriptionDoc.data();
    
    // Verify the subscription belongs to the authenticated seller
    if (subscriptionData?.sellerId !== sellerId) {
      return NextResponse.json(
        { error: 'Unauthorized to revoke access for this subscription' },
        { status: 403 }
      );
    }

    // Get repository details
    const repoDoc = await db!.collection('repositories').doc(repoId).get();
    if (!repoDoc.exists) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }
    const repoData = repoDoc.data() || {};
    const repoName = repoData.name;
    
    if (!repoName) {
      return NextResponse.json(
        { error: 'Repository name not found' },
        { status: 400 }
      );
    }

    try {
      // Use GitHub's API to remove a collaborator
      const removeCollabResponse = await fetch(`https://api.github.com/repos/${sellerData.githubUsername}/${repoName}/collaborators/${buyerData.githubUsername}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${sellerData.githubAccessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!removeCollabResponse.ok) {
        // 404 is acceptable as it means the collaborator is already removed
        if (removeCollabResponse.status !== 404) {
          const errorData = await removeCollabResponse.json();
          console.error('GitHub API error:', errorData);
          throw new Error(`GitHub API error: ${removeCollabResponse.status} - ${errorData.message || 'Unknown error'}`);
        }
      }
      
      // Update subscription status in Firestore
      await db!.collection('subscriptions').doc(subscriptionId).update({
        status: 'canceled',
        canceledAt: new Date().toISOString(),
        accessRevokedAt: new Date().toISOString()
      });
      
      // Log the access revocation
      await db!.collection('accessLogs').add({
        type: 'revoke_access',
        subscriptionId,
        repoId,
        sellerId,
        buyerId,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: true,
        message: 'Repository access revoked successfully'
      });
    } catch (error) {
      console.error('GitHub revoke error:', error);
      
      // Update subscription with error information
      await db!.collection('subscriptions').doc(subscriptionId).update({
        revocationError: error instanceof Error ? error.message : 'Unknown error',
        revocationAttemptedAt: new Date().toISOString()
      });
      
      return NextResponse.json(
        { error: 'Failed to revoke repository access', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('GitHub revoke error:', error);
    return NextResponse.json(
      { error: 'Failed to process access revocation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 