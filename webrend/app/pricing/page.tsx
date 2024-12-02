// app/pricing/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Toggle } from '../components/ui/toggle';
import { Check } from 'lucide-react';
import { SUBSCRIPTION_TIERS } from '../config/subscriptions';

export default function PricingPage() {
    const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>('monthly');
    const [loading, setLoading] = useState<string | null>(null);

    const handleSubscribe = async (priceId: string) => {
        setLoading(priceId);
        try {
            const userId = sessionStorage.getItem('userId');
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    priceId
                }),
            });

            const { sessionId } = await response.json();
            if (sessionId) {
                window.location.href = `/success?session_id=${sessionId}`;
            }
        } catch (error) {
            console.error('Subscription error:', error);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="container mx-auto py-10">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
                <p className="text-xl text-gray-600 mb-8">Scale your development with the right tools</p>
                
                <div className="flex items-center justify-center gap-4 mb-8">
                    <span className={billingFrequency === 'monthly' ? 'text-primary' : 'text-gray-500'}>
                        Monthly
                    </span>
                    <Toggle
                        pressed={billingFrequency === 'yearly'}
                        onPressedChange={(pressed) => setBillingFrequency(pressed ? 'yearly' : 'monthly')}
                        className="data-[state=on]:bg-primary"
                    />
                    <span className={billingFrequency === 'yearly' ? 'text-primary' : 'text-gray-500'}>
                        Yearly (save up to 20%)
                    </span>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {SUBSCRIPTION_TIERS.map((tier) => (
                    <Card key={tier.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle>{tier.name}</CardTitle>
                            <CardDescription>{tier.description}</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">
                                    ${billingFrequency === 'monthly' 
                                        ? tier.pricing.monthly.amount 
                                        : Math.round(tier.pricing.yearly.amount / 12)}
                                </span>
                                <span className="text-gray-600">/month</span>
                                {billingFrequency === 'yearly' && (
                                    <div className="text-sm text-green-600 mt-1">
                                        Save ${tier.pricing.yearly.savings}/year
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <ul className="space-y-3">
                                {tier.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <Check className="h-5 w-5 text-green-500" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                className="w-full" 
                                size="lg"
                                onClick={() => handleSubscribe(
                                    billingFrequency === 'monthly' 
                                        ? tier.pricing.monthly.priceId 
                                        : tier.pricing.yearly.priceId
                                )}
                                disabled={!!loading}
                            >
                                {loading === tier.id ? 'Processing...' : 'Subscribe'}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}