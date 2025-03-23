'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './sell.module.scss';

// Types for the form
type PricingType = 'onetime' | 'subscription';

type GitHubRepo = {
  id: number;
  name: string;
  fullName: string;
  description: string;
  url: string;
  language: string;
  stars: number;
  forks: number;
};

type RepoFormData = {
  selectedRepo: GitHubRepo | null;
  title: string;
  description: string;
  images: { id: string; file: File; preview: string }[];
  pricingType: PricingType;
  price: number;
  subscriptionPrice: number;
  previewUrl: string;
};

type StripeAccountStatus = {
  accountId: string | null;
  onboardingComplete: boolean;
  onboardingUrl?: string;
};

const initialFormData: RepoFormData = {
  selectedRepo: null,
  title: '',
  description: '',
  images: [],
  pricingType: 'onetime',
  price: 0,
  subscriptionPrice: 0,
  previewUrl: ''
};

export default function SellRepoPage() {
  const [currentStep, setCurrentStep] = useState(0); // Start with Stripe Connect step
  const [formData, setFormData] = useState<RepoFormData>(initialFormData);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stripeAccount, setStripeAccount] = useState<StripeAccountStatus>({
    accountId: null,
    onboardingComplete: false
  });
  const [stripeLoading, setStripeLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if returning from Stripe onboarding
    const refresh = searchParams.get('refresh');
    const success = searchParams.get('success');
    
    if (success === 'true') {
      // Re-check Stripe account status
      checkStripeAccountStatus();
    } else if (refresh === 'true') {
      // Refresh the page and re-check Stripe account status
      window.location.href = '/marketplace/sell';
    } else {
      // Initial load - check Stripe account status
      checkStripeAccountStatus();
    }
  }, [searchParams]);

  const checkStripeAccountStatus = async () => {
    try {
      setStripeLoading(true);
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to check Stripe account status');
      }
      
      const data = await response.json();
      setStripeAccount({
        accountId: data.accountId,
        onboardingComplete: data.onboardingComplete,
        onboardingUrl: data.onboardingUrl
      });
      
      // If onboarding is complete, load GitHub repos
      if (data.onboardingComplete) {
        setCurrentStep(1); // Move to GitHub repo selection
        fetchRepositories();
      }
    } catch (error) {
      setError('Failed to check Stripe account status. Please try again later.');
      console.error('Error checking Stripe account status:', error);
    } finally {
      setStripeLoading(false);
    }
  };

  const handleStripeConnect = () => {
    if (stripeAccount.onboardingUrl) {
      window.location.href = stripeAccount.onboardingUrl;
    }
  };
  
  const fetchRepositories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/github/repos');
      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }
      const data = await response.json();
      setRepos(data.repos || []);
    } catch (error) {
      setError('Failed to load repositories. Make sure your GitHub account is connected.');
      console.error('Error fetching repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRepoSelect = (repo: GitHubRepo) => {
    setFormData({
      ...formData,
      selectedRepo: repo,
      title: repo.name,
      description: repo.description || '',
      previewUrl: repo.url
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      const newImages = newFiles.map(file => ({
        id: Math.random().toString(36).substring(2, 11),
        file,
        preview: URL.createObjectURL(file)
      }));

      setFormData({
        ...formData,
        images: [...formData.images, ...newImages]
      });
    }
  };

  const handleRemoveImage = (id: string) => {
    setFormData({
      ...formData,
      images: formData.images.filter(image => image.id !== id)
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePricingTypeChange = (type: PricingType) => {
    setFormData({
      ...formData,
      pricingType: type
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Upload images to storage (in a real app)
      // const imageUrls = await Promise.all(formData.images.map(image => uploadImage(image.file)));
      
      // For demo purposes, we'll just use the preview URLs
      const imageUrls = formData.images.map(image => image.preview);
      
      // Create the product in Stripe
      const response = await fetch('/api/stripe/create-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoId: formData.selectedRepo?.id,
          title: formData.title,
          description: formData.description,
          pricingType: formData.pricingType,
          price: formData.pricingType === 'onetime' ? formData.price : undefined,
          subscriptionPrice: formData.pricingType === 'subscription' ? formData.subscriptionPrice : undefined,
          images: imageUrls
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product listing');
      }
      
      alert('Repository listed successfully! Your GitHub repository is now available in the marketplace.');
      router.push('/marketplace');
    } catch (error) {
      setError(`Failed to list repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Error submitting repository:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const renderStepIndicator = () => {
    return (
      <div className={styles.stepIndicator}>
        <div className={`${styles.step} ${currentStep >= 0 ? styles.active : ''} ${currentStep > 0 ? styles.completed : ''}`}>
          <div className={styles.stepNumber}>1</div>
          <div>Stripe Connect</div>
        </div>
        <div className={`${styles.step} ${currentStep >= 1 ? styles.active : ''} ${currentStep > 1 ? styles.completed : ''}`}>
          <div className={styles.stepNumber}>2</div>
          <div>Select Repository</div>
        </div>
        <div className={`${styles.step} ${currentStep >= 2 ? styles.active : ''} ${currentStep > 2 ? styles.completed : ''}`}>
          <div className={styles.stepNumber}>3</div>
          <div>Add Details</div>
        </div>
        <div className={`${styles.step} ${currentStep >= 3 ? styles.active : ''} ${currentStep > 3 ? styles.completed : ''}`}>
          <div className={styles.stepNumber}>4</div>
          <div>Set Pricing</div>
        </div>
        <div className={`${styles.step} ${currentStep >= 4 ? styles.active : ''}`}>
          <div className={styles.stepNumber}>5</div>
          <div>Preview & Publish</div>
        </div>
      </div>
    );
  };

  const renderStripeConnectStep = () => {
    return (
      <>
        <h2>Connect Stripe Account</h2>
        <p>To sell repositories on our marketplace, you need to connect a Stripe account to receive payments directly.</p>
        
        {stripeLoading ? (
          <div className={styles.loading}>Checking your Stripe account status...</div>
        ) : stripeAccount.onboardingComplete ? (
          <div className={styles.stripeSuccess}>
            <div className={styles.successIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3>Stripe Connected Successfully!</h3>
            <p>Your Stripe account is ready to receive payments.</p>
            <button
              className={`${styles.button} ${styles.primary}`}
              onClick={nextStep}
            >
              Continue to Repository Selection
            </button>
          </div>
        ) : (
          <div className={styles.stripeConnect}>
            <p>You need to complete the Stripe onboarding process to receive payments directly to your bank account.</p>
            <div className={styles.stripeInfo}>
              <h3>What you&apos;ll need:</h3>
              <ul>
                <li>Basic personal information</li>
                <li>Banking details for deposits</li>
                <li>Tax information</li>
              </ul>
            </div>
            <button
              className={`${styles.button} ${styles.primary}`}
              onClick={handleStripeConnect}
              disabled={!stripeAccount.onboardingUrl}
            >
              {stripeAccount.accountId ? 'Continue Stripe Setup' : 'Connect with Stripe'}
            </button>
          </div>
        )}

        <div className={styles.navigationButtons}>
          <Link href="/marketplace" className={`${styles.button} ${styles.secondary}`}>
            Cancel
          </Link>
        </div>
      </>
    );
  };

  const renderStep1 = () => {
    return (
      <>
        <h2>Select a Repository to Sell</h2>
        {loading ? (
          <p>Loading your repositories...</p>
        ) : error ? (
          <div>
            <p className={styles.error}>{error}</p>
            <Link href="/profile" className={styles.button}>
              Connect GitHub Account
            </Link>
          </div>
        ) : repos.length === 0 ? (
          <p>No repositories found. Please make sure your GitHub account is connected and has public repositories.</p>
        ) : (
          <div className={styles.repoList}>
            {repos.map((repo) => (
              <div
                key={repo.id}
                className={`${styles.repoCard} ${formData.selectedRepo?.id === repo.id ? styles.selected : ''}`}
                onClick={() => handleRepoSelect(repo)}
              >
                <h3>{repo.name}</h3>
                <p>{repo.description || 'No description available'}</p>
                <div className={styles.repoStats}>
                  <div className={styles.repoStat}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    {repo.stars}
                  </div>
                  <div className={styles.repoStat}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="6" y1="3" x2="6" y2="15"></line>
                      <circle cx="18" cy="6" r="3"></circle>
                      <circle cx="6" cy="18" r="3"></circle>
                      <path d="M18 9a9 9 0 0 1-9 9"></path>
                    </svg>
                    {repo.forks}
                  </div>
                  {repo.language && (
                    <div className={styles.repoStat}>
                      {repo.language}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.navigationButtons}>
          <button onClick={prevStep} className={`${styles.button} ${styles.secondary}`}>
            Back
          </button>
          <button
            className={`${styles.button} ${styles.primary}`}
            onClick={nextStep}
            disabled={!formData.selectedRepo}
          >
            Next
          </button>
        </div>
      </>
    );
  };

  const renderStep2 = () => {
    return (
      <>
        <h2>Add Details</h2>
        
        <div className={styles.formGroup}>
          <label htmlFor="title">Repository Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
          <div className={styles.helpText}>
            A clear, descriptive title for your repository listing.
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
          ></textarea>
          <div className={styles.helpText}>
            Explain what your repository does, its features, and why someone would want to purchase it.
          </div>
        </div>
        
        <div className={styles.imageUploadContainer}>
          <label>Images</label>
          <div 
            className={styles.imageUploadArea}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={styles.uploadIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div className={styles.uploadText}>
              Click to upload or drag and drop
            </div>
            <div className={styles.uploadHint}>
              PNG, JPG or GIF (max. 5MB)
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              multiple
              style={{ display: 'none' }}
            />
          </div>
          
          {formData.images.length > 0 && (
            <div className={styles.imagePreviewGrid}>
              {formData.images.map(image => (
                <div key={image.id} className={styles.imagePreview}>
                  <Image 
                    src={image.preview} 
                    alt="Preview" 
                    width={150} 
                    height={150}
                  />
                  <button 
                    className={styles.removeImageButton}
                    onClick={() => handleRemoveImage(image.id)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.navigationButtons}>
          <button onClick={prevStep} className={`${styles.button} ${styles.secondary}`}>
            Back
          </button>
          <button onClick={nextStep} className={`${styles.button} ${styles.primary}`}>
            Next
          </button>
        </div>
      </>
    );
  };

  const renderStep3 = () => {
    return (
      <>
        <h2>Set Pricing</h2>
        
        <div className={styles.radioGroup}>
          <div 
            className={`${styles.radioOption} ${formData.pricingType === 'onetime' ? styles.selected : ''}`}
            onClick={() => handlePricingTypeChange('onetime')}
          >
            <input 
              type="radio" 
              id="onetime" 
              name="pricingType" 
              checked={formData.pricingType === 'onetime'} 
              onChange={() => handlePricingTypeChange('onetime')} 
            />
            <div className={styles.radioLabel}>
              <div className={styles.radioTitle}>One-time Purchase</div>
              <div className={styles.radioDescription}>
                Buyers pay once and the repository ownership will be transferred to them.
              </div>
            </div>
          </div>
          
          <div 
            className={`${styles.radioOption} ${formData.pricingType === 'subscription' ? styles.selected : ''}`}
            onClick={() => handlePricingTypeChange('subscription')}
          >
            <input 
              type="radio" 
              id="subscription" 
              name="pricingType" 
              checked={formData.pricingType === 'subscription'} 
              onChange={() => handlePricingTypeChange('subscription')} 
            />
            <div className={styles.radioLabel}>
              <div className={styles.radioTitle}>Subscription</div>
              <div className={styles.radioDescription}>
                Buyers pay a monthly fee for access to your repository. Access will be revoked if they cancel.
              </div>
            </div>
          </div>
        </div>
        
        {formData.pricingType === 'onetime' ? (
          <div className={styles.formGroup}>
            <label htmlFor="price">Price ($)</label>
            <input
              type="number"
              id="price"
              name="price"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleInputChange}
              required
            />
            <div className={styles.helpText}>
              The one-time price buyers will pay to purchase your repository.
            </div>
          </div>
        ) : (
          <div className={styles.formGroup}>
            <label htmlFor="subscriptionPrice">Monthly Subscription Price ($)</label>
            <input
              type="number"
              id="subscriptionPrice"
              name="subscriptionPrice"
              min="0"
              step="0.01"
              value={formData.subscriptionPrice}
              onChange={handleInputChange}
              required
            />
            <div className={styles.helpText}>
              The monthly subscription fee buyers will pay for access to your repository.
            </div>
          </div>
        )}

        <div className={styles.navigationButtons}>
          <button onClick={prevStep} className={`${styles.button} ${styles.secondary}`}>
            Back
          </button>
          <button onClick={nextStep} className={`${styles.button} ${styles.primary}`}>
            Next
          </button>
        </div>
      </>
    );
  };

  const renderStep4 = () => {
    const isPriceValid = formData.pricingType === 'onetime' 
      ? formData.price > 0 
      : formData.subscriptionPrice > 0;

    return (
      <>
        <h2>Preview & Publish</h2>
        
        <div className={styles.previewContainer}>
          <div className={styles.previewHeader}>
            <h3>Repository Preview</h3>
          </div>
          <div className={styles.previewContent}>
            <div className={styles.previewField}>
              <div className={styles.previewLabel}>Title</div>
              <div className={styles.previewValue}>{formData.title}</div>
            </div>
            <div className={styles.previewField}>
              <div className={styles.previewLabel}>Repository</div>
              <div className={styles.previewValue}>{formData.selectedRepo?.fullName}</div>
            </div>
            <div className={styles.previewField}>
              <div className={styles.previewLabel}>Pricing</div>
              <div className={styles.previewValue}>
                {formData.pricingType === 'onetime' 
                  ? `One-time purchase: $${formData.price}` 
                  : `Subscription: $${formData.subscriptionPrice}/month`}
              </div>
            </div>
            
            <div className={styles.previewDescription}>
              <h4>Description</h4>
              <p>{formData.description}</p>
            </div>
            
            {formData.images.length > 0 && (
              <div className={styles.previewImages}>
                <h4>Images</h4>
                <div className={styles.previewImageGrid}>
                  {formData.images.map(image => (
                    <div key={image.id} className={styles.previewImageItem}>
                      <Image 
                        src={image.preview} 
                        alt="Preview" 
                        width={150} 
                        height={150}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {formData.previewUrl && (
          <div className={styles.previewContainer}>
            <div className={styles.previewHeader}>
              <h3>GitHub Repository</h3>
            </div>
            <iframe
              src={formData.previewUrl}
              className={styles.iframePreview}
              title="Repository Preview"
            />
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.feeInfo}>
          <h4>Fee Information</h4>
          <p>When your repository sells, you&apos;ll receive payouts directly to your Stripe account.</p>
          <ul>
            <li>Stripe processing fee: 2.9% + $0.30 per transaction</li>
            <li>Platform fee: 5% of the transaction amount</li>
          </ul>
        </div>

        <div className={styles.navigationButtons}>
          <button onClick={prevStep} className={`${styles.button} ${styles.secondary}`}>
            Back
          </button>
          <button 
            onClick={handleSubmit} 
            className={`${styles.button} ${styles.primary}`}
            disabled={!isPriceValid || submitting}
          >
            {submitting ? 'Publishing...' : 'Publish Listing'}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>List Your Repository for Sale</h1>
        <p>Share your code with the world and earn income from your work.</p>
      </div>
      
      <div className={styles.formContainer}>
        {renderStepIndicator()}
        
        {currentStep === 0 && renderStripeConnectStep()}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>
    </div>
  );
}
