'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '../../lib/firebase-client';
import { signOut } from 'firebase/auth';
import type { SimpleUser } from '../../utils/auth-utils';
import './NavBar.scss';

interface NavBarProps {
  serverUser: SimpleUser;
}

export default function NavBar({ serverUser }: NavBarProps) {
  const [user, setUser] = React.useState<SimpleUser>(serverUser);
  const loading = false;
  const [searchQuery, setSearchQuery] = useState<string>('');
  const scrolled = true;
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setUser(serverUser);
  }, [serverUser]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      setUser(null);
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
  
  const isAdmin = user?.email === 'ceo@webrend.com';

  return (
    <>
      <div className={`top-navbar-container ${scrolled ? 'scrolled' : ''}`}>
        <div className="top-navbar">
          <Link href="/" className={`navbar-brand ${pathname === '/' ? 'active' : ''}`}>
            <Image 
              src="/logo/logo_black.png" 
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
            
            {isAdmin && (
              <Link 
                href="/admin/portfolio/add"
                className={`nav-button admin-button ${pathname.startsWith('/admin') ? 'active' : ''}`}
              >
                Admin
              </Link>
            )}
            
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
      
      <div className="navbar-container">
        <div className="navbar">
          <div className="navbar-menu">
            <Link 
              href="/marketplace" 
              className={`nav-button marketplace-button ${pathname === '/marketplace' ? 'active' : ''}`}
            >
              Marketplace
            </Link>
          </div>
        </div>
      </div>

      <div className="logo-island-container">
        <div className="logo-island">
          <Link href="/" className={`navbar-brand ${pathname === '/' ? 'active' : ''}`}>
            <Image 
              src="/logo/logo_black.png" 
              alt="WebRend Logo" 
              width={35} 
              height={35} 
              className="navbar-logo"
              priority
            />
          </Link>
        </div>
      </div>

      {!loading && (
        <div className="auth-island-container">
          <div className="auth-island">
            {user ? (
              <>
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
              </>
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
          </div>
        </div>
      )}
    </>
  );
} 