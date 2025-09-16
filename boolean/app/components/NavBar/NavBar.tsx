'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import TrustedByInline from '../TrustedBy/TrustedByInline';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '../../lib/firebase-client';
import { signOut } from 'firebase/auth';
import type { SimpleUser } from '../../utils/auth-utils';
import { useTheme } from '../ThemeProvider/ThemeProvider';
// Removed PortfolioDropdown import
import './NavBar.scss';
// motion removed

interface NavBarProps {
  serverUser: SimpleUser;
}

export default function NavBar({ serverUser }: NavBarProps) {
  const [user, setUser] = React.useState<SimpleUser>(serverUser);
  const loading = false;
  const scrolled = true;
  const router = useRouter();
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(isDarkMode ? 'light' as const : 'dark' as const);
  const leftMenuRef = React.useRef<HTMLDivElement>(null);
  
  // No scroll-based behavior

  useEffect(() => {
    // Set mounted state to true once component is mounted
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Update dark mode based on theme context
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let shouldBeDark = false;
    
    if (theme === 'system') {
      shouldBeDark = systemDark;
    } else {
      shouldBeDark = theme === 'dark';
    }
    
    setIsDarkMode(shouldBeDark);
  }, [theme]);

  useEffect(() => {
    setUser(serverUser);
  }, [serverUser]);

  // No-op mount hook
  useEffect(() => {}, []);

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
  
  const isAdmin = user?.email === 'ceo@webrend.com';
  // No moving indicator anymore
  const updateIndicatorToActive = () => {};

  useEffect(() => {}, [pathname]);

  // Ensure indicator initializes once the client-only navbar (with refs) is mounted
  useEffect(() => {}, [isMounted, pathname]);


  // Portfolio overlay removed



  // Only render client-specific content after component is mounted
  // This prevents hydration mismatch between server and client
  if (!isMounted) {
    return (
      <>
        <div className="top-navbar-container">
          <div className="top-navbar">
            <div className="top-navbar-menu" />
            <div className="top-navbar-menu" style={{ gap: 10 }}>
              <TrustedByInline />
              <Link href="/discovery" className="nav-button cta-button">Speak with us</Link>
              {!loading && (user ? (
                <button onClick={handleSignOut} className="nav-button signout-button">Sign Out</button>
              ) : (
                <>
                  <Link href="/auth?mode=signin" className="nav-button login-button">Login</Link>
                  <Link href="/auth?mode=signup" className="nav-button signup-button">Sign Up</Link>
                </>
              ))}
            </div>
          </div>
        </div>
        <div className="theme-toggle-floating">
          <button className={`theme-toggle ${isDarkMode ? 'dark' : 'light'}`} onClick={toggleTheme} aria-label="Toggle theme" title={isDarkMode ? 'Switch to light' : 'Switch to dark'}>
            <span className="toggle-track"><span className="toggle-thumb" /></span>
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="top-navbar-container">
        <div className="top-navbar">
          <div className="top-navbar-brand">
            <Link href="/" className="brand-link">
              <img src={isDarkMode ? "/logo/logo_white.png" : "/logo/logo.png"} alt="Boolean" className="brand-logo" />
              <span className="brand-text">Boolean</span>
            </Link>
          </div>
          <div className="top-navbar-menu" ref={leftMenuRef} style={{ marginLeft: 12 }}>
            <Link 
              href="/"
              className={`nav-button ${pathname === '/' ? 'active' : ''}`}
            >
              Home
            </Link>
            <Link href="/vsl" className={`nav-button ${pathname.startsWith('/vsl') ? 'active' : ''}`}>About</Link>
            <Link href="/portfolio" className={`nav-button ${pathname.startsWith('/portfolio') ? 'active' : ''}`}>Portfolio</Link>
            <Link href="/blog" className={`nav-button ${pathname === '/blog' ? 'active' : ''}`}>AI Blog</Link>
            {isAdmin && (<Link href="/admin" className={`nav-button ${pathname.startsWith('/admin') ? 'active' : ''}`}>Admin</Link>)}
          </div>
          <div className="top-navbar-menu" style={{ gap: 10, marginLeft: 'auto' }}>
            <TrustedByInline />
            <Link href="/discovery" className="nav-button cta-button">Speak with us</Link>
            {!loading && (user ? (
              <button onClick={handleSignOut} className="nav-button signout-button">Sign Out</button>
            ) : (
              <>
                <Link href="/auth?mode=signin" className="nav-button login-button">Login</Link>
                <Link href="/auth?mode=signup" className="nav-button signup-button">Sign Up</Link>
              </>
            ))}
          </div>
        </div>
      </div>
      <div className="theme-toggle-floating">
        <button className={`theme-toggle ${isDarkMode ? 'dark' : 'light'}`} onClick={toggleTheme} aria-label="Toggle theme" title={isDarkMode ? 'Switch to light' : 'Switch to dark'}>
          <span className="toggle-track"><span className="toggle-thumb" /></span>
        </button>
      </div>
    </>
  );
} 