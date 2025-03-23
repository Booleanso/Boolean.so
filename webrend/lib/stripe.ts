import Stripe from 'stripe';

// Initialize Stripe with API version
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2024-06-20',  // Use the latest API version
});

// Platform fee percentage
export const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT || '5');

// Format amount for Stripe (converts dollars to cents)
export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount * 100);
};

// Format amount from Stripe (converts cents to dollars)
export const formatAmountFromStripe = (amount: number): number => {
  return amount / 100;
};

// Calculate platform fee amount
export const calculatePlatformFee = (amount: number): number => {
  return Math.round((amount * PLATFORM_FEE_PERCENT) / 100);
};

// Get public key for frontend
export const getStripePublicKey = (): string => {
  const key = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error('Stripe publishable key is not set in environment variables');
  }
  return key;
};

/**
 * Create a Stripe Connect account
 * @param email User's email
 * @param country Two-letter country code
 * @returns Stripe account object
 */
export const createConnectAccount = async (email: string, country: string = 'US') => {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
    });

    return account;
  } catch (error) {
    console.error('Error creating Connect account:', error);
    throw error;
  }
};

/**
 * Create an account onboarding link
 * @param accountId Stripe account ID
 * @param refreshUrl URL to redirect if onboarding is refreshed
 * @param returnUrl URL to redirect after onboarding is complete
 * @returns Onboarding URL
 */
export const createAccountLink = async (
  accountId: string,
  refreshUrl: string,
  returnUrl: string
) => {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return accountLink;
  } catch (error) {
    console.error('Error creating account link:', error);
    throw error;
  }
};

/**
 * Check if a connected account has completed onboarding
 * @param accountId Stripe account ID
 * @returns Boolean indicating if onboarding is complete
 */
export const isAccountOnboardingComplete = async (accountId: string): Promise<boolean> => {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    
    // Check if charges are enabled (indicates account is ready)
    return account.charges_enabled === true;
  } catch (error) {
    console.error('Error checking account status:', error);
    return false;
  }
};

/**
 * Create a login link for connected account
 * @param accountId Stripe account ID
 * @returns Login link URL
 */
export const createLoginLink = async (accountId: string) => {
  try {
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    return loginLink.url;
  } catch (error) {
    console.error('Error creating login link:', error);
    throw error;
  }
};

/**
 * Create a Stripe product for a repository
 * @param name Product name
 * @param description Product description
 * @param images Array of image URLs
 * @param metadata Additional metadata
 * @returns Stripe product
 */
export const createProduct = async (
  name: string,
  description: string,
  images: string[] = [],
  metadata: Record<string, string> = {}
) => {
  try {
    return await stripe.products.create({
      name,
      description,
      images,
      metadata,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

/**
 * Create a one-time price for a product
 * @param productId Stripe product ID
 * @param unitAmount Price in cents
 * @param currency Three-letter currency code
 * @param metadata Additional metadata
 * @returns Stripe price
 */
export const createOneTimePrice = async (
  productId: string,
  unitAmount: number,
  currency: string = 'usd',
  metadata: Record<string, string> = {}
) => {
  try {
    return await stripe.prices.create({
      product: productId,
      unit_amount: unitAmount,
      currency,
      metadata,
    });
  } catch (error) {
    console.error('Error creating one-time price:', error);
    throw error;
  }
};

/**
 * Create a recurring price for a product
 * @param productId Stripe product ID
 * @param unitAmount Price in cents
 * @param interval Billing interval
 * @param intervalCount Number of intervals between billings
 * @param currency Three-letter currency code
 * @param metadata Additional metadata
 * @returns Stripe price
 */
export const createRecurringPrice = async (
  productId: string,
  unitAmount: number,
  interval: 'day' | 'week' | 'month' | 'year' = 'month',
  intervalCount: number = 1,
  currency: string = 'usd',
  metadata: Record<string, string> = {}
) => {
  try {
    return await stripe.prices.create({
      product: productId,
      unit_amount: unitAmount,
      currency,
      recurring: {
        interval,
        interval_count: intervalCount,
      },
      metadata,
    });
  } catch (error) {
    console.error('Error creating recurring price:', error);
    throw error;
  }
};

/**
 * Create a checkout session
 * @param params Checkout session parameters
 * @returns Checkout session
 */
export const createCheckoutSession = async (params: {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
  clientReferenceId?: string;
  metadata?: Record<string, string>;
  mode: 'payment' | 'subscription';
  applicationFeeAmount?: number;
  connectedAccountId?: string;
}) => {
  try {
    const {
      priceId,
      successUrl,
      cancelUrl,
      customerId,
      clientReferenceId,
      metadata,
      mode,
      applicationFeeAmount,
      connectedAccountId,
    } = params;
    
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: clientReferenceId,
      metadata,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
    };
    
    // Add customer ID if provided
    if (customerId) {
      sessionParams.customer = customerId;
    }
    
    // Add application fee if provided (for Connected accounts)
    if (applicationFeeAmount && connectedAccountId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
      };
      
      // Create session on the connected account
      return await stripe.checkout.sessions.create(sessionParams, {
        stripeAccount: connectedAccountId,
      });
    }
    
    // Create regular session
    return await stripe.checkout.sessions.create(sessionParams);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}; 