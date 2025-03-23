import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '../../../lib/firebase-admin';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20'
});

// This should be your webhook endpoint secret from the Stripe dashboard
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') as string;
  
  let event;
  
  try {
    if (!endpointSecret) {
      throw new Error('Stripe webhook secret is not set');
    }
    
    // Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return new NextResponse('Webhook signature verification failed', { status: 400 });
  }
  
  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        // For subscription renewals
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        // For subscription cancellations
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return new NextResponse('Success', { status: 200 });
  } catch (error) {
    console.error(`Error handling webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return new NextResponse('Error processing webhook', { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (!session.metadata) {
    console.log('No metadata in session');
    return;
  }
  
  const { 
    listingId, 
    repoId, 
    sellerId, 
    buyerId, 
    pricingType,
    buyerGithubUsername 
  } = session.metadata;
  
  if (!listingId || !repoId || !sellerId || !buyerId) {
    console.log('Missing required metadata');
    return;
  }
  
  // Get listing and user information
  const listingDoc = await db.collection('listings').doc(listingId).get();
  if (!listingDoc.exists) {
    console.log(`Listing ${listingId} not found`);
    return;
  }
  
  const sellerDoc = await db.collection('customers').doc(sellerId).get();
  if (!sellerDoc.exists) {
    console.log(`Seller ${sellerId} not found`);
    return;
  }
  
  const sellerData = sellerDoc.data();
  
  // Record the transaction
  const transactionData = {
    listingId,
    repoId,
    sellerId,
    buyerId,
    sellerGithubUsername: sellerData?.githubUsername,
    buyerGithubUsername,
    pricingType,
    stripeSessionId: session.id,
    stripePaymentIntentId: session.payment_intent,
    stripeSubscriptionId: session.subscription,
    amount: session.amount_total,
    status: 'completed',
    createdAt: new Date().toISOString()
  };
  
  // Save the transaction
  const transactionRef = await db.collection('transactions').add(transactionData);
  
  // For one-time purchases, initiate repository transfer
  if (pricingType === 'onetime') {
    // Call our repository transfer API
    await fetch(`${process.env.NEXT_PUBLIC_URL}/api/github/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        repoId,
        sellerId,
        buyerId,
        isSinglePurchase: true,
        transactionId: transactionRef.id
      })
    });
  } else {
    // For subscriptions, add buyer as a collaborator
    await fetch(`${process.env.NEXT_PUBLIC_URL}/api/github/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        repoId,
        sellerId,
        buyerId,
        isSinglePurchase: false,
        transactionId: transactionRef.id
      })
    });
    
    // Create a subscription record
    await db.collection('subscriptions').add({
      listingId,
      repoId,
      sellerId,
      buyerId,
      stripeSubscriptionId: session.subscription,
      status: 'active',
      startDate: new Date().toISOString(),
      transactionId: transactionRef.id
    });
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Only process subscription invoice payments
  if (!invoice.subscription) {
    return;
  }
  
  // Find the subscription in our database
  const subscriptionsQuery = await db.collection('subscriptions')
    .where('stripeSubscriptionId', '==', invoice.subscription)
    .limit(1)
    .get();
    
  if (subscriptionsQuery.empty) {
    console.log(`Subscription ${invoice.subscription} not found`);
    return;
  }
  
  const subscriptionDoc = subscriptionsQuery.docs[0];
  const subscription = subscriptionDoc.data();
  
  // Record the renewal payment
  await db.collection('transactions').add({
    listingId: subscription.listingId,
    repoId: subscription.repoId,
    sellerId: subscription.sellerId,
    buyerId: subscription.buyerId,
    stripeInvoiceId: invoice.id,
    stripeSubscriptionId: invoice.subscription,
    amount: invoice.amount_paid,
    status: 'completed',
    type: 'subscription_renewal',
    createdAt: new Date().toISOString()
  });
  
  // Update the subscription with new billing period
  await subscriptionDoc.ref.update({
    lastBillingDate: new Date().toISOString(),
    status: 'active'
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Find the subscription in our database
  const subscriptionsQuery = await db.collection('subscriptions')
    .where('stripeSubscriptionId', '==', subscription.id)
    .limit(1)
    .get();
    
  if (subscriptionsQuery.empty) {
    console.log(`Subscription ${subscription.id} not found`);
    return;
  }
  
  const subscriptionDoc = subscriptionsQuery.docs[0];
  const subscriptionData = subscriptionDoc.data();
  
  // Update the subscription status
  await subscriptionDoc.ref.update({
    status: 'canceled',
    canceledAt: new Date().toISOString()
  });
  
  // Revoke repository access
  await fetch(`${process.env.NEXT_PUBLIC_URL}/api/github/revoke-access`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscriptionId: subscriptionDoc.id,
      buyerId: subscriptionData.buyerId,
      repoId: subscriptionData.repoId
    })
  });
} 