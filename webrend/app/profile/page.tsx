'use client';

import { useState, useEffect } from 'react';
import { FaGithub } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';
import styles from './profile.module.scss';
import { auth } from '../lib/firebase-client';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

type GithubRepo = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
};

type PurchasedRepo = {
  id: string;
  repoId: number;
  title: string;
  description: string;
  image: string;
  seller: string;
  purchaseDate: string;
  type: 'purchase' | 'subscription';
  accessUntil?: string; // Only present for subscriptions
  githubUrl: string;
};

type StripeConnectionStatus = {
  connected: boolean;
  bankDetailsAdded: boolean;
};

export default function ProfilePage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [purchasedRepos, setPurchasedRepos] = useState<PurchasedRepo[]>([]);
  const [stripeStatus, setStripeStatus] = useState<StripeConnectionStatus>({
    connected: false,
    bankDetailsAdded: false
  });
  const [reposLoading, setReposLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [githubConnectStatus, setGithubConnectStatus] = useState<string | null>(null);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [showBankForm, setShowBankForm] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        fetchGithubRepos();
        fetchPurchasedRepos();
        checkStripeStatus();
      }
    });

    // Check URL params for GitHub connection status
    const params = new URLSearchParams(window.location.search);
    const githubStatus = params.get('github');
    const githubError = params.get('error');
    const errorMessage = params.get('message');
    
    if (githubStatus === 'connected') {
      setGithubConnectStatus('Successfully connected your GitHub account');
    } else if (githubError) {
      setGithubConnectStatus(`Error connecting GitHub: ${githubError}${errorMessage ? ` - ${errorMessage}` : ''}`);
    }

    return () => unsubscribe();
  }, []);

  const fetchGithubRepos = async () => {
    try {
      setReposLoading(true);
      setError(null);
      const response = await fetch('/api/github/repos');
      
      if (response.status === 401 || response.status === 400) {
        // User not authenticated or GitHub not connected
        setRepos([]);
        const data = await response.json();
        if (data.error === 'GitHub token expired or invalid' || 
            data.error === 'GitHub token expired or revoked') {
          setGithubConnectStatus('Your GitHub connection has expired. Please reconnect.');
        }
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setRepos(data.repos || []);
    } catch (err) {
      setError('Failed to fetch repositories');
      console.error('Error fetching repositories:', err);
    } finally {
      setReposLoading(false);
    }
  };

  const fetchPurchasedRepos = async () => {
    try {
      setPurchasesLoading(true);
      
      // In a real app, we would fetch from an API
      // For demo purposes, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockPurchasedRepos: PurchasedRepo[] = [
        {
          id: 'purchase1',
          repoId: 12345,
          title: 'Advanced React Component Library',
          description: 'A comprehensive library of React components with TypeScript support',
          image: 'https://placehold.co/400x250/4299e1/ffffff?text=React+Components',
          seller: 'DevShop Solutions',
          purchaseDate: '2023-08-15',
          type: 'purchase',
          githubUrl: 'https://github.com/yourusername/advanced-react-components'
        },
        {
          id: 'subscription1',
          repoId: 67890,
          title: 'AI Model Collection',
          description: 'Collection of trained AI models for image recognition',
          image: 'https://placehold.co/400x250/805ad5/ffffff?text=AI+Models',
          seller: 'AI Solutions LLC',
          purchaseDate: '2023-09-22',
          type: 'subscription',
          accessUntil: '2023-11-22',
          githubUrl: 'https://github.com/yourusername/ai-model-collection'
        }
      ];
      
      setPurchasedRepos(mockPurchasedRepos);
    } catch (err) {
      console.error('Error fetching purchased repositories:', err);
    } finally {
      setPurchasesLoading(false);
    }
  };

  const checkStripeStatus = async () => {
    try {
      setStripeLoading(true);
      
      // In a real app, we would fetch from an API
      // For demo purposes, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check if we have saved bank details in local storage for demo
      const bankDetailsAdded = localStorage.getItem('stripeBankDetailsAdded') === 'true';
      
      const mockStripeStatus: StripeConnectionStatus = {
        connected: true, // Always connected since we're using the .env API key
        bankDetailsAdded: bankDetailsAdded
      };
      
      setStripeStatus(mockStripeStatus);
    } catch (err) {
      console.error('Error checking Stripe status:', err);
    } finally {
      setStripeLoading(false);
    }
  };

  const handleBankDetailsSave = () => {
    // In a real app, we would send these details to our Stripe Connect backend
    // For demo, we're just saving a flag in localStorage
    localStorage.setItem('stripeBankDetailsAdded', 'true');
    setStripeStatus({
      ...stripeStatus,
      bankDetailsAdded: true
    });
    setShowBankForm(false);
  };

  const handleRemoveBankDetails = () => {
    // In a real app, we would call an API to remove bank details
    // For demo, we're just removing the flag from localStorage
    localStorage.removeItem('stripeBankDetailsAdded');
    setStripeStatus({
      ...stripeStatus,
      bankDetailsAdded: false
    });
  };

  const handleConnectGithub = async () => {
    try {
      setError(null);
      setGithubConnectStatus('Redirecting to GitHub...');
      // Redirect to the GitHub connect API route
      window.location.href = '/api/github/connect';
    } catch (err) {
      console.error('Error connecting to GitHub:', err);
      setGithubConnectStatus('Failed to connect to GitHub');
    }
  };

  const handleDisconnectGithub = async () => {
    try {
      setError(null);
      setGithubConnectStatus('Disconnecting from GitHub...');
      const response = await fetch('/api/github/disconnect', {
        method: 'POST',
      });
      
      if (response.ok) {
        setGithubConnectStatus('Successfully disconnected your GitHub account');
        // Clear repos immediately to update UI
        setRepos([]);
      } else {
        const data = await response.json();
        setGithubConnectStatus(`Failed to disconnect GitHub: ${data.error || 'Unknown error'}`);
        console.error('Failed to disconnect GitHub', data);
        
        // If token was invalid anyway, clear repos
        if (data.error === 'GitHub not connected for this user') {
          setRepos([]);
        }
      }
    } catch (err) {
      console.error('Error disconnecting GitHub:', err);
      setGithubConnectStatus('Error disconnecting from GitHub');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading profile...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.profile}>
        <h1 className={styles.title}>Your Profile</h1>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Account</h2>
          <div className={styles.accountInfo}>
            {user ? (
              <div className={styles.userInfo}>
                <div className={styles.avatar}>
                  {user.photoURL ? (
                    <Image 
                      src={user.photoURL} 
                      alt="User avatar" 
                      width={80} 
                      height={80} 
                    />
                  ) : (
                    <div className={styles.placeholderAvatar}>
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <div className={styles.userDetails}>
                  <h3>{user.displayName || 'User'}</h3>
                  <p>{user.email}</p>
                </div>
              </div>
            ) : (
              <div className={styles.notLoggedIn}>
                <p>You are not logged in</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Connections</h2>
          
          {githubConnectStatus && (
            <div className={`${styles.statusMessage} ${githubConnectStatus.includes('Error') || githubConnectStatus.includes('Failed') ? styles.errorStatus : styles.successStatus}`}>
              {githubConnectStatus}
            </div>
          )}
          
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
          
          <div className={styles.connectionCard}>
            <div className={styles.connectionInfo}>
              <div className={styles.connectionIcon}>
                <FaGithub />
              </div>
              <div className={styles.connectionDetails}>
                <h3>GitHub</h3>
                <p>{repos.length > 0 ? 'Connected to GitHub' : 'Not connected'}</p>
              </div>
            </div>
            <div className={styles.connectionActions}>
              {reposLoading ? (
                <button 
                  className={`${styles.connectionButton} ${styles.loading}`}
                  disabled
                >
                  Loading...
                </button>
              ) : repos.length > 0 ? (
                <button 
                  className={`${styles.connectionButton} ${styles.disconnect}`}
                  onClick={handleDisconnectGithub}
                >
                  Disconnect
                </button>
              ) : (
                <button 
                  className={`${styles.connectionButton} ${styles.connect}`}
                  onClick={handleConnectGithub}
                >
                  Connect
                </button>
              )}
            </div>
          </div>
          
          <div className={styles.connectionCard}>
            <div className={styles.connectionInfo}>
              <div className={styles.connectionIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.31 8L20.05 17.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.69 8H21.17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7.38 12.0001L13.12 2.06006" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.69 16.0001L3.95 6.06006" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.31 16H2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16.62 12L10.88 21.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={styles.connectionDetails}>
                <h3>Stripe Setup</h3>
                <p>{stripeLoading 
                  ? 'Checking status...' 
                  : stripeStatus.bankDetailsAdded
                    ? 'Connected - Ready to receive payments'
                    : 'API Key Ready - Bank details needed'}</p>
              </div>
            </div>
            
            <div className={styles.connectionActions}>
              {stripeLoading ? (
                <button 
                  className={`${styles.connectionButton} ${styles.connect}`}
                  disabled
                >
                  Loading...
                </button>
              ) : stripeStatus.bankDetailsAdded ? (
                <div className={styles.bankDetailsButtons}>
                  <button
                    className={`${styles.connectionButton} ${styles.edit}`}
                    onClick={() => setShowBankForm(true)}
                  >
                    Change Bank Details
                  </button>
                  <button
                    className={`${styles.connectionButton} ${styles.disconnect}`}
                    onClick={handleRemoveBankDetails}
                  >
                    Remove Bank Details
                  </button>
                </div>
              ) : (
                <button 
                  className={`${styles.connectionButton} ${styles.connect}`}
                  onClick={() => setShowBankForm(true)}
                >
                  Add Bank Details
                </button>
              )}
            </div>
          </div>
          
          {/* Add a "Sell Repositories" button below the Stripe section when bank details are added */}
          {stripeStatus.bankDetailsAdded && (
            <div className={styles.sellReposButton}>
              <Link href="/marketplace/sell" className={styles.sellButton}>
                Sell Repositories
              </Link>
            </div>
          )}
          
          {/* Bank Details Form */}
          {showBankForm && (
            <div className={styles.formContainer}>
              <div className={styles.formSection}>
                <h3>Add Your Bank Details</h3>
                <p className={styles.formHelper}>
                  These details will be used to send you payouts for your sold repositories.
                </p>
                <div className={styles.formGroup}>
                  <label htmlFor="accountHolderName">Account Holder Name</label>
                  <input 
                    type="text" 
                    id="accountHolderName"
                    placeholder="John Doe"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="accountNumber">Account Number</label>
                  <input 
                    type="text" 
                    id="accountNumber"
                    placeholder="000123456789"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="routingNumber">Routing Number</label>
                  <input 
                    type="text" 
                    id="routingNumber"
                    placeholder="110000000"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formActions}>
                  <button 
                    className={styles.cancelButton}
                    onClick={() => setShowBankForm(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className={styles.saveButton}
                    onClick={handleBankDetailsSave}
                    disabled={!accountHolderName || !bankAccountNumber || !routingNumber}
                  >
                    Save Bank Details
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {user && (
          <>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Your Purchased Repositories</h2>
              
              {purchasesLoading ? (
                <div className={styles.loading}>Loading purchases...</div>
              ) : purchasedRepos.length > 0 ? (
                <div className={styles.purchasedRepos}>
                  {purchasedRepos.map(repo => (
                    <div key={repo.id} className={styles.purchasedRepoCard}>
                      <div className={styles.purchasedRepoImage}>
                        <Image 
                          src={repo.image} 
                          alt={repo.title} 
                          width={400} 
                          height={250}
                        />
                        <div className={styles.purchaseType}>
                          {repo.type === 'purchase' ? 'Purchased' : 'Subscription'}
                        </div>
                      </div>
                      <div className={styles.purchasedRepoInfo}>
                        <h3>{repo.title}</h3>
                        <p className={styles.purchasedRepoDescription}>
                          {repo.description}
                        </p>
                        <div className={styles.purchasedRepoMeta}>
                          <span>From {repo.seller}</span>
                          <span>•</span>
                          <span>Purchased on {new Date(repo.purchaseDate).toLocaleDateString()}</span>
                        </div>
                        {repo.type === 'subscription' && repo.accessUntil && (
                          <div className={styles.subscriptionInfo}>
                            Access until: {new Date(repo.accessUntil).toLocaleDateString()}
                          </div>
                        )}
                        <div className={styles.purchasedRepoActions}>
                          <a 
                            href={repo.githubUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={styles.viewRepoButton}
                          >
                            View on GitHub
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>You haven&apos;t purchased any repositories yet.</p>
                  <Link href="/marketplace" className={styles.browseButton}>
                    Browse Marketplace
                  </Link>
                </div>
              )}
            </div>
            
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Your GitHub Repositories</h2>
              
              {reposLoading ? (
                <div className={styles.loading}>Loading repositories...</div>
              ) : error ? (
                <div className={styles.error}>{error}</div>
              ) : repos.length > 0 ? (
                <div className={styles.repoGrid}>
                  {repos.map((repo) => (
                    <div key={repo.id} className={styles.repoCard}>
                      <h3 className={styles.repoName}>
                        <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                          {repo.name}
                        </a>
                      </h3>
                      <p className={styles.repoDescription}>
                        {repo.description || 'No description provided'}
                      </p>
                      <div className={styles.repoStats}>
                        {repo.language && <span className={styles.repoLanguage}>{repo.language}</span>}
                        <span className={styles.repoStat}>⭐ {repo.stargazers_count}</span>
                        <span className={styles.repoStat}>🍴 {repo.forks_count}</span>
                      </div>
                      <div className={styles.repoActions}>
                        <Link href={`/marketplace/sell?repo=${repo.id}`} className={styles.sellButton}>
                          Sell This Repo
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>No repositories found. Make sure your GitHub account is connected and has public repositories.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
