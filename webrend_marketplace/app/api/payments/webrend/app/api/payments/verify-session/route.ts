import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth, db } from '../../../lib/firebase-admin';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const { sessionId } = await request.json();
    
    console.log(`Verifying session ID: ${sessionId}`);
    
    if (!sessionId) {
      console.log('Missing session ID in request');
      return NextResponse.json(
        { error: 'Missing session ID' },
        { status: 400 }
      );
    }
    
    // Initialize Stripe with the API key from environment variables
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      console.log('Stripe secret key not configured');
      throw new Error('Stripe secret key is not configured in environment variables');
    }
    
    console.log('Initializing Stripe client');
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia',
    });
    
    // Retrieve the checkout session from Stripe
    console.log(`Retrieving session ${sessionId} from Stripe`);
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent', 'subscription'],
      });
      console.log('Session retrieved successfully:', session.id);
    } catch (stripeError) {
      console.error('Stripe error retrieving session:', stripeError);
      return NextResponse.json(
        { error: 'Failed to retrieve Stripe session: ' + (stripeError instanceof Error ? stripeError.message : 'Unknown error') },
        { status: 400 }
      );
    }
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    // Get metadata from the session
    const { listingId, documentId } = session.metadata || {};
    
    if (!listingId || !documentId) {
      return NextResponse.json(
        { error: 'Session metadata missing required information' },
        { status: 400 }
      );
    }
    
    // Get the listing details from Firestore
    const listingRef = db!.collection('listings').doc(documentId);
    const listingDoc = await listingRef.get();
    
    if (!listingDoc.exists) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }
    
    const listingData = listingDoc.data() || {};
    
    // Create a purchase record if it doesn't exist yet
    // Check if there's already a purchase for this session
    const purchasesQuery = await db!.collection('purchases')
      .where('stripeSessionId', '==', sessionId)
      .limit(1)
      .get();
    
    let purchaseId;
    
    if (purchasesQuery.empty) {
      // Get the user ID from the cookies (if available)
      const cookies = request.headers.get('cookie');
      let userId = null;
      
      if (cookies) {
        const cookiePairs = cookies.split(';').map(cookie => cookie.trim());
        const sessionCookie = cookiePairs
          .find(cookie => cookie.startsWith('session='))
          ?.split('=')[1];
          
        if (sessionCookie) {
          try {
            const decodedClaims = await auth!.verifySessionCookie(sessionCookie);
            userId = decodedClaims.uid;
          } catch (error) {
            console.error('Error verifying session cookie:', error);
          }
        }
      }
      
      // Use buyerId from session metadata as fallback
      userId = userId || session.metadata?.buyerId;
      
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID not found' },
          { status: 400 }
        );
      }
      
      // Create a new purchase record
      const newPurchase = {
        userId,
        listingId,
        documentId,
        stripeSessionId: sessionId,
        purchaseType: listingData.isSubscription ? 'subscription' : 'purchase',
        purchaseDate: new Date().toISOString(),
        status: 'completed',
        transferStatus: listingData.isSubscription ? undefined : 'pending',
        stripePaymentIntentId: session.payment_intent,
        stripeSubscriptionId: session.subscription,
      };
      
      const purchaseRef = await db!.collection('purchases').add(newPurchase);
      purchaseId = purchaseRef.id;
      
      // Mark the listing as sold for one-time purchases
      if (!listingData.isSubscription) {
        await listingRef.update({
          sold: true,
          buyerId: userId,
          updatedAt: new Date().toISOString()
        });
      }
    } else {
      // Purchase already exists
      const purchaseDoc = purchasesQuery.docs[0];
      purchaseId = purchaseDoc.id;
    }
    
    // Return success response with relevant details
    return NextResponse.json({
      success: true,
      sessionId,
      purchaseId,
      listing: {
        id: listingId,
        docId: documentId,
        name: listingData.name,
        isSubscription: listingData.isSubscription,
        sellerId: listingData.seller?.id,
        repoId: listingData.repoId
      }
    });
    
  } catch (error: unknown) {
    console.error('Error verifying checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to verify checkout session';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 