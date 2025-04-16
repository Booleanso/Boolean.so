'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import HeroSection from "./components/index/HeroSection/HeroSection";
import DemoRepoCard from "./components/DemoRepoCard/DemoRepoCard";

// Import the type for consistency
import { MarketplaceListing } from './api/marketplace/list-repo/route';

export default function Home() {
  const [featuredRepos, setFeaturedRepos] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedRepos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all listings from the API
        const response = await fetch('/api/marketplace/listings');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const allListings = data.listings || [];
        
        // Filter out sold repositories
        const availableRepos = allListings.filter((repo: MarketplaceListing) => !repo.sold);
        
        if (availableRepos.length === 0) {
          setFeaturedRepos([]);
          return;
        }
        
        // Select up to 3 random repos to feature
        const randomRepos: MarketplaceListing[] = [];
        const totalToShow = Math.min(3, availableRepos.length);
        
        // Create a copy of the array to avoid modifying the original
        const repoPool = [...availableRepos];
        
        for (let i = 0; i < totalToShow; i++) {
          const randomIndex = Math.floor(Math.random() * repoPool.length);
          randomRepos.push(repoPool[randomIndex]);
          // Remove the selected repo to avoid duplicates
          repoPool.splice(randomIndex, 1);
        }
        
        setFeaturedRepos(randomRepos);
      } catch (err) {
        console.error('Error fetching featured repositories:', err);
        setError('Failed to load featured repositories. Please try again later.');
        setFeaturedRepos([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeaturedRepos();
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <HeroSection />

        {/* Featured Repositories Section */}
        <section className={styles.featuredRepos}>
          <h2>Featured GitHub Repositories</h2>
          <p className={styles.featuredRepoIntro}>
            Explore our curated selection of high-quality, ready-to-use GitHub repositories for your next project.
          </p>
          
          {loading ? (
            <div className={styles.loading}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite', marginRight: '0.5rem' }}>
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
              </svg>
              Loading featured repositories...
            </div>
          ) : error ? (
            <div className={styles.error}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.2rem', height: '1.2rem', marginRight: '0.5rem' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          ) : featuredRepos.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No repositories available at the moment. Check back soon!</p>
            </div>
          ) : (
            <div className={styles.repoGrid}>
              {featuredRepos.map((repo) => (
                <div key={repo.id} className={styles.repoCard}>
                  <div className={styles.repoImage}>
                    <Image 
                      src={repo.imageUrl} 
                      alt={repo.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className={styles.repoContent}>
                    <div className={styles.repoHeader}>
                      <h3 className={styles.repoName}>{repo.name}</h3>
                      <div className={styles.repoPrice}>
                        {repo.isSubscription ? (
                          <>${repo.subscriptionPrice}/mo</>
                        ) : (
                          <>${repo.price}</>
                        )}
                      </div>
                    </div>
                    <p className={styles.repoDescription}>{repo.description}</p>
                    <div className={styles.repoStats}>
                      <div className={styles.stat}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        {repo.stars}
                      </div>
                      <div className={styles.stat}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="6" y1="3" x2="6" y2="15"></line>
                          <circle cx="18" cy="6" r="3"></circle>
                          <circle cx="6" cy="18" r="3"></circle>
                          <path d="M18 9a9 9 0 0 1-9 9"></path>
                        </svg>
                        {repo.forks}
                      </div>
                    </div>
                    <div className={styles.repoFooter}>
                      <Link href={`/marketplace/buy/${repo.docId || repo.id}`} className={styles.viewButton}>
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Demo Repository Card */}
          <DemoRepoCard />
          
        </section>

        <section id="services" className={styles.services}>
          <h2>Our Services</h2>
          
          <div className={styles.serviceCategory}>
            <h3>Core Builds</h3>
            <div className={styles.serviceGrid}>
              <div className={styles.serviceCard}>
                <h4>MVP Development</h4>
                <p>Fast and lean development for early ideas.</p>
              </div>
              <div className={styles.serviceCard}>
                <h4>Soft Launch Builds</h4>
                <p>Test your early concept in the wild.</p>
              </div>
              <div className={styles.serviceCard}>
                <h4>Full Web & Mobile App Development</h4>
                <p>Scalable and stable solutions.</p>
              </div>
              <div className={styles.serviceCard}>
                <h4>Landing Pages & PWAs</h4>
                <p>Responsive and conversion-ready.</p>
              </div>
              <div className={styles.serviceCard}>
                <h4>Admin Dashboards & Internal Tools</h4>
                <p>Control your software effectively.</p>
              </div>
            </div>
          </div>

          <div className={styles.serviceCategory}>
            <h3>Startup Strategy & Support</h3>
            <div className={styles.serviceGrid}>
              <div className={styles.serviceCard}>
                <h4>Product Roadmapping</h4>
                <p>Feature prioritization and strategic planning.</p>
              </div>
              <div className={styles.serviceCard}>
                <h4>Founder & Technical Advising</h4>
                <p>Expert guidance when you need it most.</p>
              </div>
              <div className={styles.serviceCard}>
                <h4>Investor-Ready Materials</h4>
                <p>Pitch decks, demo builds, and tech audit prep.</p>
              </div>
              <div className={styles.serviceCard}>
                <h4>Hiring Strategy</h4>
                <p>First Dev/CTO support and team building.</p>
              </div>
              <div className={styles.serviceCard}>
                <h4>Business Model Development</h4>
                <p>Product-market fit discovery and validation.</p>
              </div>
            </div>
          </div>

          <div className={styles.serviceCategory}>
            <h3>Design & UX</h3>
            <div className={styles.serviceGrid}>
              <div className={styles.serviceCard}>
                <h4>UI/UX Design</h4>
                <p>Beautiful, user-first interfaces.</p>
              </div>
              <div className={styles.serviceCard}>
                <h4>Figma Prototypes</h4>
                <p>Interactive clickable mockups.</p>
              </div>
              <div className={styles.serviceCard}>
                <h4>Branding & Positioning</h4>
                <p>Identity development and market positioning.</p>
              </div>
              <div className={styles.serviceCard}>
                <h4>User Journey Mapping</h4>
                <p>Conversion flow optimization.</p>
              </div>
            </div>
          </div>

          <div className={styles.serviceCategory}>
            <h3>Growth Infrastructure</h3>
            <div className={styles.serviceGrid}>
              <div className={styles.serviceCard}>
                <h4>Launch Strategy</h4>
                <p>Beta program setup and go-to-market planning.</p>
              </div>
              <div className={styles.serviceCard}>
                <h4>Analytics & KPI Tracking</h4>
                <p>User feedback loops and performance metrics.</p>
              </div>
              <div className={styles.serviceCard}>
                <h4>CRM & Automation</h4>
                <p>Email flows and business process automation.</p>
              </div>
              <div className={styles.serviceCard}>
                <h4>A/B Testing Infrastructure</h4>
                <p>Data-driven optimization from day one.</p>
              </div>
            </div>
          </div>

          <div className={styles.serviceCategory}>
            <h3>Hardware & Firmware</h3>
            <div className={styles.serviceGrid}>
              <div className={styles.serviceCard}>
                <h4>Firmware Development</h4>
                <p>IoT, BLE, and sensor integration.</p>
              </div>
              <div className={styles.serviceCard}>
                <h4>Device Integration</h4>
                <p>Smart interfaces and connectivity solutions.</p>
              </div>
              <div className={styles.serviceCard}>
                <h4>Hardware UIs</h4>
                <p>Web and mobile interfaces for hardware products.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="approach" className={styles.approach}>
          <h2>Our Approach</h2>
          <p className={styles.tagline}>We move like a co-founder, not an agency.</p>
          <p>Whether you're pre-seed or scaling, we help you build what matters—faster and smarter.</p>
        </section>

        <section id="contact" className={styles.contact}>
          <h2>Start Your Journey</h2>
          <p>Ready to turn your idea into reality? Get in touch with us today.</p>
          <a href="mailto:contact@webrend.com" className={styles.primary}>Contact Us</a>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <h3>WebRend</h3>
            <p>Building the future, one pixel at a time.</p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.linkColumn}>
              <h4>Services</h4>
              <a href="#services">Core Builds</a>
              <a href="#services">Startup Strategy</a>
              <a href="#services">Design & UX</a>
              <a href="#services">Growth Infrastructure</a>
              <a href="#services">Hardware & Firmware</a>
            </div>
            <div className={styles.linkColumn}>
              <h4>Company</h4>
              <a href="#about">About Us</a>
              <a href="#process">Our Process</a>
              <a href="#contact">Contact</a>
            </div>
          </div>
        </div>
        <div className={styles.copyright}>
          <p>&copy; {new Date().getFullYear()} WebRend. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
