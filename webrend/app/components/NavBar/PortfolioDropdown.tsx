'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import './PortfolioDropdown.scss';

interface PortfolioProject {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  projectUrl?: string;
  dateCompleted: Date;
  featured: boolean;
}

interface PortfolioDropdownProps {
  isDarkMode: boolean;
  pathname: string;
}

export default function PortfolioDropdown({ isDarkMode, pathname }: PortfolioDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);

  // Fetch portfolio projects when dropdown opens
  useEffect(() => {
    if (isOpen && projects.length === 0) {
      fetchPortfolioProjects();
    }
  }, [isOpen, projects.length]);

  const fetchPortfolioProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/portfolio/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching portfolio projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = () => {
    // Clear any existing timeout
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    // Add a small delay before closing to allow cursor movement to dropdown
    const timeout = setTimeout(() => {
      setIsOpen(false);
    }, 100);
    setCloseTimeout(timeout);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
      }
    };
  }, [closeTimeout]);

  const textColor = isDarkMode ? '#ffffff' : '#1d1d1f';
  const buttonBgColor = isDarkMode ? 'rgba(40, 40, 40, 0.95)' : 'rgba(0, 0, 0, 0.08)';
  const buttonShadow = isDarkMode 
    ? '0 2px 5px rgba(0, 0, 0, 0.5)' 
    : '0 1px 3px rgba(0, 0, 0, 0.1)';

  return (
    <div 
      className="portfolio-dropdown-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Portfolio Button */}
      <Link 
        href="/portfolio" 
        className={`nav-button portfolio-button ${pathname === '/portfolio' ? 'active' : ''}`}
        style={{
          backgroundColor: buttonBgColor,
          color: textColor,
          borderRadius: '30px',
          padding: '9px 20px',
          fontSize: '15px',
          fontWeight: 600,
          textDecoration: 'none',
          boxShadow: buttonShadow,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}
      >
        Portfolio
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none" 
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={`portfolio-dropdown ${isDarkMode ? 'dark' : ''}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            right: '0',
            marginTop: '4px',
            backgroundColor: isDarkMode ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: isDarkMode 
              ? '0 20px 40px rgba(0, 0, 0, 0.4)' 
              : '0 20px 40px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
            zIndex: 1000,
            minWidth: '320px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}
        >
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: textColor }}>
              Loading projects...
            </div>
          ) : projects.length > 0 ? (
            <>
              <div style={{ 
                padding: '16px 20px 12px', 
                borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.5)' : 'rgba(248, 248, 248, 0.5)'
              }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '16px', 
                  fontWeight: 600, 
                  color: textColor 
                }}>
                  Our Client Projects
                </h3>
              </div>
              
              <div style={{ padding: '8px' }}>
                {projects.slice(0, 6).map((project) => (
                  <Link
                    key={project.id}
                    href={`/portfolio/projects/${project.slug}`}
                    className="portfolio-dropdown-item"
                    style={{
                      display: 'block',
                      textDecoration: 'none',
                      margin: '4px 0',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      position: 'relative',
                      height: '60px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = isDarkMode 
                        ? '0 8px 25px rgba(0, 0, 0, 0.4)' 
                        : '0 8px 25px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Background Image */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: `url(${project.imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      filter: 'brightness(0.4)',
                      zIndex: 1
                    }} />
                    
                    {/* Dark overlay */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      zIndex: 2
                    }} />
                    
                    {/* Project Name */}
                    <div style={{
                      position: 'relative',
                      zIndex: 3,
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 16px'
                    }}>
                      <span style={{
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        textAlign: 'center',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                        lineHeight: '1.2',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {project.title}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              
              {projects.length > 6 && (
                <div style={{ 
                  padding: '12px 20px', 
                  borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.5)' : 'rgba(248, 248, 248, 0.5)'
                }}>
                  <Link 
                    href="/portfolio"
                    style={{
                      color: '#0071e3',
                      fontSize: '14px',
                      fontWeight: 500,
                      textDecoration: 'none',
                      display: 'block',
                      textAlign: 'center'
                    }}
                  >
                    View All Projects ({projects.length})
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: isDarkMode ? '#98989d' : '#86868b' 
            }}>
              No projects available
            </div>
          )}
        </div>
      )}
    </div>
  );
} 