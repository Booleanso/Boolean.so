import ScrollCodeSection from "../components/ScrollCodeSection/ScrollCodeSection";
import ServicesAndClients from "../components/ServicesAndClients/ServicesAndClients";
import ForceRemountOnPath from "../components/ForceRemountOnPath";
import IPhoneTrack from "../components/IPhoneTrack/IPhoneTrack";
import FallingTrack from "../components/FallingTrack/FallingTrack";
import ServicesCardsSection from "../components/ServicesCardsSection/ServicesCardsSection";
import PortfolioCarousel from "../components/PortfolioCarousel/PortfolioCarousel";
import VideoSection from "../components/VideoSection/VideoSection";
import Testimonials from "../components/Testimonials/Testimonials";
import ComingSoonTrack from "../components/ComingSoonTrack/ComingSoonTrack";
import BlogPreview from "../components/BlogPreview/BlogPreview";
import CTAStickyTrack from "../components/CTAStickyTrack/CTAStickyTrack";
import Footer from "../components/Footer/Footer";

export default function VSLPage() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <section id="scroll-code">
        <ScrollCodeSection />
      </section>
      <section id="services-and-clients">
        <ServicesAndClients />
      </section>
      <section id="iphone-track">
        <ForceRemountOnPath>
          <IPhoneTrack />
        </ForceRemountOnPath>
      </section>
      <section id="falling-track">
        <FallingTrack />
      </section>
      <section id="services">
        <ServicesCardsSection />
      </section>
      <section id="portfolio-carousel">
        <PortfolioCarousel />
      </section>
      <section id="video">
        <VideoSection />
      </section>
      <section id="testimonials">
        <Testimonials />
      </section>
      <section id="coming-soon">
        <ComingSoonTrack />
      </section>
      <section id="blog">
        <BlogPreview />
      </section>
      <section id="cta">
        <CTAStickyTrack />
        <Footer />
      </section>
    </main>
  );
}


