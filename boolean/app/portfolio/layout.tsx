import { Metadata } from 'next';

// --- SEO Metadata --- 
// Moved from page.tsx
export const metadata: Metadata = {
  title: 'Portfolio - WebRend Projects',
  description: 'Explore a selection of web development, design, and software projects delivered by WebRend.',
  keywords: ['portfolio', 'web development', 'web design', 'software development', 'projects', 'case studies', 'WebRend'],
  alternates: {
    canonical: 'https://webrend.com/portfolio',
  },
  openGraph: {
    title: 'WebRend Portfolio - Featured Projects',
    description: 'See the quality and range of work delivered by the WebRend team.',
    url: 'https://webrend.com/portfolio',
    siteName: 'WebRend',
    images: [
      {
        url: 'https://webrend.com/og-image-portfolio.jpg', // TODO: Create an OG image for portfolio
        width: 1200,
        height: 630,
        alt: 'WebRend Portfolio Showcase',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WebRend Portfolio',
    description: 'Explore featured projects by WebRend.',
    images: ['https://webrend.com/og-image-portfolio.jpg'], // TODO: Create an OG image for portfolio
  },
};

// Basic layout component
export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>; // Just render children, no extra layout needed for now
} 