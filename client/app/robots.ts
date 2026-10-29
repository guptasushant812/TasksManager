import { getSiteUrl } from '@/lib/siteUrl';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/help', '/tasks', '/follow-ups'],
        disallow: ['/api/', '/settings/', '/status/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
