import { NextResponse } from 'next/server';
import { db, auth } from '../lib/firebase-admin';

// Interfaces for Stripe account data
interface StripeAccountData {
  accountHolderName: string;
  country?: string;
}

// Mock Stripe Connect functionality
export const stripeConnect = {
  createAccount: async (userId: string, data: StripeAccountData) => {
    try {
      // In a real implementation, this would call Stripe API
      // For now, we'll simulate a successful account creation
      const stripeAccountId = `acct_${Math.random().toString(36).substring(2, 15)}`;
      const accountStatus = 'pending';
      
      // Save to Firestore
      await db.collection('users').doc(userId).set({
        accountHolderName: data.accountHolderName,
        country: data.country || 'US',
        bankDetailsAdded: true,
        stripeAccountId,
        stripeAccountStatus: accountStatus,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      return {
        success: true,
        stripeAccountId,
        accountStatus
      };
    } catch (error) {
      console.error('Error creating Stripe account:', error);
      throw new Error('Failed to create Stripe account');
    }
  },
  
  disconnectAccount: async (userId: string) => {
    try {
      // Update Firestore document
      await db.collection('users').doc(userId).set({
        bankDetailsAdded: false,
        stripeAccountId: null,
        stripeAccountStatus: null,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      return { success: true };
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