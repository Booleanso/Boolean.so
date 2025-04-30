import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase-admin';
import { withAuth } from '../../../../utils/stripe-utils';
import Stripe from 'stripe';

// Define interface for listing data
interface ListingData {
  id: string;
  name: string;
  description: string;
  price: number;
  isSubscription: boolean;
  subscriptionPrice?: number;
  imageUrl: string;
  sold: boolean;
  seller: {
    username: string;
    avatarUrl: string;
  };
}

// Initialize Stripe with your platform account's secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia', // Updated to latest version
});

export async function POST(
  req: NextRequest,
  context: { params: { slug: string } }
) {
  // Await params before accessing properties
  const params = await context.params;
  
  return withAuth(req, async (userId, data) => {
    try {
      // Use slug instead of id to match the route parameter
      const slug = params.slug;
      
      if (!slug) {
        return NextResponse.json({ error: 'Invalid listing slug' }, { status: 400 });
      }
      
      // Fetch the listing by slug from Firestore instead of JSON file
      const listingQuery = await db.collection('listings').where('slug', '==', slug).limit(1).get();
      
      if (listingQuery.empty) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
      }
      
      const listingDoc = listingQuery.docs[0];
      const listing = {
        ...listingDoc.data(),
        id: listingDoc.id
      } as ListingData;
      
      if (listing.sold) {
        return NextResponse.json({ error: 'This listing has already been sold' }, { status: 400 });
      }
      
      // Fetch seller's Stripe Connect ID from Firestore 
      let sellerStripeAccountId = null;
      
      // First, find the seller's UID using their username
      const sellersSnapshot = await db.collection('users')
        .where('username', '==', listing.seller.username)
        .limit(1)
        .get();
      
      if (!sellersSnapshot.empty) {
        const sellerData = sellersSnapshot.docs[0].data();
        sellerStripeAccountId = sellerData.stripeAccountId;
      }
      
      if (!sellerStripeAccountId) {
        console.error(`Seller ${listing.seller.username} does not have a Stripe Connect account`);
        return NextResponse.json(
          { error: 'Seller payment details not configured' }, 
          { status: 400 }
        );
      }
      
      // Calculate platform fee (e.g., 5% of the total)
      const platformFeePercent = process.env.PLATFORM_FEE_PERCENT 
        ? parseFloat(process.env.PLATFORM_FEE_PERCENT) 
        : 5;
      
      const price = listing.isSubscription 
        ? listing.subscriptionPrice! * 100 // Stripe uses cents
        : listing.price * 100;
      
      const platformFee = Math.round(price * (platformFeePercent / 100));
      
      // Create a payment session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: listing.name,
                description: listing.description,
                images: [listing.imageUrl]
              },
              unit_amount: price,
              ...(listing.isSubscription ? { recurring: { interval: 'month' } } : {})
            },
            quantity: 1,
          },
        ],
        mode: listing.isSubscription ? 'subscription' : 'payment',
        success_url: `${process.env.NEXT_PUBLIC_URL}/marketplace/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/marketplace/buy/${slug}`,
        payment_intent_data: listing.isSubscription ? undefined : {
          application_fee_amount: platformFee,
          transfer_data: {
            destination: sellerStripeAccountId,
          },
        },
        subscription_data: listing.isSubscription ? {
          application_fee_percent: platformFeePercent,
          transfer_data: {
            destination: sellerStripeAccountId,
          },
        } : undefined,
        metadata: {
          listingId: listing.id.toString(),
          sellerId: sellersSnapshot.empty ? null : sellersSnapshot.docs[0].id,
          buyerId: userId
        }
      });
      
      // Return the session ID to redirect to checkout
      return NextResponse.json({ 
        sessionId: session.id,
        url: session.url
      });
      
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }
  });
} 