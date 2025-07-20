'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './search.module.scss';

// Define interfaces for our search results
interface MarketplaceListing {
  id: string;
  docId?: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  subscriptionPrice?: number;
  isSubscription: boolean;
  sold: boolean;
  stars: number;
  forks: number;
  seller: {
    username: string;
    avatarUrl: string;
  };
  type: 'marketplace';
}

interface PortfolioProject {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  projectUrl: string;
  technologies: string[];
  featured?: boolean;
  type: 'portfolio';
}

type SearchResult = MarketplaceListing | PortfolioProject;

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedResults, setDisplayedResults] = useState<SearchResult[]>([]);
  
  const prevQueryRef = useRef<string>(query);
  const prevFilterRef = useRef<string>(activeFilter);

  // Handle fade transition when filter changes
  const handleFilterChange = (filter: string) => {
    if (filter === activeFilter) return;
    
    setIsTransitioning(true);
    
    // After a brief fade-out, update the filter
    setTimeout(() => {
      setActiveFilter(filter);
      setIsTransitioning(false);
    }, 300); // Match this to the duration of the fadeOut animation
  };

  // Fetch search results when component mounts or query changes
  useEffect(() => {
    const fetchSearchResults = async () => {
      // If the query changes, trigger a transition
      if (prevQueryRef.current !== query && prevQueryRef.current) {
        setIsTransitioning(true);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      }
      
      prevQueryRef.current = query;
      
      if (!query) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch marketplace listings
        const marketplaceResponse = await fetch('/api/marketplace/listings');
        
        if (!marketplaceResponse.ok) {
          throw new Error(`HTTP error! status: ${marketplaceResponse.status}`);
        }
        
        const marketplaceData = await marketplaceResponse.json();
        const marketplaceListings = marketplaceData.listings || [];
        
        // Fetch real portfolio projects from API
        let portfolioProjects: any[] = [];
        try {
          const portfolioResponse = await fetch('/api/portfolio/projects');
          if (portfolioResponse.ok) {
            const portfolioData = await portfolioResponse.json();
            portfolioProjects = portfolioData.map((project: {
              id: string;
              title: string;
              description: string;
              imageUrl: string;
              slug: string;
              tags: string[];
              featured: boolean;
            }) => ({
              id: project.id,
              name: project.title, // Map title to name for consistency
              description: project.description,
              imageUrl: project.imageUrl,
              projectUrl: `/portfolio/projects/${project.slug}`, // Use proper project URL
              technologies: project.tags || [], // Use tags as technologies
              featured: project.featured
            }));
          }
        } catch (error) {
          console.error('Error fetching portfolio projects:', error);
          portfolioProjects = []; // Empty array if fetch fails
        }
        
        // Filter marketplace listings based on search query
        const filteredMarketplaceListings = marketplaceListings
          .filter((listing: any) => 
            listing.name.toLowerCase().includes(query.toLowerCase()) || 
            listing.description.toLowerCase().includes(query.toLowerCase())
          )
          .map((listing: any) => ({
            ...listing,
            type: 'marketplace'
          }));
          
        // Filter portfolio projects based on search query
        const filteredPortfolioProjects = portfolioProjects
          .filter(project => 
            project.name.toLowerCase().includes(query.toLowerCase()) || 
            project.description.toLowerCase().includes(query.toLowerCase()) ||
            project.technologies.some((tech: string) => tech.toLowerCase().includes(query.toLowerCase()))
          )
          .map(project => ({
            ...project,
            type: 'portfolio'
          }));
          
        // Combine the results
        setResults([...filteredMarketplaceListings, ...filteredPortfolioProjects]);
        
      } catch (err) {
        console.error('Error fetching search results:', err);
        setError('Failed to load search results. Please try again later.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSearchResults();
  }, [query]);

  // Update displayed results when the filter changes
  useEffect(() => {
    // If the filter changes, track it for animation purposes
    if (prevFilterRef.current !== activeFilter && prevFilterRef.current !== '') {
      setIsTransitioning(true);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }
    
    prevFilterRef.current = activeFilter;
    
    const filtered = results.filter(result => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'marketplace' && result.type === 'marketplace') return true;
      if (activeFilter === 'portfolio' && result.type === 'portfolio') return true;
      return false;
    });
    
    setDisplayedResults(filtered);
  }, [activeFilter, results]);

  return (
    <div className={styles.searchContainer}>
      <div className={styles.header}>
        <h1>Search Results{query ? ` for "${query}"` : ''}</h1>
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
          Loading results...
        </div>
      ) : displayedResults.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>No results found</h2>
          <p>{query ? `We couldn't find any matches for "${query}". Try a different search term.` : 'Please enter a search term to find results.'}</p>
        </div>
      ) : (
        <>
          <div className={styles.filters}>
            <button 
              className={`${styles.filter} ${activeFilter === 'all' ? styles.active : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              All Results
            </button>
            <button 
              className={`${styles.filter} ${activeFilter === 'marketplace' ? styles.active : ''}`}
              onClick={() => handleFilterChange('marketplace')}
            >
              Marketplace
            </button>
            <button 
              className={`${styles.filter} ${activeFilter === 'portfolio' ? styles.active : ''}`}
              onClick={() => handleFilterChange('portfolio')}
            >
              Portfolio
            </button>
          </div>

          <div className={`${styles.grid} ${isTransitioning ? styles.fadeOutResults : ''}`}>
            {displayedResults.map((result) => {
              if (result.type === 'marketplace') {
                const marketplaceItem = result as MarketplaceListing;
                return (
                  <div key={`marketplace-${marketplaceItem.id}`} className={styles.card}>
                    <div className={styles.cardImage}>
                      <Image 
                        src={marketplaceItem.imageUrl} 
                        alt={marketplaceItem.name}
                        width={600}
                        height={400}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      {marketplaceItem.sold && (
                        <div className={styles.soldBadge}>
                          Sold
                        </div>
                      )}
                      <Link href={`/marketplace/buy/${marketplaceItem.docId || marketplaceItem.id}`}>
                        <button className={styles.buyButton} disabled={marketplaceItem.sold}>
                          {marketplaceItem.sold 
                            ? 'Sold Out' 
                            : marketplaceItem.isSubscription 
                              ? 'Subscribe' 
                              : 'Buy Now'
                          }
                        </button>
                      </Link>
                    </div>
                    <div className={styles.cardContent}>
                      <div className={styles.cardHeader}>
                        <h2 className={styles.itemName}>{marketplaceItem.name}</h2>
                        <div className={styles.itemBadge}>Marketplace</div>
                        <div>
                          {marketplaceItem.isSubscription ? (
                            <div className={styles.price}>${marketplaceItem.subscriptionPrice}/mo</div>
                          ) : (
                            <div className={styles.price}>${marketplaceItem.price}</div>
                          )}
                          {marketplaceItem.isSubscription && (
                            <div className={styles.subscription}>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v20M2 12h20"></path>
                              </svg>
                              Subscription
                            </div>
                          )}
                        </div>
                      </div>
                      <p className={styles.description}>{marketplaceItem.description}</p>
                      <div className={styles.cardFooter}>
                        <div className={styles.seller}>
                          <div className={styles.avatar}>
                            <Image 
                              src={marketplaceItem.seller.avatarUrl} 
                              alt={marketplaceItem.seller.username}
                              width={24}
                              height={24}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          </div>
                          <Link href={`/marketplace/user/${marketplaceItem.seller.username}`} className={styles.sellerUsername}>
                            @{marketplaceItem.seller.username}
                          </Link>
                        </div>
                        <div className={styles.stats}>
                          <div className={styles.stat}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                            {marketplaceItem.stars}
                          </div>
                          <div className={styles.stat}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="6" y1="3" x2="6" y2="15"></line>
                              <circle cx="18" cy="6" r="3"></circle>
                              <circle cx="6" cy="18" r="3"></circle>
                              <path d="M18 9a9 9 0 0 1-9 9"></path>
                            </svg>
                            {marketplaceItem.forks}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                const portfolioItem = result as PortfolioProject;
                return (
                  <div key={`portfolio-${portfolioItem.id}`} className={styles.card}>
                    <div className={styles.cardImage}>
                      <Image 
                        src={portfolioItem.imageUrl} 
                        alt={portfolioItem.name}
                        width={600}
                        height={400}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <Link href={portfolioItem.projectUrl} target="_blank" rel="noopener noreferrer">
                        <button className={styles.viewButton}>
                          View Project
                        </button>
                      </Link>
                    </div>
                    <div className={styles.cardContent}>
                      <div className={styles.cardHeader}>
                        <h2 className={styles.itemName}>{portfolioItem.name}</h2>
                        <div className={styles.itemBadge}>Portfolio</div>
                      </div>
                      <p className={styles.description}>{portfolioItem.description}</p>
                      <div className={styles.cardFooter}>
                        <div className={styles.technologies}>
                          {portfolioItem.technologies.map((tech, index) => (
                            <span key={index} className={styles.tech}>
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </>
      )}
    </div>
  );
} 