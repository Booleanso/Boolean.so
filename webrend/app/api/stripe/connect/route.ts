import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth, db } from '../../../lib/firebase-admin';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

// Platform fee percentage (your commission) will be used in the payment route
export const PLATFORM_FEE_PERCENT = 5;

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

    // Get user data
    const userDoc = await db.collection('customers').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const userData = userDoc.data() || {};
    
    // If user already has a connected account, return it
    if (userData.stripeConnectAccountId) {
      // Check if onboarding is complete
      const account = await stripe.accounts.retrieve(userData.stripeConnectAccountId);
      
      if (account.charges_enabled) {
        return NextResponse.json({
          accountId: userData.stripeConnectAccountId,
          onboardingComplete: true
        });
      }
      
      // If onboarding is not complete, create a new onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: userData.stripeConnectAccountId,
        refresh_url: `${process.env.NEXT_PUBLIC_URL}/marketplace/sell?refresh=true`,
        return_url: `${process.env.NEXT_PUBLIC_URL}/marketplace/sell?success=true`,
        type: 'account_onboarding',
      });
      
      return NextResponse.json({
        accountId: userData.stripeConnectAccountId,
        onboardingComplete: false,
        onboardingUrl: accountLink.url
      });
    }
    
    // Create a new Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      email: userData.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: userData.name || 'GitHub Repository Seller',
        product_description: 'Selling software repositories and code'
      },
      metadata: {
        firebaseUserId: userId
      }
    });
    
    // Save the Connect account ID to the user's document
    await db.collection('customers').doc(userId).update({
      stripeConnectAccountId: account.id,
      stripeConnectOnboardingComplete: false,
      stripeConnectCreatedAt: new Date().toISOString()
    });
    
    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_URL}/marketplace/sell?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_URL}/marketplace/sell?success=true`,
      type: 'account_onboarding',
    });
    
    return NextResponse.json({
      accountId: account.id,
      onboardingComplete: false,
      onboardingUrl: accountLink.url
    });
  } catch (error) {
    console.error('Stripe Connect error:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe Connect account' },
      { status: 500 }
    );
  }
} 