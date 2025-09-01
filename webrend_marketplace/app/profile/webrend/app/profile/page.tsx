'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaGithub } from 'react-icons/fa';
import { FiRefreshCw, FiSun, FiMoon, FiMonitor } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import styles from './profile.module.scss';
import marketplaceStyles from '../marketplace/marketplace.module.scss';
import { auth } from '../lib/firebase-client';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useTheme } from '../components/ThemeProvider/ThemeProvider';

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
  repoId: string | number;
  title: string;
  description: string;
  image: string;
  seller: {
    id: string;
    username: string;
  };
  purchaseDate: string;
  type: 'purchase' | 'subscription';
  accessUntil?: string;
  githubUrl: string;
  status: string;
  transferStatus?: string;
};

type StripeConnectionStatus = {
  connected: boolean;
  bankDetailsAdded: boolean;
  stripeAccountId?: string;
  accountStatus?: 'pending' | 'verified' | 'restricted';
};

// Updated MarketplaceListing type to include id as string or number
type MarketplaceListing = {
  id: string | number;
  docId?: string;
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
  const [listedRepos, setListedRepos] = useState<MarketplaceListing[]>([]);
  const [listedReposLoading, setListedReposLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [refreshingListings, setRefreshingListings] = useState(false);
  const [taxId, setTaxId] = useState('');
  const [country, setCountry] = useState('US');
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<'pending' | 'verified' | 'restricted' | null>(null);
  const [showingSoldListings, setShowingSoldListings] = useState(false);
  const [allUserListings, setAllUserListings] = useState<MarketplaceListing[]>([]);
  const [repoFilter, setRepoFilter] = useState('');
  const [repoSort, setRepoSort] = useState('name'); // Default sort by name
  const [sortDirection, setSortDirection] = useState('asc'); // Default ascending
  
  // Get theme from context
  const { theme, setTheme } = useTheme();

  // Fetch user details using the Admin API endpoint
  const fetchUserDetails = useCallback(async () => {
    try {
      const response = await fetch('/api/user/get-current');
      
      if (!response.ok) {
        console.error('Failed to fetch user details:', response.status);
        return;
      }
      
      const userData = await response.json();
      
      // Set username from Firestore data (our source of truth)
      if (userData.firestore && userData.firestore.username) {
        setUsername(userData.firestore.username);
      } else if (userData.auth.displayName) {
        setUsername(userData.auth.displayName);
      } else if (userData.auth.email) {
        setUsername(userData.auth.email.split('@')[0]);
      }
      
      // Also update localStorage for other components
      if (userData.firestore && userData.firestore.username) {
        localStorage.setItem('sellerUsername', userData.firestore.username);
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
    }
  }, []);

  const fetchGithubRepos = useCallback(async () => {
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
  }, []);

  const fetchPurchasedRepos = useCallback(async (retryCount = 0) => {
    try {
      setPurchasesLoading(true);
      setError(null); // Clear any previous errors
      
      // Fetch from the API
      const response = await fetch('/api/user/purchased-repos');
      
      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated, just return empty array
          setPurchasedRepos([]);
          return;
        }
        
        console.error(`Failed to fetch purchased repos. Status: ${response.status}`);
        
        // If we got a 500 error and have retries left, try again after a delay
        if (response.status === 500 && retryCount < 2) {
          console.log(`Retrying fetch purchased repos (${retryCount + 1}/2)...`);
          setTimeout(() => {
            fetchPurchasedRepos(retryCount + 1);
          }, 1000 * (retryCount + 1)); // Increasing delay with each retry
          return;
        }
        
        throw new Error(`Failed to fetch purchased repositories. Status: ${response.status}`);
      }
      
      const data = await response.json();
      setPurchasedRepos(data.purchasedRepos || []);
    } catch (err) {
      console.error('Error fetching purchased repositories:', err);
      // Show error but don't block the UI
      setError('Failed to load purchased repositories');
      // Display empty data rather than breaking the UI completely
      setPurchasedRepos([]);
    } finally {
      setPurchasesLoading(false);
    }
  }, []);

  const fetchListedRepos = useCallback(async () => {
    try {
      setListedReposLoading(true);
      
      if (!user) {
        setListedRepos([]);
        return;
      }
      
      // Get the current user's data from our API
      const userResponse = await fetch('/api/user/get-current');
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user identity data');
      }
      
      const userData = await userResponse.json();
      
      // Get the user ID from Firebase Auth
      const userId = userData.auth.uid;
      
      if (!userId) {
        console.log('No user ID found for current user, cannot fetch listings');
        setListedRepos([]);
        return;
      }
      
      // Fetch listings from Firestore using the user ID
      const response = await fetch('/api/marketplace/firestore-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'query',
          collection: 'listings',
          data: {
            field: 'seller.id',
            operator: '==',
            value: userId,
            orderByField: 'createdAt',
            orderDirection: 'desc'
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('User marketplace listings:', data.documents);
      
      // Store all user listings in state for toggling
      setAllUserListings(data.documents);

      // Add an additional filter to only show non-sold listings by default
      const activeListings = data.documents.filter((listing: MarketplaceListing) => !listing.sold);
      const soldListings = data.documents.filter((listing: MarketplaceListing) => listing.sold);

      console.log(`Active listings: ${activeListings.length}, Sold listings: ${soldListings.length}`);

      // Set both types of listings for display
      setListedRepos(activeListings);
      setShowingSoldListings(false);
      
    } catch (err) {
      console.error('Error fetching listed repositories:', err);
    } finally {
      setListedReposLoading(false);
    }
  }, [user]);

  const checkStripeStatus = useCallback(async () => {
    try {
      setStripeLoading(true);
      
      // Fetch bank details from server using our API
      const response = await fetch('/api/user/get-current');
      let bankDetailsAdded = false;
      let stripeAccount = null;
      let status = null;
      
      if (response.ok) {
        const userData = await response.json();
        
        // Check if the user has bank details in Firestore
        if (userData.firestore) {
          if (userData.firestore.bankDetailsAdded === true) {
            bankDetailsAdded = true;
          }
          
          // Get user-specific Stripe Connect account ID
          if (userData.firestore.stripeAccountId) {
            stripeAccount = userData.firestore.stripeAccountId;
            setStripeAccountId(stripeAccount);
          }
          
          // Get account verification status
          if (userData.firestore.stripeAccountStatus) {
            status = userData.firestore.stripeAccountStatus;
            setAccountStatus(status);
          }
          
          // Set form values if they exist
          if (userData.firestore.accountHolderName) {
            setAccountHolderName(userData.firestore.accountHolderName);
          }
          if (userData.firestore.country) {
            setCountry(userData.firestore.country);
          }
        }
      }
      
      // Fallback to localStorage for demo purposes
      if (!bankDetailsAdded) {
        bankDetailsAdded = localStorage.getItem(`${username || user?.uid}_stripeBankDetailsAdded`) === 'true';
      }
      
      const stripeStatus: StripeConnectionStatus = {
        connected: !!stripeAccount, 
        bankDetailsAdded: bankDetailsAdded,
        stripeAccountId: stripeAccount || undefined,
        accountStatus: status || undefined
      };
      
      setStripeStatus(stripeStatus);
    } catch (err) {
      console.error('Error checking Stripe status:', err);
      
      // Fallback to localStorage in case of error
      const bankDetailsAdded = localStorage.getItem(`${username || user?.uid}_stripeBankDetailsAdded`) === 'true';
      setStripeStatus({
        connected: false,
        bankDetailsAdded: bankDetailsAdded
      });
    } finally {
      setStripeLoading(false);
    }
  }, [username, user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        fetchGithubRepos();
        fetchPurchasedRepos();
        fetchUserDetails();
        fetchListedRepos();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add a new effect to refresh listings when mounting
  // This catches any new listings created since the last visit
  useEffect(() => {
    // If user is already set (not first render), refresh listings
    if (user && !loading) {
      fetchListedRepos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const handleBankDetailsSave = async () => {
    // Save the bank details to Firestore via API
    try {
      // Maintain localStorage for demo purposes, but make it user-specific
      localStorage.setItem(`${username || user?.uid}_stripeBankDetailsAdded`, 'true');
      
      // Create or update Stripe Connect account for this specific user
      const response = await fetch('/api/user/create-stripe-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountHolderName,
          bankAccountNumber,
          routingNumber,
          taxId,
          country,
          email: user?.email,
          bankDetailsAdded: true
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to save bank details to server:', response.status);
        throw new Error('Failed to create Stripe Connect account');
      }
      
      const data = await response.json();
      
      // Update UI state with new Stripe account ID
      setStripeStatus({
        ...stripeStatus,
        connected: true,
        bankDetailsAdded: true,
        stripeAccountId: data.stripeAccountId,
        accountStatus: data.accountStatus || 'pending'
      });
      
      setStripeAccountId(data.stripeAccountId);
      setAccountStatus(data.accountStatus || 'pending');
      setShowBankForm(false);
      
      // Show success message
      setError(null);
    } catch (err) {
      console.error('Error saving bank details:', err);
      setError(err instanceof Error ? err.message : 'Failed to save bank details. Please try again.');
    }
  };

  const handleRemoveBankDetails = async () => {
    try {
      // Remove from localStorage for demo purposes
      localStorage.removeItem(`${username || user?.uid}_stripeBankDetailsAdded`);
      
      // Also update in Firestore via API
      const response = await fetch('/api/user/disconnect-stripe-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bankDetailsAdded: false,
          stripeAccountId // Pass the current account ID to be disconnected
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to disconnect Stripe account:', response.status);
        throw new Error('Failed to disconnect Stripe account');
      }
      
      // Update UI state
      setStripeStatus({
        connected: false,
        bankDetailsAdded: false
      });
      
      setStripeAccountId(null);
      setAccountStatus(null);
      
      // Show success message
      setError(null);
    } catch (err) {
      console.error('Error removing bank details:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect Stripe account. Please try again.');
    }
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

  const handleRemoveListing = async (listingId: string | number, stripeProductId: string) => {
    if (!user) return;
    
    try {
      // Convert string id to number if needed for the loading state
      setDeleteLoading(typeof listingId === 'string' ? parseInt(listingId, 10) : listingId);
      
      // Call Firestore API to remove the listing
      const deleteResponse = await fetch('/api/marketplace/firestore-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'delete',
          collection: 'listings',
          documentId: String(listingId)
        }),
      });
      
      if (!deleteResponse.ok) {
        throw new Error('Failed to remove marketplace listing');
      }
      
      // Call API to archive the Stripe product
      const stripeResponse = await fetch('/api/stripe/archive-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: stripeProductId,
        }),
      });
      
      if (!stripeResponse.ok) {
        console.warn('Listing removed from marketplace but Stripe product could not be archived');
      }
      
      // Update the UI by removing the deleted listing
      setListedRepos(prev => prev.filter(repo => {
        // Compare as strings to avoid type issues
        return String(repo.id) !== String(listingId);
      }));
      
    } catch (err) {
      console.error('Error removing listing:', err);
      alert('Failed to remove listing. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleMarkAsSold = async (listingId: string | number) => {
    if (!user) return;
    
    try {
      setDeleteLoading(typeof listingId === 'string' ? parseInt(listingId, 10) : listingId);
      
      // Use Firestore API to mark the listing as sold
      const response = await fetch('/api/marketplace/firestore-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'update',
          collection: 'listings',
          documentId: String(listingId),
          data: {
            sold: true,
            updatedAt: new Date().toISOString()
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark listing as sold');
      }
      
      // Update the UI by refreshing the listings
      fetchListedRepos();
      
    } catch (err) {
      console.error('Error marking listing as sold:', err);
      alert('Failed to mark listing as sold. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Validate username format client-side
  const validateUsername = (input: string): string | null => {
    if (input.length < 3 || input.length > 30) {
      return 'Username must be between 3 and 30 characters';
    }
    
    if (!/^[a-zA-Z0-9_.]+$/.test(input)) {
      return 'Username can only contain letters, numbers, underscores, and periods';
    }
    
    if (input.startsWith('.') || input.endsWith('.')) {
      return 'Username cannot start or end with a period';
    }
    
    if (input.includes('..')) {
      return 'Username cannot contain consecutive periods';
    }
    
    return null; // Valid username
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get value and remove any @ symbol the user might type
    // Then convert to lowercase
    const inputValue = e.target.value.replace('@', '').toLowerCase();
    setUsername(inputValue);
    
    // Only validate if there's some input
    if (inputValue.trim()) {
      setValidationMessage(validateUsername(inputValue));
    } else {
      setValidationMessage(null);
    }
  };

  const handleUpdateUsername = async () => {
    if (!user) return;
    const trimmedUsername = username.trim();
    if (!trimmedUsername) return;
    
    // Validate username format before submitting
    const validationError = validateUsername(trimmedUsername);
    if (validationError) {
      setValidationMessage(validationError);
      return;
    }
    
    try {
      setUsernameLoading(true);
      
      // Make API call to update the username server-side using Firebase Admin
      const response = await fetch('/api/user/update-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: trimmedUsername }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Show specific error for already taken usernames
        if (response.status === 409) {
          setError(errorData.error || 'This username is already taken');
          return;
        }
        
        throw new Error(errorData.error || 'Failed to update username');
      }
      
      // Clear any previous errors
      setError(null);
      setValidationMessage(null);
      
      // Update succeeded
      const result = await response.json();
      
      // Update localStorage for other pages that might need it
      localStorage.setItem('sellerUsername', result.username);
      
      // Update display
      setIsEditingUsername(false);
      
      // Refetch listings to reflect the new username
      fetchListedRepos();
      
    } catch (err) {
      console.error('Error updating username:', err);
      setError(err instanceof Error ? err.message : 'Failed to update username. Please try again.');
    } finally {
      setUsernameLoading(false);
    }
  };

  // Add a manual refresh function
  const handleRefreshListings = async () => {
    if (refreshingListings) return; // Prevent multiple simultaneous refreshes
    
    try {
      setRefreshingListings(true);
      await fetchListedRepos();
    } finally {
      setRefreshingListings(false);
    }
  };

  // Add this function to the component to toggle showing sold listings
  const toggleSoldListings = () => {
    if (showingSoldListings) {
      // Switch to active listings
      const activeListings = allUserListings.filter((listing: MarketplaceListing) => !listing.sold);
      setListedRepos(activeListings);
      setShowingSoldListings(false);
    } else {
      // Switch to sold listings
      const soldListings = allUserListings.filter((listing: MarketplaceListing) => listing.sold);
      setListedRepos(soldListings);
      setShowingSoldListings(true);
    }
  };

  // Add load preferences from localStorage
  useEffect(() => {
    // Load filter/sort preferences from localStorage
    if (typeof window !== 'undefined') {
      const savedFilter = localStorage.getItem('githubRepoFilter');
      const savedSort = localStorage.getItem('githubRepoSort');
      const savedDirection = localStorage.getItem('githubRepoSortDirection');
      
      if (savedFilter) setRepoFilter(savedFilter);
      if (savedSort) setRepoSort(savedSort);
      if (savedDirection) setSortDirection(savedDirection as 'asc' | 'desc');
    }
  }, []);

  // Add a function to save preferences
  const saveFilterPreferences = (filter: string, sort: string, direction: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('githubRepoFilter', filter);
      localStorage.setItem('githubRepoSort', sort);
      localStorage.setItem('githubRepoSortDirection', direction);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filter = e.target.value;
    setRepoFilter(filter);
    saveFilterPreferences(filter, repoSort, sortDirection);
  };

  // Handle sort changes
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sort = e.target.value;
    setRepoSort(sort);
    saveFilterPreferences(repoFilter, sort, sortDirection);
  };

  // Handle sort direction change
  const toggleSortDirection = () => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
    saveFilterPreferences(repoFilter, repoSort, newDirection);
  };

  // Function to sort repositories
  const getSortedFilteredRepos = () => {
    // First filter the repos
    const filtered = repos.filter(repo => {
      if (!repoFilter) return true;
      const searchTerm = repoFilter.toLowerCase();
      return (
        repo.name.toLowerCase().includes(searchTerm) ||
        (repo.description && repo.description.toLowerCase().includes(searchTerm))
      );
    });
    
    // Then sort them
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (repoSort) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'stars':
          comparison = b.stargazers_count - a.stargazers_count;
          break;
        case 'forks':
          comparison = b.forks_count - a.forks_count;
          break;
        case 'updated':
          comparison = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          break;
        case 'created':
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      
      return sortDirection === 'asc' ? comparison * -1 : comparison;
    });
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
      <div className={styles.sectionHeader}>
        <h1 className={styles.heading}><span className={styles.headingHighlight}>Your Profile</span></h1>
        <p className={styles.sectionIntro}>Manage your account, connections, and repositories in one place.</p>
      </div>
      
      <div className={styles.profile}>
        {/* Account & Connections unified section */}
        <div className={`${styles.section} ${styles.gridWrap}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.heading}>Account & Connections</h2>
          </div>
          
          {/* Status messages */}
          {githubConnectStatus && (
            <div className={`${styles.statusMessage} ${githubConnectStatus.includes('Error') || githubConnectStatus.includes('Failed') ? styles.errorStatus : styles.successStatus}`}>
              {githubConnectStatus}
            </div>
          )}
          
          {error && !isEditingUsername && (
            <div className={styles.error}>
              {error}
            </div>
          )}
          
          <div className={styles.unifiedSection}>
            {/* Account info on left */}
            <div className={styles.accountColumn}>
              <div className={styles.accountInfo}>
                {user ? (
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                      {user.photoURL ? (
                        <Image 
                          src={user.photoURL} 
                          alt="User avatar" 
                          width={120} 
                          height={120} 
                        />
                      ) : (
                        <div className={styles.placeholderAvatar}>
                          {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className={styles.userDetails}>
                      {isEditingUsername ? (
                        <div className={styles.usernameEdit}>
                          <div className={styles.usernameInputContainer}>
                            <span className={styles.atSymbol}>@</span>
                            <input
                              type="text"
                              value={username}
                              onChange={handleUsernameChange}
                              className={styles.usernameInput}
                              placeholder="username"
                              autoComplete="off"
                            />
                          </div>
                          <div className={styles.usernameRequirements}>
                            Username must:
                            <ul>
                              <li>Be 3-30 characters long</li>
                              <li>Only contain letters, numbers, underscores (_) and periods (.)</li>
                              <li>Not start or end with a period</li>
                              <li>Not contain consecutive periods</li>
                            </ul>
                          </div>
                          {validationMessage && (
                            <div className={styles.usernameValidation}>
                              {validationMessage}
                            </div>
                          )}
                          {error && (
                            <div className={styles.usernameError}>
                              {error}
                            </div>
                          )}
                          <div className={styles.usernameButtons}>
                            <button 
                              onClick={() => {
                                setIsEditingUsername(false);
                                setError(null); // Clear error when canceling
                              }} 
                              className={styles.cancelButton}
                              disabled={usernameLoading}
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={handleUpdateUsername} 
                              className={styles.saveButton}
                              disabled={usernameLoading || !username.trim() || validationMessage !== null}
                            >
                              {usernameLoading ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.usernameDisplay}>
                          <h3>@{username || user.displayName || 'user'}</h3>
                          <div className={styles.usernameActions}>
                            <button 
                              onClick={() => setIsEditingUsername(true)}
                              className={styles.editUsernameButton}
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      )}
                      <p>{user.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>You are not logged in</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Connections on right */}
            <div className={styles.connectionsColumn}>
              {/* Theme Toggle Connection */}
              <div className={styles.connectionCard}>
                <div className={styles.connectionInfo}>
                  <div className={styles.connectionIcon}>
                    {theme === 'light' ? <FiSun /> : theme === 'dark' ? <FiMoon /> : <FiMonitor />}
                  </div>
                  <div className={styles.connectionDetails}>
                    <h3>Theme</h3>
                    <p>Current theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}</p>
                  </div>
                </div>
                <div className={styles.themeToggle}>
                  <button 
                    onClick={() => setTheme('light')}
                    className={`${styles.themeButton} ${theme === 'light' ? styles.activeTheme : ''}`}
                    title="Light mode"
                  >
                    <FiSun />
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`${styles.themeButton} ${theme === 'dark' ? styles.activeTheme : ''}`}
                    title="Dark mode"
                  >
                    <FiMoon />
                  </button>
                  <button 
                    onClick={() => setTheme('system')}
                    className={`${styles.themeButton} ${theme === 'system' ? styles.activeTheme : ''}`}
                    title="System default"
                  >
                    <FiMonitor />
                  </button>
                </div>
              </div>

              {/* GitHub connection */}
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
              
              {/* Bank details connection */}
              <div className={styles.connectionCard}>
                <div className={styles.connectionInfo}>
                  <div className={styles.connectionIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6h18v3H3V6zm0 5h18v3H3v-3zm0 5h18v3H3v-3z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className={styles.connectionDetails}>
                    <h3>Bank Details</h3>
                    <p>
                      {stripeLoading 
                        ? 'Checking status...' 
                        : stripeStatus.bankDetailsAdded 
                          ? `Bank account ending in ${bankAccountNumber.slice(-4) || '****'}`
                          : 'No bank account connected - Required to receive payments'}
                    </p>
                    {stripeStatus.bankDetailsAdded && accountStatus === 'pending' && (
                      <small className={styles.verificationNote}>
                        Your account is pending verification. This usually takes 1-2 business days. 
                        You can still list repositories for sale during this time.
                      </small>
                    )}
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
                        Update Details
                      </button>
                      <button
                        className={`${styles.connectionButton} ${styles.disconnect}`}
                        onClick={handleRemoveBankDetails}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button 
                      className={`${styles.connectionButton} ${styles.connect}`}
                      onClick={() => setShowBankForm(true)}
                    >
                      Add Bank Account
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Bank Details Form */}
          {showBankForm && (
            <div className={styles.formContainer}>
              <div className={styles.formSection}>
                <h3>Set Up Bank Account</h3>
                <p className={styles.formHelper}>
                  These details will be used to receive payments from your marketplace sales. Bank verification typically takes 1-2 business days.
                  You can still list repositories during verification.
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
                  <label htmlFor="country">Country</label>
                  <select 
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={styles.formInput}
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    {/* Add more countries as needed */}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="taxId">Tax ID (SSN, EIN, etc.)</label>
                  <input 
                    type="text" 
                    id="taxId"
                    placeholder="123-45-6789"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className={styles.formInput}
                  />
                  <small className={styles.formHint}>Required for tax reporting. Will be securely stored by Stripe.</small>
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
                    disabled={!accountHolderName || !bankAccountNumber || !routingNumber || !taxId}
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
            {/* Listed Repositories - moved to be right after Account & Connections */}
            <div className={`${styles.section} ${styles.gridWrap}`}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.heading}>Your Listed Repositories</h2>
                <div className={styles.sectionControls}>
                  <button 
                    onClick={toggleSoldListings}
                    className={styles.toggleSoldButton}
                    title={showingSoldListings ? "Show active listings" : "Show sold listings"}
                  >
                    {showingSoldListings ? "Show Active" : "Show Sold"}
                  </button>
                  <button 
                    onClick={handleRefreshListings}
                    className={styles.refreshButton}
                    disabled={refreshingListings || listedReposLoading}
                    title="Refresh listings"
                  >
                    <FiRefreshCw className={refreshingListings || listedReposLoading ? styles.spinning : ''} />
                  </button>
                </div>
              </div>
              
              {listedReposLoading ? (
                <div className={styles.loading}>Loading listed repositories...</div>
              ) : listedRepos.length > 0 ? (
                <div className={`${styles.gridWrap}`}>
                  <div className={marketplaceStyles.grid}>
                    {listedRepos.map(repo => (
                      <div key={repo.id} className={marketplaceStyles.card}>
                        <div className={marketplaceStyles.cardImage}>
                          <Image src={repo.imageUrl} alt={repo.name} width={600} height={400} />
                          {repo.sold && (<div className={marketplaceStyles.soldBadge}>Sold</div>)}
                          <Link href={`/marketplace/buy/${repo.id}`}>
                            <button className={marketplaceStyles.buyButton} disabled={repo.sold}>
                              {repo.sold ? 'Sold Out' : repo.isSubscription ? 'Subscribe' : 'Buy Now'}
                            </button>
                          </Link>
                        </div>
                        <div className={marketplaceStyles.cardContent}>
                          <div className={marketplaceStyles.cardHeader}>
                            <h2 className={marketplaceStyles.repoName}>{repo.name}</h2>
                            <div className={marketplaceStyles.price}>{repo.isSubscription ? `$${repo.subscriptionPrice}/mo` : `$${repo.price}`}</div>
                          </div>
                          <p className={marketplaceStyles.description}>{repo.description}</p>
                          {/* Tags omitted on profile cards */}
                          <div className={marketplaceStyles.cardFooter}>
                            <div className={marketplaceStyles.seller}>
                              <div className={marketplaceStyles.avatar}>
                                <div className={marketplaceStyles.defaultAvatar}>{repo.seller.username.charAt(0).toUpperCase()}</div>
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
                          <div className={styles.listedRepoControls}>
                            <Link href={`/marketplace/buy/${repo.id}`} className={styles.viewListingButton}>View Listing</Link>
                            <Link href={`/marketplace/sell?edit=true&listing=${repo.id}`} className={styles.editListingButton}>Edit</Link>
                            <button
                              className={styles.removeListingButton}
                              onClick={() => handleRemoveListing(repo.id, repo.stripeProductId || '')}
                              disabled={deleteLoading === repo.id}
                            >
                              {deleteLoading === repo.id ? 'Removing…' : 'Remove'}
                            </button>
                            <button
                              className={styles.soldButton}
                              onClick={() => handleMarkAsSold(repo.id)}
                              disabled={deleteLoading === repo.id}
                            >
                              Mark as Sold
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>You haven&apos;t listed any repositories for sale yet.</p>
                  <Link href="/marketplace/sell" className={styles.sellButton}>
                    List a Repository
                  </Link>
                </div>
              )}
            </div>
            
            <div className={`${styles.section} ${styles.gridWrap}`}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.heading}>Your Purchased Repositories</h2>
                <button 
                  onClick={() => fetchPurchasedRepos(0)} 
                  className={styles.refreshButton}
                  disabled={purchasesLoading}
                  title="Refresh purchased repositories"
                >
                  <FiRefreshCw className={purchasesLoading ? styles.spinning : ''} />
                </button>
              </div>
              
              {error && (
                <div className={styles.error}>
                  {error}
                </div>
              )}
              
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
                          <span>From {repo.seller.username}</span>
                          <span>•</span>
                          <span>Purchased on {new Date(repo.purchaseDate).toLocaleDateString()}</span>
                        </div>
                        {repo.type === 'subscription' && repo.accessUntil && (
                          <div className={styles.subscriptionInfo}>
                            Access until: {new Date(repo.accessUntil).toLocaleDateString()}
                          </div>
                        )}
                        {repo.type === 'purchase' && repo.transferStatus && (
                          <div className={`${styles.transferStatus} ${styles[`status-${repo.transferStatus}`] || ''}`}>
                            Transfer status: {repo.transferStatus === 'self-purchase' || repo.transferStatus === 'not_applicable' 
                              ? 'Self-purchase (already owned)' 
                              : repo.transferStatus}
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
            
            <div className={`${styles.section} ${styles.gridWrap}`}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.heading}>Your GitHub Repositories</h2>
              </div>
              
              {reposLoading ? (
                <div className={styles.loading}>Loading repositories...</div>
              ) : error ? (
                <div className={styles.error}>{error}</div>
              ) : repos.length > 0 ? (
                <div className={styles.repoListContainer}>
                  {/* Filter and sort controls */}
                  <div className={styles.repoControls}>
                    <div className={styles.filterContainer}>
                      <input
                        type="text"
                        placeholder="Find a repository..."
                        value={repoFilter}
                        onChange={handleFilterChange}
                        className={styles.repoFilterInput}
                      />
                    </div>
                    <div className={styles.sortContainer}>
                      <select 
                        value={repoSort}
                        onChange={handleSortChange}
                        className={styles.repoSortSelect}
                      >
                        <option value="name">Name</option>
                        <option value="stars">Stars</option>
                        <option value="forks">Forks</option>
                        <option value="updated">Last updated</option>
                        <option value="created">Created</option>
                      </select>
                      <button 
                        onClick={toggleSortDirection}
                        className={styles.sortDirectionButton}
                        title={sortDirection === 'asc' ? 'Sort ascending' : 'Sort descending'}
                      >
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Repositories list (rows) */}
                  <div className={styles.repoList}>
                    {getSortedFilteredRepos().map((repo) => (
                      <div key={repo.id} className={styles.repoListItem}>
                        <div className={styles.repoListItemHeader}>
                          <h3 className={styles.repoName}>
                            <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                              {repo.name}
                            </a>
                          </h3>
                          <Link href={`/marketplace/sell?repo=${repo.id}`} className={styles.sellButton}>
                            Sell This Repo
                          </Link>
                        </div>
                        {repo.description && (
                          <p className={styles.repoDescription}>
                            {repo.description}
                          </p>
                        )}
                        <div className={styles.repoListItemFooter}>
                          {repo.language && <span className={styles.repoLanguage}>{repo.language}</span>}
                          <span className={styles.repoStat} title="Stars">⭐ {repo.stargazers_count}</span>
                          <span className={styles.repoStat} title="Forks">🍴 {repo.forks_count}</span>
                          <span className={styles.repoDate}>
                            Updated {new Date(repo.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Show "No results" if filtered repositories is empty */}
                  {getSortedFilteredRepos().length === 0 && (
                    <div className={styles.noResults}>
                      <p>No repositories match your filter criteria.</p>
                    </div>
                  )}
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
      
      {/* Compressed Footer */}
      <footer className={styles.compressedFooter}>
        <div className={styles.footerContent}>
          <div className={styles.footerLeft}>
            Made with love, by WebRend
          </div>
          <div className={styles.footerRight}>
            <a href="/privacy" className={styles.footerLink}>Privacy Policy</a>
            <a href="/terms" className={styles.footerLink}>Terms and Conditions</a>
            <span className={styles.footerCopyright}>Copyright 2025, All rights reserved</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
