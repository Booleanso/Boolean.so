import Image from "next/image";
import styles from "./page.module.css";
import HeroSection from "./components/index/HeroSection/HeroSection";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <HeroSection />

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
