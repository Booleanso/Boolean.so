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
        <h2>Featured GitHub Repositories</h2>
        <p className={styles.featuredRepoIntro}>
          Explore our curated selection of high-quality, ready-to-use GitHub repositories for your next project.
        </p>
      </div>
      
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingBar}></div>
          <span>Loading featured repositories</span>
        </div>
      ) : error ? (
        <div className={styles.error}>
          {error}
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
              </div>
              <div className={styles.repoContent}>
                <div className={styles.repoName}>{repo.name}</div>
                <div className={styles.repoDetails}>
                  <div className={styles.repoDescription}>{repo.description}</div>
                  <div className={styles.repoStats}>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>{repo.stars}</span>
                      <span className={styles.statLabel}>Stars</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>{repo.forks}</span>
                      <span className={styles.statLabel}>Forks</span>
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
    </section>
  );
} 