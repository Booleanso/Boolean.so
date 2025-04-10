'use client';

/**
 * Marketplace Sell Page
 * 
 * This component allows users to list their GitHub repositories for sale.
 * Instead of using Firebase client directly (which caused permission errors),
 * we now use secure server-side API routes to access Firestore.
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './sell.module.scss';
import { MarketplaceListing } from '../../api/marketplace/list-repo/route';

type RepositoryInfo = {
  id: number;
  name: string;
  description: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  stargazers_count: number;
  forks_count: number;
  language?: string;
  html_url?: string;
};

// Define the shape of the repository data returned from our API
interface GitHubApiRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  isPrivate: boolean;
  stars: number;
  forks: number;
  language: string | null;
  updatedAt: string;
}

export default function SellPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repoId = searchParams.get('repo');
  const isEditing = searchParams.get('edit') === 'true';
  const listingId = searchParams.get('listing');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form fields
  const [repoInfo, setRepoInfo] = useState<RepositoryInfo | null>(null);
  const [price, setPrice] = useState('');
  const [isSubscription, setIsSubscription] = useState(false);
  const [subscriptionPrice, setSubscriptionPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sellerUsername, setSellerUsername] = useState('');
  const [sellerAvatarUrl, setSellerAvatarUrl] = useState('');
  const [existingListing, setExistingListing] = useState<MarketplaceListing | null>(null);
  
  useEffect(() => {
    // Replace direct Firebase auth check with server API call
    const fetchCurrentUser = async () => {
      try {
        // Use our secure API endpoints to get user data
        const userResponse = await fetch('/api/user/get-current');
        
        if (!userResponse.ok) {
          if (userResponse.status === 401) {
            // Not authenticated, redirect to auth
            router.push('/auth?from=/marketplace/sell');
            return;
          }
          throw new Error('Failed to fetch user information');
        }
        
        const userData = await userResponse.json();
        
        // Check if user exists and has auth/firestore data
        if (userData) {
          // Get username from firestore data if available
          if (userData.firestore) {
            // Check bank details
            const bankDetailsAdded = userData.firestore.bankDetailsAdded || false;
            
            // If no bank details, show error but don't block
            if (!bankDetailsAdded) {
              setError('You need to add your bank account details in your profile before you can receive payments. You can still create a listing now.');
            }
            
            // Set username if available
            if (userData.firestore.username) {
              setSellerUsername(userData.firestore.username);
              localStorage.setItem('sellerUsername', userData.firestore.username);
            }
          }
          
          // Fallback to auth display name if needed
          if (!sellerUsername && userData.auth?.displayName) {
            setSellerUsername(userData.auth.displayName);
          } else if (!sellerUsername && userData.auth?.email) {
            setSellerUsername(userData.auth.email.split('@')[0]);
          }
        } else {
          // No user data found, redirect to auth
          router.push('/auth?from=/marketplace/sell');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        
        // Fallback to localStorage in case of error
        const storedUsername = localStorage.getItem('sellerUsername');
        if (storedUsername) {
          setSellerUsername(storedUsername);
        }
      }
    };

    fetchCurrentUser();
    
    // If editing an existing listing, fetch it
    if (isEditing && listingId) {
      fetchExistingListing(listingId);
    }
    // If creating a new listing and repo ID was provided, fetch repo info
    else if (repoId) {
      fetchRepoInfo(repoId);
    }
  }, [repoId, listingId, isEditing, router]);
  
  const fetchExistingListing = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch the listing from the API
      const response = await fetch(`/api/marketplace/listings/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch listing: ${response.status}`);
      }
      
      const data = await response.json();
      const listing = data.listing as MarketplaceListing;
      setExistingListing(listing);
      
      // Set form values from the listing
      setRepoInfo({
        id: listing.id,
        name: listing.name,
        description: listing.description,
        owner: {
          login: listing.seller.username,
          avatar_url: listing.seller.avatarUrl
        },
        stargazers_count: listing.stars,
        forks_count: listing.forks
      });
      
      setSellerUsername(listing.seller.username);
      setSellerAvatarUrl(listing.seller.avatarUrl);
      setImageUrl(listing.imageUrl);
      setIsSubscription(listing.isSubscription);
      
      if (listing.isSubscription && listing.subscriptionPrice) {
        setSubscriptionPrice(listing.subscriptionPrice.toString());
      } else if (listing.price) {
        setPrice(listing.price.toString());
      }
      
    } catch (err) {
      console.error('Error fetching listing:', err);
      setError('Failed to load listing information. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRepoInfo = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Make an API call to fetch the specific repository from our GitHub repos API
      const response = await fetch(`/api/github/repos`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch repositories: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Find the specific repository by ID
      const selectedRepo = data.repos.find((repo: GitHubApiRepo) => repo.id === parseInt(id));
      
      if (!selectedRepo) {
        throw new Error('Repository not found');
      }
      
      // Set the repository information
      const repoInfo: RepositoryInfo = {
        id: selectedRepo.id,
        name: selectedRepo.name,
        description: selectedRepo.description || 'No description provided',
        owner: {
          login: selectedRepo.fullName.split('/')[0], // Extract owner from full_name
          avatar_url: 'https://placehold.co/100/24292e/FFFFFF/png?text=GH' // Placeholder since we may not have the avatar URL
        },
        stargazers_count: selectedRepo.stars,
        forks_count: selectedRepo.forks
      };
      
      setRepoInfo(repoInfo);
      setSellerAvatarUrl(repoInfo.owner.avatar_url);
      
      // Generate a placeholder image URL
      setImageUrl(`https://placehold.co/600x400/0366d6/FFFFFF/png?text=${encodeURIComponent(repoInfo.name)}`);
      
    } catch (err) {
      console.error('Error fetching repository info:', err);
      setError('Failed to load repository information. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!repoInfo) {
      setError('No repository selected');
      return;
    }
    
    if (!isSubscription && !price) {
      setError('Price is required for one-time purchases');
      return;
    }
    
    if (isSubscription && !subscriptionPrice) {
      setError('Subscription price is required for subscription products');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Different flow for editing vs creating new listing
      if (isEditing && existingListing) {
        // Update existing listing using our Firestore access API
        const updateResponse = await fetch('/api/marketplace/firestore-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            operation: 'update',
            collection: 'listings',
            documentId: existingListing.id.toString(),
            data: {
              name: repoInfo.name,
              description: repoInfo.description,
              price: parseFloat(price),
              isSubscription,
              subscriptionPrice: isSubscription ? parseFloat(subscriptionPrice) : undefined,
              imageUrl,
              seller: {
                username: sellerUsername,
                avatarUrl: sellerAvatarUrl
              },
              stars: repoInfo.stargazers_count,
              forks: repoInfo.forks_count,
              lastUpdated: new Date().toISOString().split('T')[0],
              stripeProductId: existingListing.stripeProductId,
              stripePriceId: existingListing.stripePriceId,
              sold: existingListing.sold
            }
          })
        });
        
        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(errorData.error || 'Failed to update listing');
        }
        
        // Show success message
        setSuccess(true);
        
        // Redirect to marketplace after 2 seconds
        setTimeout(() => {
          router.push('/marketplace');
        }, 2000);
        
        return;
      }
      
      // Creating a new listing - first, create the product in Stripe
      const stripeResponse = await fetch('/api/stripe/create-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: repoInfo.name,
          description: repoInfo.description,
          price: parseFloat(price),
          isSubscription,
          subscriptionPrice: isSubscription ? parseFloat(subscriptionPrice) : undefined,
          repoId: repoInfo.id,
          seller: {
            username: sellerUsername,
            avatarUrl: sellerAvatarUrl
          },
          imageUrl
        })
      });
      
      if (!stripeResponse.ok) {
        const errorData = await stripeResponse.json();
        throw new Error(errorData.error || 'Failed to create Stripe product');
      }
      
      const stripeData = await stripeResponse.json();
      
      // Then, create the marketplace listing using our new Firestore access API
      const listingResponse = await fetch('/api/marketplace/firestore-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: 'create',
          collection: 'listings',
          data: {
            name: repoInfo.name,
            description: repoInfo.description,
            price: parseFloat(price),
            isSubscription,
            subscriptionPrice: isSubscription ? parseFloat(subscriptionPrice) : undefined,
            imageUrl,
            seller: {
              username: sellerUsername,
              avatarUrl: sellerAvatarUrl,
            },
            stars: repoInfo.stargazers_count,
            forks: repoInfo.forks_count,
            lastUpdated: new Date().toISOString().split('T')[0],
            stripeProductId: stripeData.productId,
            stripePriceId: stripeData.priceId,
            sold: false,
            // Store repository details for easier access
            repoId: repoInfo.id.toString(),
            language: repoInfo.language || 'Unknown',
            githubUrl: repoInfo.html_url || `https://github.com/${repoInfo.owner.login}/${repoInfo.name}`
          }
        })
      });
      
      if (!listingResponse.ok) {
        const errorData = await listingResponse.json();
        throw new Error(errorData.error || 'Failed to create marketplace listing');
      }
      
      // Show success message
      setSuccess(true);
      
      // Redirect to marketplace after 2 seconds
      setTimeout(() => {
        router.push('/marketplace');
      }, 2000);
      
    } catch (err) {
      console.error('Error listing repository for sale:', err);
      setError(err instanceof Error ? err.message : 'Failed to list repository for sale');
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.successMessage}>
          <h1>{isEditing ? 'Listing Updated Successfully!' : 'Repository Listed Successfully!'}</h1>
          <p>Your repository has been {isEditing ? 'updated' : 'listed'} on the marketplace. Redirecting to marketplace...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{isEditing ? 'Edit Repository Listing' : 'Sell Your Repository'}</h1>
      
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
      
      {loading && !repoInfo ? (
        <div className={styles.loading}>
          Loading {isEditing ? 'listing' : 'repository'} information...
        </div>
      ) : !repoInfo ? (
        <div className={styles.selectRepo}>
          <p>Select a repository from your profile to sell:</p>
          <a href="/profile" className={styles.profileLink}>
            Go to Your Profile
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.sellForm}>
          <div className={styles.formSection}>
            <h2>Repository Information</h2>
            
            <div className={styles.repoCard}>
              <h3>{repoInfo.name}</h3>
              <p>{repoInfo.description}</p>
              <div className={styles.repoStats}>
                <span>⭐ {repoInfo.stargazers_count}</span>
                <span>🍴 {repoInfo.forks_count}</span>
              </div>
            </div>
          </div>
          
          <div className={styles.formSection}>
            <h2>Repository Image</h2>
            <div className={styles.formGroup}>
              <label htmlFor="imageUrl">Image URL</label>
              <input 
                type="text" 
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className={styles.formInput}
                required
              />
              <div className={styles.imagePreview}>
                {imageUrl && (
                  <img 
                    src={imageUrl} 
                    alt="Repository Preview" 
                    className={styles.previewImage}
                  />
                )}
              </div>
            </div>
          </div>
          
          <div className={styles.formSection}>
            <h2>Pricing</h2>
            
            <div className={styles.pricingOptions}>
              <div className={styles.pricingOption}>
                <input 
                  type="radio" 
                  id="oneTime" 
                  name="pricingType"
                  checked={!isSubscription}
                  onChange={() => setIsSubscription(false)}
                />
                <label htmlFor="oneTime">One-time Purchase</label>
              </div>
              
              <div className={styles.pricingOption}>
                <input 
                  type="radio" 
                  id="subscription" 
                  name="pricingType"
                  checked={isSubscription}
                  onChange={() => setIsSubscription(true)}
                />
                <label htmlFor="subscription">Monthly Subscription</label>
              </div>
            </div>
            
            {!isSubscription ? (
              <div className={styles.formGroup}>
                <label htmlFor="price">Price ($)</label>
                <input 
                  type="number" 
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="1"
                  step="0.01"
                  className={styles.formInput}
                  required={!isSubscription}
                />
                <p className={styles.feeInfo}>
                  Platform fee: 2.5% (${price ? (parseFloat(price) * 0.025).toFixed(2) : '0.00'})
                </p>
              </div>
            ) : (
              <div className={styles.formGroup}>
                <label htmlFor="subscriptionPrice">Monthly Subscription Price ($)</label>
                <input 
                  type="number" 
                  id="subscriptionPrice"
                  value={subscriptionPrice}
                  onChange={(e) => setSubscriptionPrice(e.target.value)}
                  min="1"
                  step="0.01"
                  className={styles.formInput}
                  required={isSubscription}
                />
                <p className={styles.feeInfo}>
                  Platform fee: 2.5% (${subscriptionPrice ? (parseFloat(subscriptionPrice) * 0.025).toFixed(2) : '0.00'}/month)
                </p>
              </div>
            )}
          </div>
          
          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={() => router.push('/profile')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading 
                ? 'Processing...' 
                : isEditing 
                  ? 'Update Listing' 
                  : 'List Repository for Sale'
              }
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
