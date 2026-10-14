import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { JsonLd } from '@/components/seo/JsonLd';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Grano Rey',
    template: '%s | Grano Rey',
  },
  description: 'Grano Rey — alimentos precocidos de calidad, elaborados en Monteagudo, Bolivia. Descubrí nuestros productos y dónde encontrarnos.',
  applicationName: 'Grano Rey',
  keywords: ['Grano Rey', 'alimentos precocidos', 'Monteagudo', 'Bolivia'],
  authors: [{ name: 'Grano Rey' }],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    siteName: 'Grano Rey',
    title: 'Grano Rey',
    description: 'Empresa boliviana dedicada a la elaboración y comercialización de alimentos precocidos.',
    url: SITE_URL,
    locale: 'es_BO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grano Rey',
    description: 'Empresa boliviana dedicada a la elaboración y comercialización de alimentos precocidos.',
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: 'z8GoTBaV6IJZEHuRUvWtaJ9W72h5lDWOvGQphkIb5RQ',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full">
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Grano Rey',
          url: SITE_URL,
        }} />
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Grano Rey',
          url: SITE_URL,
          logo: `${SITE_URL}/logo-grano-rey.webp`,
        }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
