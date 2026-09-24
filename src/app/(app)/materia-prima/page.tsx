'use client';
import { useMemo, useState } from 'react';
import { useMateriasPrimas, useCreateKardexMP, useKardexMP, useKardexMPPendientesPago, usePagarKardexMP, useAnularKardexMP } from '@/lib/api/materia-prima';
import { useProveedores, useUnidades, useSubtiposMP } from '@/lib/api/catalogos';
import { useLotes } from '@/lib/api/produccion';
import { TipoMovimientoMP, TipoPagoCarga, EstadoPagoMP, RolUsuario, type MateriaPrima, type KardexMP, type LoteProduccion, type UnidadMedida } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { formatNum, formatBs, kgToQQ } from '@/lib/utils';
import { Btn, Modal, FormField, Input, Select, Textarea, Spinner, useToast } from '@/components/ui';
import { Plus, CheckCircle, ChevronRight, ChevronDown, MinusCircle, Ban } from 'lucide-react';
import { CargasSection, type CargaDraft } from '@/components/CargasSection';

/**
 * Código de lote sugerido para entradas de materia prima:
 * `MP-YYMMDD-HHMM` (ej. MP-260701-2006 = 1-jul-2026 20:06).
 * Fecha primero para orden cronológico natural + separador para lectura.
 */
function autoLoteMp(): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `MP-${yy}${mm}${dd}-${hh}${mi}`;
}

function StockDot({ value, min }: { value: number; min: number }) {
  const low  = min > 0 && value < min;
  const warn = !low && min > 0 && value < min * 1.5;
  const color = low ? '#B53D35' : warn ? '#A05C0A' : '#2E7D52';
  const label = low ? 'Crítico' : warn ? 'Bajo' : 'OK';
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-600" style={{ color }}>
      <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: color }} />
      {label}
    </span>
  );
}

