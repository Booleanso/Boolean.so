import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth, db } from '../../../lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('GitHub transfer: Processing repository transfer request');
    
    // Get the session cookie
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      console.log('GitHub transfer: No session cookie found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the session cookie to get the buyer's user ID
    const decodedClaims = await auth.verifySessionCookie(sessionCookie);
    const buyerId = decodedClaims.uid;
    
    if (!buyerId) {
      console.log('GitHub transfer: Invalid session (no userId)');
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get request body
    const { repoId, sellerId, isSinglePurchase } = await request.json();
    
    if (!repoId || !sellerId) {
      return NextResponse.json(
        { error: 'Missing required information' },
        { status: 400 }
      );
    }

    console.log(`GitHub transfer: Transferring repo ${repoId} from ${sellerId} to ${buyerId}, type: ${isSinglePurchase ? 'one-time purchase' : 'subscription'}`);

    // Get buyer and seller GitHub information
    const buyerDoc = await db.collection('customers').doc(buyerId).get();
    if (!buyerDoc.exists) {
      return NextResponse.json(
        { error: 'Buyer account not found' },
        { status: 404 }
      );
    }
    const buyerData = buyerDoc.data() || {};
    
    const sellerDoc = await db.collection('customers').doc(sellerId).get();
    if (!sellerDoc.exists) {
      return NextResponse.json(
        { error: 'Seller account not found' },
        { status: 404 }
      );
    }
    const sellerData = sellerDoc.data() || {};
    
    // Check if both accounts have GitHub connected
    if (!buyerData.githubAccessToken) {
      return NextResponse.json(
        { error: 'Buyer GitHub account not connected' },
        { status: 400 }
      );
    }
    
    if (!sellerData.githubAccessToken) {
      return NextResponse.json(
        { error: 'Seller GitHub account not connected' },
        { status: 400 }
      );
    }

    if (isSinglePurchase) {
      // For one-time purchase, transfer repository ownership
      try {
        // In a real implementation, you would use GitHub's API to transfer repository ownership
        // This requires the GitHub API with appropriate scopes and potentially GitHub Apps integration
        // See: https://docs.github.com/en/rest/reference/repos#transfer-a-repository
        
        // Example implementation (not executed here):
        /*
        const transferResponse = await fetch(`https://api.github.com/repos/${sellerData.githubUsername}/${repoName}/transfer`, {
          method: 'POST',
          headers: {
            'Authorization': `token ${sellerData.githubAccessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            new_owner: buyerData.githubUsername,
          })
        });
        
        if (!transferResponse.ok) {
          throw new Error(`GitHub API error: ${transferResponse.status}`);
        }
        */
        
        // For demo purposes, we'll just record the transaction in Firestore
        await db.collection('transactions').add({
          type: 'repository_transfer',
          repoId,
          sellerId,
          buyerId,
          sellerGithubUsername: sellerData.githubUsername,
          buyerGithubUsername: buyerData.githubUsername,
          status: 'completed',
          timestamp: new Date().toISOString()
        });
        
        return NextResponse.json({
          success: true,
          message: 'Repository transfer initiated successfully'
        });
        
      } catch (error) {
        console.error('GitHub transfer error:', error);
        return NextResponse.json(
          { error: 'Failed to transfer repository' },
          { status: 500 }
        );
      }
    } else {
      // For subscription, add buyer as collaborator
      try {
        // In a real implementation, you would use GitHub's API to add a collaborator
        // See: https://docs.github.com/en/rest/reference/repos#add-a-repository-collaborator
        
        // Example implementation (not executed here):
        /*
        const addCollabResponse = await fetch(`https://api.github.com/repos/${sellerData.githubUsername}/${repoName}/collaborators/${buyerData.githubUsername}`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${sellerData.githubAccessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            permission: 'maintain'  // or 'push' for write access
          })
        });
        
        if (!addCollabResponse.ok) {
          throw new Error(`GitHub API error: ${addCollabResponse.status}`);
        }
        */
        
        // For demo purposes, we'll just record the subscription in Firestore
        await db.collection('subscriptions').add({
          repoId,
          sellerId,
          buyerId,
          sellerGithubUsername: sellerData.githubUsername,
          buyerGithubUsername: buyerData.githubUsername,
          status: 'active',
          startDate: new Date().toISOString(),
          nextBillingDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
        });
        
        return NextResponse.json({
          success: true,
          message: 'Repository access granted successfully'
        });
      } catch (error) {
        console.error('GitHub collaboration error:', error);
        return NextResponse.json(
          { error: 'Failed to grant repository access' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('GitHub transfer error:', error);
    return NextResponse.json(
      { error: 'Failed to process repository transfer' },
      { status: 500 }
    );
  }
} 