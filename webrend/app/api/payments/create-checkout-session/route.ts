import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '../../../lib/firebase-admin'; // Import server-side Firebase admin

export async function POST(request: Request) {
  try {
    // Get user authentication from cookies instead of client-side auth
    // Extract the session cookie from the request
    const cookies = request.headers.get('cookie');
    if (!cookies) {
      return NextResponse.json(
        { error: 'Authentication cookies not found' },
        { status: 401 }
      );
    }
    
    // Parse cookies to get the session token
    const cookiePairs = cookies.split(';').map(cookie => cookie.trim());
    const sessionCookie = cookiePairs
      .find(cookie => cookie.startsWith('session='))
      ?.split('=')[1];
      
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Session cookie not found' },
        { status: 401 }
      );
    }
    
    // Verify the session cookie with Firebase Admin
    let decodedClaims;
    try {
      decodedClaims = await auth.verifySessionCookie(sessionCookie);
    } catch (error) {
      console.error('Error verifying session cookie:', error);
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }
    
    const userId = decodedClaims.uid;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 401 }
      );
    }

    // Parse the request body
    const { listingId, priceId, isSubscription } = await request.json();
    
    if (!listingId || !priceId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Initialize Stripe with the API key from environment variables
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key is not configured in environment variables');
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia',
    });
    
    // For demo purposes, we'll create a basic checkout session without Connect features
    // In a real application with Stripe Connect:
    // 1. You would retrieve the seller's Stripe account ID from your database
    // 2. Set up proper transfer_data with the actual account ID
    
    const success_url = new URL('/marketplace/buy/success', request.url).toString();
    const cancel_url = new URL(`/marketplace/buy/${listingId}`, request.url).toString();
    
    // Create a Stripe checkout session
    // For now, we're creating a direct charge without Connect to avoid the error
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url,
      cancel_url,
      metadata: {
        listingId: listingId.toString(),
        buyerId: userId,
      },
      // For demo purposes, we'll skip the application fee and transfer
      // In a real app, you would use this with proper Stripe Connect accounts
    });

    // Return the session URL for redirect
    return NextResponse.json({
      success: true,
      sessionUrl: session.url,
    });
    
  } catch (error: unknown) {
    console.error('Error creating checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 