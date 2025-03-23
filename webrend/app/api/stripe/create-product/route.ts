import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth, db } from '../../../lib/firebase-admin';
import Stripe from 'stripe';

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
    
    // Verify the session cookie to get the user
    const decodedClaims = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedClaims.uid;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get user data to check if they have a Stripe Connect account
    const userDoc = await db.collection('customers').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const userData = userDoc.data() || {};
    
    // Check if user has completed Stripe Connect onboarding
    if (!userData.stripeConnectAccountId) {
      return NextResponse.json(
        { error: 'Stripe Connect account required. Please complete onboarding first.' },
        { status: 400 }
      );
    }
    
    // Verify that the Connect account is ready to receive payments
    const account = await stripe.accounts.retrieve(userData.stripeConnectAccountId);
    if (!account.charges_enabled) {
      return NextResponse.json(
        { error: 'Your Stripe account setup is incomplete. Please complete onboarding first.' },
        { status: 400 }
      );
    }

    // Get the repository listing data from the request
    const { 
      repoId, 
      title, 
      description, 
      pricingType,
      price, 
      subscriptionPrice,
      images = []
    } = await request.json();
    
    if (!repoId || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required repository information' },
        { status: 400 }
      );
    }
    
    if (pricingType === 'onetime' && (!price || price <= 0)) {
      return NextResponse.json(
        { error: 'Invalid price for one-time purchase' },
        { status: 400 }
      );
    }
    
    if (pricingType === 'subscription' && (!subscriptionPrice || subscriptionPrice <= 0)) {
      return NextResponse.json(
        { error: 'Invalid price for subscription' },
        { status: 400 }
      );
    }

    // Create a product in Stripe
    const product = await stripe.products.create({
      name: title,
      description: description,
      images: images.length > 0 ? images : undefined,
      metadata: {
        repoId,
        sellerId: userId,
        pricingType,
      }
    });
    
    // Create the appropriate price
    let priceObj;
    if (pricingType === 'onetime') {
      priceObj = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(price * 100), // Convert dollars to cents
        currency: 'usd',
      });
    } else {
      priceObj = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(subscriptionPrice * 100), // Convert dollars to cents
        currency: 'usd',
        recurring: {
          interval: 'month'
        }
      });
    }
    
    // Save the product and price to Firestore
    const listingRef = await db.collection('listings').add({
      repoId,
      sellerId: userId,
      sellerStripeAccountId: userData.stripeConnectAccountId,
      title,
      description,
      pricingType,
      price: pricingType === 'onetime' ? price : null,
      subscriptionPrice: pricingType === 'subscription' ? subscriptionPrice : null,
      images,
      stripeProductId: product.id,
      stripePriceId: priceObj.id,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      listingId: listingRef.id,
      productId: product.id,
      priceId: priceObj.id
    });
  } catch (error) {
    console.error('Stripe product creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create product listing' },
      { status: 500 }
    );
  }
} 