'use client';

import { smoothScrollToElement } from '../../utils/smooth-scroll';
import styles from './Footer.module.css';

export default function Footer() {
  const handleSmoothScroll = (elementId: string) => {
    smoothScrollToElement(elementId);
  };
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerLogo}>
          <h3>WebRend</h3>
          <p>Building the future, one pixel at a time.</p>
        </div>
        <div className={styles.footerLinks}>
          <div className={styles.linkColumn}>
            <h4>Services</h4>
            <a href="#services" onClick={(e) => { e.preventDefault(); handleSmoothScroll('services'); }}>Core Builds</a>
            <a href="#services" onClick={(e) => { e.preventDefault(); handleSmoothScroll('services'); }}>Startup Strategy</a>
            <a href="#services" onClick={(e) => { e.preventDefault(); handleSmoothScroll('services'); }}>Design & UX</a>
            <a href="#services" onClick={(e) => { e.preventDefault(); handleSmoothScroll('services'); }}>Growth Infrastructure</a>
            <a href="#services" onClick={(e) => { e.preventDefault(); handleSmoothScroll('services'); }}>Hardware & Firmware</a>
          </div>
          <div className={styles.linkColumn}>
            <h4>Company</h4>
            <a href="#about" onClick={(e) => { e.preventDefault(); handleSmoothScroll('about'); }}>About Us</a>
            <a href="#process" onClick={(e) => { e.preventDefault(); handleSmoothScroll('process'); }}>Our Process</a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); handleSmoothScroll('contact'); }}>Contact</a>
          </div>
        </div>
      </div>
      <div className={styles.copyright}>
        <p>&copy; {new Date().getFullYear()} WebRend. All rights reserved.</p>
      </div>
    </footer>
  );
} 