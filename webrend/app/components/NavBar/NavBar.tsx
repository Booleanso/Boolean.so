'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '../../lib/firebase-client';
import { signOut, User } from 'firebase/auth';
import './NavBar.scss';

export default function NavBar() {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scrolled, setScrolled] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* Top Navbar */}
      <div className={`top-navbar-container ${scrolled ? 'scrolled' : ''}`}>
        <div className="top-navbar">
          <Link href="/" className={`navbar-brand ${pathname === '/' ? 'active' : ''}`}>
            <Image 
              src="/logo/logo.png" 
              alt="WebRend Logo" 
              width={40} 
              height={40} 
              className="navbar-logo"
              priority
            />
          </Link>
          
          <div className="top-navbar-menu">
            <Link 
              href="/portfolio" 
              className={`nav-button portfolio-button ${pathname === '/portfolio' ? 'active' : ''}`}
            >
              Portfolio
            </Link>
            
            <Link 
              href="/blog" 
              className={`nav-button portfolio-button ${pathname === '/blog' ? 'active' : ''}`}
            >
              AI Blog
            </Link>
            
            <div className="search-container">
              <form onSubmit={handleSearch} className="search-form">
                <input 
                  id="top-navbar-search-input"
                  type="text" 
                  placeholder="Search for designs, templates..."
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="search-button">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Navbar */}
      <div className="navbar-container">
        <div className="navbar">
          <Link href="/" className={`navbar-brand ${pathname === '/' ? 'active' : ''}`}>
            <Image 
              src="/logo/logo.png" 
              alt="WebRend Logo" 
              width={35} 
              height={35} 
              className="navbar-logo"
              priority
            />
          </Link>
          
          <div className="navbar-menu">
            <Link 
              href="/marketplace" 
              className={`nav-button marketplace-button ${pathname === '/marketplace' ? 'active' : ''}`}
            >
              Marketplace
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
                    <button
                      onClick={handleSignOut}
                      className="nav-button signout-button"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <>
                    <Link
                      href="/auth?mode=signin"
                      className={`nav-button login-button ${pathname === '/auth' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'signin' ? 'active' : ''}`}
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth?mode=signup"
                      className={`nav-button signup-button ${pathname === '/auth' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'signup' ? 'active' : ''}`}
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
    </>
  );
} 