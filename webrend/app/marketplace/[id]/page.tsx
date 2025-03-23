'use client';

import { useState, useEffect } from 'react';
// Removing unused import
// import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './detail.module.scss';

type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  pricingType: 'onetime' | 'subscription';
  subscriptionPrice?: number;
  images: string[];
  sellerId: string;
  sellerName?: string;
  repoId: number;
  repoName: string;
  repoOwner: string;
  createdAt: string;
  language?: string;
  stars?: number;
};

export default function RepositoryDetailPage({ params }: { params: { id: string } }) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  useEffect(() => {
    async function fetchListing() {
      try {
        setLoading(true);
        // In a real app, fetch from API
        // For demo, we'll create mock data based on the ID
        // In a real implementation, you would fetch the actual listing data from the database

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock data for the detail view
        const mockListing: Listing = {
          id: params.id,
          title: 'Advanced React Component Library',
          description: 'A comprehensive library of React components with full TypeScript support, theming capabilities, and accessibility features. Includes form elements, navigation components, data display widgets, and more.',
          price: params.id.endsWith('1') ? 49.99 : 79.99,
          pricingType: params.id.endsWith('1') ? 'onetime' : 'subscription',
          subscriptionPrice: params.id.endsWith('1') ? undefined : 9.99,
          images: [
            'https://placehold.co/800x600/4299e1/ffffff?text=Component+Preview+1',
            'https://placehold.co/800x600/38b2ac/ffffff?text=Component+Preview+2',
            'https://placehold.co/800x600/667eea/ffffff?text=Code+Sample'
          ],
          sellerId: 'user123',
          sellerName: 'DevShop Solutions',
          repoId: 123456789,
          repoName: 'advanced-react-components',
          repoOwner: 'devshop',
          createdAt: '2023-06-15',
          language: 'TypeScript',
          stars: 245
        };

        setListing(mockListing);
      } catch (err) {
        setError('Failed to load repository details');
        console.error('Error fetching repository details:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchListing();
  }, [params.id]);

  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);
      
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: listing?.id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      setError(`Checkout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Error during checkout:', error);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}>Loading repository details...</div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {error || 'Repository not found'}
          <Link href="/marketplace" className={styles.backLink}>
            Return to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.breadcrumbs}>
          <Link href="/marketplace">Marketplace</Link> / {listing.title}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.gallery}>
          {listing.images.length > 0 && (
            <div className={styles.mainImage}>
              <Image 
                src={listing.images[0]} 
                alt={listing.title} 
                width={800} 
                height={600}
                style={{ width: '100%', height: 'auto' }}
              />
            </div>
          )}
          
          {listing.images.length > 1 && (
            <div className={styles.thumbnails}>
              {listing.images.map((image, index) => (
                <div className={styles.thumbnail} key={index}>
                  <Image 
                    src={image} 
                    alt={`${listing.title} preview ${index + 1}`} 
                    width={150} 
                    height={150}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.details}>
          <h1 className={styles.title}>{listing.title}</h1>
          
          <div className={styles.repoInfo}>
            <div className={styles.repoOwner}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
              <span>{listing.repoOwner}/{listing.repoName}</span>
            </div>
            
            {listing.language && (
              <div className={styles.repoLanguage}>
                <span className={styles.languageDot}></span>
                <span>{listing.language}</span>
              </div>
            )}
            
            {listing.stars !== undefined && (
              <div className={styles.repoStars}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <span>{listing.stars}</span>
              </div>
            )}
          </div>
          
          <div className={styles.pricing}>
            {listing.pricingType === 'onetime' ? (
              <>
                <div className={styles.price}>${listing.price.toFixed(2)}</div>
                <div className={styles.pricingType}>One-time purchase</div>
              </>
            ) : (
              <>
                <div className={styles.price}>${listing.subscriptionPrice?.toFixed(2)}<span>/month</span></div>
                <div className={styles.pricingType}>Monthly subscription</div>
              </>
            )}
          </div>

          <div className={styles.purchaseOptions}>
            <button 
              className={styles.purchaseButton}
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? 'Processing...' : listing.pricingType === 'onetime' ? 'Buy Now' : 'Subscribe Now'}
            </button>
            
            {error && <div className={styles.checkoutError}>{error}</div>}
            
            <div className={styles.purchaseInfo}>
              {listing.pricingType === 'onetime' ? (
                <p>You&apos;ll get full ownership of this repository after purchase.</p>
              ) : (
                <p>You&apos;ll get collaborator access to this repository for as long as your subscription is active.</p>
              )}
            </div>
          </div>
          
          <div className={styles.sellerInfo}>
            <h3>About the Seller</h3>
            <div className={styles.seller}>
              <div className={styles.sellerAvatar}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div className={styles.sellerDetails}>
                <div className={styles.sellerName}>{listing.sellerName}</div>
                <div className={styles.sellerSince}>Seller since {new Date(listing.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.description}>
        <h2>Description</h2>
        <div className={styles.descriptionText}>
          <p>{listing.description}</p>
        </div>
      </div>
    </div>
  );
} 