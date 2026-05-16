import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Grano Rey — Sistema de Gestión',
  description: 'Sistema de gestión de inventario y ventas para Grano Rey',
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
