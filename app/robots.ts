import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/checkout/', '/login', '/sign-in', '/sign-up'],
      },
    ],
    sitemap: 'https://fyndlater.com/sitemap.xml',
  };
}
