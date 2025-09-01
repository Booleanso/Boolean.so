import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth, db } from '../../../lib/firebase-admin';
import Stripe from 'stripe';
import { PLATFORM_FEE_PERCENT } from '../../../lib/constants';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20'
});

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
    
    // Verify the session cookie to get the buyer's user ID
    const decodedClaims = await auth.verifySessionCookie(sessionCookie);
    const buyerId = decodedClaims.uid;
    
    if (!buyerId) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get the listing ID from the request
    const { listingId } = await request.json();
    
    if (!listingId) {
      return NextResponse.json(
        { error: 'Missing listing ID' },
        { status: 400 }
      );
    }

    // Get the listing from Firestore
    const listingDoc = await db.collection('listings').doc(listingId).get();
    
    if (!listingDoc.exists) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }
    
    const listingData = listingDoc.data();
    
    if (!listingData || !listingData.active) {
      return NextResponse.json(
        { error: 'Listing is not active' },
        { status: 400 }
      );
    }

    // Get buyer information
    const buyerDoc = await db.collection('customers').doc(buyerId).get();
    if (!buyerDoc.exists) {
      return NextResponse.json(
        { error: 'Buyer account not found' },
        { status: 404 }
      );
    }
    const buyerData = buyerDoc.data() || {};
    
    // Make sure buyer has connected GitHub
    if (!buyerData.githubUsername) {
      return NextResponse.json(
        { error: 'GitHub account connection required to purchase repositories' },
        { status: 400 }
      );
    }

    // Calculate the platform fee
    const price = listingData.pricingType === 'onetime' 
      ? listingData.price 
      : listingData.subscriptionPrice;
    
    const amount = Math.round(price * 100); // Convert dollars to cents
    const platformFeeAmount = Math.round(amount * (PLATFORM_FEE_PERCENT / 100));

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: listingData.stripePriceId,
          quantity: 1,
        },
      ],
      mode: listingData.pricingType === 'subscription' ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/marketplace/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/marketplace`,
      payment_intent_data: listingData.pricingType === 'onetime' ? {
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: listingData.sellerStripeAccountId,
        },
      } : undefined,
      subscription_data: listingData.pricingType === 'subscription' ? {
        application_fee_percent: PLATFORM_FEE_PERCENT,
        transfer_data: {
          destination: listingData.sellerStripeAccountId,
        },
      } : undefined,
      client_reference_id: buyerId,
      metadata: {
        listingId,
        repoId: listingData.repoId,
        sellerId: listingData.sellerId,
        buyerId,
        pricingType: listingData.pricingType,
        buyerGithubUsername: buyerData.githubUsername,
      },
    });

    return NextResponse.json({ 
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 