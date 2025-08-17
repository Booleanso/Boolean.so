'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./FeaturedRepos.module.css";
import marketplaceStyles from "../../marketplace/marketplace.module.scss";

// Import the type for consistency
import { MarketplaceListing } from '../../api/marketplace/list-repo/route';

export default function FeaturedRepos() {
  const [featuredRepos, setFeaturedRepos] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedRepos = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/marketplace/listings');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const allListings = data.listings || [];
        const availableRepos = allListings.filter((repo: MarketplaceListing) => !repo.sold);
        if (availableRepos.length === 0) {
          setFeaturedRepos([]);
          return;
        }
        const randomRepos: MarketplaceListing[] = [];
        const totalToShow = Math.min(3, availableRepos.length);
        const repoPool = [...availableRepos];
        for (let i = 0; i < totalToShow; i++) {
          const randomIndex = Math.floor(Math.random() * repoPool.length);
          randomRepos.push(repoPool[randomIndex]);
          repoPool.splice(randomIndex, 1);
        }
        setFeaturedRepos(randomRepos);
      } catch (err) {
        console.error('Error fetching featured repositories:', err);
        setError('Failed to load featured repositories. Please try again later.');
        setFeaturedRepos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedRepos();
  }, []);

  return (
    <section className={styles.featuredSection}>
      <div className={styles.sectionHeader}>
        <h2>Premium GitHub<br />Repositories</h2>
        <p className={styles.featuredRepoIntro}>
          Discover high-quality code ready to use in your next project. Our marketplace offers the best GitHub repositories from top developers worldwide.
        </p>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingBar}></div>
          <span>Loading repositories</span>
        </div>
      ) : error ? (
        <div className={styles.error}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V9H11V15ZM11 7H9V5H11V7Z" fill="#FF443A"/>
          </svg>
          <span>{error}</span>
        </div>
      ) : featuredRepos.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No repositories available at the moment. Check back soon!</p>
        </div>
      ) : (
        <div className={marketplaceStyles.grid}>
          {featuredRepos.map((repo) => (
            <div key={repo.id} className={marketplaceStyles.card}>
              <div className={marketplaceStyles.cardImage}>
                <Image 
                  src={repo.imageUrl}
                  alt={repo.name}
                  width={600}
                  height={400}
                />
                {repo.sold && (
                  <div className={marketplaceStyles.soldBadge}>Sold</div>
                )}
                <Link href={`/marketplace/buy/${repo.slug || repo.docId || repo.id}`}>
                  <button className={marketplaceStyles.buyButton} disabled={repo.sold}>
                    {repo.sold 
                      ? 'Sold Out' 
                      : repo.isSubscription 
                        ? 'Subscribe' 
                        : 'Buy Now'}
                  </button>
                </Link>
              </div>
              <div className={marketplaceStyles.cardContent}>
                <div className={marketplaceStyles.cardHeader}>
                  <h2 className={marketplaceStyles.repoName}>{repo.name}</h2>
                  <div>
                    {repo.isSubscription ? (
                      <div className={marketplaceStyles.price}>${repo.subscriptionPrice}/mo</div>
                    ) : (
                      <div className={marketplaceStyles.price}>${repo.price}</div>
                    )}
                    {repo.isSubscription && (
                      <div className={marketplaceStyles.subscription}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2v20M2 12h20"></path>
                        </svg>
                        Subscription
                      </div>
                    )}
                  </div>
                </div>
                <p className={marketplaceStyles.description}>{repo.description}</p>
                {repo.tags && repo.tags.length > 0 && (
                  <div className={marketplaceStyles.tags}>
                    {repo.tags.slice(0, 3).map(tag => (
                      <Link key={tag} href={`/marketplace?search=${encodeURIComponent(tag)}`} className={marketplaceStyles.tag}>
                        {tag}
                      </Link>
                    ))}
                    {repo.tags.length > 3 && (
                      <span className={marketplaceStyles.moreTags}>+{repo.tags.length - 3}</span>
                    )}
                  </div>
                )}
                <div className={marketplaceStyles.cardFooter}>
                  <div className={marketplaceStyles.seller}>
                    <div className={marketplaceStyles.avatar}>
                      {repo.seller.avatarUrl ? (
                        <Image 
                          src={repo.seller.avatarUrl} 
                          alt={repo.seller.username}
                          width={24}
                          height={24}
                        />
                      ) : (
                        <div className={marketplaceStyles.defaultAvatar}>
                          {repo.seller.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <Link href={`/marketplace/user/${repo.seller.username}`} className={marketplaceStyles.sellerUsername}>
                      @{repo.seller.username}
                    </Link>
                  </div>
                  <div className={marketplaceStyles.stats}>
                    <div className={marketplaceStyles.stat}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                      {repo.stars}
                    </div>
                    <div className={marketplaceStyles.stat}>
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

      <div className={styles.viewAllContainer}>
        <Link href="/marketplace" className={styles.viewAllButton}>
          View All Repositories
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 0L5.645 1.355L10.09 5.8H0V7.8H10.09L5.645 12.245L7 13.6L14 6.6L7 0Z" fill="currentColor"/>
          </svg>
        </Link>
      </div>
    </section>
  );
}