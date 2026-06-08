import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'Grano Rey — Sistema de Gestión',
    template: '%s | Grano Rey',
  },
  description: 'Sistema de gestión de inventario, ventas y despachos para Grano Rey. Control de stock, materia prima y notas de venta en un solo lugar.',
  keywords: ['Grano Rey', 'sistema de gestión', 'inventario', 'ventas', 'Bolivia'],
  authors: [{ name: 'Grano Rey' }],
  openGraph: {
    title: 'Grano Rey — Sistema de Gestión',
    description: 'Control de inventario, ventas y despachos para Grano Rey.',
    locale: 'es_BO',
    type: 'website',
  },
  robots: {
    index: true,
    follow: false,
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
