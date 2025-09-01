'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../buy.module.scss';
import { auth } from '@/app/lib/firebase-client';
import { onAuthStateChanged } from 'firebase/auth';
import { MarketplaceListing } from '@/app/api/marketplace/list-repo/route';

// Update the type to include all needed properties
interface ExtendedMarketplaceListing extends MarketplaceListing {
  slug: string;
  docId: string;
  tags?: string[];
  lastUpdated?: string;
  language?: string;
  size?: number;
  repoId?: string | number;
}

// Type for GitHub repo details
interface GitHubRepoDetails {
  languages: Record<string, number>;
  license?: {
    name: string;
    spdx_id: string;
  };
  size: number;
  default_branch: string;
  open_issues: number;
  created_at: string;
  updated_at: string;
}

// Type for related repos and more from developer
interface RelatedRepo {
  id: string | number;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  seller: {
    username: string;
    avatarUrl: string;
  };
  slug: string;
}

// Type for the developer's info
interface DeveloperInfo {
  username: string;
  avatarUrl?: string;
  email?: string;
  createdAt?: string;
}

interface BuyPageClientProps {
  initialListing: ExtendedMarketplaceListing;
}

export default function ProductDetailClient({ initialListing }: BuyPageClientProps) {
  const router = useRouter();
  const [listing] = useState<ExtendedMarketplaceListing>(initialListing);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [showGithubTransferInfo, setShowGithubTransferInfo] = useState(false);
  const [moreFromDeveloper, setMoreFromDeveloper] = useState<RelatedRepo[]>([]);
  const [relatedRepos, setRelatedRepos] = useState<RelatedRepo[]>([]);
  
  // Add state for GitHub repo details
  const [repoDetails, setRepoDetails] = useState<GitHubRepoDetails | null>(null);
  
  // Add state for developer info
  const [developerInfo, setDeveloperInfo] = useState<DeveloperInfo>({
    username: listing.seller.username,
    avatarUrl: listing.seller.avatarUrl
  });

  // First effect: Check if user is authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    
    return () => unsubscribe();
  }, []);

  // Second effect: Fetch GitHub repo details and developer info
  useEffect(() => {
    const fetchRepoDetails = async () => {
      if (!listing) return;
      
      try {
        // Fetch GitHub repo details
        const response = await fetch(`/api/github/repo-details?repoId=${listing.repoId || listing.id}`);
        if (response.ok) {
          const data = await response.json();
          setRepoDetails(data.repoDetails);
        }
        
        // Fetch developer info from Firebase
        const sellerResponse = await fetch(`/api/user/profile?userId=${listing.seller.id}`);
        if (sellerResponse.ok) {
          const sellerData = await sellerResponse.json();
          if (sellerData.user) {
            setDeveloperInfo({
              ...developerInfo,
              email: sellerData.user.email,
              createdAt: sellerData.user.createdAt
            });
          }
        }
      } catch (error) {
        console.error('Error fetching repo details:', error);
      }
    };
    
    fetchRepoDetails();
  }, [listing, developerInfo]);

  // Third effect: Fetch more repos from the same developer and related repos
  useEffect(() => {
    const fetchRelatedData = async () => {
      if (!listing || !listing.seller || !listing.seller.id) return;
      
      try {
        // Fetch more from this developer
        const developerResponse = await fetch(`/api/marketplace/developer-listings?sellerId=${listing.seller.id}&exclude=${listing.id}`);
        if (developerResponse.ok) {
          const developerData = await developerResponse.json();
          setMoreFromDeveloper(developerData.listings || []);
        }
        
        // Fetch related repos - could be based on tags, if available
        const tagsParam = listing.tags ? `&tags=${listing.tags.join(',')}` : '';
        const relatedResponse = await fetch(`/api/marketplace/related-listings?id=${listing.id}${tagsParam}`);
        if (relatedResponse.ok) {
          const relatedData = await relatedResponse.json();
          setRelatedRepos(relatedData.listings || []);
        }
      } catch (error) {
        console.error('Error fetching related data:', error);
      }
    };
    
    fetchRelatedData();
  }, [listing]);

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=' + encodeURIComponent(`/marketplace/buy/${listing.slug}`));
      return;
    }
    
    try {
      setPurchaseLoading(true);
      setPurchaseError(null);
      
      // Create a checkout session for the purchase using Stripe
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: listing.repoId || listing.id, // Use repoId as the primary identifier
          priceId: listing.stripePriceId,
          isSubscription: listing.isSubscription,
          documentId: listing.docId,
          slug: listing.slug, // Include slug for better tracking
          name: listing.name // Include name for better identification
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const { sessionUrl } = await response.json();
      
      if (sessionUrl) {
        // Redirect to Stripe Checkout
        window.location.href = sessionUrl;
      } else {
        // For demo/test purposes, simulate a successful purchase directly
        // In a real application, you'd always redirect to Stripe
        await handleSuccessfulPurchase();
      }
    } catch (err) {
      console.error('Error initiating purchase:', err);
      setPurchaseError(err instanceof Error ? err.message : 'Failed to process purchase');
    } finally {
      setPurchaseLoading(false);
    }
  };
  
  const handleSuccessfulPurchase = async () => {
    if (!listing) return;
    
    try {
      // Simulate the post-purchase actions
      setPurchaseLoading(true);
      
      // Artificial delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For one-time purchases, show the GitHub transfer info
      if (!listing.isSubscription) {
        setShowGithubTransferInfo(true);
      } else {
        // For subscriptions, show success immediately
        setPurchaseSuccess(true);
      }
      
      // Record the purchase in the user's account
      // This would be done by the webhook in a real implementation
      await fetch('/api/payments/record-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: listing.id,
          purchaseType: listing.isSubscription ? 'subscription' : 'purchase',
          documentId: listing.docId
        }),
      });
      
    } catch (err) {
      console.error('Error processing purchase:', err);
      setPurchaseError('Purchase was successful but there was an issue processing the repository transfer');
    } finally {
      setPurchaseLoading(false);
    }
  };
  
  const completeGithubTransfer = async () => {
    if (!listing) return;
    
    try {
      setPurchaseLoading(true);
      
      // Call the GitHub transfer API
      const response = await fetch('/api/github/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoId: listing.repoId,
          sellerId: listing.seller.id,
          isSinglePurchase: true
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transfer repository');
      }
      
      // Mark listing as sold
      await fetch('/api/marketplace/firestore-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'update',
          collection: 'listings',
          documentId: listing.docId,
          data: {
            sold: true,
            updatedAt: new Date().toISOString()
          }
        }),
      });
      
      setPurchaseSuccess(true);
    } catch (err) {
      console.error('Error transferring repository:', err);
      setPurchaseError(err instanceof Error ? err.message : 'Failed to transfer the GitHub repository');
    } finally {
      setPurchaseLoading(false);
    }
  };
  
  // Format the date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Get developer account creation year
  const getDeveloperSinceYear = () => {
    if (developerInfo.createdAt) {
      return new Date(developerInfo.createdAt).getFullYear();
    }
    return new Date().getFullYear(); // Fallback to current year
  };
  
  // Handle contact developer
  const handleContactDeveloper = () => {
    if (developerInfo.email) {
      const subject = encodeURIComponent(`Inquiry about "${listing.name}" repository`);
      const body = encodeURIComponent(
        `Hello ${listing.seller.username},\n\nI'm interested in your "${listing.name}" repository on WebRend Marketplace. I have a question regarding...\n\nBest regards,\n[Your Name]`
      );
      window.location.href = `mailto:${developerInfo.email}?subject=${subject}&body=${body}`;
    }
  };

  // Format file size to human-readable
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const kilobytes = bytes / 1024;
    if (kilobytes < 1024) {
      return `${kilobytes.toFixed(2)} KB`;
    }
    const megabytes = kilobytes / 1024;
    if (megabytes < 1024) {
      return `${megabytes.toFixed(2)} MB`;
    }
    const gigabytes = megabytes / 1024;
    return `${gigabytes.toFixed(2)} GB`;
  };

  // Get all languages as string
  const getAllLanguages = () => {
    if (repoDetails?.languages) {
      return Object.keys(repoDetails.languages).join(', ');
    }
    return listing.language || 'Unknown';
  };

  if (purchaseSuccess) {
    return (
      <div className={styles.container}>
        <div className={styles.successMessage}>
          <div className={styles.successIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h1>Purchase Successful!</h1>
          <p>
            {listing.isSubscription
              ? `You now have access to "${listing.name}" repository. You can access it from your profile.`
              : `The "${listing.name}" repository has been transferred to your GitHub account.`
            }
          </p>
          <div className={styles.successActions}>
            <Link href="/profile" className={styles.viewProfileButton}>
              View in Your Profile
            </Link>
            <Link href="/marketplace" className={styles.backToMarketplaceButton}>
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (showGithubTransferInfo) {
    return (
      <div className={styles.container}>
        <div className={styles.transferInfo}>
          <h1>Authorize GitHub Repository Transfer</h1>
          <p>
            You&apos;ve successfully purchased <strong>{listing.name}</strong>. The next step is to transfer
            the repository to your GitHub account.
          </p>
          <div className={styles.transferInstructions}>
            <h2>What happens next:</h2>
            <ol>
              <li>The seller will initiate a repository transfer to your GitHub account.</li>
              <li>You&apos;ll receive an email from GitHub with a link to accept the transfer.</li>
              <li>Once accepted, the repository will appear in your GitHub account.</li>
            </ol>
          </div>
          <div className={styles.transferActions}>
            <button 
              className={styles.completeTransferButton}
              onClick={completeGithubTransfer}
              disabled={purchaseLoading}
            >
              {purchaseLoading ? 'Processing...' : 'Complete & Simulate Transfer'}
            </button>
            <p className={styles.transferNote}>
              Note: In a real implementation, the transfer would be handled automatically by GitHub&apos;s API.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.buyContainer}>
        <div className={styles.productInfo}>
          <div className={styles.productImage}>
            <Image
              src={listing.imageUrl}
              alt={listing.name}
              width={800}
              height={500}
              priority
            />
          </div>
          <div className={styles.productDetails}>
            <h1 className={styles.productTitle}>{listing.name}</h1>
            <div className={styles.sellerInfo}>
              <div className={styles.sellerAvatar}>
                {listing.seller.avatarUrl ? (
                  <Image
                    src={listing.seller.avatarUrl}
                    alt={listing.seller.username}
                    width={24}
                    height={24}
                  />
                ) : (
                  <div className={styles.defaultAvatar}>
                    {listing.seller.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span>By <Link href={`/marketplace/user/${listing.seller.username}`}>{listing.seller.username}</Link></span>
            </div>
            <div className={styles.productStats}>
              <div className={styles.stat}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                {listing.stars}
              </div>
              <div className={styles.stat}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="6" y1="3" x2="6" y2="15"></line>
                  <circle cx="18" cy="6" r="3"></circle>
                  <circle cx="6" cy="18" r="3"></circle>
                  <path d="M18 9a9 9 0 0 1-9 9"></path>
                </svg>
                {listing.forks}
              </div>
              <div className={styles.stat}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Last updated: {new Date(listing.updatedAt || listing.lastUpdated || '').toLocaleDateString()}
              </div>
            </div>
            
            {/* Add Tags */}
            {listing.tags && listing.tags.length > 0 && (
              <div className={styles.productTags}>
                {listing.tags.map((tag) => (
                  <Link 
                    key={tag} 
                    href={`/marketplace?search=${encodeURIComponent(tag)}`}
                    className={styles.tag}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
            
            <div className={styles.productDescription}>
              <h2>Description</h2>
              <p>{listing.description}</p>
            </div>
          </div>
        </div>
        
        <div className={styles.purchaseCard}>
          <div className={styles.purchaseType}>
            {listing.isSubscription ? 'Subscription' : 'One-time Purchase'}
          </div>
          <div className={styles.price}>
            {listing.isSubscription
              ? `$${listing.subscriptionPrice}/mo`
              : `$${listing.price}`
            }
          </div>
          {listing.isSubscription && (
            <div className={styles.subscriptionInfo}>
              Ongoing monthly subscription. Cancel anytime.
            </div>
          )}
          {!listing.isSubscription && (
            <div className={styles.oneTimeInfo}>
              One-time purchase. Full repository transfer to your GitHub account.
            </div>
          )}
          
          {!isAuthenticated && (
            <div className={styles.purchaseError}>
              You need to log in to purchase this repository
            </div>
          )}
          
          {purchaseError && (
            <div className={styles.purchaseError}>
              {purchaseError}
            </div>
          )}
          
          <button
            className={styles.buyButton}
            onClick={handlePurchase}
            disabled={purchaseLoading}
          >
            {purchaseLoading 
              ? 'Processing...' 
              : listing.isSubscription 
                ? 'Subscribe Now' 
                : 'Buy Now'
            }
          </button>
          
          <div className={styles.secureInfo}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>Secure payment via Stripe</span>
          </div>
          
          <div className={styles.purchaseDetails}>
            <div className={styles.purchaseDetail}>
              <span>You get:</span>
              <ul>
                <li>Full source code access</li>
                {listing.isSubscription ? (
                  <li>Monthly access renewal</li>
                ) : (
                  <li>Repository ownership transfer</li>
                )}
                <li>Developer support</li>
                <li>Access to WebRend community</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Benefits Section */}
      <div className={styles.benefitsSection}>
        <h2>Why Buy From WebRend</h2>
        <div className={styles.benefitsList}>
          <div className={styles.benefitItem}>
            <div className={styles.benefitEmoji}>✅</div>
            <h3 className={styles.benefitTitle}>Verified Code Quality</h3>
            <p className={styles.benefitDescription}>
              All repositories undergo code review to ensure quality, security, and best practices.
            </p>
          </div>
          
          <div className={styles.benefitItem}>
            <div className={styles.benefitEmoji}>🔒</div>
            <h3 className={styles.benefitTitle}>Secure Transactions</h3>
            <p className={styles.benefitDescription}>
              All payments are processed securely through Stripe with encryption and fraud protection.
            </p>
          </div>
          
          <div className={styles.benefitItem}>
            <div className={styles.benefitEmoji}>🛡️</div>
            <h3 className={styles.benefitTitle}>Transfer Guarantee</h3>
            <p className={styles.benefitDescription}>
              All repository transfers are guaranteed. If any issues arise, our team will resolve them promptly.
            </p>
          </div>
          
          <div className={styles.benefitItem}>
            <div className={styles.benefitEmoji}>🤝</div>
            <h3 className={styles.benefitTitle}>Developer Support</h3>
            <p className={styles.benefitDescription}>
              Get direct support from the repository creator for questions, issues, or implementation help.
            </p>
          </div>
        </div>
      </div>
      
      {/* Technical Specifications */}
      <div className={styles.technicalSpecsSection}>
        <h2>Technical Specifications</h2>
        <table className={styles.specsTable}>
          <tbody>
            <tr>
              <th>Languages</th>
              <td>{getAllLanguages()}</td>
            </tr>
            <tr>
              <th>Dependencies</th>
              <td>React, Next.js, Firebase</td>
            </tr>
            <tr>
              <th>Code Size</th>
              <td>{formatFileSize(listing.size)}</td>
            </tr>
            <tr>
              <th>Last Update</th>
              <td>{formatDate(listing.updatedAt || listing.lastUpdated)}</td>
            </tr>
            <tr>
              <th>License</th>
              <td>{repoDetails?.license?.name || 'Unknown'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* More from this Developer */}
      {moreFromDeveloper.length > 0 && (
        <div className={styles.moreFromDeveloperSection}>
          <h2>More From This Developer</h2>
          <div className={styles.developerRepos}>
            {moreFromDeveloper.slice(0, 3).map((repo) => (
              <Link href={`/marketplace/buy/${repo.slug}`} key={repo.id} className={styles.developerRepoCard}>
                <div className={styles.repoImage}>
                  <Image
                    src={repo.imageUrl}
                    alt={repo.name}
                    width={400}
                    height={240}
                  />
                </div>
                <div className={styles.repoContent}>
                  <h3 className={styles.repoTitle}>{repo.name}</h3>
                  <p className={styles.repoDescription}>{repo.description}</p>
                  <div className={styles.repoPrice}>${repo.price}</div>
                </div>
              </Link>
            ))}
          </div>
          {moreFromDeveloper.length > 3 && (
            <Link 
              href={`/marketplace/user/${listing.seller.username}`} 
              className={styles.viewAllDeveloperRepos}
            >
              View all from {listing.seller.username}
            </Link>
          )}
        </div>
      )}
      
      {/* Contact Developer */}
      <div className={styles.contactDeveloperSection}>
        <h2>Contact the Developer</h2>
        <div className={styles.developerInfo}>
          <div className={styles.developerAvatar}>
            {listing.seller.avatarUrl ? (
              <Image
                src={listing.seller.avatarUrl}
                alt={listing.seller.username}
                width={80}
                height={80}
              />
            ) : (
              <div className={styles.defaultAvatarLarge}>
                {listing.seller.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h3 className={styles.developerName}>{listing.seller.username}</h3>
          <p className={styles.developerUsername}>Developer since {getDeveloperSinceYear()}</p>
        </div>
        <p className={styles.contactDescription}>
          Have questions about this repository? Need customizations or implementation help?
          Contact the developer directly to discuss your requirements.
        </p>
        <button 
          onClick={handleContactDeveloper}
          className={styles.contactButton}
        >
          Contact Developer
        </button>
      </div>
      
      {/* Related Repos People Also Bought */}
      {relatedRepos.length > 0 && (
        <div className={styles.relatedPurchasesSection}>
          <h2>People Also Bought</h2>
          <div className={styles.relatedRepos}>
            {relatedRepos.slice(0, 4).map((repo) => (
              <Link href={`/marketplace/buy/${repo.slug}`} key={repo.id} className={styles.relatedRepoCard}>
                <div className={styles.repoImage}>
                  <Image
                    src={repo.imageUrl}
                    alt={repo.name}
                    width={400}
                    height={240}
                  />
                </div>
                <div className={styles.repoContent}>
                  <h3 className={styles.repoTitle}>{repo.name}</h3>
                  <p className={styles.repoDescription}>{repo.description}</p>
                  <div className={styles.repoPrice}>${repo.price}</div>
                  <div className={styles.repoSeller}>
                    <div className={styles.sellerAvatar}>
                      <Image
                        src={repo.seller.avatarUrl}
                        alt={repo.seller.username}
                        width={20}
                        height={20}
                      />
                    </div>
                    <span>{repo.seller.username}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className={styles.footer}>
        © {new Date().getFullYear()} WebRend Marketplace. All rights reserved.
      </div>
      
      <div className={styles.actions}>
        <Link href="/marketplace" className={styles.backButton}>
          ← Back to Marketplace
        </Link>
      </div>
    </div>
  );
} 