// ─── Lotes de un MP (se monta cuando el acordeón está abierto) ────────────
function LotesSection({ kardex, loading, stockActualKg, unidadMedida, onPagar, pagarPending, onAnular, canEdit }: {
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

// ─── Fila de una materia prima (acordeón) ─────────────────────────────────
function MPRow({ mp, kardex, kardexLoading, onEntrada, onMovimiento }: {
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

// ─── Anular Compra Modal ───────────────────────────────────────────────────
function AnularCompraModal({ kardex, onClose, onAnulada }: {
  kardex: KardexMP;
  onClose: () => void;
  onAnulada: () => void;
}) {
  const anular = useAnularKardexMP();
  const toast  = useToast(s => s.show);
  const [motivo, setMotivo] = useState('');

  async function handleAnular() {
    if (!motivo.trim()) return;
    try {
      await anular.mutateAsync({ id: kardex.id, motivo: motivo.trim() });
      onAnulada();
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo anular la compra'), 'error');
    }
  }

  return (
    <Modal open title={`Anular compra — ${kardex.numeroLotePropio ?? kardex.materiaPrima?.nombre}`} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cerrar</Btn>
        <Btn variant="danger" onClick={handleAnular} disabled={!motivo.trim()} loading={anular.isPending}>
          <Ban size={14} /> Confirmar anulación
        </Btn>
      </>}>
      <div className="rounded-[10px] px-4 py-3 flex items-start gap-2"
        style={{ background: 'var(--color-gr-danger-bg)', border: '1px solid rgba(181,61,53,0.15)' }}>
        <Ban size={15} className="text-gr-danger shrink-0 mt-0.5" />
        <p className="font-600 text-[13px] text-gr-danger">
          Solo se puede anular una compra que aún no se pagó. El stock que sumó esta entrada se resta automáticamente.
        </p>
      </div>
      <div className="text-[13.5px]">
        <p className="text-gr-muted">Materia prima</p>
        <p className="font-800 text-gr-text">{kardex.materiaPrima?.nombre ?? '—'}</p>
        <p className="text-gr-muted mt-1">
          Cantidad: <strong className="text-gr-text">{formatNum(kardex.cantidad, 1)} {kardex.unidad?.codigo ?? ''}</strong>
          {kardex.proveedor && <> · Proveedor: <strong className="text-gr-text">{kardex.proveedor.nombre}</strong></>}
        </p>
      </div>
      <FormField label="Motivo de la anulación" required hint="Obligatorio">
        <Textarea placeholder="Ej. El proveedor no entregó, error al registrar la compra..."
          value={motivo} onChange={e => setMotivo(e.target.value)} />
      </FormField>
    </Modal>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────
export default function MateriaPrimaPage() {
  const toast = useToast(s => s.show);
  const mpQ             = useMateriasPrimas();
  const proveedoresQ    = useProveedores();
  const unidadesQ       = useUnidades();
  const pendientesPagoQ = useKardexMPPendientesPago();
  const allKardexQ      = useKardexMP();

  const materiasPrimas = mpQ.data ?? [];
  const proveedores    = proveedoresQ.data ?? [];
  const unidades       = unidadesQ.data ?? [];
  const pendientesPago = pendientesPagoQ.data ?? [];
  const allKardex      = allKardexQ.data ?? [];

  const [entradaModal, setEntradaModal]     = useState<MateriaPrima | null>(null);
  const [movimientoModal, setMovimientoModal] = useState<MateriaPrima | null>(null);
  const lotesQ = useLotes();

  // Resumen — todos los useMemo antes del early return
  const totalKg = useMemo(
    () => materiasPrimas.reduce((s, m) => s + Number(m.stockActualKg), 0),
    [materiasPrimas],
  );

  const totalIngresadoKg = useMemo(
    () => allKardex
      .filter(k => k.tipoMovimiento === TipoMovimientoMP.INGRESO)
      .reduce((s, k) => s + Number(k.cantidadKg), 0),
    [allKardex],
  );

  const totalConsumidoKg = Math.max(0, totalIngresadoKg - totalKg);
  const stockBajoCount = useMemo(
    () => materiasPrimas.filter(
      m => Number(m.stockMinimoKg) > 0 && Number(m.stockActualKg) < Number(m.stockMinimoKg)
    ).length,
    [materiasPrimas],
  );
  const pendBs = useMemo(
    () => pendientesPago.reduce((s, k) => s + Number(k.costoUnitarioBs ?? 0) * Number(k.cantidad), 0),
    [pendientesPago],
  );
  const mpsSorted = useMemo(() => [...materiasPrimas].sort((a, b) => {
    const minA = Number(a.stockMinimoKg);
    const minB = Number(b.stockMinimoKg);
    if (minA === 0 && minB === 0) return a.nombre.localeCompare(b.nombre);
    if (minA === 0) return 1;
    if (minB === 0) return -1;
    return (Number(a.stockActualKg) / minA) - (Number(b.stockActualKg) / minB);
  }), [materiasPrimas]);

  if (mpQ.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-75">
        <Spinner size={28} color="var(--color-gr-primary)" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-900 text-gr-text">Materia Prima</h1>
        <p className="text-gr-muted text-[13.5px] mt-0.5">
          {materiasPrimas.length} ítems · {formatNum(kgToQQ(totalKg), 2)} QQ en stock
        </p>
      </div>

      {/* 4 tarjetas resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {/* Ingresado total */}
        <div className="card">
          <p className="text-[10px] sm:text-[11.5px] font-700 text-gr-muted uppercase tracking-wide mb-1">Ingresado</p>
          <p className="text-[20px] sm:text-[28px] font-900 text-gr-text leading-none">
            {allKardexQ.isLoading ? '…' : formatNum(kgToQQ(totalIngresadoKg), 2)}
          </p>
          <p className="text-[10px] sm:text-[12px] text-gr-muted mt-1">QQ total</p>
          <p className="text-[10px] sm:text-[11px] text-gr-muted hidden sm:block">{formatNum(totalIngresadoKg, 0)} kg</p>
        </div>

        {/* Utilizado */}
        <div className="card border-t-2" style={{ borderTopColor: totalConsumidoKg > 0 ? '#A05C0A' : '#9CA3AF' }}>
          <p className="text-[10px] sm:text-[11.5px] font-700 text-gr-muted uppercase tracking-wide mb-1">Utilizado</p>
          <p className="text-[20px] sm:text-[28px] font-900 leading-none"
            style={{ color: totalConsumidoKg > 0 ? '#A05C0A' : '#9CA3AF' }}>
            {allKardexQ.isLoading ? '…' : formatNum(kgToQQ(totalConsumidoKg), 2)}
          </p>
          <p className="text-[10px] sm:text-[12px] text-gr-muted mt-1">QQ en producción</p>
          <p className="text-[10px] sm:text-[11px] text-gr-muted hidden sm:block">{formatNum(totalConsumidoKg, 0)} kg</p>
        </div>

        {/* Disponible */}
        <div className="card border-t-2" style={{ borderTopColor: 'var(--color-gr-primary)' }}>
          <p className="text-[10px] sm:text-[11.5px] font-700 text-gr-muted uppercase tracking-wide mb-1">Disponible</p>
          <p className="text-[20px] sm:text-[28px] font-900 text-gr-primary leading-none">{formatNum(kgToQQ(totalKg), 2)}</p>
          <p className="text-[10px] sm:text-[12px] text-gr-muted mt-1">QQ en stock</p>
          <p className="text-[10px] sm:text-[11px] text-gr-muted hidden sm:block">{formatNum(totalKg, 0)} kg</p>
        </div>

        {/* Por pagar / Stock bajo */}
        <div className="card border-t-2"
          style={{ borderTopColor: stockBajoCount > 0 ? 'var(--color-gr-danger)' : pendientesPago.length > 0 ? '#e67e00' : '#2E7D52' }}>
          <p className="text-[10px] sm:text-[11.5px] font-700 text-gr-muted uppercase tracking-wide mb-1">
            {stockBajoCount > 0 ? 'Stock bajo' : 'Por pagar'}
          </p>
          {stockBajoCount > 0 ? (
            <>
              <p className="text-[20px] sm:text-[28px] font-900 leading-none" style={{ color: 'var(--color-gr-danger)' }}>
                {stockBajoCount}
              </p>
              <p className="text-[10px] sm:text-[12px] text-gr-muted mt-1">materia{stockBajoCount !== 1 ? 's' : ''}</p>
            </>
          ) : pendientesPago.length > 0 ? (
            <>
              <p className="text-[20px] sm:text-[28px] font-900 leading-none" style={{ color: '#e67e00' }}>
                {pendientesPago.length}
              </p>
              <p className="text-[10px] sm:text-[12px] text-gr-muted mt-1">compra{pendientesPago.length !== 1 ? 's' : ''}</p>
              <p className="text-[10px] sm:text-[11px] font-700 hidden sm:block" style={{ color: '#e67e00' }}>{formatBs(pendBs)}</p>
            </>
          ) : (
            <>
              <p className="text-[20px] sm:text-[28px] font-900 leading-none" style={{ color: '#2E7D52' }}>✓</p>
              <p className="text-[10px] sm:text-[12px] text-gr-muted mt-1">Sin alertas</p>
            </>
          )}
        </div>
      </div>

      {/* Lista de MP con acordeón */}
      <div>
        <p className="text-[11.5px] font-700 text-gr-muted uppercase tracking-wide mb-2">
          Materias primas · tocá una para ver sus lotes
        </p>
        <div className="card-no-pad">
          {mpsSorted.map(mp => {
            const mpKardex = allKardex.filter(k => k.materiaPrima.id === mp.id);
            return (
              <MPRow key={mp.id} mp={mp}
                kardex={mpKardex} kardexLoading={allKardexQ.isLoading}
                onEntrada={() => setEntradaModal(mp)}
                onMovimiento={() => setMovimientoModal(mp)} />
            );
          })}
          {materiasPrimas.length === 0 && (
            <p className="px-4 py-10 text-center text-gr-muted text-[14px]">Sin materias primas registradas</p>
          )}
        </div>
      </div>


      {entradaModal && (
        <EntradaModal
          mp={entradaModal}
          proveedores={proveedores}
          unidades={unidades}
          allKardex={allKardex}
          onClose={() => setEntradaModal(null)}
          onSaved={() => {
            setEntradaModal(null);
            toast('Entrada registrada en inventario', 'success');
          }}
          onError={(msg) => toast(msg, 'error')}
        />
      )}
      {movimientoModal && (
        <MovimientoMPModal
          mp={movimientoModal}
          kardex={allKardex.filter(k => k.materiaPrima.id === movimientoModal.id)}
          unidades={unidades}
          lotes={lotesQ.data ?? []}
          onClose={() => setMovimientoModal(null)}
          onSaved={(tipo) => {
            setMovimientoModal(null);
            const msg =
              tipo === TipoMovimientoMP.AJUSTE ? 'Ajuste registrado' :
              tipo === TipoMovimientoMP.DESECHO ? 'Desecho registrado' : 'Merma registrada';
            toast(msg, tipo === TipoMovimientoMP.AJUSTE ? 'success' : 'warning');
          }}
          onError={(msg) => toast(msg, 'error')}
        />
      )}
    </div>
  );
}

// ─── Entrada Modal ─────────────────────────────────────────────────────────
function EntradaModal({ mp, proveedores, unidades, allKardex, onClose, onSaved, onError }: {
  mp: MateriaPrima;
  proveedores: { id: string; nombre: string }[];
  unidades: { id: string; codigo: string; nombre: string; abreviatura?: string | null }[];
  allKardex: KardexMP[];
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const createKardex = useCreateKardexMP();
  const subtiposQ = useSubtiposMP(mp.categoria?.tieneSubtipos ? mp.categoria.id : undefined);
  const subtipos = subtiposQ.data ?? [];

  // Número de lote propio sugerido: MP-XXXX secuencial, sin colisión con los existentes
  const sugeridoLotePropio = useMemo(() => {
    const existentes = new Set(
      allKardex.map(k => k.numeroLotePropio).filter(Boolean)
    );
    const nums = [...existentes]
      .map(n => { const m = /^MP-0*(\d+)$/i.exec(n!); return m ? parseInt(m[1]) : 0; })
      .filter(n => n > 0);
    let siguiente = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
    while (existentes.has(`MP-${String(siguiente).padStart(4, '0')}`)) siguiente++;
    return `MP-${String(siguiente).padStart(4, '0')}`;
  }, [allKardex]);

  const [cantidad, setCantidad]       = useState('');
  const [unidadId, setUnidadId]       = useState(mp.unidadMedida?.id ?? '');
  const [subtipoId, setSubtipoId]     = useState('');
  const [costoBs, setCostoBs]         = useState('');
  const [proveedorId, setProvId]      = useState('');
  const [numeroLotePropio, setNumeroLotePropio] = useState(sugeridoLotePropio);
  const [observaciones, setObs]       = useState('');
  const [fecha, setFecha]             = useState(new Date().toISOString().slice(0, 10));
  const [estadoPago, setEstadoPago]   = useState<'pendiente' | 'pagado'>('pendiente');
  const [fechaPago, setFechaPago]     = useState('');

  // Cargas
  const [tipoPago, setTipoPago]       = useState<TipoPagoCarga>(TipoPagoCarga.BOLSA);
  const [tarifaBs, setTarifaBs]       = useState(0);
  const [cargas, setCargas]           = useState<CargaDraft[]>([]);

  const cantNum = parseFloat(cantidad) || 0;

  const totalUnidades = cantNum;

  // Obligatorios: cantidad, unidad, proveedor. N° de lote se autogenera pero editable.
  const valid = cantNum > 0 && !!unidadId && !!proveedorId;

  async function handleSave() {
    if (!valid) return;
    try {
      await createKardex.mutateAsync({
        fecha,
        tipoMovimiento: TipoMovimientoMP.INGRESO,
        cantidad: cantNum,
        materiaPrimaId: mp.id,
        unidadId,
        subtipoId: subtipoId || undefined,
        proveedorId,
        numeroLotePropio: numeroLotePropio.trim() || undefined,
        costoUnitarioBs: costoBs ? parseFloat(costoBs) : undefined,
        observaciones: observaciones || undefined,
        estadoPago: estadoPago as EstadoPagoMP,
        fechaPago: estadoPago === 'pagado' && fechaPago ? fechaPago : undefined,
        cargas: cargas.length > 0
          ? cargas.map(({ _id: _drop, ...c }) => c)
          : undefined,
      });
      onSaved();
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo registrar la entrada'));
    }
  }

  return (
    <Modal xl open title={`Registrar entrada — ${mp.nombre}`} onClose={onClose}>
      <div className="rounded-md px-4 py-3 text-[13px]" style={{ background: 'var(--color-gr-primary-lite)' }}>
        <p className="font-600 text-gr-primary">
          Stock actual: <strong>{formatNum(Number(mp.stockActualKg), 1)} kg</strong> ({formatNum(kgToQQ(Number(mp.stockActualKg)), 2)} QQ)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Columna izquierda ── datos de la entrada ── */}
        <div className="space-y-3">
          <p className="text-[11.5px] font-700 text-gr-muted uppercase tracking-wide">
            Datos de la entrada
          </p>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Cantidad" required>
              <Input type="number" min="0" step="0.01" placeholder="0" value={cantidad}
                onChange={e => setCantidad(e.target.value)} autoFocus className="text-[16px] font-700" />
            </FormField>
            <FormField label="Unidad" required>
              <Select value={unidadId} onChange={e => setUnidadId(e.target.value)}>
                <option value="">— Seleccionar —</option>
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>{u.codigo} · {u.nombre}</option>
                ))}
              </Select>
            </FormField>
          </div>

          {mp.categoria?.tieneSubtipos && subtipos.length > 0 && (
            <FormField label="Subtipo">
              <Select value={subtipoId} onChange={e => setSubtipoId(e.target.value)}>
                <option value="">— Sin subtipo —</option>
                {subtipos.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </Select>
            </FormField>
          )}

          <FormField label="N° lote" hint="Sugerido · editable">
            <Input placeholder="MP-0001" value={numeroLotePropio}
              onChange={e => setNumeroLotePropio(e.target.value)} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Proveedor" required>
              <Select value={proveedorId} onChange={e => setProvId(e.target.value)}>
                <option value="">— Seleccionar —</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </Select>
            </FormField>
            <FormField label="Costo unitario (Bs)">
              <Input type="number" min="0" step="0.01" placeholder="0" value={costoBs}
                onChange={e => setCostoBs(e.target.value)} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Estado de pago">
              <Select value={estadoPago} onChange={e => setEstadoPago(e.target.value as 'pendiente' | 'pagado')}>
                <option value="pendiente">Pendiente</option>
                <option value="pagado">Pagado</option>
              </Select>
            </FormField>
            {estadoPago === 'pagado' ? (
              <FormField label="Fecha de pago">
                <Input type="date" value={fechaPago} onChange={e => setFechaPago(e.target.value)} />
              </FormField>
            ) : (
              <FormField label="Fecha de entrada" required>
                <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
              </FormField>
            )}
          </div>

          {estadoPago === 'pagado' && (
            <FormField label="Fecha de entrada" required>
              <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </FormField>
          )}

          <FormField label="Observaciones">
            <Input placeholder="Notas..." value={observaciones} onChange={e => setObs(e.target.value)} />
          </FormField>
        </div>

        {/* ── Columna derecha ── cargadores ── */}
        <div className="space-y-3">
          <p className="text-[11.5px] font-700 text-gr-muted uppercase tracking-wide">
            Estibaje (opcional)
          </p>
          <CargasSection
            totalEsperado={totalUnidades}
            unidadTotal="unid."
            tipoPago={tipoPago}
            onTipoPagoChange={setTipoPago}
            tarifaBs={tarifaBs}
            onTarifaChange={setTarifaBs}
            cargas={cargas}
            onCargasChange={setCargas}
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-gr-border-lite">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!valid} loading={createKardex.isPending}>
          <Plus size={14} /> Registrar entrada
        </Btn>
      </div>
    </Modal>
  );
}

// ─── Movimiento MP Modal (merma / desecho / ajuste) ───────────────────────
const TIPO_CONFIG: Record<string, { label: string; color: string; hint: string }> = {
  [TipoMovimientoMP.MERMA]:   { label: 'Merma',   color: '#A05C0A', hint: 'Pérdida natural del proceso (polvo, derrame, humedad). Reduce el stock.' },
  [TipoMovimientoMP.DESECHO]: { label: 'Desecho',  color: '#B53D35', hint: 'MP dañada o vencida que se descarta completamente. Reduce el stock.' },
  [TipoMovimientoMP.AJUSTE]:  { label: 'Ajuste',   color: '#2E7D52', hint: 'Corrección positiva por conteo físico. Suma al stock.' },
};

function MovimientoMPModal({ mp, kardex, unidades, lotes, onClose, onSaved, onError }: {
  mp: MateriaPrima;
  kardex: KardexMP[];
  unidades: UnidadMedida[];
  lotes: LoteProduccion[];
  onClose: () => void;
  onSaved: (tipo: TipoMovimientoMP) => void;
  onError: (msg: string) => void;
}) {
  const createKardex = useCreateKardexMP();
  const [tipo, setTipo]         = useState<TipoMovimientoMP>(TipoMovimientoMP.MERMA);
  const [cantidad, setCantidad] = useState('');
  const [unidadId, setUnidadId] = useState(mp.unidadMedida?.id ?? '');
  const [loteId, setLoteId]     = useState('');
  const [valorBs, setValorBs]   = useState('');
  const [obs, setObs]           = useState('');
  const [fecha, setFecha]       = useState(new Date().toISOString().slice(0, 10));

  // Costo promedio ponderado por KG desde todos los ingresos con precio registrado
  const costoPorKg = useMemo(() => {
    const ingresos = kardex.filter(
      k => k.tipoMovimiento === TipoMovimientoMP.INGRESO && k.costoUnitarioBs != null
    );
    const totalCost = ingresos.reduce((s, k) => s + Number(k.costoUnitarioBs!) * Number(k.cantidad), 0);
    const totalKg   = ingresos.reduce((s, k) => s + Number(k.cantidadKg), 0);
    return totalKg > 0 ? totalCost / totalKg : 0;
  }, [kardex]);

  const cantNum         = parseFloat(cantidad) || 0;
  const config          = TIPO_CONFIG[tipo];
  const esMerma         = tipo === TipoMovimientoMP.MERMA;
  const esDesecho       = tipo === TipoMovimientoMP.DESECHO;
  const esAjuste        = tipo === TipoMovimientoMP.AJUSTE;
  const mostrarValor    = esMerma || esDesecho;
  const valid           = cantNum > 0 && !!unidadId;

  // Valor auto-calculado: cantidad convertida a KG × costo promedio
  const selectedUnidad  = unidades.find(u => u.id === unidadId);
  const factorABase     = selectedUnidad?.factorABase ?? 1;
  const cantKg          = cantNum * factorABase;
  const valorAuto       = costoPorKg > 0 && cantKg > 0
    ? parseFloat((costoPorKg * cantKg).toFixed(2))
    : 0;

  // Si el usuario no escribió nada, usamos el calculado
  const valorEfectivo   = valorBs ? parseFloat(valorBs) : valorAuto;

  async function handleSave() {
    if (!valid) return;
    const costoUnitarioBs = mostrarValor && valorEfectivo > 0 && cantNum > 0
      ? valorEfectivo / cantNum
      : undefined;
    try {
      await createKardex.mutateAsync({
        fecha,
        tipoMovimiento: tipo,
        cantidad: cantNum,
        materiaPrimaId: mp.id,
        unidadId,
        loteProduccionId: esMerma && loteId ? loteId : undefined,
        costoUnitarioBs,
        observaciones: obs.trim() || undefined,
      });
      onSaved(tipo);
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo registrar el movimiento'));
    }
  }

  return (
    <Modal open title={`Movimiento de MP — ${mp.nombre}`} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn
          onClick={handleSave}
          disabled={!valid}
          loading={createKardex.isPending}
          variant={esAjuste ? 'primary' : 'danger'}
        >
          Confirmar {config.label.toLowerCase()}
        </Btn>
      </>}>

      {/* Selector de tipo */}
      <div className="grid grid-cols-3 gap-2">
        {([TipoMovimientoMP.MERMA, TipoMovimientoMP.DESECHO, TipoMovimientoMP.AJUSTE] as TipoMovimientoMP[]).map(t => {
          const c = TIPO_CONFIG[t];
          const active = tipo === t;
          return (
            <button key={t} type="button" onClick={() => setTipo(t)}
              className="rounded-[10px] border-2 px-3 py-2.5 text-[12.5px] font-700 transition-all text-left"
              style={{
                borderColor: active ? c.color : 'var(--color-gr-border)',
                background: active ? `${c.color}14` : 'transparent',
                color: active ? c.color : 'var(--color-gr-muted)',
              }}>
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Hint del tipo seleccionado */}
      <p className="text-[12px] px-1" style={{ color: config.color }}>{config.hint}</p>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Cantidad" required>
          <Input type="number" min="0.001" step="0.001" placeholder="0"
            value={cantidad} onChange={e => setCantidad(e.target.value)} autoFocus />
        </FormField>
        <FormField label="Unidad" required>
          <Select value={unidadId} onChange={e => setUnidadId(e.target.value)}>
            <option value="">— Unidad —</option>
            {unidades.map(u => (
              <option key={u.id} value={u.id}>{u.codigo} — {u.nombre}</option>
            ))}
          </Select>
        </FormField>
      </div>

      {mostrarValor && (
        <FormField
          label={`Pérdida estimada (Bs)`}
          hint={
            costoPorKg > 0
              ? `Calculado desde precio de compra promedio (${formatBs(costoPorKg)}/kg). Podés ajustarlo si es necesario.`
              : 'Sin precio de compra registrado — ingresá el valor manualmente si lo conocés.'
          }>
          <Input
            type="number" min="0" step="0.01"
            placeholder={valorAuto > 0 ? String(valorAuto) : '0.00'}
            value={valorBs}
            onChange={e => setValorBs(e.target.value)}
          />
          {valorAuto > 0 && !valorBs && (
            <p className="text-[11.5px] mt-1" style={{ color: config.color }}>
              Se registrará {formatBs(valorAuto)} como pérdida
            </p>
          )}
          {valorBs && parseFloat(valorBs) !== valorAuto && valorAuto > 0 && (
            <button type="button"
              className="text-[11.5px] mt-1 underline"
              style={{ color: 'var(--color-gr-primary)' }}
              onClick={() => setValorBs('')}>
              Volver al calculado ({formatBs(valorAuto)})
            </button>
          )}
        </FormField>
      )}

      <FormField label="Fecha" required>
        <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
      </FormField>

      {/* Lote de producción — solo en merma */}
      {esMerma && lotes.length > 0 && (
        <FormField label="Lote de producción (opcional)"
          hint="Vincula esta merma a un lote específico para trazabilidad">
          <Select value={loteId} onChange={e => setLoteId(e.target.value)}>
            <option value="">— Sin vincular —</option>
            {lotes
              .filter(l => Number(l.stockRestante) > 0)
              .sort((a, b) => b.fecha.localeCompare(a.fecha))
              .slice(0, 20)
              .map(l => (
                <option key={l.id} value={l.id}>
                  {l.codigoLote} · {l.producto?.nombre} · {l.fecha}
                </option>
              ))}
          </Select>
        </FormField>
      )}

      <FormField label="Observaciones">
        <Textarea placeholder={
          esMerma   ? 'Causa de la merma (tamizado, derrame, humedad…)' :
          esAjuste  ? 'Motivo del ajuste (conteo físico, corrección…)' :
                      'Motivo del desecho (daño, vencimiento…)'
        } value={obs} onChange={e => setObs(e.target.value)} rows={2} />
      </FormField>
    </Modal>
  );
}
