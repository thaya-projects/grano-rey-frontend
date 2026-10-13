import { TipoMovimientoMP, EstadoPagoMP, type KardexMP, type UnidadMedida } from '@/lib/types';
import { formatNum, formatBs } from '@/lib/utils';
import { Btn, Spinner } from '@/components/ui';
import { CheckCircle, Ban } from 'lucide-react';

/** Lotes de un MP (se monta cuando el acordeón está abierto). */
export function LotesSection({ kardex, loading, stockActualKg, unidadMedida, onPagar, pagarPending, onAnular, canEdit }: {
  kardex: KardexMP[];
  loading: boolean;
  stockActualKg: number;
  unidadMedida?: UnidadMedida | null;
  onPagar: (id: string) => void;
  pagarPending: boolean;
  onAnular: (k: KardexMP) => void;
  canEdit: boolean;
}) {
  const factor    = unidadMedida?.factorABase ?? 46;
  const unitLabel = unidadMedida?.abreviatura ?? unidadMedida?.codigo ?? 'QQ';
  // Ingresos ordenados FIFO (más viejo primero) para cómputo — excluye anuladas: ya no aportan stock.
  const ingresosOrdenados = kardex
    .filter(k => k.tipoMovimiento === TipoMovimientoMP.INGRESO && !k.anulado)
    .sort((a, b) => {
      const d = a.fecha.localeCompare(b.fecha);
      return d !== 0 ? d : a.createdAt.localeCompare(b.createdAt);
    });
  // Anuladas se muestran aparte, al final, solo como registro de auditoría.
  const anuladas = kardex
    .filter(k => k.tipoMovimiento === TipoMovimientoMP.INGRESO && k.anulado)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  // ── FIFO: asignar disponible por lote ──────────────────────────
  const totalIngresadoKg = ingresosOrdenados.reduce((s, k) => s + Number(k.cantidadKg), 0);
  const totalConsumidoKg = Math.max(0, totalIngresadoKg - stockActualKg);

  let pendConsumed = totalConsumidoKg;
  const dispKgMap = new Map<string, number>();
  for (const k of ingresosOrdenados) {
    const kgK = Number(k.cantidadKg);
    const consumidoK = Math.min(pendConsumed, kgK);
    dispKgMap.set(k.id, kgK - consumidoK);
    pendConsumed = Math.max(0, pendConsumed - kgK);
  }

  // Display: más reciente primero
  const ingresosDisplay = [...ingresosOrdenados].reverse();

  if (loading) {
    return (
      <div className="px-8 py-5 flex justify-center bg-gr-border-lite/40">
        <Spinner size={18} color="var(--color-gr-primary)" />
      </div>
    );
  }

  if (ingresosDisplay.length === 0 && anuladas.length === 0) {
    return (
      <div className="px-6 py-5 text-[13px] text-gr-muted text-center bg-gr-border-lite/40">
        Sin lotes registrados · registrá una entrada para agregar stock
      </div>
    );
  }

  return (
    <div className="bg-gr-border-lite/40 border-t border-gr-border-lite px-3 sm:px-5 pb-3 pt-2 space-y-2">

      {/* ── Resumen totales ── */}
      <div className="grid grid-cols-3 gap-2 rounded-lg px-3 py-3 text-center text-[12px]"
        style={{ background: 'var(--color-gr-primary-lite)' }}>
        <div>
          <p className="font-600 text-gr-muted mb-0.5">Ingresado</p>
          <p className="font-800 text-gr-text">{formatNum(totalIngresadoKg / factor, 2)} {unitLabel}</p>
          <p className="text-[11px] text-gr-muted">{formatNum(totalIngresadoKg, 0)} kg</p>
        </div>
        <div>
          <p className="font-600 text-gr-muted mb-0.5">Utilizado</p>
          <p className="font-800" style={{ color: totalConsumidoKg > 0 ? '#A05C0A' : '#9CA3AF' }}>
            {formatNum(totalConsumidoKg / factor, 2)} {unitLabel}
          </p>
          <p className="text-[11px] text-gr-muted">{formatNum(totalConsumidoKg, 0)} kg</p>
        </div>
        <div>
          <p className="font-600 text-gr-muted mb-0.5">Disponible</p>
          <p className="font-800" style={{ color: '#2E7D52' }}>
            {formatNum(stockActualKg / factor, 2)} {unitLabel}
          </p>
          <p className="text-[11px] text-gr-muted">{formatNum(stockActualKg, 0)} kg</p>
        </div>
      </div>

      <p className="text-[10.5px] font-700 text-gr-muted uppercase tracking-wide pt-0.5">
        {ingresosDisplay.length} lote{ingresosDisplay.length !== 1 ? 's' : ''} · más reciente primero · consumo FIFO
      </p>

      {/* ── Fila por lote ── */}
      {ingresosDisplay.map(k => {
        const pagado      = k.estadoPago === EstadoPagoMP.PAGADO;
        const dispKg      = dispKgMap.get(k.id) ?? 0;
        const consumidoKg = Number(k.cantidadKg) - dispKg;
        const pct         = Number(k.cantidadKg) > 0 ? (dispKg / Number(k.cantidadKg)) * 100 : 0;
        const agotado     = dispKg <= 0;

        return (
          <div key={k.id}
            className={`flex items-start gap-3 px-3 py-2.5 rounded-lg bg-white border transition-opacity ${agotado ? 'border-gr-border opacity-55' : 'border-gr-border-lite'}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-700 text-[13.5px] text-gr-text">
                  {k.numeroLotePropio ?? 'Sin N°'}
                </span>
                <span className="text-[11px] text-gr-muted">{k.fecha}</span>
                {k.proveedor && (
                  <span className="text-[11px] text-gr-muted">{k.proveedor.nombre}</span>
                )}
                {agotado && (
                  <span className="text-[10px] font-700 px-1.5 py-0.5 rounded-full bg-gr-border text-gr-muted">
                    Agotado
                  </span>
                )}
              </div>
              <p className="font-700 text-gr-primary text-[13px] mt-0.5">
                {formatNum(k.cantidad, 1)} {k.unidad?.codigo ?? ''}
                <span className="font-400 text-gr-muted text-[11.5px] ml-1.5">
                  ({formatNum(Number(k.cantidadKg), 0)} kg)
                </span>
                {k.costoUnitarioBs && (
                  <span className="font-500 text-gr-muted text-[11.5px] ml-2">
                    {formatBs(Number(k.costoUnitarioBs) * Number(k.cantidad))}
                  </span>
                )}
              </p>
              {/* Barra disponible / utilizado */}
              <div className="mt-2">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-gr-border)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: agotado ? '#9CA3AF' : '#2E7D52' }} />
                </div>
                <div className="flex gap-3 mt-1 text-[11px]">
                  <span style={{ color: agotado ? '#9CA3AF' : '#2E7D52' }}>
                    Disp: <strong>{formatNum(dispKg / factor, 2)} {unitLabel}</strong>
                  </span>
                  {consumidoKg > 0 && (
                    <span className="text-gr-muted">
                      Usado: {formatNum(consumidoKg / factor, 2)} {unitLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="shrink-0 mt-0.5 flex flex-col items-end gap-1.5">
              {pagado ? (
                <span className="text-[11.5px] font-600 flex items-center gap-1 whitespace-nowrap"
                  style={{ color: '#2E7D52' }}>
                  <CheckCircle size={13} /> Pagado
                </span>
              ) : canEdit ? (
                <Btn size="sm" onClick={() => onPagar(k.id)} loading={pagarPending}
                  style={{ background: '#FFF3E0', color: '#e67e00', border: '1px solid #FFB74D' }}>
                  Pagar
                </Btn>
              ) : null}
              {!pagado && canEdit && (
                <Btn size="sm" variant="ghost" onClick={() => onAnular(k)}>
                  <Ban size={12} /> Anular
                </Btn>
              )}
            </div>
          </div>
        );
      })}

      {/* ── Compras anuladas (registro de auditoría) ── */}
      {anuladas.length > 0 && (
        <div className="pt-2 space-y-2">
          <p className="text-[10.5px] font-700 text-gr-muted uppercase tracking-wide">
            Anuladas
          </p>
          {anuladas.map(k => (
            <div key={k.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-white border border-gr-border opacity-55">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-700 text-[13.5px] text-gr-text line-through">
                    {k.numeroLotePropio ?? 'Sin N°'}
                  </span>
                  <span className="text-[11px] text-gr-muted">{k.fecha}</span>
                  <span className="text-[10px] font-700 px-1.5 py-0.5 rounded-full"
                    style={{ background: 'var(--color-gr-danger-bg)', color: 'var(--color-gr-danger)' }}>
                    Anulada
                  </span>
                </div>
                <p className="font-700 text-gr-muted text-[13px] mt-0.5 line-through">
                  {formatNum(k.cantidad, 1)} {k.unidad?.codigo ?? ''}
                </p>
                {k.motivoAnulacion && (
                  <p className="text-[11px] text-gr-muted mt-0.5 italic">Motivo: {k.motivoAnulacion}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
