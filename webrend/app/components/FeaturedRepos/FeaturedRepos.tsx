'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./FeaturedRepos.module.css";

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
        
        // Fetch all listings from the API
        const response = await fetch('/api/marketplace/listings');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const allListings = data.listings || [];
        
        // Filter out sold repositories
        const availableRepos = allListings.filter((repo: MarketplaceListing) => !repo.sold);
        
        if (availableRepos.length === 0) {
          setFeaturedRepos([]);
          return;
        }
        
        // Select up to 3 random repos to feature
        const randomRepos: MarketplaceListing[] = [];
        const totalToShow = Math.min(3, availableRepos.length);
        
        // Create a copy of the array to avoid modifying the original
        const repoPool = [...availableRepos];
        
        for (let i = 0; i < totalToShow; i++) {
          const randomIndex = Math.floor(Math.random() * repoPool.length);
          randomRepos.push(repoPool[randomIndex]);
          // Remove the selected repo to avoid duplicates
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
        <div className={styles.repoGrid}>
          {featuredRepos.map((repo) => (
            <Link href={`/marketplace/buy/${repo.docId || repo.id}`} key={repo.id} className={styles.repoCard}>
              <div className={styles.repoImageWrapper}>
                <Image 
                  src={repo.imageUrl} 
                  alt={repo.name}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className={styles.repoImage}
                />
                <div className={styles.overlay}></div>
              </div>
              <div className={styles.repoContent}>
                <div className={styles.repoName}>{repo.name}</div>
                <div className={styles.repoDetails}>
                  <div className={styles.repoDescription}>{repo.description}</div>
                  <div className={styles.repoStats}>
                    <div className={styles.statsGroup}>
                      <div className={styles.stat}>
                        <span className={styles.statValue}>{repo.stars}</span>
                        <span className={styles.statLabel}>Stars</span>
                      </div>
                      <div className={styles.stat}>
                        <span className={styles.statValue}>{repo.forks}</span>
                        <span className={styles.statLabel}>Forks</span>
                      </div>
                    </div>
                    <div className={styles.price}>
                      {repo.isSubscription ? (
                        <>${repo.subscriptionPrice}/mo</>
                      ) : (
                        <>${repo.price}</>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
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