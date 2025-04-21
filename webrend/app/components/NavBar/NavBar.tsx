'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '../../lib/firebase-client';
import { signOut, User } from 'firebase/auth';
import './NavBar.scss';

export default function NavBar() {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const pathname = usePathname();

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
        <Link href="/" className={`navbar-brand ${pathname === '/' ? 'active' : ''}`}>
          <Image 
            src="/logo/logo.png" 
            alt="WebRend Logo" 
            width={35} 
            height={35} 
            className="navbar-logo"
          />
        </Link>
        
        <div className="navbar-menu">
          <Link 
            href="/marketplace" 
            className={`nav-button marketplace-button ${pathname === '/marketplace' ? 'active' : ''}`}
          >
            Marketplace
          </Link>
          
          <Link 
            href="/portfolio" 
            className={`nav-button portfolio-button ${pathname === '/portfolio' ? 'active' : ''}`}
          >
            Portfolio
          </Link>
          
          {!loading && (
            <>
              {user ? (
                <div className="user-section">
                  <Link 
                    href="/profile" 
                    className={`nav-button profile-button ${pathname === '/profile' ? 'active' : ''}`}
                  >
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
                    className={`nav-button login-button ${pathname === '/auth' && new URLSearchParams(window.location.search).get('mode') === 'signin' ? 'active' : ''}`}
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth?mode=signup"
                    className={`nav-button signup-button ${pathname === '/auth' && new URLSearchParams(window.location.search).get('mode') === 'signup' ? 'active' : ''}`}
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