import { NextRequest, NextResponse } from 'next/server';
import { withAuth, stripeConnect } from '../../../utils/stripe-utils';

export async function POST(req: NextRequest) {
  return withAuth(req, async (userId, data) => {
    try {
      // Validate required fields
      const { 
        accountHolderName, 
        bankAccountNumber, 
        routingNumber, 
        taxId, 
        country = 'US',
        email 
      } = data;
      
      // Validate required fields
      if (!accountHolderName || !bankAccountNumber || !routingNumber || !taxId) {
        return NextResponse.json(
          { error: 'Missing required fields' }, 
          { status: 400 }
        );
      }
      
      // Create Stripe Connect account
      const result = await stripeConnect.createAccount(userId, {
        accountHolderName,
        bankAccountNumber,
        routingNumber,
        taxId,
        country,
        email
      });
      
      return NextResponse.json({
        success: true,
        message: 'Stripe Connect account created successfully',
        stripeAccountId: result.stripeAccountId,
        accountStatus: result.accountStatus
      });
      
    } catch (error) {
      console.error('Error creating Stripe account:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
} 