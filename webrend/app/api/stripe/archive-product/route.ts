import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '../../../lib/firebase-admin';

export async function POST(request: Request) {
  try {
    // Verify authentication using cookies
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
      decodedClaims = await auth!.verifySessionCookie(sessionCookie);
    } catch (error) {
      console.error('Error verifying session cookie:', error);
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }
    
    // Verify the user ID from the claims
    const userId = decodedClaims.uid;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 401 }
      );
    }
    
    // Parse the request body to get the product ID
    const { productId } = await request.json();
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
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
    
    // Archive the product in Stripe
    const product = await stripe.products.update(productId, {
      active: false, // This effectively archives the product
    });
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Product successfully archived',
      product: {
        id: product.id,
        name: product.name,
        active: product.active
      }
    });
    
  } catch (error: unknown) {
    console.error('Error archiving Stripe product:', error);
    
    // Handle Stripe specific errors
    if (error instanceof Stripe.errors.StripeError) {
      const statusCode = error.statusCode || 500;
      return NextResponse.json(
        { 
          error: error.message,
          type: error.type,
          code: error.code
        },
        { status: statusCode }
      );
    }
    
    // Handle generic errors
    const errorMessage = error instanceof Error ? error.message : 'Failed to archive product';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 