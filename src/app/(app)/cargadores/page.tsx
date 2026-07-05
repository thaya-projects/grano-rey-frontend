'use client';
import { useMemo, useState } from 'react';
import {
  useTodasCargas,
  usePagarCarga,
  usePagarCargasBulk,
  useUpdateCargaTrabajo,
} from '@/lib/api/cargadores';
import { apiErrorMessage } from '@/lib/api';
import { formatBs, formatNum } from '@/lib/utils';
import { TipoPagoCarga, type DeudaItem } from '@/lib/types';
import { Btn, Spinner, useToast, Input, ConfirmModal } from '@/components/ui';
import {
  CheckCircle2, Wallet, Wheat, Truck, Pencil, Check, X, Calendar,
  ChevronDown, ChevronUp,
} from 'lucide-react';

type Tab = 'pendientes' | 'pagados';
type FiltroFecha = 'Hoy' | 'Esta semana' | 'Este mes' | 'Este año' | 'Personalizado' | 'Todos';

const FILTROS_FECHA: FiltroFecha[] = ['Hoy', 'Esta semana', 'Este mes', 'Este año', 'Personalizado', 'Todos'];

interface GrupoMovimiento {
  key: string;
  origen: 'kardex_mp' | 'venta';
  origenId: string;
  referencia: string;
  numeroReferencia?: string;
  clienteNombre?: string;
  materiaPrimaNombre?: string;
  fecha: string;
  items: DeudaItem[];
  totalBs: number;
  pagado: boolean;
}

/**
 * Fecha local YYYY-MM-DD (no UTC — evita off-by-one por la noche).
 */
function toLocalIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Devuelve el rango [desde, hasta] YYYY-MM-DD para un filtro rápido.
 * Null indica sin filtro (Todos).
 */
function rangoFiltro(filtro: FiltroFecha, custom: { desde: string; hasta: string }): { desde?: string; hasta?: string } {
  const hoy = new Date();
  if (filtro === 'Hoy') {
    const s = toLocalIso(hoy);
    return { desde: s, hasta: s };
  }
  if (filtro === 'Esta semana') {
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
    return { desde: toLocalIso(lunes), hasta: toLocalIso(hoy) };
  }
  if (filtro === 'Este mes') {
    const primer = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    return { desde: toLocalIso(primer), hasta: toLocalIso(hoy) };
  }
  if (filtro === 'Este año') {
    const primer = new Date(hoy.getFullYear(), 0, 1);
    return { desde: toLocalIso(primer), hasta: toLocalIso(hoy) };
  }
  if (filtro === 'Personalizado') {
    return { desde: custom.desde || undefined, hasta: custom.hasta || undefined };
  }
  return {};
}

