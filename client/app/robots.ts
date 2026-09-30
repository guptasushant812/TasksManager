import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tasksmanager.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/tasks', '/follow-ups', '/help'],
        disallow: ['/api/', '/settings', '/status/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
