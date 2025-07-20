'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '../../lib/firebase-client';
import { signOut } from 'firebase/auth';
import type { SimpleUser } from '../../utils/auth-utils';
import { useTheme } from '../ThemeProvider/ThemeProvider';
import PortfolioDropdown from './PortfolioDropdown';
import './NavBar.scss';

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
  const { theme } = useTheme();
  
  // Scroll-based navbar visibility
  const [isNavbarVisible, setIsNavbarVisible] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);

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

  // Scroll direction detection for navbar visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show navbar at top of page or when scrolling up
      if (currentScrollY === 0) {
        setIsNavbarVisible(true);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsNavbarVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past 100px
        setIsNavbarVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

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



  // Only render client-specific content after component is mounted
  // This prevents hydration mismatch between server and client
  if (!isMounted) {
    return (
      <>
        <div className={`top-navbar-container ${scrolled ? 'scrolled' : ''} ${!isNavbarVisible ? 'hidden' : ''}`}>
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
              <PortfolioDropdown isDarkMode={isDarkMode} pathname={pathname} />
              
              <Link 
                href="/marketplace" 
                className={`nav-button marketplace-button ${pathname === '/marketplace' ? 'active' : ''}`}
              >
                Marketplace
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
              
              {/* Auth Buttons */}
              {!loading && (
                <>
                  {user ? (
                    <>
                      <Link 
                        href="/profile" 
                        className="nav-button profile-button"
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="nav-button signout-button"
                        style={{
                          backgroundColor: isDarkMode ? 'rgba(155, 32, 32, 0.7)' : 'rgba(255, 59, 48, 0.15)',
                          color: isDarkMode ? '#ff8080' : '#ff3b30'
                        }}
                      >
                        Sign Out
                      </button>
                    </>
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
                        style={{
                          backgroundColor: isDarkMode ? '#0066cc' : '#0071e3',
                          color: 'white'
                        }}
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

      return (
      <>
        <div className={`top-navbar-container ${scrolled ? 'scrolled' : ''} ${!isNavbarVisible ? 'hidden' : ''}`}>
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
              <PortfolioDropdown isDarkMode={isDarkMode} pathname={pathname} />
              
              <Link 
                href="/marketplace" 
                className={`nav-button marketplace-button ${pathname === '/marketplace' ? 'active' : ''}`}
              >
                Marketplace
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
            
            {/* Auth Buttons */}
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link 
                      href="/profile" 
                      className="nav-button profile-button"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="nav-button signout-button"
                      style={{
                        backgroundColor: isDarkMode ? 'rgba(155, 32, 32, 0.7)' : 'rgba(255, 59, 48, 0.15)',
                        color: isDarkMode ? '#ff8080' : '#ff3b30'
                      }}
                    >
                      Sign Out
                    </button>
                  </>
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
                      style={{
                        backgroundColor: isDarkMode ? '#0066cc' : '#0071e3',
                        color: 'white'
                      }}
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