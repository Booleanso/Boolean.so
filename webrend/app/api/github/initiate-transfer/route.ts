import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth, db } from '../../../lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the session cookie to get the user ID
    const decodedClaims = await auth!.verifySessionCookie(sessionCookie);
    const buyerId = decodedClaims.uid;
    
    if (!buyerId) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Parse request body
    const { purchaseId, listingId, documentId } = await request.json();
    
    if (!purchaseId || !listingId || !documentId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Get purchase details
    const purchaseDoc = await db!.collection('purchases').doc(purchaseId).get();
    
    if (!purchaseDoc.exists) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }
    
    const purchase = purchaseDoc.data();
    
    // Verify this purchase belongs to the authenticated user
    if (purchase?.userId !== buyerId) {
      return NextResponse.json(
        { error: 'Unauthorized access to purchase' },
        { status: 403 }
      );
    }
    
    // Get listing details
    const listingDoc = await db!.collection('listings').doc(documentId).get();
    
    if (!listingDoc.exists) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }
    
    const listing = listingDoc.data();
    const sellerId = listing?.seller?.id;
    const repoId = listing?.repoId;
    
    if (!sellerId || !repoId) {
      return NextResponse.json(
        { error: 'Listing missing seller or repository information' },
        { status: 400 }
      );
    }
    
    // Check if buyer and seller are the same user
    if (buyerId === sellerId) {
      console.log('Buyer and seller are the same user:', buyerId);
      
      // Mark the purchase as special "self-purchase"
      await purchaseDoc.ref.update({
        transferStatus: 'self-purchase',
        note: 'Repository already owned by buyer',
        updatedAt: new Date().toISOString()
      });
      
      // Mark the listing as sold but with special status
      await listingDoc.ref.update({
        sold: true,
        selfPurchase: true,
        buyerId: buyerId,
        updatedAt: new Date().toISOString()
      });
      
      // Create a self-purchase transaction record
      const transactionRef = await db!.collection('transactions').add({
        listingId,
        repoId,
        sellerId,
        buyerId,
        amount: listing.price,
        status: 'completed',
        type: 'repository_self_purchase',
        pricingType: 'onetime',
        createdAt: new Date().toISOString(),
        purchaseId,
        transferStatus: 'not_applicable',
        note: 'Self-purchase: Repository already owned by buyer'
      });
      
      // Update purchase record with transaction ID
      await purchaseDoc.ref.update({
        transactionId: transactionRef.id
      });
      
      return NextResponse.json({
        success: true,
        message: 'Self-purchase successful. Repository already belongs to you.',
        selfPurchase: true
      });
    }
    
    // Create a transaction record for normal purchase
    const transactionData = {
      listingId,
      repoId,
      sellerId,
      buyerId,
      amount: listing.price,
      status: 'completed',
      type: 'repository_purchase',
      pricingType: 'onetime',
      createdAt: new Date().toISOString(),
      purchaseId
    };
    
    const transactionRef = await db!.collection('transactions').add(transactionData);
    
    // Call the transfer API
    const transferResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/github/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session=${sessionCookie}`
      },
      body: JSON.stringify({
        repoId,
        sellerId,
        isSinglePurchase: true,
        transactionId: transactionRef.id
      })
    });
    
    if (!transferResponse.ok) {
      const errorData = await transferResponse.json();
      console.error('GitHub transfer API error:', errorData);
      
      // Update transaction with error
      await transactionRef.update({
        transferError: errorData.error || 'Failed to initiate repository transfer',
        transferStatus: 'failed',
        updatedAt: new Date().toISOString()
      });
      
      return NextResponse.json(
        { error: 'Failed to initiate repository transfer', details: errorData },
        { status: 500 }
      );
    }
    
    // Transfer initiated successfully
    const transferResult = await transferResponse.json();
    
    // Update transaction with transfer info
    await transactionRef.update({
      transferStatus: 'initiated',
      transferInitiatedAt: new Date().toISOString(),
      transferDetails: transferResult
    });
    
    // Update purchase record
    await purchaseDoc.ref.update({
      transferStatus: 'initiated',
      transferInitiatedAt: new Date().toISOString(),
      transactionId: transactionRef.id
    });
    
    return NextResponse.json({
      success: true,
      message: 'Repository transfer initiated successfully',
      transferId: transferResult.transferId || null
    });
    
  } catch (error) {
    console.error('Error initiating repository transfer:', error);
    return NextResponse.json(
      { error: 'Failed to initiate repository transfer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 