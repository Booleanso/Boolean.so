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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    // Set mounted state to true once component is mounted
    setIsMounted(true);
    
    // Check if user prefers dark mode
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);

    // Listen for changes in color scheme preference
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    darkModeMediaQuery.addEventListener('change', handleChange);
    return () => {
      darkModeMediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

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

  // Dark mode styling variables
  const bgColor = isDarkMode ? 'rgba(10, 10, 10, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const textColor = isDarkMode ? '#ffffff' : '#1d1d1f';
  const borderColor = isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(230, 230, 230, 0.95)';
  const buttonBgColor = isDarkMode ? 'rgba(40, 40, 40, 0.95)' : 'rgba(0, 0, 0, 0.08)';
  const signOutBgColor = isDarkMode ? 'rgba(155, 32, 32, 0.7)' : 'rgba(255, 59, 48, 0.15)';
  const signOutTextColor = isDarkMode ? '#ff8080' : '#ff3b30';
  const signUpBgColor = isDarkMode ? '#0066cc' : '#0071e3';
  const boxShadow = isDarkMode 
    ? '0 4px 20px rgba(0, 0, 0, 0.7)' 
    : '0 4px 20px rgba(0, 0, 0, 0.25)';
  const buttonShadow = isDarkMode 
    ? '0 2px 5px rgba(0, 0, 0, 0.5)' 
    : '0 1px 3px rgba(0, 0, 0, 0.1)';
  const logoFilter = isDarkMode ? 'invert(1) brightness(1.5)' : 'none';

  // Only render client-specific content after component is mounted
  // This prevents hydration mismatch between server and client
  if (!isMounted) {
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
                <form 
                  onSubmit={handleSearch} 
                  className="search-form"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(0, 0, 0, 0.03)',
                    border: isDarkMode ? '1px solid rgba(50, 50, 50, 0.8)' : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '10px',
                    padding: '0 15px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <input 
                    id="top-navbar-search-input"
                    type="text" 
                    placeholder="Search for designs, templates..."
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      padding: '10px 0',
                      fontSize: '14px',
                      width: '220px',
                      maxWidth: '220px',
                      color: isDarkMode ? '#f5f5f7' : '#1d1d1f'
                    }}
                  />
                  <button 
                    type="submit" 
                    className="search-button"
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: isDarkMode ? '#98989d' : '#86868b',
                      padding: 0,
                      marginLeft: '5px'
                    }}
                  >
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
      </>
    );
  }

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
              <form 
                onSubmit={handleSearch} 
                className="search-form"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(0, 0, 0, 0.03)',
                  border: isDarkMode ? '1px solid rgba(50, 50, 50, 0.8)' : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '10px',
                  padding: '0 15px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <input 
                  id="top-navbar-search-input"
                  type="text" 
                  placeholder="Search for designs, templates..."
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    padding: '10px 0',
                    fontSize: '14px',
                    width: '220px',
                    maxWidth: '220px',
                    color: isDarkMode ? '#f5f5f7' : '#1d1d1f'
                  }}
                />
                <button 
                  type="submit" 
                  className="search-button"
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: isDarkMode ? '#98989d' : '#86868b',
                    padding: 0,
                    marginLeft: '5px'
                  }}
                >
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
      
      <div style={{
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        zIndex: 1000
      }}>
        {/* Logo */}
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '60px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: bgColor,
          boxShadow: boxShadow,
          border: `2px solid ${borderColor}`
        }}>
          <Link href="/" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Image 
              src="/logo/logo_black.png" 
              alt="WebRend Logo" 
              width={40} 
              height={40} 
              className="navbar-logo"
              style={{
                objectFit: 'contain',
                filter: logoFilter
              }}
              priority
            />
          </Link>
        </div>

        {/* Marketplace Button */}
        <div style={{
          height: '60px',
          minWidth: '180px',
          borderRadius: '60px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: bgColor,
          boxShadow: boxShadow,
          border: `2px solid ${borderColor}`,
          padding: '0 25px'
        }}>
          <Link 
            href="/marketplace" 
            style={{
              backgroundColor: buttonBgColor,
              color: textColor,
              borderRadius: '30px',
              padding: '9px 20px',
              fontSize: '15px',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: buttonShadow
            }}
          >
            Marketplace
          </Link>
        </div>

        {/* Auth Buttons */}
        {!loading && (
          <div style={{
            height: '60px',
            minWidth: '220px',
            borderRadius: '60px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: bgColor,
            boxShadow: boxShadow,
            border: `2px solid ${borderColor}`,
            padding: '0 25px',
            gap: '10px'
          }}>
            {user ? (
              <>
                <Link 
                  href="/profile" 
                  style={{
                    backgroundColor: buttonBgColor,
                    color: textColor,
                    borderRadius: '30px',
                    padding: '9px 20px',
                    fontSize: '15px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: buttonShadow
                  }}
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  style={{
                    backgroundColor: signOutBgColor,
                    color: signOutTextColor,
                    borderRadius: '30px',
                    padding: '9px 20px',
                    fontSize: '15px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: buttonShadow
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth?mode=signin"
                  style={{
                    backgroundColor: buttonBgColor,
                    color: textColor,
                    borderRadius: '30px',
                    padding: '9px 20px',
                    fontSize: '15px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: buttonShadow
                  }}
                >
                  Login
                </Link>
                <Link
                  href="/auth?mode=signup"
                  style={{
                    backgroundColor: signUpBgColor,
                    color: 'white',
                    borderRadius: '30px',
                    padding: '9px 20px',
                    fontSize: '15px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: buttonShadow
                  }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
} 