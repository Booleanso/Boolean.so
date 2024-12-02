type BillingFrequency = 'monthly' | 'yearly';

interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  features: string[];
  pricing: {
    monthly: {
      amount: number;
      priceId: string;
    };
    yearly: {
      amount: number;
      priceId: string;
      savings: number;
    };
  };
}