export default function CargadoresPage() {
  const toast = useToast(s => s.show);
  const [tab, setTab] = useState<Tab>('pendientes');

  // Default: pendientes → Todos (querés ver toda la deuda). Pagados → Este mes.
  const [filtroPend, setFiltroPend] = useState<FiltroFecha>('Todos');
  const [filtroPag,  setFiltroPag]  = useState<FiltroFecha>('Este mes');
  const [customPend, setCustomPend] = useState({ desde: '', hasta: '' });
  const [customPag,  setCustomPag]  = useState({ desde: '', hasta: '' });

  const filtroActivo = tab === 'pendientes' ? filtroPend : filtroPag;
  const customActivo = tab === 'pendientes' ? customPend : customPag;
  const setFiltro    = tab === 'pendientes' ? setFiltroPend : setFiltroPag;
  const setCustom    = tab === 'pendientes' ? setCustomPend : setCustomPag;

  const { desde, hasta } = rangoFiltro(filtroActivo, customActivo);
  const pagado = tab === 'pagados';
  // En "Personalizado" esperamos a que el usuario complete ambas fechas
  // antes de disparar la query — evita fetches con rango vacío.
  const rangoIncompleto = filtroActivo === 'Personalizado' && (!desde || !hasta);
  const cargasQ = useTodasCargas(pagado, desde, hasta, { enabled: !rangoIncompleto });
  const cargas  = cargasQ.data ?? [];

  const grupos = useMemo<GrupoMovimiento[]>(() => {
    const map = new Map<string, GrupoMovimiento>();
    for (const item of cargas) {
      const key = `${item.origen}::${item.origenId}`;
      const g = map.get(key);
      if (g) {
        g.items.push(item);
        g.totalBs += Number(item.montoBs);
      } else {
        map.set(key, {
          key,
          origen: item.origen,
          origenId: item.origenId,
          referencia: item.referencia,
          numeroReferencia: item.numeroReferencia,
          clienteNombre: item.clienteNombre,
          materiaPrimaNombre: item.materiaPrimaNombre,
          fecha: item.fecha,
          items: [item],
          totalBs: Number(item.montoBs),
          pagado,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => (b.fecha > a.fecha ? 1 : -1));
  }, [cargas, pagado]);

  const totalPeriodo = grupos.reduce((s, g) => s + g.totalBs, 0);
  const totalCargadores = new Set(cargas.map(i => i.cargadorId).filter(Boolean)).size;

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-[22px] font-900 text-[var(--color-gr-text)]">Pagos a cargadores</h1>
        <p className="text-[var(--color-gr-muted)] text-[13.5px] mt-0.5">
          Cada lote/despacho muestra quiénes descargaron y cuánto se les pagó.
        </p>
      </div>

      {/* Tabs Pendientes / Pagados */}
      <div className="flex gap-1 bg-white border border-[var(--color-gr-border)] rounded-[12px] p-1 w-fit">
        {(['pendientes', 'pagados'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2 rounded-[10px] text-[13.5px] font-700 transition-all"
            style={tab === t
              ? { background: 'var(--color-gr-primary)', color: '#fff' }
              : { color: 'var(--color-gr-muted)' }}
          >
            {t === 'pendientes' ? 'Pendientes de pago' : 'Ya pagados'}
          </button>
        ))}
      </div>

      {/* Filtros de fecha */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 bg-white border border-[var(--color-gr-border)] rounded-[10px] p-1">
          {FILTROS_FECHA.map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className="px-3 py-1.5 rounded-[8px] text-[12.5px] font-600 transition-all"
              style={filtroActivo === f
                ? { background: 'var(--color-gr-primary)', color: '#fff' }
                : { color: 'var(--color-gr-muted)' }}>
              {f}
            </button>
          ))}
        </div>
        {filtroActivo === 'Personalizado' && (
          <div className="flex flex-wrap items-center gap-2 bg-[var(--color-gr-border-lite)] rounded-[10px] p-2">
            <input type="date" value={customActivo.desde}
              onChange={e => setCustom({ ...customActivo, desde: e.target.value })}
              className="border border-[var(--color-gr-border)] rounded-[8px] px-3 py-1.5 text-[13px] bg-white" />
            <span className="text-[12px] text-[var(--color-gr-muted)]">→</span>
            <input type="date" value={customActivo.hasta}
              onChange={e => setCustom({ ...customActivo, hasta: e.target.value })}
              className="border border-[var(--color-gr-border)] rounded-[8px] px-3 py-1.5 text-[13px] bg-white" />
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Lotes" value={String(grupos.length)} />
        <KpiCard label="Cargadores" value={String(totalCargadores)} />
        <KpiCard
          label={tab === 'pendientes' ? 'Total a pagar' : 'Total pagado en el período'}
          value={formatBs(totalPeriodo)}
          color={tab === 'pendientes' ? 'danger' : 'success'}
        />
      </div>

      {rangoIncompleto ? (
        <div className="rounded-[14px] px-6 py-10 text-center"
          style={{ background: 'var(--color-gr-primary-lite)', border: '1px solid rgba(0,0,0,0.05)' }}>
          <Calendar size={32} style={{ color: 'var(--color-gr-primary)' }} className="mx-auto mb-3" />
          <p className="font-800 text-[var(--color-gr-text)] text-[15px]">
            Elegí ambas fechas para ver los resultados
          </p>
          <p className="text-[var(--color-gr-muted)] text-[13px] mt-1">
            La consulta se hará automáticamente cuando completes el rango.
          </p>
        </div>
      ) : cargasQ.isLoading ? (
        <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>
      ) : grupos.length === 0 ? (
        <div className="rounded-[14px] px-6 py-10 text-center"
          style={{ background: 'var(--color-gr-success-bg)', border: '1px solid rgba(46,125,82,0.15)' }}>
          <CheckCircle2 size={36} style={{ color: 'var(--color-gr-success)' }} className="mx-auto mb-3" />
          <p className="font-800 text-[var(--color-gr-text)] text-[16px]">
            {tab === 'pendientes' ? 'Sin deudas en el período' : 'Sin pagos en el período'}
          </p>
          <p className="text-[var(--color-gr-muted)] text-[13px] mt-1">
            Cambiá el filtro de fecha para ver otros registros.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {grupos.map(g => (
            <GrupoCard
              key={g.key}
              grupo={g}
              defaultOpen={tab === 'pendientes'}
              onSuccess={(msg) => toast(msg, 'success')}
              onError={(msg) => toast(msg, 'error')}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, color }: { label: string; value: string; color?: 'danger' | 'success' }) {
  const c = color === 'danger' ? 'var(--color-gr-danger)'
    : color === 'success' ? 'var(--color-gr-success)'
    : 'var(--color-gr-text)';
  return (
    <div className="card text-center">
      <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">{label}</p>
      <p className="text-[26px] font-900 leading-tight" style={{ color: c }}>{value}</p>
    </div>
  );
}

// ─── Card por movimiento/lote ────────────────────────────────
function GrupoCard({
  grupo, defaultOpen, onSuccess, onError,
}: {
  grupo: GrupoMovimiento;
  defaultOpen: boolean;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const pagarBulk = usePagarCargasBulk();
  const [confirmarLote, setConfirmarLote] = useState(false);
  const [open, setOpen] = useState(defaultOpen);

  const esVenta = grupo.origen === 'venta';
  const Icon    = esVenta ? Truck : Wheat;
  const iconBg  = esVenta ? 'var(--color-gr-info-bg)' : 'var(--color-gr-primary-lite)';
  const iconCol = esVenta ? 'var(--color-gr-info)'    : 'var(--color-gr-primary)';

  const titulo = esVenta
    ? `Despacho NV-${grupo.numeroReferencia ?? '?'}`
    : `Entrada MP · ${grupo.materiaPrimaNombre ?? '—'}`;
  const subtitulo = esVenta
    ? (grupo.clienteNombre ?? 'Sin cliente')
    : (grupo.numeroReferencia ? `Lote ${grupo.numeroReferencia}` : 'Sin lote');

  const idsPendientes = grupo.items.filter(i => !i.pagado).map(i => i.id);
  const totalPendiente = grupo.items.filter(i => !i.pagado).reduce((s, i) => s + Number(i.montoBs), 0);

  async function ejecutarPagoLote() {
    setConfirmarLote(false);
    try {
      const res = await pagarBulk.mutateAsync({ ids: idsPendientes });
      onSuccess(`Pago total de ${formatBs(res.totalBs)} — ${res.cantidadPagada} cargadores`);
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo pagar el lote'));
    }
  }

  return (
    <>
      <div className="card-no-pad overflow-hidden">
        {/* Header del lote (clickable para colapsar) */}
        <button
          onClick={() => setOpen(!open)}
          className="w-full px-5 py-3.5 border-b border-[var(--color-gr-border-lite)] flex items-center gap-4 text-left hover:brightness-98 transition"
          style={{ background: iconBg, borderBottomWidth: open ? '1px' : '0' }}
        >
          <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: iconCol }}>
            <Icon size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-900 text-[16px] text-[var(--color-gr-text)] leading-tight">{titulo}</p>
            <p className="text-[12.5px] text-[var(--color-gr-muted)] leading-tight mt-0.5">
              {subtitulo} · {grupo.fecha} · {grupo.items.length} cargador{grupo.items.length !== 1 ? 'es' : ''}
              {grupo.pagado && ' · pagado'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10.5px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wider">
              Total lote
            </p>
            <p className="font-900 text-[20px] leading-tight"
              style={{ color: grupo.pagado ? 'var(--color-gr-success)' : 'var(--color-gr-danger)' }}>
              {formatBs(grupo.totalBs)}
            </p>
          </div>
          <div className="shrink-0 ml-1">
            {open
              ? <ChevronUp size={20} className="text-[var(--color-gr-muted)]" />
              : <ChevronDown size={20} className="text-[var(--color-gr-muted)]" />}
          </div>
        </button>

        {open && (
          <>
            {/* Cabecera de filas */}
            <div className="hidden md:grid grid-cols-[minmax(180px,1fr)_140px_140px_150px_120px_44px] items-center gap-3 px-5 py-2.5 text-[11px] font-700 uppercase tracking-wider text-[var(--color-gr-muted)] border-b border-[var(--color-gr-border-lite)]"
              style={{ background: 'var(--color-gr-border-lite)' }}>
              <span>Cargador</span>
              <span className="text-center">Cantidad</span>
              <span className="text-right">Tarifa</span>
              <span className="text-right">Total</span>
              <span />
              <span />
            </div>

            {/* Filas */}
            {grupo.items.map(item => (
              <FilaCarga key={item.id} item={item} onSuccess={onSuccess} onError={onError} />
            ))}

            {/* Footer con pagar todo el lote — solo si quedan pendientes */}
            {idsPendientes.length > 1 && (
              <div className="px-5 py-3.5 flex items-center justify-end gap-3 border-t border-[var(--color-gr-border-lite)]"
                style={{ background: 'var(--color-gr-border-lite)' }}>
                <p className="text-[12.5px] text-[var(--color-gr-muted)]">
                  Pagar todo el lote a la vez:
                </p>
                <Btn onClick={() => setConfirmarLote(true)} loading={pagarBulk.isPending}>
                  <Wallet size={14} /> Pagar lote · {formatBs(totalPendiente)}
                </Btn>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        open={confirmarLote}
        onClose={() => setConfirmarLote(false)}
        onConfirm={ejecutarPagoLote}
        title={`Pagar ${idsPendientes.length} cargadores del lote`}
        message={`Se registrará un pago de ${formatBs(totalPendiente)} y quedará como gasto en categoría Mano de obra. ¿Confirmar?`}
      />
    </>
  );
}

// ─── Fila editable ───────────────────────────────────────────
function FilaCarga({
  item, onSuccess, onError,
}: {
  item: DeudaItem;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const update   = useUpdateCargaTrabajo();
  const pagarUna = usePagarCarga();
  const [editing, setEditing]   = useState(false);
  const [cantidad, setCantidad] = useState(Number(item.cantidad));
  const [tarifa, setTarifa]     = useState(Number(item.tarifaBs));
  const [confirmarPago, setConfirmarPago] = useState(false);

  const totalActual = Number(item.cantidad) * Number(item.tarifaBs);
  const totalEdit   = cantidad * tarifa;
  const esBolsa     = item.tipoPago === TipoPagoCarga.BOLSA;
  const unidad      = esBolsa ? 'bolsas' : 'día';

  async function guardar() {
    try {
      await update.mutateAsync({
        id: item.id,
        dto: { cantidad, tarifaBs: tarifa },
      });
      setEditing(false);
      onSuccess('Carga actualizada');
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo editar'));
    }
  }

  async function ejecutarPago() {
    setConfirmarPago(false);
    try {
      const res = await pagarUna.mutateAsync({ id: item.id });
      onSuccess(`Pago de ${formatBs(res.totalBs)} a ${item.cargadorNombre ?? 'cargador'} registrado`);
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo pagar'));
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(180px,1fr)_140px_140px_150px_120px_44px] items-center gap-3 px-5 py-3 text-[13.5px] border-b border-[var(--color-gr-border-lite)] last:border-b-0">
        <div className="min-w-0">
          <p className="font-800 text-[14.5px] text-[var(--color-gr-text)] truncate">
            {item.cargadorNombre ?? '—'}
          </p>
          <p className="text-[11.5px] text-[var(--color-gr-muted)]">
            {unidad}
            {item.pagado && item.fechaPago && (
              <> · <Calendar size={10} className="inline mr-0.5" />pagado {item.fechaPago}</>
            )}
          </p>
        </div>

        {editing ? (
          <>
            <Input type="number" min="0" step="0.01" value={cantidad}
              onChange={e => setCantidad(parseFloat(e.target.value) || 0)}
              className="text-center h-10 font-800 text-[15px]" />
            <Input type="number" min="0" step="0.01" value={tarifa}
              onChange={e => setTarifa(parseFloat(e.target.value) || 0)}
              className="text-right h-10 font-800 text-[15px]" />
            <p className="text-right font-900 text-[16px] text-[var(--color-gr-primary)]">
              {formatBs(totalEdit)}
            </p>
            <div className="flex gap-1.5 justify-end">
              <button onClick={guardar}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:opacity-90"
                style={{ background: 'var(--color-gr-success)' }}>
                <Check size={15} />
              </button>
              <button onClick={() => { setEditing(false); setCantidad(Number(item.cantidad)); setTarifa(Number(item.tarifaBs)); }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:opacity-90"
                style={{ background: 'var(--color-gr-muted)' }}>
                <X size={15} />
              </button>
            </div>
            <span />
          </>
        ) : (
          <>
            <p className="text-center font-800 text-[15px]">{formatNum(Number(item.cantidad), 2)}</p>
            <p className="text-right font-700 text-[14px]">{formatBs(Number(item.tarifaBs))}</p>
            <p className="text-right font-900 text-[16px]"
              style={{ color: item.pagado ? 'var(--color-gr-success)' : 'var(--color-gr-danger)' }}>
              {formatBs(totalActual)}
            </p>
            {item.pagado ? (
              <span className="inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-700"
                style={{ background: 'var(--color-gr-success-bg)', color: 'var(--color-gr-success)' }}>
                <CheckCircle2 size={12} /> Pagado
              </span>
            ) : (
              <Btn size="sm" variant="green" onClick={() => setConfirmarPago(true)} loading={pagarUna.isPending}>
                <Wallet size={12} /> Pagar
              </Btn>
            )}
            <div className="flex justify-center">
              {!item.pagado && (
                <button onClick={() => setEditing(true)}
                  title="Editar cantidad/tarifa"
                  className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-[var(--color-gr-border)] hover:bg-[var(--color-gr-border-lite)]">
                  <Pencil size={13} />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        open={confirmarPago}
        onClose={() => setConfirmarPago(false)}
        onConfirm={ejecutarPago}
        title={`Pagar a ${item.cargadorNombre ?? 'cargador'}`}
        message={`Se registrará un pago de ${formatBs(totalActual)} y quedará como gasto en categoría Mano de obra. ¿Confirmar?`}
      />
    </>
  );
}
