'use client';
import { useState } from 'react';
import { TrendingUp, ShoppingCart, Boxes, Layers, ChevronDown, ChevronUp, HardHat } from 'lucide-react';
import { type ReporteId } from './_components/helpers';
import { ReporteCargadores } from './_components/ReporteCargadores';
import { ReporteFinanciero } from './_components/ReporteFinanciero';
import { ReporteVentas } from './_components/ReporteVentas';
import { ReporteMovimientosMP } from './_components/ReporteMovimientosMP';
import { ReporteStock } from './_components/ReporteStock';

const REPORT_CARDS: { id: ReporteId; Icon: React.ElementType; title: string; desc: string }[] = [
  { id: 'financiero',     Icon: TrendingUp,   title: 'Resumen Financiero',  desc: 'Ingresos, egresos, utilidad y margen del período' },
  { id: 'ventas',         Icon: ShoppingCart, title: 'Ventas por Período',   desc: 'Detalle de notas de venta con filtros por cliente y estado' },
  { id: 'movimientos_mp', Icon: Boxes,        title: 'Movimientos de MP',    desc: 'Entradas y salidas de materia prima con costos' },
  { id: 'stock',          Icon: Layers,       title: 'Stock Actual',         desc: 'Inventario completo de productos terminados y materia prima' },
  { id: 'cargadores',     Icon: HardHat,      title: 'Gastos en cargadores', desc: 'Total pagado + pendiente por cargador con filtro de fechas' },
];

export default function ReportesPage() {
  const [activo, setActivo] = useState<ReporteId | null>(null);

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-[22px] font-900 text-gr-text">Reportes</h1>
        <p className="text-gr-muted text-[13.5px] mt-0.5">
          Selecciona un reporte para verlo expandido
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {REPORT_CARDS.map(({ id, Icon, title, desc }) => {
          const isActive = activo === id;
          return (
            <button key={id} onClick={() => setActivo(prev => prev === id ? null : id)}
              className="card text-left flex items-start gap-4 transition-all w-full"
              style={isActive ? {
                outline: '2px solid var(--color-gr-primary)',
                outlineOffset: '-2px',
                background: 'var(--color-gr-primary-lite)',
              } : {}}>
              <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: isActive ? 'var(--color-gr-primary)' : 'var(--color-gr-border-lite)' }}>
                <Icon size={18} style={{ color: isActive ? '#fff' : 'var(--color-gr-primary)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-800 text-gr-text text-[14px]">{title}</p>
                <p className="text-[12.5px] text-gr-muted mt-0.5">{desc}</p>
              </div>
              {isActive
                ? <ChevronUp size={16} className="shrink-0 mt-1" style={{ color: 'var(--color-gr-primary)' }} />
                : <ChevronDown size={16} className="shrink-0 mt-1" style={{ color: 'var(--color-gr-muted)' }} />}
            </button>
          );
        })}
      </div>

      {activo === 'financiero'     && <ReporteFinanciero />}
      {activo === 'ventas'         && <ReporteVentas />}
      {activo === 'movimientos_mp' && <ReporteMovimientosMP />}
      {activo === 'stock'          && <ReporteStock />}
      {activo === 'cargadores'     && <ReporteCargadores />}
    </div>
  );
}
