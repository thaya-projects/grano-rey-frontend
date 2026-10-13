import { type LoteProduccion } from '@/lib/types';
import { formatNum } from '@/lib/utils';
import { Btn, Badge } from '@/components/ui';
import { TrendingDown, ArrowDownCircle } from 'lucide-react';

const GRID_COLS = '160px 90px 1fr 90px 90px 100px 90px 90px';

export function LoteRow({ lote: l, isLast, onRegistrarResiduo }: {
  lote: LoteProduccion;
  isLast: boolean;
  onRegistrarResiduo: (lote: LoteProduccion) => void;
}) {
  const restante   = Number(l.stockRestante);
  const cant       = Number(l.cantidadProducida);
  const loteAbrev  = l.unidad?.abreviatura ?? l.unidad?.codigo ?? '';
  const pct        = cant > 0 ? restante / cant : 0;
  const status: 'red' | 'yellow' | 'green' = pct < 0.15 ? 'red' : pct < 0.4 ? 'yellow' : 'green';
  const mermaUn = Number(l.mermaUnidades || 0);
  const mermaMp = Number(l.mermaMpKg || 0);
  const hasMerma = mermaUn > 0 || mermaMp > 0;

  return (
    <div className={`px-5 py-3.5 ${!isLast ? 'border-b border-gr-border-lite' : ''}`}>
      <div className="md:hidden">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-700 font-mono text-[13px] text-gr-primary">{l.codigoLote}</p>
            {l.numeroLotePropio && (
              <p className="text-[11px] font-mono text-gr-muted">
                ({l.numeroLotePropio})
              </p>
            )}
            <p className="text-[13px] mt-0.5 font-600">{l.producto?.nombre}</p>
            <p className="text-[12px] text-gr-muted">
              {formatNum(restante, 2)}/{formatNum(cant, 2)} {loteAbrev} · {l.fecha}
            </p>
            {hasMerma && (
              <p className="text-[11.5px] text-gr-warning mt-0.5 flex items-center gap-1">
                <TrendingDown size={11} /> Merma: {mermaUn > 0 && `${formatNum(mermaUn, 0)} u`}
                {mermaUn > 0 && mermaMp > 0 && ' / '}
                {mermaMp > 0 && `${formatNum(mermaMp, 1)} kg MP`}
              </p>
            )}
          </div>
          <Badge color={status}>
            {status === 'red' ? 'Agotando' : status === 'yellow' ? 'Medio' : 'OK'}
          </Badge>
        </div>
      </div>

      <div className="hidden md:grid gap-3 items-center" style={{ gridTemplateColumns: GRID_COLS }}>
        <span className="font-mono font-700 text-[12px] text-gr-primary break-all">
          {l.codigoLote}
        </span>
        <span className="font-mono text-[12px] text-gr-muted">
          {l.numeroLotePropio || '—'}
        </span>
        <div>
          <p className="font-600 text-[13px] text-gr-text">{l.producto?.nombre}</p>
          <p className="text-[11.5px] text-gr-muted">
            {l.producto?.codigo}{l.registroSanitario ? ` · ${l.registroSanitario}` : ''}
          </p>
        </div>
        <span className="text-right text-[13px] font-600">
          {formatNum(cant, 2)}
          {loteAbrev && <span className="text-[11px] font-500 text-gr-muted ml-1">{loteAbrev}</span>}
        </span>
        <span className="text-right font-800 text-[14px] text-gr-text">
          {formatNum(restante, 2)}
          {loteAbrev && <span className="text-[11px] font-500 text-gr-muted ml-1">{loteAbrev}</span>}
        </span>
        <span className="text-right text-[12.5px]">
          {hasMerma ? (
            <span className="text-gr-warning flex items-center justify-end gap-1">
              <TrendingDown size={11} />
              {mermaUn > 0 && `${formatNum(mermaUn, 0)}u`}
              {mermaMp > 0 && (mermaUn > 0 ? ` / ${formatNum(mermaMp, 1)}kg` : `${formatNum(mermaMp, 1)}kg`)}
            </span>
          ) : (
            <span className="text-gr-muted">—</span>
          )}
        </span>
        <span className="text-[12px] text-gr-muted">{l.fecha}</span>
        <span className="text-[12px] text-gr-muted">
          {l.fechaVencimiento}
        </span>
      </div>

      {hasMerma && (
        <div className="mt-2 flex justify-end">
          <Btn size="sm" variant="ghost" onClick={() => onRegistrarResiduo(l)}>
            <ArrowDownCircle size={13} /> Registrar residuo como materia prima
          </Btn>
        </div>
      )}
    </div>
  );
}
