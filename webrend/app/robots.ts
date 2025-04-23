import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://webrend.com';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/auth/', '/profile/'], // Private pages
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
} 