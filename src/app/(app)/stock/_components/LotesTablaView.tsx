import { type Producto, type LoteProduccion } from '@/lib/types';
import { formatNum, formatBs } from '@/lib/utils';
import { Badge } from '@/components/ui';

/** Tabla de trazabilidad de lotes activos, con toggle de unidad (kg / QQ / etc). */
export function LotesTablaView({
  productos,
  getLotes,
  tableUnits,
  tableUnit,
  setTableUnit,
}: {
  productos: Producto[];
  getLotes: (pid: string) => LoteProduccion[];
  tableUnits: { factor: number; abrev: string }[];
  tableUnit: { factor: number; abrev: string };
  setTableUnit: (u: { factor: number; abrev: string }) => void;
}) {
  const totalLotes = productos.reduce((s, p) => s + getLotes(p.id).length, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] font-700 text-gr-muted uppercase tracking-wide">
          Lotes activos · trazabilidad SENASAG
        </h2>
        {tableUnits.length > 1 && (
          <div className="flex rounded-[8px] overflow-hidden border border-gr-border shrink-0">
            {tableUnits.map(u => (
              <button key={u.factor} type="button"
                onClick={() => setTableUnit(u)}
                className={`px-2.5 py-1 text-[11px] font-700 transition-all ${
                  Math.abs(u.factor - tableUnit.factor) < 0.1
                    ? 'bg-gr-primary text-white'
                    : 'bg-white text-gr-muted hover:text-gr-text'
                }`}>
                {u.abrev}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="card-no-pad">
        <div className="overflow-x-auto">
        <div style={{ minWidth: 620 }}>
        <div className="hidden md:grid gap-4 px-5 py-3 text-[11.5px] font-700 text-gr-muted uppercase tracking-wide border-b border-gr-border"
          style={{ gridTemplateColumns: '180px 1fr auto auto auto auto', background: 'var(--color-gr-border-lite)' }}>
          <span>Código Lote</span><span>Producto</span>
          <span className="text-right">Disponible ({tableUnit.abrev})</span>
          <span>Producido ({tableUnit.abrev})</span>
          <span>Vence</span><span>Estado</span>
        </div>

        {productos.flatMap(p => {
          const lotesProd = getLotes(p.id);
          if (lotesProd.length === 0) return [];
          return lotesProd.map((l, i) => {
            const cant       = Number(l.cantidadProducida);
            const restante   = Number(l.stockRestante);
            const totalKg    = Number(l.totalKg);
            const pct        = cant > 0 ? restante / cant : 0;
            const status     = pct < 0.15 ? 'red' : pct < 0.4 ? 'yellow' : 'green';
            const isLast     = i === lotesProd.length - 1;
            // Factor real del lote (kg por unidad)
            const factorLote = cant > 0 ? totalKg / cant : 1;
            const restanteKg = restante * factorLote;
            // Convertir a la unidad seleccionada en la tabla
            const dispRestante  = formatNum(restanteKg / tableUnit.factor, tableUnit.factor === 1 ? 0 : 2);
            const dispProducido = formatNum(totalKg / tableUnit.factor, tableUnit.factor === 1 ? 0 : 2);
            return (
              <div key={l.id}
                className={`border-b ${isLast ? 'border-b-gr-border' : 'border-b-gr-border-lite'}`}>
                {/* Mobile */}
                <div className="flex items-center justify-between px-5 py-3.5 md:hidden">
                  <div>
                    <p className="font-700 text-gr-text text-[13px]">{l.codigoLote}</p>
                    <p className="text-[12px] text-gr-muted">
                      {dispRestante} {tableUnit.abrev} · vence {l.fechaVencimiento}
                    </p>
                  </div>
                  <Badge color={status}>{status === 'red' ? 'Agotando' : status === 'yellow' ? 'Medio' : 'OK'}</Badge>
                </div>
                {/* Desktop */}
                <div className="hidden md:grid gap-4 px-5 py-3.5 items-center"
                  style={{ gridTemplateColumns: '180px 1fr auto auto auto auto' }}>
                  <span className="font-700 font-mono text-[12.5px] text-gr-primary">{l.codigoLote}</span>
                  <div>
                    <p className="font-600 text-gr-text text-[13px]">{p.nombre}</p>
                    <p className="text-[11.5px] text-gr-muted">{p.codigo}{l.registroSanitario ? ` · ${l.registroSanitario}` : ''}</p>
                  </div>
                  <span className="text-right font-800 text-gr-text text-[14px]">
                    {dispRestante}
                    <span className="text-[11px] font-500 text-gr-muted ml-1">{tableUnit.abrev}</span>
                  </span>
                  <span className="text-[13px] text-gr-sub">
                    {dispProducido} {tableUnit.abrev} · {l.fecha}
                  </span>
                  <span className="text-[13px] text-gr-muted">{l.fechaVencimiento}</span>
                  <Badge color={status}>{pct < 0.15 ? 'Agotando' : pct < 0.4 ? 'Medio' : 'Disponible'}</Badge>
                </div>
              </div>
            );
          });
        })}

        {totalLotes === 0 && (
          <div className="py-12 text-center text-gr-muted text-[13.5px]">
            Sin lotes activos. Registrá producción desde la sección Producción.
          </div>
        )}

        <div className="px-5 py-3 flex items-center justify-between text-[12.5px]"
          style={{ background: 'var(--color-gr-border-lite)' }}>
          <span className="text-gr-muted">{totalLotes} lotes activos</span>
          <span className="font-700 text-gr-text">
            Valor inventario: {formatBs(productos.reduce((s, p) => s + Number(p.stockActual) * Number(p.precioUnitarioBs ?? 0), 0))}
          </span>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
}
