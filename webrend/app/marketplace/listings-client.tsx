'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './marketplace.module.scss';
import { MarketplaceListing } from '../api/marketplace/list-repo/route';

interface MarketplaceClientProps {
  initialListings: MarketplaceListing[];
}

export default function ListingsClient({ initialListings }: MarketplaceClientProps) {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');
  
  const [activeFilter, setActiveFilter] = useState(filterParam || 'all');
  const [listings] = useState<MarketplaceListing[]>(initialListings);
  const [includeSold, setIncludeSold] = useState(false);

  // Filter listings based on current filters
  const filteredListings = listings.filter(repo => {
    // Filter by type (all, onetime, subscription)
    if (activeFilter === 'onetime' && repo.isSubscription) return false;
    if (activeFilter === 'subscription' && !repo.isSubscription) return false;
    
    // Filter sold status
    if (!includeSold && repo.sold) return false;
    
    return true;
  });

  return (
    <div className={styles.marketplaceContainer}>
      <div className={styles.header}>
        <h1>GitHub Repository Marketplace</h1>
        <Link href="/marketplace/sell" className={styles.listButton}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          List a Repo to Sell
        </Link>
      </div>

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

      {filteredListings.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>No repositories available</h2>
          <p>Be the first to list a repository for sale!</p>
          <Link href="/marketplace/sell" className={styles.sellButton}>
            List a Repository
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredListings.map((repo) => (
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
                <Link href={`/marketplace/buy/${repo.slug}`}>
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
                    <Link href={`/marketplace/user/${repo.seller.username}`} className={styles.sellerUsername}>
                      @{repo.seller.username}
                    </Link>
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
          ))}
        </div>
      )}
    </div>
  );
} 