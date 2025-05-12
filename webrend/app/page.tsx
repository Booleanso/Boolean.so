'use client';

import styles from "./page.module.css";
import HeroSection from "./components/index/HeroSection/HeroSection";
import VideoSection from "./components/VideoSection/VideoSection";
import FeaturedRepos from "./components/FeaturedRepos/FeaturedRepos";
import BlogPreview from "./components/BlogPreview/BlogPreview";
import MarketplaceShowcase from "./components/MarketplaceShowcase/MarketplaceShowcase";
import MarketplaceFeatures from "./components/MarketplaceFeatures/MarketplaceFeatures";
import ServicesCardsSection from "./components/ServicesCardsSection/ServicesCardsSection";
import PortfolioPreview from "./components/PortfolioPreview/PortfolioPreview";
import ContactUs from "./components/ContactUs/ContactUs";
import Footer from "./components/Footer/Footer";
import TrustedBy from "./components/TrustedBy/TrustedBy";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <HeroSection />
        <TrustedBy />
        <MarketplaceShowcase />
        <MarketplaceFeatures />
        <FeaturedRepos />
        <VideoSection />
        <ServicesCardsSection />
        <PortfolioPreview />
        <BlogPreview />
        <ContactUs />
      </main>
      <Footer />
    </div>
  );
}
