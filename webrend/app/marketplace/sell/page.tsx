'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './sell.module.scss';

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
};

export default function SellPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repoId = searchParams.get('repo');
  
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
  
  useEffect(() => {
    // Check if bank details are added
    const bankDetailsAdded = localStorage.getItem('stripeBankDetailsAdded') === 'true';
    if (!bankDetailsAdded) {
      setError('You need to add your bank details in your profile before selling repos.');
      return;
    }
    
    // If repo ID was provided, fetch repo info
    if (repoId) {
      fetchRepoInfo(repoId);
    }
  }, [repoId]);
  
  const fetchRepoInfo = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Normally, we would make an API call to fetch repo details
      // For demo purposes, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate a sample repo based on the ID
      const mockRepo: RepositoryInfo = {
        id: parseInt(id),
        name: `Repository ${id}`,
        description: `This is a sample repository with ID ${id}. In a real application, this would be fetched from GitHub's API.`,
        owner: {
          login: 'yourusername',
          avatar_url: 'https://placehold.co/100/24292e/FFFFFF/png?text=YU'
        },
        stargazers_count: Math.floor(Math.random() * 100),
        forks_count: Math.floor(Math.random() * 30)
      };
      
      setRepoInfo(mockRepo);
      setSellerUsername(mockRepo.owner.login);
      setSellerAvatarUrl(mockRepo.owner.avatar_url);
      
      // Generate a placeholder image URL
      setImageUrl(`https://placehold.co/600x400/0366d6/FFFFFF/png?text=${encodeURIComponent(mockRepo.name)}`);
      
    } catch (err) {
      console.error('Error fetching repository info:', err);
      setError('Failed to load repository information');
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
    
    if (!price && !isSubscription) {
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
      
      // First, create the product in Stripe
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
      
      // Then, create the marketplace listing
      const listingResponse = await fetch('/api/marketplace/list-repo', {
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
          imageUrl,
          seller: {
            username: sellerUsername,
            avatarUrl: sellerAvatarUrl
          },
          stars: repoInfo.stargazers_count,
          forks: repoInfo.forks_count,
          lastUpdated: new Date().toISOString().split('T')[0],
          stripeProductId: stripeData.productId,
          stripePriceId: stripeData.priceId
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
          <h1>Repository Listed Successfully!</h1>
          <p>Your repository has been listed on the marketplace. Redirecting to marketplace...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Sell Your Repository</h1>
      
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
      
      {loading && !repoInfo ? (
        <div className={styles.loading}>
          Loading repository information...
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
          
          <div className={styles.formSection}>
            <h2>Seller Information</h2>
            <div className={styles.formGroup}>
              <label htmlFor="sellerUsername">Your Username</label>
              <input 
                type="text" 
                id="sellerUsername"
                value={sellerUsername}
                onChange={(e) => setSellerUsername(e.target.value)}
                className={styles.formInput}
                required
              />
            </div>
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
              {loading ? 'Processing...' : 'List Repository for Sale'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
