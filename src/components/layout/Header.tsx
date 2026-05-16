'use client';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-store';
import { ChevronRight } from 'lucide-react';

const PAGE_NAMES: Record<string, string> = {
  '/dashboard':     'Inicio',
  '/stock':         'Stock',
  '/materia-prima': 'Materia Prima',
  '/ventas':        'Ventas',
  '/ventas/nueva':  'Nueva Venta',
  '/despachos':     'Despachos',
  '/reportes':      'Reportes',
  '/configuracion': 'Configuración',
};

function formatDateEs(date: Date): string {
  return date.toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const pageName = PAGE_NAMES[pathname] ?? 'Grano Rey';

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-6 py-3.5 border-b border-[var(--color-gr-border)] bg-[var(--color-gr-surface)]"
      style={{ minHeight: '56px' }}>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13.5px]">
        <span className="text-[var(--color-gr-muted)] font-500">Grano Rey</span>
        <ChevronRight size={13} className="text-[var(--color-gr-muted)]" />
        <span className="font-700 text-[var(--color-gr-text)]">{pageName}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <span className="text-[13px] text-[var(--color-gr-muted)] hidden sm:block">
          {formatDateEs(new Date())}
        </span>
        {user && (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-700 text-white shrink-0"
            style={{ background: 'var(--color-gr-primary-dark)' }}
            title={user.nombre}>
            {user.iniciales}
          </div>
        )}
      </div>
    </header>
  );
}
