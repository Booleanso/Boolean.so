'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './buy.module.scss';
import { auth } from '../../../lib/firebase-client';
import { onAuthStateChanged } from 'firebase/auth';
import { MarketplaceListing } from '../../../api/marketplace/list-repo/route';

// Define the proper params interface
interface BuyPageProps {
  params: {
    id: string;
  };
}

export default function BuyPage({ params }: BuyPageProps) {
  const router = useRouter();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [showGithubTransferInfo, setShowGithubTransferInfo] = useState(false);
  
  // Safely access the id from params
  const repoId = params?.id;

  // Check if user is authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    
    return () => unsubscribe();
  }, []);

  // Fetch the repository details
  useEffect(() => {
    const fetchListing = async () => {
      if (!repoId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the listing details from the API
        const response = await fetch(`/api/marketplace/listings/${repoId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch repository details. Status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.listing) {
          setListing(data.listing);
        } else {
          setError('Repository not found');
        }
      } catch (err) {
        console.error('Error fetching repository details:', err);
        setError('Failed to load repository details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchListing();
  }, [repoId]);

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=' + encodeURIComponent(`/marketplace/buy/${repoId}`));
      return;
    }
    
    if (!listing) return;
    
    try {
      setPurchaseLoading(true);
      setPurchaseError(null);
      
      // Create a checkout session for the purchase using Stripe
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: listing.id,
          priceId: listing.stripePriceId, // Use the stored Stripe Price ID
          isSubscription: listing.isSubscription,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const { sessionUrl } = await response.json();
      
      if (sessionUrl) {
        // Redirect to Stripe Checkout
        window.location.href = sessionUrl;
      } else {
        // For demo/test purposes, simulate a successful purchase directly
        // In a real application, you'd always redirect to Stripe
        await handleSuccessfulPurchase();
      }
    } catch (err) {
      console.error('Error initiating purchase:', err);
      setPurchaseError(err instanceof Error ? err.message : 'Failed to process purchase');
    } finally {
      setPurchaseLoading(false);
    }
  };
  
  const handleSuccessfulPurchase = async () => {
    if (!listing) return;
    
    try {
      // Simulate the post-purchase actions
      setPurchaseLoading(true);
      
      // Artificial delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For one-time purchases, show the GitHub transfer info
      if (!listing.isSubscription) {
        setShowGithubTransferInfo(true);
      } else {
        // For subscriptions, show success immediately
        setPurchaseSuccess(true);
      }
      
      // Record the purchase in the user's account
      // This would be done by the webhook in a real implementation
      await fetch('/api/payments/record-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: listing.id,
          purchaseType: listing.isSubscription ? 'subscription' : 'purchase',
        }),
      });
      
    } catch (err) {
      console.error('Error processing purchase:', err);
      setPurchaseError('Purchase was successful but there was an issue processing the repository transfer');
    } finally {
      setPurchaseLoading(false);
    }
  };
  
  const completeGithubTransfer = async () => {
    if (!listing) return;
    
    try {
      setPurchaseLoading(true);
      
      // Simulate GitHub repository transfer process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real application, this would initiate GitHub's repository transfer API
      // and would be handled by a background job or webhook
      
      setPurchaseSuccess(true);
    } catch (err) {
      console.error('Error transferring repository:', err);
      setPurchaseError('Failed to transfer the GitHub repository');
    } finally {
      setPurchaseLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading repository details...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <Link href="/marketplace" className={styles.backButton}>
          Return to Marketplace
        </Link>
      </div>
    );
  }
  
  if (!listing) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Repository not found</div>
        <Link href="/marketplace" className={styles.backButton}>
          Return to Marketplace
        </Link>
      </div>
    );
  }
  
  if (purchaseSuccess) {
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
            {listing.isSubscription
              ? `You now have access to "${listing.name}" repository. You can access it from your profile.`
              : `The "${listing.name}" repository has been transferred to your GitHub account.`
            }
          </p>
          <div className={styles.successActions}>
            <Link href="/profile" className={styles.viewProfileButton}>
              View in Your Profile
            </Link>
            <Link href="/marketplace" className={styles.backToMarketplaceButton}>
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (showGithubTransferInfo) {
    return (
      <div className={styles.container}>
        <div className={styles.transferInfo}>
          <h1>Authorize GitHub Repository Transfer</h1>
          <p>
            You&apos;ve successfully purchased <strong>{listing.name}</strong>. The next step is to transfer
            the repository to your GitHub account.
          </p>
          <div className={styles.transferInstructions}>
            <h2>What happens next:</h2>
            <ol>
              <li>The seller will initiate a repository transfer to your GitHub account.</li>
              <li>You&apos;ll receive an email from GitHub with a link to accept the transfer.</li>
              <li>Once accepted, the repository will appear in your GitHub account.</li>
            </ol>
          </div>
          <div className={styles.transferActions}>
            <button 
              className={styles.completeTransferButton}
              onClick={completeGithubTransfer}
              disabled={purchaseLoading}
            >
              {purchaseLoading ? 'Processing...' : 'Complete & Simulate Transfer'}
            </button>
            <p className={styles.transferNote}>
              Note: In a real implementation, the transfer would be handled automatically by GitHub&apos;s API.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.buyContainer}>
        <div className={styles.productInfo}>
          <div className={styles.productImage}>
            <Image
              src={listing.imageUrl}
              alt={listing.name}
              width={600}
              height={400}
              layout="responsive"
            />
          </div>
          <div className={styles.productDetails}>
            <h1 className={styles.productTitle}>{listing.name}</h1>
            <div className={styles.sellerInfo}>
              <div className={styles.sellerAvatar}>
                <Image
                  src={listing.seller.avatarUrl}
                  alt={listing.seller.username}
                  width={24}
                  height={24}
                />
              </div>
              <span>By {listing.seller.username}</span>
            </div>
            <div className={styles.productStats}>
              <div className={styles.stat}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                {listing.stars}
              </div>
              <div className={styles.stat}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="6" y1="3" x2="6" y2="15"></line>
                  <circle cx="18" cy="6" r="3"></circle>
                  <circle cx="6" cy="18" r="3"></circle>
                  <path d="M18 9a9 9 0 0 1-9 9"></path>
                </svg>
                {listing.forks}
              </div>
              <div className={styles.stat}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Last updated: {new Date(listing.lastUpdated).toLocaleDateString()}
              </div>
            </div>
            <div className={styles.productDescription}>
              <h2>Description</h2>
              <p>{listing.description}</p>
            </div>
          </div>
        </div>
        
        <div className={styles.purchaseCard}>
          <div className={styles.purchaseType}>
            {listing.isSubscription ? 'Subscription' : 'One-time Purchase'}
          </div>
          <div className={styles.price}>
            {listing.isSubscription
              ? `$${listing.subscriptionPrice}/month`
              : `$${listing.price}`
            }
          </div>
          {listing.isSubscription && (
            <div className={styles.subscriptionInfo}>
              Ongoing monthly subscription. Cancel anytime.
            </div>
          )}
          {!listing.isSubscription && (
            <div className={styles.oneTimeInfo}>
              One-time purchase. Full repository transfer to your GitHub account.
            </div>
          )}
          
          {!isAuthenticated && (
            <div className={styles.purchaseError}>
              User not authenticated
            </div>
          )}
          
          {purchaseError && (
            <div className={styles.purchaseError}>
              {purchaseError}
            </div>
          )}
          
          <button
            className={styles.buyButton}
            onClick={handlePurchase}
            disabled={purchaseLoading}
          >
            {purchaseLoading 
              ? 'Processing...' 
              : listing.isSubscription 
                ? 'Subscribe Now' 
                : 'Buy Now'
            }
          </button>
          
          <div className={styles.secureInfo}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>Secure payment via Stripe</span>
          </div>
          
          <div className={styles.purchaseDetails}>
            <div className={styles.purchaseDetail}>
              <span>You get:</span>
              <ul>
                <li>Full source code access</li>
                {listing.isSubscription ? (
                  <li>Monthly access renewal</li>
                ) : (
                  <li>Repository ownership transfer</li>
                )}
                <li>Issue support from the seller</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.actions}>
        <Link href="/marketplace" className={styles.backButton}>
          Back to Marketplace
        </Link>
      </div>
    </div>
  );
} 