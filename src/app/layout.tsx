import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'Grano Rey',
    template: '%s | Grano Rey',
  },
  description: 'Grano Rey — empresa boliviana dedicada a la elaboración y comercialización de alimentos precocidos, ofreciendo calidad y confianza a sus clientes.',
  keywords: ['Grano Rey', 'alimentos precocidos', 'Monteagudo', 'Bolivia'],
  authors: [{ name: 'Grano Rey' }],
  icons: {
    icon: '/logo-reynales.webp',
    apple: '/logo-reynales.webp',
  },
  openGraph: {
    title: 'Grano Rey',
    description: 'Empresa boliviana dedicada a la elaboración y comercialización de alimentos precocidos.',
    locale: 'es_BO',
    type: 'website',
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
