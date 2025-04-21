'use client';

import styles from "./page.module.css";
import HeroSection from "./components/index/HeroSection/HeroSection";
import VideoSection from "./components/VideoSection/VideoSection";
import FeaturedRepos from "./components/FeaturedRepos/FeaturedRepos";
import Footer from "./components/Footer/Footer";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <HeroSection />
        <FeaturedRepos />
        <VideoSection />
      </main>
      <Footer />
    </div>
  );
}
