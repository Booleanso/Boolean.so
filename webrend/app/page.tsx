import styles from "./page.module.css";
import HeroSection from "./components/index/HeroSection/HeroSection";
import VideoSection from "./components/VideoSection/VideoSection";
import FeaturedRepos from "./components/FeaturedRepos/FeaturedRepos";
import BlogPreview from "./components/BlogPreview/BlogPreview";
import MarketplaceShowcase from "./components/MarketplaceShowcase/MarketplaceShowcase";
import MarketplaceFeatures from "./components/MarketplaceFeatures/MarketplaceFeatures";
import ServicesCardsSection from "./components/ServicesCardsSection/ServicesCardsSection";
import PortfolioPreview from "./components/PortfolioPreview/PortfolioPreview";
// import InstagramFeed from "./components/InstagramFeed/InstagramFeed";
import ReviewCrowd from "./components/ReviewCrowd/ReviewCrowd";
import FAQ from "./components/FAQ/FAQ";
// import ContactUs from "./components/ContactUs/ContactUs"; // Commented out - "Let's work together" section removed
import Footer from "./components/Footer/Footer";
import ScrollCodeSection from "./components/ScrollCodeSection/ScrollCodeSection";
import StickyTransitionSection from "./components/StickyTransitionSection/StickyTransitionSection";

import { db } from './lib/firebase-admin';
import { DocumentData, Timestamp } from 'firebase-admin/firestore';
import { logEnvironmentStatus } from './utils/env-check';

// Log environment status on server startup (development only)
logEnvironmentStatus();

// Define the type for portfolio projects
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

// Server-side data fetching for featured projects
async function getFeaturedProjects(): Promise<PortfolioProject[]> {
  try {
    // Fetch all portfolio projects, ordered by date descending (same as portfolio page)
    const projectsSnapshot = await db.collection('portfolioProjects')
      .orderBy('dateCompleted', 'desc')
      .limit(4) // Get the 4 most recent projects
      .get();

    if (projectsSnapshot.empty) {
      return [];
    }

    // Convert the Firestore data to our PortfolioProject type
    const projects = projectsSnapshot.docs.map((doc: DocumentData) => {
      const data = doc.data();
      
      // Handle Firestore timestamp conversion
      let dateCompleted = data.dateCompleted;
      if (dateCompleted instanceof Timestamp) {
        dateCompleted = dateCompleted.toDate();
      }
      
      return {
        id: doc.id,
        slug: data.slug || doc.id,
        title: data.title || 'Untitled Project',
        description: data.description || '',
        imageUrl: data.imageUrl || '/images/placeholder.png',
        tags: data.tags || [],
        projectUrl: data.projectUrl || null,
        dateCompleted: dateCompleted instanceof Date ? dateCompleted : new Date(),
        featured: data.featured || false,
      } as PortfolioProject;
    });

    return projects;
  } catch (error) {
    console.error('Error fetching portfolio projects:', error);
    
    // Log Firebase index error if needed
    const errorString = String(error);
    if (errorString.includes('https://console.firebase.google.com/')) {
      const indexUrlMatch = errorString.match(/(https:\/\/console\.firebase\.google\.com\/[^\s"]+)/);
      if (indexUrlMatch && indexUrlMatch[1]) {
        console.log('\n\n---\n⚠️ FIREBASE INDEX NEEDED (Recent Projects) ⚠️\n---');
        console.log(`Firestore requires an index for this query. Please create it:`);
        console.log(indexUrlMatch[1].replace(/\\n/g, '').replace(/\\"/g, '"'));
        console.log('---\n\n');
      }
    }
    
    return []; // Return empty array in case of error
  }
}

export default async function Home() {
  // Fetch featured projects on the server
  const featuredProjects = await getFeaturedProjects();

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section id="hero">
          <HeroSection />
        </section>
        <section id="scroll-code">
          <ScrollCodeSection />
        </section>
        <section id="marketplace">
          <MarketplaceShowcase />
        </section>
        <section id="services-and-portfolio">
          <StickyTransitionSection sectionHeight="400vh">
            <ServicesCardsSection />
            <PortfolioPreview projects={featuredProjects} />
            <ReviewCrowd />
          </StickyTransitionSection>
        </section>
        <section id="marketplace-features">
          <MarketplaceFeatures />
        </section>
        <section id="video">
          <VideoSection />
        </section>
        <section id="featured-repos">
          <FeaturedRepos />
        </section>
        {/* <section id="instagram">
          <InstagramFeed />
        </section> */}
        <section id="blog">
          <BlogPreview />
        </section>
        <section id="faq">
          <FAQ />
        </section>
        {/* <ContactUs /> */} {/* Commented out - "Let's work together" section removed */}
      </main>
      <Footer />
    </div>
  );
}
