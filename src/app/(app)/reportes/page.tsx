'use client';
import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useVentas } from '@/lib/api/ventas';
import { useGastos } from '@/lib/api/gastos';
import { useKardexMP } from '@/lib/api/materia-prima';
import { useMateriasPrimas } from '@/lib/api/materia-prima';
import { useProductos } from '@/lib/api/productos';
import { CategoriaGasto, EstadoVenta, TipoMovimientoMP } from '@/lib/types';
import { formatBs, formatNum } from '@/lib/utils';
import { Badge, SearchBox, Spinner } from '@/components/ui';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, ShoppingCart, Boxes, Layers, ChevronDown, ChevronUp, Zap } from 'lucide-react';

type ReporteId = 'financiero' | 'ventas' | 'movimientos_mp' | 'stock';
type Periodo   = 'mes_actual' | 'mes_anterior';
type StockTab  = 'productos' | 'mp';

// ── Dynamic PDF imports ────────────────────────────────────────────────────
const ResumenFinancieroPDFLink = dynamic(
  () => import('@/components/pdf/ResumenFinancieroPDF').then(m => m.ResumenFinancieroPDFLink),
  { ssr: false, loading: () => <span className="text-[12px] text-[var(--color-gr-muted)]">…</span> },
);
const VentasPDFLink = dynamic(
  () => import('@/components/pdf/VentasPDF').then(m => m.VentasPDFLink),
  { ssr: false, loading: () => <span className="text-[12px] text-[var(--color-gr-muted)]">…</span> },
);
const MovimientosMPPDFLink = dynamic(
  () => import('@/components/pdf/MovimientosMPPDF').then(m => m.MovimientosMPPDFLink),
  { ssr: false, loading: () => <span className="text-[12px] text-[var(--color-gr-muted)]">…</span> },
);
const StockActualPDFLink = dynamic(
  () => import('@/components/pdf/StockActualPDF').then(m => m.StockActualPDFLink),
  { ssr: false, loading: () => <span className="text-[12px] text-[var(--color-gr-muted)]">…</span> },
);

const REPORT_CARDS: { id: ReporteId; Icon: React.ElementType; title: string; desc: string }[] = [
  { id: 'financiero',     Icon: TrendingUp,   title: 'Resumen Financiero',  desc: 'Ingresos, egresos, utilidad y margen del período' },
  { id: 'ventas',         Icon: ShoppingCart, title: 'Ventas por Período',   desc: 'Detalle de notas de venta con filtros por cliente y estado' },
  { id: 'movimientos_mp', Icon: Boxes,        title: 'Movimientos de MP',    desc: 'Entradas y salidas de materia prima con costos' },
  { id: 'stock',          Icon: Layers,       title: 'Stock Actual',         desc: 'Inventario completo de productos terminados y materia prima' },
];

function KPICard({ label, value, color }: { label: string; value: string; color: 'success' | 'danger' | 'warning' | 'primary' }) {
  const C = { success: 'var(--color-gr-success)', danger: 'var(--color-gr-danger)', warning: 'var(--color-gr-warning)', primary: 'var(--color-gr-primary)' };
  return (
    <div className="card text-center">
      <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide mb-2">{label}</p>
      <p className="text-[24px] font-900 leading-none" style={{ color: C[color] }}>{value}</p>
    </div>
  );
}

function PeriodoToggle({ value, onChange }: { value: Periodo; onChange: (p: Periodo) => void }) {
  return (
    <div className="flex rounded-[8px] overflow-hidden border border-[var(--color-gr-border)]">
      {(['mes_actual', 'mes_anterior'] as Periodo[]).map(p => (
        <button key={p} onClick={() => onChange(p)}
          className="px-3 py-1.5 text-[12px] font-600 transition-colors"
          style={value === p
            ? { background: 'var(--color-gr-primary)', color: '#fff' }
            : { background: '#fff', color: 'var(--color-gr-muted)' }}>
          {p === 'mes_actual' ? 'Este mes' : 'Mes anterior'}
        </button>
      ))}
    </div>
  );
}

