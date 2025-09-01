import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: Request) {
  try {
    const { 
      name, 
      description, 
      price, 
      isSubscription, 
      subscriptionPrice, 
      repoId, 
      seller,
      imageUrl 
    } = await request.json();
    
    // Use the Stripe secret key from environment variables
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key is not configured in environment variables');
    }
    
    // Initialize Stripe with the API key from environment variables
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia',
    });
    
    // Create a product in Stripe
    const product = await stripe.products.create({
      name,
      description,
      metadata: {
        repoId,
        sellerUsername: seller.username
      },
      images: [imageUrl]
    });
    
    // Create a price for the product
    let priceObject;
    
    if (isSubscription) {
      priceObject = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(subscriptionPrice * 100), // Convert to cents
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        metadata: {
          platformFee: '2.5%'
        }
      });
    } else {
      priceObject = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(price * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          platformFee: '2.5%'
        }
      });
    }
    
    // Return success response with the product and price IDs
    return NextResponse.json({ 
      success: true, 
      productId: product.id,
      priceId: priceObject.id
    });
    
  } catch (error: Error | unknown) {
    console.error('Error creating Stripe product:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create Stripe product';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 