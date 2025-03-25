'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './marketplace.module.scss';

// Import the type from our API
import { MarketplaceListing } from '../api/marketplace/list-repo/route';

export default function Marketplace() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch listings when component mounts
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if our file-based DB exists yet, and fallback to demo data if not
        const response = await fetch('/api/marketplace/listings');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setListings(data.listings || []);
      } catch (err) {
        console.error('Error fetching marketplace listings:', err);
        setError('Failed to load listings. Using demo data instead.');
        // Fallback to demo data
        setListings(demoRepos);
      } finally {
        setLoading(false);
      }
    };
    
    fetchListings();
  }, []);

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

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.filters}>
        <button 
          className={`${styles.filter} ${activeFilter === 'all' ? styles.active : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All Repositories
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
      </div>

      {loading ? (
        <div className={styles.loading}>Loading repositories...</div>
      ) : (
        <div className={styles.grid}>
          {listings
            .filter(repo => {
              if (activeFilter === 'all') return true;
              if (activeFilter === 'onetime') return !repo.isSubscription;
              if (activeFilter === 'subscription') return repo.isSubscription;
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
                  <Link href={`/marketplace/buy/${repo.id}`}>
                    <button className={styles.buyButton}>
                      {repo.isSubscription ? 'Subscribe' : 'Buy Now'}
                    </button>
                  </Link>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// Sample data for demo purposes - used as fallback
const demoRepos: MarketplaceListing[] = [
  {
    id: 1,
    name: 'E-Commerce Platform',
    description: 'A complete e-commerce solution with React frontend and Node.js backend. Includes shopping cart, user authentication, and payment processing.',
    price: 499,
    isSubscription: false,
    imageUrl: 'https://placehold.co/600x400/0366d6/FFFFFF/png?text=E-Commerce+Platform',
    seller: {
      username: 'techdev',
      avatarUrl: 'https://placehold.co/100/24292e/FFFFFF/png?text=TD'
    },
    stars: 45,
    forks: 12,
    lastUpdated: '2023-12-15'
  },
  {
    id: 2,
    name: 'Dashboard UI Kit',
    description: 'Modern dashboard components built with React and Tailwind CSS. Fully customizable and responsive design elements.',
    price: 29,
    isSubscription: true,
    subscriptionPrice: 9.99,
    imageUrl: 'https://placehold.co/600x400/0366d6/FFFFFF/png?text=Dashboard+UI+Kit',
    seller: {
      username: 'designstudio',
      avatarUrl: 'https://placehold.co/100/24292e/FFFFFF/png?text=DS'
    },
    stars: 87,
    forks: 33,
    lastUpdated: '2024-01-21'
  },
  {
    id: 3,
    name: 'AI Content Generator',
    description: 'Text and image generation API powered by machine learning models. Easy to integrate with any application.',
    price: 199,
    isSubscription: true,
    subscriptionPrice: 39.99,
    imageUrl: 'https://placehold.co/600x400/0366d6/FFFFFF/png?text=AI+Content+Generator',
    seller: {
      username: 'aiinnovators',
      avatarUrl: 'https://placehold.co/100/24292e/FFFFFF/png?text=AI'
    },
    stars: 215,
    forks: 68,
    lastUpdated: '2024-02-05'
  },
  {
    id: 4,
    name: 'Analytics Engine',
    description: 'User behavior tracking and analytics dashboard. Collect and visualize data from your web applications.',
    price: 349,
    isSubscription: false,
    imageUrl: 'https://placehold.co/600x400/0366d6/FFFFFF/png?text=Analytics+Engine',
    seller: {
      username: 'datastudio',
      avatarUrl: 'https://placehold.co/100/24292e/FFFFFF/png?text=DS'
    },
    stars: 68,
    forks: 21,
    lastUpdated: '2024-01-18'
  }
];
