'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './success.module.scss';

function SuccessPageContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactionDetails, setTransactionDetails] = useState<{
    repositoryName?: string;
    transactionType?: 'purchase' | 'subscription';
    sellerName?: string;
  }>({});
  
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError('No transaction information found. Please check your purchases in your account.');
      setLoading(false);
      return;
    }
    
    async function verifyTransaction() {
      try {
        // Make a real API call to verify the Stripe session
        const response = await fetch('/api/payments/verify-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to verify transaction');
        }
        
        const data = await response.json();
        
        if (data.success && data.listing) {
          // Set real transaction details from the API response
          setTransactionDetails({
            repositoryName: data.listing.name,
            transactionType: data.listing.isSubscription ? 'subscription' : 'purchase',
            sellerName: data.listing.sellerId || 'Repository Owner'
          });
        } else {
          throw new Error('Transaction verification failed');
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to verify transaction. Please contact support if you believe this is an error.');
        setLoading(false);
        console.error('Error verifying transaction:', err);
      }
    }
    
    verifyTransaction();
  }, [sessionId]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}>Verifying your transaction...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h1>Transaction Error</h1>
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
      <div className={styles.successCard}>
        <div className={styles.successIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        
        <h1 className={styles.title}>Transaction Successful!</h1>
        
        <p className={styles.message}>
          {transactionDetails.transactionType === 'purchase'
            ? 'Congratulations on your purchase! The repository has been transferred to your GitHub account.'
            : 'Thank you for your subscription! You now have collaborator access to the repository.'}
        </p>
        
        <div className={styles.details}>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Repository:</div>
            <div className={styles.detailValue}>{transactionDetails.repositoryName}</div>
          </div>
          
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Transaction Type:</div>
            <div className={styles.detailValue}>
              {transactionDetails.transactionType === 'purchase' ? 'One-time Purchase' : 'Monthly Subscription'}
            </div>
          </div>
          
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>Seller:</div>
            <div className={styles.detailValue}>{transactionDetails.sellerName}</div>
          </div>
        </div>
        
        <div className={styles.nextSteps}>
          <h2>Next Steps</h2>
          <ul>
            <li>Check your GitHub account for access to the repository</li>
            <li>Clone the repository to your local machine</li>
            <li>Review the README for setup instructions</li>
          </ul>
        </div>
        
        <div className={styles.buttons}>
          <Link href="/profile" className={styles.button}>
            View My Purchases
          </Link>
          <Link href="/marketplace" className={styles.button}>
            Explore More Repositories
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
      <div className={styles.loadingSpinner}>Loading success page...</div>
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