function periodoKey(periodo: Periodo): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - (periodo === 'mes_actual' ? 0 : 1), 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function periodoLabel(periodo: Periodo): string {
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - (periodo === 'mes_actual' ? 0 : 1), 1);
  return `${meses[d.getMonth()][0].toUpperCase()}${meses[d.getMonth()].slice(1)} ${d.getFullYear()}`;
}

// ──────────────────────────────────────────────────────────────────────────
export default function ReportesPage() {
  const [activo, setActivo] = useState<ReporteId | null>(null);

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-[22px] font-900 text-[var(--color-gr-text)]">Reportes</h1>
        <p className="text-[var(--color-gr-muted)] text-[13.5px] mt-0.5">
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
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: isActive ? 'var(--color-gr-primary)' : 'var(--color-gr-border-lite)' }}>
                <Icon size={18} style={{ color: isActive ? '#fff' : 'var(--color-gr-primary)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-800 text-[var(--color-gr-text)] text-[14px]">{title}</p>
                <p className="text-[12.5px] text-[var(--color-gr-muted)] mt-0.5">{desc}</p>
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
    </div>
  );
}

// ── Report 1: Resumen Financiero ──────────────────────────────────────────
function ReporteFinanciero() {
  const [periodo, setPeriodo] = useState<Periodo>('mes_actual');
  const ventasQ = useVentas();
  const gastosQ = useGastos();

  const key = periodoKey(periodo);
  const ventas = ventasQ.data ?? [];
  const gastos = gastosQ.data ?? [];

  const ventasPeriodo = ventas.filter(v => v.fecha.startsWith(key));
  const gastosPeriodo = gastos.filter(g => g.fecha.startsWith(key));

  const ingresosBs = ventasPeriodo.reduce((s, v) => s + Number(v.totalBs), 0);
  const egresosBs  = gastosPeriodo.reduce((s, g) => s + Number(g.montoBs), 0);
  const utilidadBs = ingresosBs - egresosBs;
  const margenPct  = ingresosBs > 0 ? (utilidadBs / ingresosBs) * 100 : 0;
  const resumen = { ingresosBs, egresosBs, utilidadBs, margenPct };

  const LABELS: Record<string, string> = {
    [CategoriaGasto.MATERIA_PRIMA]:  'Materia Prima',
    [CategoriaGasto.TRANSPORTE]:     'Transporte/Flete',
    [CategoriaGasto.MANO_DE_OBRA]:   'Mano de Obra',
    [CategoriaGasto.MANTENIMIENTO]:  'Mantenimiento',
    [CategoriaGasto.SERVICIOS]:      'Servicios',
    [CategoriaGasto.ADMINISTRATIVO]: 'Administrativo',
    [CategoriaGasto.OTROS]:          'Otros',
  };
  const total = gastosPeriodo.reduce((s, g) => s + Number(g.montoBs), 0);
  const gastosCat = Object.entries(
    gastosPeriodo.reduce<Record<string, number>>((acc, g) => {
      acc[g.categoria] = (acc[g.categoria] || 0) + Number(g.montoBs);
      return acc;
    }, {}),
  )
    .map(([cat, monto]) => ({
      label: LABELS[cat] ?? cat,
      monto,
      pct: total > 0 ? (monto / total) * 100 : 0,
      esAutomatico: false,
    }))
    .sort((a, b) => b.monto - a.monto);

  const semanales = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'].map((sem, i) => {
    const d1 = i * 7 + 1; const d2 = d1 + 6;
    const inRange = (fecha: string) => {
      const day = parseInt(fecha.slice(8, 10));
      return fecha.startsWith(key) && day >= d1 && day <= d2;
    };
    return {
      sem,
      ingresos: ventasPeriodo.filter(v => inRange(v.fecha)).reduce((s, v) => s + Number(v.totalBs), 0),
      egresos:  gastosPeriodo.filter(g => inRange(g.fecha)).reduce((s, g) => s + Number(g.montoBs), 0),
    };
  });

  if (ventasQ.isLoading || gastosQ.isLoading) {
    return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-900 text-[16px] text-[var(--color-gr-text)]">Resumen Financiero</h2>
          <p className="text-[12.5px] text-[var(--color-gr-muted)]">{periodoLabel(periodo)}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <PeriodoToggle value={periodo} onChange={setPeriodo} />
          <ResumenFinancieroPDFLink data={{ resumen, gastosCat, semanales, periodo: periodoLabel(periodo) }} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard label="Ingresos" value={formatBs(resumen.ingresosBs)} color="success" />
        <KPICard label="Egresos"  value={formatBs(resumen.egresosBs)}  color="danger" />
        <KPICard label="Utilidad" value={formatBs(resumen.utilidadBs)} color={resumen.utilidadBs >= 0 ? 'success' : 'danger'} />
        <KPICard label="Margen"   value={`${resumen.margenPct.toFixed(1)}%`}
          color={resumen.margenPct >= 20 ? 'success' : resumen.margenPct >= 10 ? 'warning' : 'danger'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card-no-pad">
          <div className="px-5 py-3.5 border-b border-[var(--color-gr-border)]">
            <p className="font-800 text-[14px] text-[var(--color-gr-text)]">Ingresos vs Egresos por semana</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={semanales} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gr-border)" vertical={false} />
                <XAxis dataKey="sem" tick={{ fontSize: 11, fill: 'var(--color-gr-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-gr-muted)' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip formatter={(v) => [formatBs(v as number)]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="ingresos" name="Ingresos" fill="var(--color-gr-success)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="egresos"  name="Egresos"  fill="var(--color-gr-danger)"  radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-no-pad">
          <div className="px-5 py-3.5 border-b border-[var(--color-gr-border)]">
            <p className="font-800 text-[14px] text-[var(--color-gr-text)]">Egresos por categoría</p>
          </div>
          <div className="divide-y divide-[var(--color-gr-border-lite)]">
            {gastosCat.length === 0 && (
              <p className="px-5 py-6 text-[13px] text-[var(--color-gr-muted)] text-center">Sin egresos en el período</p>
            )}
            {gastosCat.map(cat => (
              <div key={cat.label} className="px-5 py-3 flex items-center gap-3">
                <span className="w-[13px] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-600 text-[var(--color-gr-text)]">{cat.label}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13.5px] font-700 text-[var(--color-gr-text)]">{formatBs(cat.monto)}</p>
                  <p className="text-[11px] text-[var(--color-gr-muted)]">{cat.pct.toFixed(1)}%</p>
                </div>
              </div>
            ))}
            <div className="px-5 py-3 flex items-center justify-between"
              style={{ background: 'var(--color-gr-border-lite)' }}>
              <span className="text-[13px] font-700 text-[var(--color-gr-text)]">Total egresos</span>
              <span className="font-900 text-[14px]" style={{ color: 'var(--color-gr-danger)' }}>
                {formatBs(total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Report 2: Ventas ──────────────────────────────────────────────────────
function ReporteVentas() {
  const ventasQ = useVentas();
  const ventas  = ventasQ.data ?? [];
  const [search, setSearch] = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  const clientes = useMemo(() => [...new Set(ventas.map(v => v.cliente?.nombre ?? '—'))].sort(), [ventas]);

  const filtered = useMemo(() => ventas.filter(v => {
    const nombre = v.cliente?.nombre ?? '—';
    if (filterCliente && nombre !== filterCliente) return false;
    if (filterEstado  && v.estado !== filterEstado) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        nombre.toLowerCase().includes(q) ||
        v.numeroNota.toString().includes(q) ||
        v.detalles.some(d => (d.producto?.nombre ?? '').toLowerCase().includes(q))
      );
    }
    return true;
  }), [ventas, search, filterCliente, filterEstado]);

  const totalFiltered = filtered.reduce((s, v) => s + Number(v.totalBs), 0);

  const ESTADO_COLORS: Record<string, 'green' | 'yellow' | 'blue' | 'red'> = {
    [EstadoVenta.ENTREGADA]: 'green',
    [EstadoVenta.DESPACHADA]: 'blue',
    [EstadoVenta.PENDIENTE]: 'yellow',
    [EstadoVenta.CANCELADA]: 'red',
  };
  const ESTADO_LABELS: Record<string, string> = {
    [EstadoVenta.ENTREGADA]: 'Entregada',
    [EstadoVenta.DESPACHADA]: 'Despachada',
    [EstadoVenta.PENDIENTE]: 'Pendiente',
    [EstadoVenta.CANCELADA]: 'Cancelada',
  };

  // Adaptador para PDF legacy shape
  const ventasLegacy = filtered.map(v => ({
    id: v.id,
    numero: v.numeroNota,
    fecha: v.fecha,
    clienteNombre: v.cliente?.nombre ?? '—',
    totalBs: Number(v.totalBs),
    estado: v.estado,
    detalles: v.detalles.map(d => ({
      productoNombre: d.producto?.nombre ?? '—',
      cantidad: Number(d.cantidad),
    })),
  }));

  if (ventasQ.isLoading) {
    return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-900 text-[16px] text-[var(--color-gr-text)]">Ventas por período</h2>
          <p className="text-[12.5px] text-[var(--color-gr-muted)]">
            {filtered.length} ventas · {formatBs(totalFiltered)}
          </p>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <VentasPDFLink data={{ ventas: ventasLegacy as any, total: totalFiltered }} />
      </div>

      <div className="card flex flex-wrap gap-3 py-3">
        <div className="flex-1 min-w-[180px]">
          <SearchBox value={search} onChange={setSearch} placeholder="Buscar nota, cliente, producto…" />
        </div>
        <select value={filterCliente} onChange={e => setFilterCliente(e.target.value)}
          className="border border-[var(--color-gr-border)] rounded-[8px] px-3 py-2 text-[13px] bg-white min-w-[160px]"
          style={{ color: 'var(--color-gr-text)' }}>
          <option value="">Todos los clientes</option>
          {clientes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
          className="border border-[var(--color-gr-border)] rounded-[8px] px-3 py-2 text-[13px] bg-white"
          style={{ color: 'var(--color-gr-text)' }}>
          <option value="">Todos los estados</option>
          <option value={EstadoVenta.PENDIENTE}>Pendiente</option>
          <option value={EstadoVenta.DESPACHADA}>Despachada</option>
          <option value={EstadoVenta.ENTREGADA}>Entregada</option>
          <option value={EstadoVenta.CANCELADA}>Cancelada</option>
        </select>
      </div>

      <div className="card-no-pad">
        <div className="hidden md:grid gap-3 px-5 py-3 text-[11px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide border-b border-[var(--color-gr-border)]"
          style={{ gridTemplateColumns: '60px 1fr 1.5fr 90px 90px 80px', background: 'var(--color-gr-border-lite)' }}>
          <span>N°</span>
          <span>Cliente</span>
          <span>Productos</span>
          <span className="text-right">Total</span>
          <span>Estado</span>
          <span>Fecha</span>
        </div>
        {filtered.map((v, i) => (
          <div key={v.id}
            className={`px-5 py-3.5 ${i < filtered.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}>
            <div className="md:hidden flex items-start justify-between gap-2">
              <div>
                <p className="font-700 text-[var(--color-gr-text)] text-[13.5px]">N°{v.numeroNota} · {v.cliente?.nombre ?? '—'}</p>
                <p className="text-[12px] text-[var(--color-gr-muted)] mt-0.5">
                  {v.detalles.map(d => d.producto?.nombre ?? '').join(', ')} · {v.fecha}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-800 text-[var(--color-gr-text)] text-[13.5px]">{formatBs(Number(v.totalBs))}</p>
                <Badge color={ESTADO_COLORS[v.estado] ?? 'gray'}>{ESTADO_LABELS[v.estado] ?? v.estado}</Badge>
              </div>
            </div>
            <div className="hidden md:grid gap-3 items-center"
              style={{ gridTemplateColumns: '60px 1fr 1.5fr 90px 90px 80px' }}>
              <span className="font-700 text-[var(--color-gr-text)] text-[13px]">N°{v.numeroNota}</span>
              <span className="text-[13px] text-[var(--color-gr-text)]">{v.cliente?.nombre ?? '—'}</span>
              <span className="text-[12.5px] text-[var(--color-gr-muted)] truncate">
                {v.detalles.map(d => `${d.producto?.nombre ?? ''} ×${Number(d.cantidad)}`).join(' · ')}
              </span>
              <span className="text-right font-700 text-[var(--color-gr-text)] text-[13.5px]">{formatBs(Number(v.totalBs))}</span>
              <Badge color={ESTADO_COLORS[v.estado] ?? 'gray'}>{ESTADO_LABELS[v.estado] ?? v.estado}</Badge>
              <span className="text-[12px] text-[var(--color-gr-muted)]">{v.fecha}</span>
            </div>
          </div>
        ))}
        <div className="px-5 py-3 flex items-center justify-between border-t border-[var(--color-gr-border)]"
          style={{ background: 'var(--color-gr-border-lite)' }}>
          <span className="text-[13px] text-[var(--color-gr-muted)]">{filtered.length} ventas</span>
          <span className="font-900 text-[14px] text-[var(--color-gr-primary)]">Total: {formatBs(totalFiltered)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Report 3: Movimientos MP ──────────────────────────────────────────────
function ReporteMovimientosMP() {
  const kardexQ = useKardexMP();
  const movs = kardexQ.data ?? [];
  const [filterMP, setFilterMP] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  const mpNames = useMemo(() => [...new Set(movs.map(m => m.materiaPrima?.nombre ?? '—'))].sort(), [movs]);

  const filtered = useMemo(() => movs.filter(m => {
    if (filterMP   && (m.materiaPrima?.nombre ?? '') !== filterMP) return false;
    if (filterTipo && m.tipoMovimiento !== filterTipo) return false;
    return true;
  }), [movs, filterMP, filterTipo]);

  const movsLegacy = filtered.map(m => ({
    id: m.id,
    fecha: m.fecha,
    mpNombre: m.materiaPrima?.nombre ?? '—',
    tipo: m.tipoMovimiento,
    totalQQ: Number(m.cantidadKg) / 46,
    costoBs: m.costoTotalBs != null ? Number(m.costoTotalBs) : null,
    lote: m.numeroLote ?? null,
    responsable: m.responsable?.nombre ?? '—',
  }));

  if (kardexQ.isLoading) {
    return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-900 text-[16px] text-[var(--color-gr-text)]">Movimientos de Materia Prima</h2>
          <p className="text-[12.5px] text-[var(--color-gr-muted)]">{filtered.length} registros</p>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <MovimientosMPPDFLink data={{ movimientos: movsLegacy as any }} />
      </div>

      <div className="card flex flex-wrap gap-3 py-3">
        <select value={filterMP} onChange={e => setFilterMP(e.target.value)}
          className="border border-[var(--color-gr-border)] rounded-[8px] px-3 py-2 text-[13px] bg-white flex-1 min-w-[180px]"
          style={{ color: 'var(--color-gr-text)' }}>
          <option value="">Todas las materias primas</option>
          {mpNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}
          className="border border-[var(--color-gr-border)] rounded-[8px] px-3 py-2 text-[13px] bg-white"
          style={{ color: 'var(--color-gr-text)' }}>
          <option value="">Todos los tipos</option>
          <option value={TipoMovimientoMP.INGRESO}>Ingreso</option>
          <option value={TipoMovimientoMP.SALIDA}>Salida</option>
          <option value={TipoMovimientoMP.AJUSTE}>Ajuste</option>
          <option value={TipoMovimientoMP.DEVOLUCION}>Devolución</option>
        </select>
      </div>

      <div className="card-no-pad">
        <div className="hidden md:grid gap-3 px-5 py-3 text-[11px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide border-b border-[var(--color-gr-border)]"
          style={{ gridTemplateColumns: '80px 1fr 90px 90px 60px 90px 1fr', background: 'var(--color-gr-border-lite)' }}>
          <span>Tipo</span>
          <span>Materia Prima</span>
          <span className="text-right">QQ</span>
          <span className="text-right">Costo Bs</span>
          <span className="text-right">Lote</span>
          <span>Fecha</span>
          <span>Responsable</span>
        </div>
        {filtered.map((m, i) => (
          <div key={m.id}
            className={`px-5 py-3.5 ${i < filtered.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}>
            <div className="md:hidden flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge color={m.tipoMovimiento === TipoMovimientoMP.INGRESO ? 'green' : 'red'}>
                    {m.tipoMovimiento === TipoMovimientoMP.INGRESO ? '↑ Ingreso' : '↓ Salida'}
                  </Badge>
                  <span className="font-600 text-[var(--color-gr-text)] text-[13px]">{m.materiaPrima?.nombre ?? '—'}</span>
                </div>
                <p className="text-[12px] text-[var(--color-gr-muted)]">
                  {m.fecha} · {m.responsable?.nombre ?? '—'}{m.numeroLote ? ` · Lote #${m.numeroLote}` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-800 text-[var(--color-gr-text)]">{formatNum(Number(m.cantidadKg) / 46, 2)} QQ</p>
                {m.costoTotalBs != null && <p className="text-[12px] text-[var(--color-gr-muted)]">{formatBs(Number(m.costoTotalBs))}</p>}
              </div>
            </div>
            <div className="hidden md:grid gap-3 items-center"
              style={{ gridTemplateColumns: '80px 1fr 90px 90px 60px 90px 1fr' }}>
              <Badge color={m.tipoMovimiento === TipoMovimientoMP.INGRESO ? 'green' : 'red'}>
                {m.tipoMovimiento === TipoMovimientoMP.INGRESO ? '↑ Ingreso' : '↓ Salida'}
              </Badge>
              <span className="font-700 text-[var(--color-gr-text)] text-[13px]">{m.materiaPrima?.nombre ?? '—'}</span>
              <span className="text-right font-700 text-[var(--color-gr-text)] text-[13.5px]">
                {formatNum(Number(m.cantidadKg) / 46, 2)}
              </span>
              <span className="text-right text-[13px] text-[var(--color-gr-text)]">
                {m.costoTotalBs != null ? formatBs(Number(m.costoTotalBs)) : '—'}
              </span>
              <span className="text-right text-[13px] text-[var(--color-gr-muted)]">
                {m.numeroLote ? `#${m.numeroLote}` : '—'}
              </span>
              <span className="text-[12px] text-[var(--color-gr-muted)]">{m.fecha}</span>
              <span className="text-[12.5px] text-[var(--color-gr-text)]">{m.responsable?.nombre ?? '—'}</span>
            </div>
          </div>
        ))}
        <div className="px-5 py-3 flex items-center justify-between border-t border-[var(--color-gr-border)]"
          style={{ background: 'var(--color-gr-border-lite)' }}>
          <span className="text-[13px] text-[var(--color-gr-muted)]">{filtered.length} movimientos</span>
          <span className="font-900 text-[13.5px] text-[var(--color-gr-primary)]">
            {formatNum(filtered.reduce((s, m) => s + Number(m.cantidadKg) / 46, 0), 2)} QQ totales
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Report 4: Stock Actual ────────────────────────────────────────────────
function ReporteStock() {
  const productosQ = useProductos();
  const mpQ        = useMateriasPrimas();
  const productos = productosQ.data ?? [];
  const materiaPrima = mpQ.data ?? [];
  const [tab, setTab] = useState<StockTab>('productos');

  if (productosQ.isLoading || mpQ.isLoading) {
    return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;
  }

  const productosLegacy = productos.map(p => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    kgPorBolsa: Number(p.pesoKgPorUnidad),
    bolsaEsQQ: false,
    precioUnitarioBs: Number(p.precioUnitarioBs),
    stockActual: Number(p.stockActual),
    stockMinimo: Number(p.stockMinimo),
  }));

  const mpLegacy = materiaPrima.map(m => ({
    id: m.id,
    nombre: m.nombre,
    unidad: m.unidadMedida?.codigo ?? 'KG',
    stockEntero: undefined,
    stockParChico: undefined,
    stockParGrande: undefined,
    stockTotal: Number(m.stockActualKg) / 46,
    stockMinimo: Number(m.stockMinimoKg) / 46,
  }));

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-900 text-[16px] text-[var(--color-gr-text)]">Stock Actual</h2>
          <p className="text-[12.5px] text-[var(--color-gr-muted)]">
            Inventario al {new Date().toLocaleDateString('es-BO')}
          </p>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <StockActualPDFLink data={{ productos: productosLegacy as any, materiaPrima: mpLegacy as any }} />
      </div>

      <div className="flex gap-1 rounded-[10px] p-1 border border-[var(--color-gr-border)] w-fit"
        style={{ background: 'var(--color-gr-border-lite)' }}>
        {(['productos', 'mp'] as StockTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-[8px] text-[12.5px] font-600 transition-colors"
            style={tab === t ? { background: 'var(--color-gr-primary)', color: '#fff' }
              : { color: 'var(--color-gr-muted)' }}>
            {t === 'productos' ? 'Productos' : 'Materia Prima'}
          </button>
        ))}
      </div>

      {tab === 'productos' && (
        <div className="card-no-pad">
          <div className="hidden md:grid gap-3 px-5 py-3 text-[11px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide border-b border-[var(--color-gr-border)]"
            style={{ gridTemplateColumns: '80px 1fr 90px 80px 80px 70px', background: 'var(--color-gr-border-lite)' }}>
            <span>Código</span><span>Producto</span><span className="text-right">Bolsas</span><span className="text-right">QQ equiv.</span><span className="text-right">Precio/u</span><span>Estado</span>
          </div>
          {productos.map((p, i) => {
            const stock = Number(p.stockActual);
            const min   = Number(p.stockMinimo);
            const qq    = stock * Number(p.pesoKgPorUnidad) / 46;
            const low   = stock < min;
            const warn  = !low && stock < min * 2;
            return (
              <div key={p.id}
                className={`px-5 py-3.5 ${i < productos.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}>
                <div className="md:hidden flex items-center justify-between gap-2">
                  <div>
                    <p className="font-700 text-[var(--color-gr-text)] text-[13.5px]">{p.nombre}</p>
                    <p className="text-[12px] text-[var(--color-gr-muted)]">
                      {p.codigo} · {formatNum(stock, 0)} · {formatNum(qq, 2)} QQ
                    </p>
                  </div>
                  <Badge color={low ? 'red' : warn ? 'yellow' : 'green'}>
                    {low ? 'Bajo' : warn ? 'Alerta' : 'OK'}
                  </Badge>
                </div>
                <div className="hidden md:grid gap-3 items-center"
                  style={{ gridTemplateColumns: '80px 1fr 90px 80px 80px 70px' }}>
                  <span className="text-[12px] font-600 text-[var(--color-gr-muted)]">{p.codigo}</span>
                  <span className="font-700 text-[var(--color-gr-text)] text-[13.5px]">{p.nombre}</span>
                  <span className="text-right font-900 text-[14px] text-[var(--color-gr-primary)]">
                    {formatNum(stock, 0)}
                  </span>
                  <span className="text-right font-700 text-[var(--color-gr-text)] text-[13px]">{formatNum(qq, 2)}</span>
                  <span className="text-right text-[13px] text-[var(--color-gr-text)]">{formatBs(Number(p.precioUnitarioBs))}</span>
                  <Badge color={low ? 'red' : warn ? 'yellow' : 'green'}>
                    {low ? 'Bajo' : warn ? 'Alerta' : 'OK'}
                  </Badge>
                </div>
              </div>
            );
          })}
          <div className="px-5 py-3 flex items-center justify-between border-t border-[var(--color-gr-border)]"
            style={{ background: 'var(--color-gr-border-lite)' }}>
            <span className="text-[13px] text-[var(--color-gr-muted)]">{productos.length} productos</span>
            <span className="font-900 text-[14px] text-[var(--color-gr-primary)]">
              {formatNum(productos.reduce((s, p) => s + Number(p.stockActual), 0), 0)} unidades totales
            </span>
          </div>
        </div>
      )}

      {tab === 'mp' && (
        <div className="card-no-pad">
          <div className="hidden md:grid gap-3 px-5 py-3 text-[11px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide border-b border-[var(--color-gr-border)]"
            style={{ gridTemplateColumns: '1fr 110px 110px 90px 80px', background: 'var(--color-gr-border-lite)' }}>
            <span>Materia Prima</span><span className="text-right">Stock (kg)</span><span className="text-right">Stock (QQ)</span><span className="text-right">Mínimo</span><span>Estado</span>
          </div>
          {materiaPrima.map((mp, i) => {
            const stockKg = Number(mp.stockActualKg);
            const minKg   = Number(mp.stockMinimoKg);
            const low     = minKg > 0 && stockKg < minKg;
            const warn    = !low && minKg > 0 && stockKg < minKg * 2;
            return (
              <div key={mp.id}
                className={`px-5 py-3.5 ${i < materiaPrima.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}>
                <div className="md:hidden flex items-center justify-between gap-2">
                  <div>
                    <p className="font-700 text-[var(--color-gr-text)] text-[13.5px]">{mp.nombre}</p>
                    <p className="text-[12px] text-[var(--color-gr-muted)]">{formatNum(stockKg, 1)} kg · {formatNum(stockKg / 46, 2)} QQ</p>
                  </div>
                  <Badge color={low ? 'red' : warn ? 'yellow' : 'green'}>
                    {low ? 'Bajo' : warn ? 'Alerta' : 'OK'}
                  </Badge>
                </div>
                <div className="hidden md:grid gap-3 items-center"
                  style={{ gridTemplateColumns: '1fr 110px 110px 90px 80px' }}>
                  <span className="font-700 text-[var(--color-gr-text)] text-[13.5px]">{mp.nombre}</span>
                  <span className="text-right font-900 text-[14px] text-[var(--color-gr-text)]">
                    {formatNum(stockKg, 1)}
                  </span>
                  <span className="text-right font-900 text-[14px] text-[var(--color-gr-primary)]">
                    {formatNum(stockKg / 46, 2)}
                  </span>
                  <span className="text-right text-[12.5px] text-[var(--color-gr-muted)]">{formatNum(minKg, 1)}</span>
                  <Badge color={low ? 'red' : warn ? 'yellow' : 'green'}>
                    {low ? 'Bajo' : warn ? 'Alerta' : 'OK'}
                  </Badge>
                </div>
              </div>
            );
          })}
          <div className="px-5 py-3 flex items-center justify-between border-t border-[var(--color-gr-border)]"
            style={{ background: 'var(--color-gr-border-lite)' }}>
            <span className="text-[13px] text-[var(--color-gr-muted)]">{materiaPrima.length} materias primas</span>
            <span className="font-900 text-[14px] text-[var(--color-gr-primary)]">
              {formatNum(materiaPrima.reduce((s, m) => s + Number(m.stockActualKg), 0), 1)} kg totales
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
