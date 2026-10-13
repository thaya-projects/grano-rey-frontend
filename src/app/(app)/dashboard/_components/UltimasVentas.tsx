import Link from 'next/link';
import type { NotaVenta } from '@/lib/types';
import { formatBs } from '@/lib/utils';
import { EstadoBadge } from '@/components/ui';
import { ShoppingCart, ArrowRight } from 'lucide-react';

export function UltimasVentas({ ventas }: { ventas: NotaVenta[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-800 text-gr-text text-[15px]">Últimas ventas</h2>
        <Link href="/ventas" className="flex items-center gap-1 text-gr-primary text-[13px] font-600 hover:underline">
          Ver todas <ArrowRight size={13} />
        </Link>
      </div>
      <div className="card-no-pad">
        {ventas.map((v, i) => (
          <div key={v.id} className={`flex items-center gap-4 px-5 py-3.5 ${i < ventas.length - 1 ? 'border-b border-gr-border-lite' : ''}`}>
            <div className="w-9 h-9 rounded-[10px] bg-gr-primary-lite flex items-center justify-center shrink-0">
              <ShoppingCart size={16} className="text-gr-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-700 text-gr-text text-[13.5px]">NV-{v.numeroNota} · {v.cliente?.nombre ?? '—'}</p>
              <p className="text-[12px] text-gr-muted">{v.detalles?.[0]?.producto?.nombre ?? 'Sin detalle'} · {v.fecha}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-800 text-gr-primary text-[14px]">{formatBs(Number(v.totalBs))}</p>
              <EstadoBadge estado={v.estado} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
