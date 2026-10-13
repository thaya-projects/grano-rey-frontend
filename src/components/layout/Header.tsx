'use client';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { UserMenu } from './UserMenu';

const PAGE_NAMES: Record<string, string> = {
  '/dashboard':     'Inicio',
  '/stock':         'Stock',
  '/produccion':    'Producción',
  '/materia-prima': 'Materia Prima',
  '/ventas':        'Ventas',
  '/ventas/nueva':  'Nueva Venta',
  '/despachos':     'Despachos',
  '/cargadores':    'Personal',
  '/gastos':        'Gastos',
  '/reportes':      'Reportes',
  '/configuracion': 'Configuración',
};

function formatDateEs(date: Date): string {
  return date.toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function Header() {
  const pathname = usePathname();
  const pageName = PAGE_NAMES[pathname] ?? 'Grano Rey';

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-6 py-3.5 border-b border-gr-border bg-gr-surface"
      style={{ minHeight: '56px' }}>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13.5px]">
        <span className="text-gr-muted font-500">Grano Rey</span>
        <ChevronRight size={13} className="text-gr-muted" />
        <span className="font-700 text-gr-text">{pageName}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <span className="text-[13px] text-gr-muted hidden sm:block">
          {formatDateEs(new Date())}
        </span>
        <UserMenu />
      </div>
    </header>
  );
}
