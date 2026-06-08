import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://grano-rey.netlify.app';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/login', '/'],
        disallow: ['/dashboard', '/ventas', '/stock', '/despachos', '/materia-prima', '/configuracion', '/reportes'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
