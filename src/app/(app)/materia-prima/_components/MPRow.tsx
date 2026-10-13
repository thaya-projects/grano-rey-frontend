'use client';
import { useState } from 'react';
import { usePagarKardexMP } from '@/lib/api/materia-prima';
import { RolUsuario, type MateriaPrima, type KardexMP } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { formatNum } from '@/lib/utils';
import { Btn, useToast } from '@/components/ui';
import { Plus, ChevronRight, ChevronDown, MinusCircle } from 'lucide-react';
import { StockDot } from './StockDot';
import { LotesSection } from './LotesSection';
import { AnularCompraModal } from './AnularCompraModal';

/** Fila de una materia prima (acordeón). */
export function MPRow({ mp, kardex, kardexLoading, onEntrada, onMovimiento }: {
  mp: MateriaPrima;
  kardex: KardexMP[];
  kardexLoading: boolean;
  onEntrada: () => void;
  onMovimiento: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [anularKardex, setAnularKardex] = useState<KardexMP | null>(null);
  const toast = useToast(s => s.show);
  const pagarMut = usePagarKardexMP();
  const { user } = useAuth();
  const canEdit = user?.rol !== RolUsuario.PRODUCCION;

  const stockKg = Number(mp.stockActualKg);
  const minKg   = Number(mp.stockMinimoKg);
  const pct     = minKg > 0 ? Math.min(100, (stockKg / minKg) * 100) : null;
  const barColor = !pct ? '#9CA3AF' : pct < 100 ? '#B53D35' : pct < 150 ? '#A05C0A' : '#2E7D52';

  async function handlePagar(id: string) {
    try {
      await pagarMut.mutateAsync(id);
      toast('Compra marcada como pagada', 'success');
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo registrar el pago'), 'error');
    }
  }

  return (
    <div className="border-b border-gr-border-lite last:border-0">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gr-primary-lite transition-colors select-none"
        onClick={() => setOpen(o => !o)}>
        {open
          ? <ChevronDown size={15} className="text-gr-muted shrink-0" />
          : <ChevronRight size={15} className="text-gr-muted shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="font-800 text-[14px] text-gr-text truncate">{mp.nombre}</p>
          <p className="text-[11px] font-mono text-gr-primary mt-0.5">{mp.codigo}</p>
        </div>
        {/* Barra de stock (solo sm+) */}
        <div className="hidden sm:block w-20 shrink-0">
          <div className="h-1.5 rounded-full bg-gr-border overflow-hidden">
            {pct !== null
              ? <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
              : <div className="h-full w-full rounded-full bg-gr-border" />}
          </div>
        </div>
        {/* Stock actual en unidad propia */}
        <span className="font-900 text-[15px] shrink-0 tabular-nums" style={{ color: barColor }}>
          {formatNum(stockKg / (mp.unidadMedida?.factorABase ?? 46), 1)}
          <span className="text-[11px] font-500 text-gr-muted"> {mp.unidadMedida?.abreviatura ?? mp.unidadMedida?.codigo ?? 'QQ'}</span>
        </span>
        {/* Estado (solo sm+) */}
        <span className="hidden sm:flex shrink-0">
          <StockDot value={stockKg} min={minKg} />
        </span>
        {canEdit && (
          <>
            <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); onMovimiento(); }}>
              <MinusCircle size={12} /><span className="hidden sm:inline"> Baja</span>
            </Btn>
            <Btn size="sm" variant="primary" onClick={e => { e.stopPropagation(); onEntrada(); }}>
              <Plus size={12} /><span className="hidden sm:inline"> Entrada</span>
            </Btn>
          </>
        )}
      </div>
      {open && (
        <LotesSection kardex={kardex} loading={kardexLoading} stockActualKg={stockKg}
          unidadMedida={mp.unidadMedida}
          onPagar={handlePagar} pagarPending={pagarMut.isPending}
          onAnular={setAnularKardex} canEdit={canEdit} />
      )}
      {anularKardex && (
        <AnularCompraModal
          kardex={anularKardex}
          onClose={() => setAnularKardex(null)}
          onAnulada={() => { setAnularKardex(null); toast('Compra anulada', 'warning'); }}
        />
      )}
    </div>
  );
}
