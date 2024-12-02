export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Essential tools for small projects',
      features: [
        'Basic static site hosting',
        '5 repositories',
        'Community support'
      ],
      pricing: {
        monthly: {
          amount: 29,
          priceId: 'price_starter_monthly'
        },
        yearly: {
          amount: 290,
          priceId: 'price_starter_yearly',
          savings: 58
        }
      }
    },
    {
      id: 'pro',
      name: 'Professional',
      description: 'Advanced features for growing teams',
      features: [
        'Automated GitHub Pages',
        'Unlimited repositories',
        'Custom domains',
        'Priority support'
      ],
      pricing: {
        monthly: {
          amount: 99,
          priceId: 'price_pro_monthly'
        },
        yearly: {
          amount: 990,
          priceId: 'price_pro_yearly',
          savings: 198
        }
      }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Full-featured solution for large organizations',
      features: [
        'Everything in Pro',
        'Custom integrations',
        'Advanced security',
        'Dedicated support',
        'SLA guarantee'
      ],
      pricing: {
        monthly: {
          amount: 499,
          priceId: 'price_enterprise_monthly'
        },
        yearly: {
          amount: 4990,
          priceId: 'price_enterprise_yearly',
          savings: 998
        }
      }
    }
  ];