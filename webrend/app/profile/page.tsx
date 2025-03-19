'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './profile.module.scss';
import Image from 'next/image';

type GithubStatus = {
  connected: boolean;
  githubUsername: string | null;
  githubAvatarUrl: string | null;
  githubProfileUrl: string | null;
  githubConnectedAt: string | null;
};

type GitHubRepo = {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  isPrivate: boolean;
  stars: number;
  forks: number;
  language: string | null;
  updatedAt: string;
};

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const [githubStatus, setGithubStatus] = useState<GithubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);

  useEffect(() => {
    // Check for URL parameters indicating success or error
    const githubParam = searchParams.get('github');
    const errorParam = searchParams.get('error');
    
    if (githubParam === 'connected') {
      setSuccess('GitHub account connected successfully!');
    }
    
    if (errorParam) {
      setError(`Error: ${errorParam.replace(/_/g, ' ')}`);
    }
    
    // Fetch GitHub connection status
    const fetchGithubStatus = async () => {
      try {
        setLoading(true);
        console.log('Fetching GitHub status...');
        const response = await fetch('/api/github/status');
        
        console.log('GitHub status response:', response.status);
        
        // Even if we get a 4xx/5xx response, we still want to parse the JSON to get error details
        const data = await response.json().catch(() => ({ connected: false }));
        console.log('GitHub status data:', data);
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch GitHub status');
        }
        
        setGithubStatus(data);
        
        // If connected, fetch repositories
        if (data.connected) {
          fetchRepositories();
        }
      } catch (err) {
        console.error('Error fetching GitHub status:', err);
        setError(`Failed to load GitHub connection status: ${err instanceof Error ? err.message : 'Unknown error'}`);
        // Ensure githubStatus has at least the connected property
        setGithubStatus(prev => prev || { connected: false, githubUsername: null, githubAvatarUrl: null, githubProfileUrl: null, githubConnectedAt: null });
      } finally {
        setLoading(false);
      }
    };

    fetchGithubStatus();
  }, [searchParams]);

  const fetchRepositories = async () => {
    try {
      setReposLoading(true);
      console.log('Fetching GitHub repositories...');
      const response = await fetch('/api/github/repos');
      
      console.log('GitHub repos response:', response.status);
      
      // Even if we get a 4xx/5xx response, we still want to parse the JSON to get error details
      const data = await response.json().catch(() => ({ repos: [] }));
      console.log('GitHub repos data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch repositories');
      }
      
      setRepositories(data.repos || []);
    } catch (err) {
      console.error('Error fetching repositories:', err);
      setError(`Failed to load GitHub repositories: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setReposLoading(false);
    }
  };

  const handleConnectGithub = () => {
    window.location.href = '/api/github/connect';
  };

  const handleDisconnectGithub = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/github/disconnect', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect GitHub account');
      }
      
      // Refresh GitHub status
      const statusResponse = await fetch('/api/github/status');
      const data = await statusResponse.json();
      setGithubStatus(data);
      setRepositories([]);
      setSuccess('GitHub account disconnected successfully');
    } catch (err) {
      console.error('Error disconnecting GitHub:', err);
      setError('Failed to disconnect GitHub account');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className={styles.profileContainer}>
      <h1 className={styles.profileTitle}>Your Profile</h1>
      
      {error && (
        <div className={styles.errorMessage}>
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      {success && (
        <div className={styles.successMessage}>
          {success}
          <button onClick={() => setSuccess(null)}>Dismiss</button>
        </div>
      )}
      
      <div className={styles.settingsSection}>
        <h2>Connected Accounts</h2>
        
        <div className={styles.accountConnection}>
          <div className={styles.serviceInfo}>
            <h3>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
              GitHub
            </h3>
            <p>Connect your GitHub account to access repositories and more.</p>
          </div>
          
          <div className={styles.connectionStatus}>
            {loading ? (
              <div className={styles.loading}>Loading...</div>
            ) : githubStatus?.connected ? (
              <div className={styles.connectedAccount}>
                <div className={styles.githubProfile}>
                  {githubStatus.githubAvatarUrl && (
                    <Image
                      src={githubStatus.githubAvatarUrl}
                      alt={`${githubStatus.githubUsername}'s GitHub avatar`}
                      width={40}
                      height={40}
                      className={styles.avatarImage}
                    />
                  )}
                  <div>
                    <p className={styles.githubUsername}>{githubStatus.githubUsername}</p>
                    {githubStatus.githubProfileUrl && (
                      <a
                        href={githubStatus.githubProfileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.githubLink}
                      >
                        View Profile
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleDisconnectGithub}
                  className={styles.disconnectButton}
                  disabled={loading}
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectGithub}
                className={styles.connectButton}
                disabled={loading}
              >
                Connect
              </button>
            )}
          </div>
        </div>
      </div>
      
      {githubStatus?.connected && (
        <div className={styles.settingsSection}>
          <h2>Your GitHub Repositories</h2>
          
          {reposLoading ? (
            <div className={styles.loading}>Loading repositories...</div>
          ) : repositories.length > 0 ? (
            <div className={styles.reposList}>
              {repositories.map(repo => (
                <div key={repo.id} className={styles.repoCard}>
                  <div className={styles.repoHeader}>
                    <h3 className={styles.repoName}>
                      <a href={repo.url} target="_blank" rel="noopener noreferrer">
                        {repo.name}
                        {repo.isPrivate && <span className={styles.privateLabel}>Private</span>}
                      </a>
                    </h3>
                    <div className={styles.repoStats}>
                      {repo.language && (
                        <span className={styles.language}>
                          <span 
                            className={styles.languageColor} 
                            style={{ backgroundColor: getLanguageColor(repo.language) }}
                          ></span>
                          {repo.language}
                        </span>
                      )}
                      <span className={styles.stars}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        {repo.stars}
                      </span>
                      <span className={styles.forks}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 18C7 16.3431 8.34315 15 10 15H15"></path>
                          <path d="M15 15C16.6569 15 18 16.3431 18 18C18 19.6569 16.6569 21 15 21C13.3431 21 12 19.6569 12 18"></path>
                          <path d="M15 3C16.6569 3 18 4.34315 18 6C18 7.65685 16.6569 9 15 9C13.3431 9 12 7.65685 12 6"></path>
                          <path d="M6 6C6 7.65685 4.65685 9 3 9C1.34315 9 0 7.65685 0 6C0 4.34315 1.34315 3 3 3C4.65685 3 6 4.34315 6 6Z"></path>
                        </svg>
                        {repo.forks}
                      </span>
                      <span className={styles.updatedAt}>Updated on {formatDate(repo.updatedAt)}</span>
                    </div>
                  </div>
                  {repo.description && <p className={styles.repoDescription}>{repo.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noRepos}>No repositories found.</p>
          )}
          
          <button 
            onClick={fetchRepositories} 
            className={styles.refreshButton}
            disabled={reposLoading}
          >
            Refresh Repositories
          </button>
        </div>
      )}
    </div>
  );
}

// Helper function to get a color for a programming language
function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    JavaScript: '#f1e05a',
    TypeScript: '#2b7489',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Python: '#3572A5',
    Java: '#b07219',
    C: '#555555',
    'C++': '#f34b7d',
    'C#': '#178600',
    PHP: '#4F5D95',
    Ruby: '#701516',
    Go: '#00ADD8',
    Swift: '#ffac45',
    Kotlin: '#F18E33',
    Rust: '#dea584',
    Dart: '#00B4AB',
    Shell: '#89e051',
  };
  
  return colors[language] || '#8257e5'; // Default purple color
}
