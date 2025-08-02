import { NextResponse } from 'next/server';
import { db, auth } from '../lib/firebase-admin';
import { createConnectAccount, isAccountOnboardingComplete, createAccountLink } from '../../lib/stripe';

// Interfaces for Stripe account data
interface StripeAccountData {
  accountHolderName: string;
  country?: string;
  email: string;
}

// Real Stripe Connect functionality
export const stripeConnect = {
  createAccount: async (userId: string, data: StripeAccountData) => {
    try {
      // Create real Stripe Connect account
      const stripeAccount = await createConnectAccount(data.email, data.country || 'US');
      const accountStatus = 'pending'; // Will be updated when onboarding completes
      
      // Save to Firestore
      await db!.collection('users').doc(userId).set({
        accountHolderName: data.accountHolderName,
        email: data.email,
        country: data.country || 'US',
        bankDetailsAdded: false, // Will be true after onboarding
        stripeAccountId: stripeAccount.id,
        stripeAccountStatus: accountStatus,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      return {
        success: true,
        stripeAccountId: stripeAccount.id,
        accountStatus,
        account: stripeAccount
      };
    } catch (error) {
      console.error('Error creating Stripe account:', error);
      throw new Error('Failed to create Stripe account');
    }
  },
  
  createOnboardingLink: async (userId: string, stripeAccountId: string, refreshUrl: string, returnUrl: string) => {
    try {
      // Create real Stripe onboarding link
      const accountLink = await createAccountLink(stripeAccountId, refreshUrl, returnUrl);
      
      return {
        success: true,
        url: accountLink.url
      };
    } catch (error) {
      console.error('Error creating onboarding link:', error);
      throw new Error('Failed to create onboarding link');
    }
  },
  
  checkAccountStatus: async (userId: string, stripeAccountId: string) => {
    try {
      // Check real Stripe account onboarding status
      const isComplete = await isAccountOnboardingComplete(stripeAccountId);
      
      // Update Firestore with current status
      await db!.collection('users').doc(userId).set({
        bankDetailsAdded: isComplete,
        stripeAccountStatus: isComplete ? 'verified' : 'pending',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      return {
        success: true,
        isComplete,
        accountStatus: isComplete ? 'verified' : 'pending'
      };
    } catch (error) {
      console.error('Error checking account status:', error);
      throw new Error('Failed to check account status');
    }
  },
  
  disconnectAccount: async (userId: string) => {
    try {
      // Note: Stripe doesn't allow programmatic deletion of Connect accounts
      // for security reasons. Users must contact Stripe directly.
      // We'll just update our records to reflect disconnection
      
      await db!.collection('users').doc(userId).set({
        bankDetailsAdded: false,
        stripeAccountId: null,
        stripeAccountStatus: null,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      return { 
        success: true,
        message: 'Account disconnected from platform. Contact Stripe support to permanently delete the account.'
      };
    } catch (error) {
      console.error('Error disconnecting Stripe account:', error);
      throw new Error('Failed to disconnect Stripe account');
    }
  }
};

// Helper to verify user authentication and return user
export async function verifyUserAuth(sessionCookie: string | undefined) {
  if (!sessionCookie) {
    return null;
  }
  
  try {
    // Verify the session cookie
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    // Get the user record
    const user = await auth.getUser(decodedClaims.uid);
    
    return user;
  } catch (error) {
    console.error('Error verifying user authentication:', error);
    return null;
  }
}

// API handler helper
export async function withAuth<T = unknown, R = unknown>(
  req: Request,
  handler: (userId: string, data: T) => Promise<R>
): Promise<NextResponse<R | { error: string }>> {
  try {
    // Get session cookie from request
    const cookies = req.headers.get('cookie') || '';
    const sessionCookie = getCookie(cookies, 'session');
    
    // Verify user
    const user = await verifyUserAuth(sessionCookie);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body if it exists
    let data = {};
    try {
      const contentType = req.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const body = await req.text();
        if (body) {
          data = JSON.parse(body);
        }
      }
    } catch (e) {
      console.error('Error parsing request body:', e);
    }
    
    // Call handler with authenticated user id and data
    return await handler(user.uid, data);
  } catch (error) {
    console.error('Error in withAuth:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to get cookie value
function getCookie(cookies: string, name: string): string | undefined {
  const match = cookies.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : undefined;
} 