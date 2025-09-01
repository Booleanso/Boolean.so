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
    const decodedClaims = await auth!.verifySessionCookie(sessionCookie);
    const buyerId = decodedClaims.uid;
    
    if (!buyerId) {
      console.log('GitHub transfer: Invalid session (no userId)');
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get request body
    const { repoId, sellerId, isSinglePurchase, transactionId } = await request.json();
    
    if (!repoId || !sellerId) {
      return NextResponse.json(
        { error: 'Missing required information' },
        { status: 400 }
      );
    }

    console.log(`GitHub transfer: Transferring repo ${repoId} from ${sellerId} to ${buyerId}, type: ${isSinglePurchase ? 'one-time purchase' : 'subscription'}`);

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

    // Check if buyer and seller are the same user
    if (buyerId === sellerId) {
      console.log('GitHub transfer: Buyer and seller are the same user. No transfer needed.');
      
      // Update transaction with self-purchase status
      if (transactionId) {
        await db!.collection('transactions').doc(transactionId).update({
          type: 'repository_self_purchase',
          transferStatus: 'not_applicable',
          note: 'Self-purchase: Repository already owned by buyer',
          updatedAt: new Date().toISOString()
        });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Self-purchase detected. Repository already belongs to the buyer.',
        selfPurchase: true
      });
    }

    // Get repository details from database
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

    if (isSinglePurchase) {
      // For one-time purchase, transfer repository ownership
      try {
        // Use GitHub's API to transfer repository ownership
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
          const errorData = await transferResponse.json();
          console.error('GitHub API error:', errorData);
          throw new Error(`GitHub API error: ${transferResponse.status} - ${errorData.message || 'Unknown error'}`);
        }
        
        const transferResult = await transferResponse.json();
        
        // Record the transaction in Firestore
        await db!.collection('transactions').doc(transactionId).update({
          type: 'repository_transfer',
          githubTransferId: transferResult.id,
          transferStatus: 'initiated',
          transferInitiatedAt: new Date().toISOString()
        });
        
        // Update repository ownership in database
        await db!.collection('repositories').doc(repoId).update({
          ownerUserId: buyerId,
          previousOwnerUserId: sellerId,
          transferredAt: new Date().toISOString()
        });
        
        return NextResponse.json({
          success: true,
          message: 'Repository transfer initiated successfully',
          transferId: transferResult.id
        });
        
      } catch (error) {
        console.error('GitHub transfer error:', error);
        
        // Update transaction with error
        if (transactionId) {
          await db!.collection('transactions').doc(transactionId).update({
            transferStatus: 'failed',
            transferError: error instanceof Error ? error.message : 'Unknown error',
            updatedAt: new Date().toISOString()
          });
        }
        
        return NextResponse.json(
          { error: 'Failed to transfer repository', details: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        );
      }
    } else {
      // For subscription, add buyer as collaborator
      try {
        // Use GitHub's API to add a collaborator
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
          const errorData = await addCollabResponse.json();
          console.error('GitHub API error:', errorData);
          throw new Error(`GitHub API error: ${addCollabResponse.status} - ${errorData.message || 'Unknown error'}`);
        }
        
        const collabResult = await addCollabResponse.json();
        
        // Update transaction with collaboration status
        if (transactionId) {
          await db!.collection('transactions').doc(transactionId).update({
            collaborationStatus: 'added',
            collaborationAddedAt: new Date().toISOString()
          });
        }
        
        return NextResponse.json({
          success: true,
          message: 'Repository access granted successfully',
          invitationId: collabResult.id
        });
      } catch (error) {
        console.error('GitHub collaboration error:', error);
        
        // Update transaction with error
        if (transactionId) {
          await db!.collection('transactions').doc(transactionId).update({
            collaborationStatus: 'failed',
            collaborationError: error instanceof Error ? error.message : 'Unknown error',
            updatedAt: new Date().toISOString()
          });
        }
        
        return NextResponse.json(
          { error: 'Failed to grant repository access', details: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('GitHub transfer error:', error);
    return NextResponse.json(
      { error: 'Failed to process repository transfer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 