import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/(dashboard)/'],
    },
    sitemap: 'https://cortex-pos.vercel.app/sitemap.xml',
  };
}