'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '../../lib/firebase-client';
import { signOut } from 'firebase/auth';
import type { SimpleUser } from '../../utils/auth-utils';
import { useTheme } from '../ThemeProvider/ThemeProvider';
// Removed PortfolioDropdown import
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
  const [isPortfolioOpen, setIsPortfolioOpen] = useState<boolean>(false);
  const [isPortfolioClosing, setIsPortfolioClosing] = useState<boolean>(false);
  const [portfolioProjects, setPortfolioProjects] = useState<any[]>([]);

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

  // Fetch portfolio projects when overlay opens
  const fetchPortfolioProjects = async () => {
    try {
      const response = await fetch('/api/portfolio/projects');
      if (response.ok) {
        const projects = await response.json();
        setPortfolioProjects(projects);
      }
    } catch (error) {
      console.error('Error fetching portfolio projects:', error);
    }
  };

  const handlePortfolioOpen = () => {
    setIsPortfolioOpen(true);
    setIsPortfolioClosing(false);
    fetchPortfolioProjects();
  };

  const handlePortfolioClose = () => {
    setIsPortfolioClosing(true);
    setTimeout(() => {
      setIsPortfolioOpen(false);
      setIsPortfolioClosing(false);
    }, 400); // Match the animation duration
  };



  // Only render client-specific content after component is mounted
  // This prevents hydration mismatch between server and client
  if (!isMounted) {
    return (
      <>
        {/* Logo Island */}
        <div className="logo-island-container" style={{ opacity: isNavbarVisible ? 1 : 0 }}>
          <div className="logo-island">
            <Link href="/" className={`navbar-brand ${pathname === '/' ? 'active' : ''}`}>
              <Image 
                src="/logo/logo_black.png" 
                alt="WebRend Logo" 
                width={28} 
                height={28} 
                className="navbar-logo"
                priority
              />
            </Link>
          </div>
        </div>

        {/* Main Navbar Island */}
        <div className="navbar-container" style={{ opacity: isNavbarVisible ? 1 : 0 }}>
          <div className="navbar">
            <div className="navbar-menu">
              <button
                onClick={handlePortfolioOpen}
                className={`nav-button marketplace-button ${pathname.startsWith('/portfolio') ? 'active' : ''}`}
              >
                Portfolio
              </button>
              
              <Link 
                href="/marketplace" 
                className={`nav-button marketplace-button ${pathname === '/marketplace' ? 'active' : ''}`}
              >
                Marketplace
              </Link>
              
              <Link 
                href="/blog" 
                className={`nav-button marketplace-button ${pathname === '/blog' ? 'active' : ''}`}
              >
                AI Blog
              </Link>
              
              {isAdmin && (
                <Link 
                  href="/admin"
                  className={`nav-button marketplace-button ${pathname.startsWith('/admin') ? 'active' : ''}`}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Auth Island */}
        <div className="auth-island-container" style={{ opacity: isNavbarVisible ? 1 : 0 }}>
          <div className="auth-island">
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
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Logo Island */}
      <div className="logo-island-container" style={{ opacity: isNavbarVisible ? 1 : 0 }}>
        <div className="logo-island">
          <Link href="/" className={`navbar-brand ${pathname === '/' ? 'active' : ''}`}>
            <Image 
              src="/logo/logo_black.png" 
              alt="WebRend Logo" 
              width={28} 
              height={28} 
              className="navbar-logo"
              priority
            />
          </Link>
        </div>
      </div>

      {/* Main Navbar Island */}
      <div className="navbar-container" style={{ opacity: isNavbarVisible ? 1 : 0 }}>
                  <div className="navbar">
            <div className="navbar-menu">
              <button
                onClick={handlePortfolioOpen}
                className={`nav-button marketplace-button ${pathname.startsWith('/portfolio') ? 'active' : ''}`}
              >
                Portfolio
              </button>
            
            <Link 
              href="/marketplace" 
              className={`nav-button marketplace-button ${pathname === '/marketplace' ? 'active' : ''}`}
            >
              Marketplace
            </Link>
            
            <Link 
              href="/blog" 
              className={`nav-button marketplace-button ${pathname === '/blog' ? 'active' : ''}`}
            >
              AI Blog
            </Link>
            
            {isAdmin && (
              <Link 
                href="/admin"
                className={`nav-button marketplace-button ${pathname.startsWith('/admin') ? 'active' : ''}`}
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Auth Island */}
      <div className="auth-island-container" style={{ opacity: isNavbarVisible ? 1 : 0 }}>
        <div className="auth-island">
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
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Portfolio Overlay */}
      {isPortfolioOpen && (
        <div 
          className={`portfolio-overlay ${isPortfolioClosing ? 'closing' : ''}`} 
          onClick={handlePortfolioClose}
        >
          <div className={`portfolio-grid ${isPortfolioClosing ? 'closing' : ''}`}>
            {portfolioProjects.map((project, index) => (
              <Link
                key={project.id}
                href={`/portfolio/projects/${project.slug}`}
                className={`portfolio-project ${isPortfolioClosing ? 'closing' : ''}`}
                style={{ '--index': index } as any}
                onClick={handlePortfolioClose}
              >
                <div className="project-image">
                  <Image
                    src={project.imageUrl}
                    alt={project.title}
                    width={400}
                    height={300}
                    className="project-img"
                  />
                </div>
                <div className="project-info">
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
} 