import { NextRequest, NextResponse } from 'next/server';
import { withAuth, stripeConnect } from '../../../utils/stripe-utils';

export async function POST(req: NextRequest) {
  return withAuth(req, async (userId) => {
    try {
      // Disconnect Stripe Connect account
      await stripeConnect.disconnectAccount(userId);
      
      return NextResponse.json({
        success: true,
        message: 'Stripe account disconnected successfully'
      });
    } catch (error) {
      console.error('Error disconnecting Stripe account:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
} 