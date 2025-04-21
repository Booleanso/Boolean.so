'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase-client';
import { signOut, User } from 'firebase/auth';
import './NavBar.scss';

export default function NavBar() {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Clear session cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="navbar-container">
      <div className="navbar">
        <Link href="/" className="navbar-brand">
          WebRend
        </Link>
        
        <div className="navbar-menu">
          <Link href="/marketplace" className="nav-button marketplace-button">
            Marketplace
          </Link>
          
          <Link href="/portfolio" className="nav-button portfolio-button">
            Portfolio
          </Link>
          
          {!loading && (
            <>
              {user ? (
                <div className="user-section">
                  <Link href="/profile" className="nav-button profile-button">
                    Profile
                  </Link>
                  <div className="user-info">
                    <span className="user-email">{user.email}</span>
                    <button
                      onClick={handleSignOut}
                      className="nav-button signout-button"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    href="/auth?mode=signin"
                    className="nav-button login-button"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth?mode=signup"
                    className="nav-button signup-button"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 