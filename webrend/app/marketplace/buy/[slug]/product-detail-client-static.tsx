'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../buy.module.scss';
import { auth } from '@/app/lib/firebase-client';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';

// Types from the server component
interface ExtendedMarketplaceListing {
  id: string | number;
  name: string;
  description: string;
  price?: number;
  subscriptionPrice?: number;
  isSubscription: boolean;
  imageUrl: string;
  seller: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  repoUrl: string;
  stars: number;
  forks: number;
  stripeProductId?: string;
  stripePriceId?: string;
  sold?: boolean;
  createdAt?: string;
  updatedAt?: string;
  slug: string;
  docId: string;
  tags?: string[];
  lastUpdated?: string;
  language?: string;
  size?: number;
  repoId?: string | number;
}

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

interface DeveloperInfo {
  username: string;
  avatarUrl?: string;
  email?: string;
  createdAt?: string;
}

interface Review {
  id?: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

interface ProductDetailClientProps {
  listing: ExtendedMarketplaceListing;
  repoDetails: GitHubRepoDetails | null;
  developerInfo: DeveloperInfo | null;
  moreFromDeveloper: RelatedRepo[];
  relatedRepos: RelatedRepo[];
}

export default function ProductDetailClient({ 
  listing, 
  repoDetails, 
  developerInfo,
  moreFromDeveloper,
  relatedRepos
}: ProductDetailClientProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [showGithubTransferInfo, setShowGithubTransferInfo] = useState(false);
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  // Frequently asked questions
  const faqItems = [
    {
      question: 'How does WebRend\'s repository marketplace work?',
      answer: 'WebRend allows developers to buy and sell code repositories. Sellers list their repositories with pricing details, and buyers can purchase either a one-time transfer of ownership or a subscription for access. All transactions are secured through Stripe.'
    },
    {
      question: 'What happens after I purchase a repository?',
      answer: 'For one-time purchases, the repository ownership will be transferred to your GitHub account. For subscriptions, you\'ll get access to the repository for the subscription period. All purchased repositories appear in your profile.'
    },
    {
      question: 'Are there any guarantees on purchased code?',
      answer: 'Yes! WebRend verifies all repositories for code quality and security before listing. If you encounter any issues with a purchased repository, our support team will assist you promptly.'
    },
    {
      question: 'Can I request customizations to a repository?',
      answer: 'Yes, you can contact the developer directly using the "Contact Developer" button. Many developers offer customization services in addition to their repository sales.'
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept all major credit cards through our secure payment processor, Stripe. All transactions are encrypted and secure.'
    }
  ];

  // Only use useEffect for authentication, not data fetching
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    
    return () => unsubscribe();
  }, []);

  // Fetch reviews on mount and when listing changes
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        setReviewsError(null);
        const res = await fetch(`/api/marketplace/reviews/${listing.docId}`);
        if (!res.ok) {
          throw new Error(`Failed to load reviews (${res.status})`);
        }
        const data = await res.json();
        setReviews((data.reviews || []) as Review[]);
      } catch (err) {
        console.error('Error loading reviews:', err);
        setReviewsError('Failed to load reviews');
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [listing.docId]);

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
    if (developerInfo?.createdAt) {
      return new Date(developerInfo.createdAt).getFullYear();
    }
    return new Date().getFullYear(); // Fallback to current year
  };
  
  // Handle contact developer
  const handleContactDeveloper = () => {
    if (developerInfo?.email) {
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
        
        <div className={styles.sidebarColumn}>
          {/* Purchase Card */}
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
          
          {/* Contact Developer Card - moved here under purchase card */}
          <div className={styles.contactDeveloperCard}>
            <h3>Contact the Developer</h3>
            <div className={styles.developerInfo}>
              <div className={styles.developerAvatar}>
                {developerInfo?.avatarUrl || listing.seller.avatarUrl ? (
                  <Image
                    src={developerInfo?.avatarUrl || listing.seller.avatarUrl || ''}
                    alt={listing.seller.username}
                    width={50}
                    height={50}
                  />
                ) : (
                  <div className={styles.defaultAvatarMedium}>
                    {listing.seller.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h4 className={styles.developerName}>{listing.seller.username}</h4>
                <p className={styles.developerUsername}>Developer since {getDeveloperSinceYear()}</p>
              </div>
            </div>
            <p className={styles.contactDescription}>
              Have questions about this repository? Need customizations or help?
            </p>
            <button 
              onClick={handleContactDeveloper}
              className={styles.contactButton}
            >
              Contact Developer
            </button>
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
              <td>{formatFileSize(repoDetails?.size || listing.size)}</td>
            </tr>
            <tr>
              <th>Last Update</th>
              <td>{formatDate(repoDetails?.updated_at || listing.updatedAt || listing.lastUpdated)}</td>
            </tr>
            <tr>
              <th>License</th>
              <td>{repoDetails?.license?.name || 'Unknown'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Reviews Section - New */}
      <div className={styles.reviewsSection}>
        <h2>Customer Reviews</h2>
        {reviewsLoading ? (
          <div className={styles.loading}>Loading reviews…</div>
        ) : reviewsError ? (
          <div className={styles.error}>{reviewsError}</div>
        ) : (
          <>
            <div className={styles.reviewStats}>
              <div className={styles.averageRating}>
                <div className={styles.ratingNumber}>
                  {reviews.length > 0 ? (
                    (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
                  ) : (
                    '0.0'
                  )}
                </div>
                <div className={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={styles.ratingStar}>★</span>
                  ))}
                </div>
                <div className={styles.ratingCount}>
                  {reviews.length > 0 ? `Based on ${reviews.length} reviews` : 'No reviews yet'}
                </div>
              </div>
              <div className={styles.ratingBreakdown}>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = reviews.filter(r => r.rating === rating).length;
                  const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={rating} className={styles.ratingBar}>
                      <span className={styles.ratingLabel}>{rating} stars</span>
                      <div className={styles.ratingBarContainer}>
                        <div className={styles.ratingBarFill} style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className={styles.ratingCount}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review form for authenticated users */}
            {isAuthenticated && (
              <div className={styles.reviewForm}>
                <h3>Write a Review</h3>
                <div className={styles.ratingInput}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={star <= newRating ? styles.starFilled : styles.starEmpty}
                      onClick={() => setNewRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  className={styles.commentInput}
                  placeholder="Share your experience with this repository"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  maxLength={5000}
                />
                <button
                  className={styles.submitReviewButton}
                  disabled={submittingReview || newComment.trim().length === 0}
                  onClick={async () => {
                    try {
                      setSubmittingReview(true);
                      const res = await fetch(`/api/marketplace/reviews/${listing.docId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rating: newRating, comment: newComment.trim() })
                      });
                      if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.error || 'Failed to submit review');
                      }
                      // Reload reviews
                      const refreshed = await fetch(`/api/marketplace/reviews/${listing.docId}`);
                      const data = await refreshed.json();
                      setReviews((data.reviews || []) as Review[]);
                      setNewComment('');
                    } catch (err) {
                      console.error('Submit review error:', err);
                      alert(err instanceof Error ? err.message : 'Failed to submit review');
                    } finally {
                      setSubmittingReview(false);
                    }
                  }}
                >
                  {submittingReview ? 'Submitting…' : 'Submit Review'}
                </button>
              </div>
            )}
          </>
        )}
        
        <div className={styles.reviewsList}>
          {reviews.map((review) => (
            <div key={review.id || review.userId + String(review.createdAt)} className={styles.reviewItem}>
              <div className={styles.reviewHeader}>
                <div className={styles.reviewerInfo}>
                  <div className={styles.reviewerAvatar}>
                    {review.avatarUrl ? (
                      <Image
                        src={review.avatarUrl}
                        alt={review.username}
                        width={40}
                        height={40}
                      />
                    ) : (
                      <div className={styles.defaultAvatarSmall}>
                        {review.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className={styles.reviewerName}>{review.username}</div>
                    <div className={styles.reviewDate}>{formatDate(review.createdAt)}</div>
                  </div>
                </div>
                <div className={styles.reviewRating}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < review.rating ? styles.starFilled : styles.starEmpty}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.reviewBody}>
                <p>{review.comment}</p>
              </div>
            </div>
          ))}
        </div>
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
                        src={repo.seller.avatarUrl || '/default-avatar.png'}
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
      
      {/* FAQ Section - New */}
      <div className={styles.faqSection}>
        <h2>Frequently Asked Questions</h2>
        <div className={styles.faqList}>
          {faqItems.map((item, index) => (
            <div key={index} className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>{item.question}</h3>
              <p className={styles.faqAnswer}>{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
      
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