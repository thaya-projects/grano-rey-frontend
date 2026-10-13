import Link from 'next/link';
import type { Producto } from '@/lib/types';
import { formatNum, equivPT, equivLabel } from '@/lib/utils';
import { StockBar } from '@/components/ui';
import { ArrowRight } from 'lucide-react';

export function StockDestacado({ productos }: { productos: Producto[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-800 text-gr-text text-[15px]">Stock actual por producto</h2>
        <Link href="/stock" className="flex items-center gap-1 text-gr-primary text-[13px] font-600 hover:underline">
          Ver todo <ArrowRight size={13} />
        </Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {productos.map(p => {
          const low = Number(p.stockActual) < Number(p.stockMinimo);
          return (
            <div key={p.id} className={`card p-4 border-t-[3px] ${low ? 'border-t-gr-danger' : 'border-t-gr-success'}`}>
              <p className="text-[11px] font-600 text-gr-muted uppercase tracking-wide mb-1">{p.codigo}</p>
              <p className="font-700 text-gr-text text-[13px] mb-3 leading-tight">{p.nombre}</p>
              <p className="text-[28px] font-900 text-gr-text leading-none mb-1">
                {formatNum(Number(p.stockActual), 0)} <span className="text-[14px] font-500 text-gr-muted">bol</span>
              </p>
              <p className="text-[12px] text-gr-muted mb-3">{formatNum(equivPT(Number(p.stockActual), p.unidadProduccion?.factorABase, p.unidadProduccion?.tipo), 2)} {equivLabel(p.unidadProduccion?.tipo)}</p>
              <StockBar value={Number(p.stockActual)} min={Number(p.stockMinimo)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
