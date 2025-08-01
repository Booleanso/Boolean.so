'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './success.module.scss';

function SuccessPageContent() {
  const searchParams = useSearchParams();
  // const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState<{
    name?: string;
    isSubscription?: boolean;
    selfPurchase?: boolean;
  }>({});

  useEffect(() => {
    const processCheckout = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        
        if (!sessionId) {
          console.error('No session_id found in URL params');
          setError('Invalid checkout session');
          setLoading(false);
          return;
        }
        
        console.log('Verifying session ID:', sessionId);
        
        // Verify the checkout session with the server
        const response = await fetch('/api/payments/verify-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response from verify-session:', errorData);
          throw new Error(errorData.error || 'Failed to verify checkout session');
        }
        
        const data = await response.json();
        console.log('Session verification successful:', data);
        
        // If the purchase was successful, trigger the transfer process
        if (data.success) {
          setPurchaseDetails({
            name: data.listing?.name || 'Repository',
            isSubscription: data.listing?.isSubscription
          });
          
          // For non-subscription purchases, initiate the GitHub transfer process
          if (!data.listing?.isSubscription) {
            console.log('Initiating GitHub transfer for purchase:', data.purchaseId);
            // This endpoint is responsible for initiating the GitHub transfer
            const transferResponse = await fetch('/api/github/initiate-transfer', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                purchaseId: data.purchaseId,
                listingId: data.listing.id,
                documentId: data.listing.docId || data.listing.id,
              }),
            });
            
            if (!transferResponse.ok) {
              const transferError = await transferResponse.json();
              console.error('Failed to initiate transfer:', transferError);
              // We still set success to true since the purchase succeeded
            } else {
              // Check if this was a self-purchase
              const transferResult = await transferResponse.json();
              if (transferResult.selfPurchase) {
                setPurchaseDetails(prev => ({
                  ...prev,
                  selfPurchase: true
                }));
              }
            }
          }
          
          setSuccess(true);
        } else {
          console.error('Purchase verification failed:', data);
          setError('Purchase verification failed');
        }
      } catch (err) {
        console.error('Error processing checkout:', err);
        setError(err instanceof Error ? err.message : 'An error occurred during checkout');
      } finally {
        setLoading(false);
      }
    };
    
    processCheckout();
  }, [searchParams]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingMessage}>
          <div className={styles.loadingSpinner}></div>
          <h2>Processing your purchase...</h2>
          <p>Please wait while we complete your transaction.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          <div className={styles.errorIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2>Payment Error</h2>
          <p>{error}</p>
          <Link href="/marketplace" className={styles.button}>
            Return to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.successMessage}>
        <div className={styles.successIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h1>Purchase Successful!</h1>
        <p>
          {purchaseDetails.isSubscription
            ? `You now have access to "${purchaseDetails.name}" repository. You can access it from your profile.`
            : purchaseDetails.selfPurchase
              ? `You've successfully purchased "${purchaseDetails.name}". Since you're also the seller, no transfer is needed - you already own this repository.`
              : `The "${purchaseDetails.name}" repository transfer has been initiated. You will receive an email from GitHub when the transfer is ready to accept.`
          }
        </p>
        <div className={styles.actions}>
          <Link href="/profile" className={styles.primaryButton}>
            View in Your Profile
          </Link>
          <Link href="/marketplace" className={styles.secondaryButton}>
            Back to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function SuccessPageLoading() {
  return (
    <div className={styles.container}>
      <div className={styles.loadingMessage}>
        <div className={styles.loadingSpinner}></div>
        <h2>Loading purchase information...</h2>
        <p>Please wait while we load your purchase details.</p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<SuccessPageLoading />}>
      <SuccessPageContent />
    </Suspense>
  );
} 