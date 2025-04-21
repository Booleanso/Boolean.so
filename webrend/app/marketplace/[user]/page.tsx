'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from '../marketplace.module.scss';

// Import the type from our API
import { MarketplaceListing } from '../../api/marketplace/list-repo/route';

export default function UserMarketplace() {
  const params = useParams();
  const username = params.user as string;
  
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeSold, setIncludeSold] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  // Fetch listings when component mounts
  useEffect(() => {
    const fetchUserListings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch listings for the specific user
        const response = await fetch(`/api/marketplace/listings?username=${encodeURIComponent(username)}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const fetchedListings = data.listings || [];
        setListings(fetchedListings);
      } catch (err) {
        console.error('Error fetching user marketplace listings:', err);
        setError('Failed to load listings. Please try again later.');
        setListings([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserListings();
  }, [username]);

  return (
    <div className={styles.marketplaceContainer}>
      <div className={styles.header}>
        <Link href="/marketplace" className={styles.backLink}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Marketplace
        </Link>
        <h1>Repos from @{username}</h1>
      </div>

      {error && (
        <div className={styles.error}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.2rem', height: '1.2rem', marginRight: '0.5rem' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ animation: 'spin 1s linear infinite', marginRight: '0.5rem' }}>
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
          </svg>
          Loading repositories...
        </div>
      ) : listings.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>No repositories found</h2>
          <p>This user hasn't listed any repositories yet.</p>
          <Link href="/marketplace" className={styles.sellButton}>
            Back to Marketplace
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.filters}>
            <button 
              className={`${styles.filter} ${activeFilter === 'all' ? styles.active : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Repos
            </button>
            <button 
              className={`${styles.filter} ${activeFilter === 'onetime' ? styles.active : ''}`}
              onClick={() => setActiveFilter('onetime')}
            >
              One-time Purchase
            </button>
            <button 
              className={`${styles.filter} ${activeFilter === 'subscription' ? styles.active : ''}`}
              onClick={() => setActiveFilter('subscription')}
            >
              Subscription
            </button>
            <label className={styles.toggleLabel}>
              <input 
                type="checkbox" 
                checked={includeSold}
                onChange={() => setIncludeSold(!includeSold)}
                className={styles.toggleInput}
              />
              Include Sold
            </label>
          </div>

          <div className={styles.grid}>
            {listings
              .filter(repo => {
                // Filter by type (all, onetime, subscription)
                if (activeFilter === 'onetime' && repo.isSubscription) return false;
                if (activeFilter === 'subscription' && !repo.isSubscription) return false;
                
                // Filter sold status
                if (!includeSold && repo.sold) return false;
                
                return true;
              })
              .map(repo => (
                <div key={repo.id} className={styles.card}>
                  <div className={styles.cardImage}>
                    <Image 
                      src={repo.imageUrl} 
                      alt={repo.name}
                      width={600}
                      height={400}
                      layout="responsive"
                    />
                    {repo.sold && (
                      <div className={styles.soldBadge}>
                        Sold
                      </div>
                    )}
                    <Link href={`/marketplace/buy/${repo.docId || repo.id}`}>
                      <button className={styles.buyButton} disabled={repo.sold}>
                        {repo.sold 
                          ? 'Sold Out' 
                          : repo.isSubscription 
                            ? 'Subscribe' 
                            : 'Buy Now'
                        }
                      </button>
                    </Link>
                  </div>
                  <div className={styles.cardContent}>
                    <div className={styles.cardHeader}>
                      <h2 className={styles.repoName}>{repo.name}</h2>
                      <div>
                        {repo.isSubscription ? (
                          <div className={styles.price}>${repo.subscriptionPrice}/mo</div>
                        ) : (
                          <div className={styles.price}>${repo.price}</div>
                        )}
                        {repo.isSubscription && (
                          <div className={styles.subscription}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2v20M2 12h20"></path>
                            </svg>
                            Subscription
                          </div>
                        )}
                      </div>
                    </div>
                    <p className={styles.description}>{repo.description}</p>
                    <div className={styles.cardFooter}>
                      <div className={styles.seller}>
                        <div className={styles.avatar}>
                          <Image 
                            src={repo.seller.avatarUrl} 
                            alt={repo.seller.username}
                            width={24}
                            height={24}
                          />
                        </div>
                        @{repo.seller.username}
                      </div>
                      <div className={styles.stats}>
                        <div className={styles.stat}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                          {repo.stars}
                        </div>
                        <div className={styles.stat}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="6" y1="3" x2="6" y2="15"></line>
                            <circle cx="18" cy="6" r="3"></circle>
                            <circle cx="6" cy="18" r="3"></circle>
                            <path d="M18 9a9 9 0 0 1-9 9"></path>
                          </svg>
                          {repo.forks}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </>
      )}
    </div>
  );
} 