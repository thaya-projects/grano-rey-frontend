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
import { TrendingUp, ShoppingCart, Boxes, Layers, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';

type ReporteId      = 'financiero' | 'ventas' | 'movimientos_mp' | 'stock';
type AgrupacionTipo = 'semana' | 'mes' | 'año';
type StockTab       = 'productos' | 'mp';

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

const MESES      = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DIAS_SEM    = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

function getWeekBounds(anchor: Date): { start: string; end: string } {
  const d   = new Date(anchor);
  const day = d.getDay();
  const mon = new Date(d); mon.setDate(d.getDate() - ((day + 6) % 7));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmt = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  return { start: fmt(mon), end: fmt(sun) };
}

function navigateAnchor(anchor: Date, tipo: AgrupacionTipo, dir: -1 | 1): Date {
  const d = new Date(anchor);
  if      (tipo === 'semana') d.setDate(d.getDate() + dir * 7);
  else if (tipo === 'mes')   d.setMonth(d.getMonth() + dir);
  else                       d.setFullYear(d.getFullYear() + dir);
  return d;
}

function getPeriodLabel(anchor: Date, tipo: AgrupacionTipo): string {
  if (tipo === 'año') return String(anchor.getFullYear());
  if (tipo === 'mes') {
    const m = MESES[anchor.getMonth()];
    return `${m[0].toUpperCase()}${m.slice(1)} ${anchor.getFullYear()}`;
  }
  const { start, end } = getWeekBounds(anchor);
  const [,sm,sd] = start.split('-').map(Number);
  const [ey,em,ed] = end.split('-').map(Number);
  return `${sd} ${MESES[sm-1].slice(0,3)} – ${ed} ${MESES[em-1].slice(0,3)} ${ey}`;
}

function filterByPeriod<T extends { fecha: string }>(items: T[], anchor: Date, tipo: AgrupacionTipo): T[] {
  if (tipo === 'año') {
    const prefix = String(anchor.getFullYear());
    return items.filter(it => it.fecha.startsWith(prefix));
  }
  if (tipo === 'mes') {
    const prefix = `${anchor.getFullYear()}-${String(anchor.getMonth()+1).padStart(2,'0')}`;
    return items.filter(it => it.fecha.startsWith(prefix));
  }
  const { start, end } = getWeekBounds(anchor);
  return items.filter(it => it.fecha >= start && it.fecha <= end);
}

function buildChartData(
  ventas: { fecha: string; totalBs: string | number }[],
  gastos: { fecha: string; montoBs: string | number }[],
  anchor: Date,
  tipo: AgrupacionTipo,
): { label: string; ingresos: number; egresos: number }[] {
  if (tipo === 'semana') {
    const { start } = getWeekBounds(anchor);
    const [sy,sm,sd] = start.split('-').map(Number);
    return DIAS_SEM.map((label, i) => {
      const dt  = new Date(sy, sm-1, sd+i);
      const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
      return {
        label,
        ingresos: ventas.filter(v => v.fecha === key).reduce((s,v) => s + Number(v.totalBs), 0),
        egresos:  gastos.filter(g => g.fecha === key).reduce((s,g) => s + Number(g.montoBs), 0),
      };
    });
  }
  if (tipo === 'mes') {
    const prefix = `${anchor.getFullYear()}-${String(anchor.getMonth()+1).padStart(2,'0')}`;
    return ['Sem 1','Sem 2','Sem 3','Sem 4'].map((label, i) => {
      const d1 = i*7+1; const d2 = d1+6;
      return {
        label,
        ingresos: ventas.filter(v => v.fecha.startsWith(prefix) && +v.fecha.slice(8) >= d1 && +v.fecha.slice(8) <= d2).reduce((s,v) => s + Number(v.totalBs), 0),
        egresos:  gastos.filter(g => g.fecha.startsWith(prefix) && +g.fecha.slice(8) >= d1 && +g.fecha.slice(8) <= d2).reduce((s,g) => s + Number(g.montoBs), 0),
      };
    });
  }
  const year = anchor.getFullYear();
  return MESES_CORTO.map((label, i) => {
    const prefix = `${year}-${String(i+1).padStart(2,'0')}`;
    return {
      label,
      ingresos: ventas.filter(v => v.fecha.startsWith(prefix)).reduce((s,v) => s + Number(v.totalBs), 0),
      egresos:  gastos.filter(g => g.fecha.startsWith(prefix)).reduce((s,g) => s + Number(g.montoBs), 0),
    };
  });
}

function AgrupacionSelector({ tipo, setTipo, anchor, setAnchor }: {
  tipo: AgrupacionTipo; setTipo: (t: AgrupacionTipo) => void;
  anchor: Date; setAnchor: (d: Date) => void;
}) {
  const labels: Record<AgrupacionTipo, string> = { semana: 'Semana', mes: 'Mes', año: 'Año' };
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex rounded-[8px] overflow-hidden border border-[var(--color-gr-border)]">
        {(['semana','mes','año'] as AgrupacionTipo[]).map(t => (
          <button key={t} onClick={() => setTipo(t)}
            className="px-3 py-1.5 text-[12px] font-600 transition-colors"
            style={tipo === t
              ? { background: 'var(--color-gr-primary)', color: '#fff' }
              : { background: '#fff', color: 'var(--color-gr-muted)' }}>
            {labels[t]}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => setAnchor(navigateAnchor(anchor, tipo, -1))}
          className="w-7 h-7 flex items-center justify-center rounded-[6px] transition-colors hover:bg-[var(--color-gr-border-lite)]">
          <ChevronLeft size={14} color="var(--color-gr-muted)" />
        </button>
        <span className="text-[13px] font-700 text-[var(--color-gr-text)] min-w-[160px] text-center">
          {getPeriodLabel(anchor, tipo)}
        </span>
        <button onClick={() => setAnchor(navigateAnchor(anchor, tipo, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-[6px] transition-colors hover:bg-[var(--color-gr-border-lite)]">
          <ChevronRight size={14} color="var(--color-gr-muted)" />
        </button>
      </div>
    </div>
  );
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
  const [tipo, setTipo]     = useState<AgrupacionTipo>('mes');
  const [anchor, setAnchor] = useState(() => new Date());
  const ventasQ = useVentas();
  const gastosQ = useGastos();

  const ventas = ventasQ.data ?? [];
  const gastos = gastosQ.data ?? [];

  const ventasPeriodo = filterByPeriod(ventas, anchor, tipo);
  const gastosPeriodo = filterByPeriod(gastos, anchor, tipo);

  const ingresosBs = ventasPeriodo.reduce((s, v) => s + Number(v.totalBs), 0);
  const egresosBs  = gastosPeriodo.reduce((s, g) => s + Number(g.montoBs), 0);
  const utilidadBs = ingresosBs - egresosBs;
  const margenPct  = ingresosBs > 0 ? (utilidadBs / ingresosBs) * 100 : 0;
  const resumen    = { ingresosBs, egresosBs, utilidadBs, margenPct };

  const LABELS: Record<string, string> = {
    [CategoriaGasto.MATERIA_PRIMA]:  'Materia Prima',
    [CategoriaGasto.TRANSPORTE]:     'Transporte/Flete',
    [CategoriaGasto.MANO_DE_OBRA]:   'Mano de Obra',
    [CategoriaGasto.MANTENIMIENTO]:  'Mantenimiento',
    [CategoriaGasto.SERVICIOS]:      'Servicios',
    [CategoriaGasto.ADMINISTRATIVO]: 'Administrativo',
    [CategoriaGasto.OTROS]:          'Otros',
  };
  const totalEgresos = gastosPeriodo.reduce((s, g) => s + Number(g.montoBs), 0);
  const gastosCat = Object.entries(
    gastosPeriodo.reduce<Record<string, number>>((acc, g) => {
      acc[g.categoria] = (acc[g.categoria] || 0) + Number(g.montoBs);
      return acc;
    }, {}),
  )
    .map(([cat, monto]) => ({
      label: LABELS[cat] ?? cat,
      monto,
      pct: totalEgresos > 0 ? (monto / totalEgresos) * 100 : 0,
      esAutomatico: false,
    }))
    .sort((a, b) => b.monto - a.monto);

  const chartData  = buildChartData(ventas, gastos, anchor, tipo);
  const semanales  = chartData.map(d => ({ sem: d.label, ingresos: d.ingresos, egresos: d.egresos }));
  const chartLabel = tipo === 'semana' ? 'por día' : tipo === 'mes' ? 'por semana' : 'por mes';

  if (ventasQ.isLoading || gastosQ.isLoading) {
    return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-900 text-[16px] text-[var(--color-gr-text)]">Resumen Financiero</h2>
          <p className="text-[12.5px] text-[var(--color-gr-muted)]">{getPeriodLabel(anchor, tipo)}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <AgrupacionSelector tipo={tipo} setTipo={setTipo} anchor={anchor} setAnchor={setAnchor} />
          <ResumenFinancieroPDFLink data={{ resumen, gastosCat, semanales, periodo: getPeriodLabel(anchor, tipo) }} />
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
            <p className="font-800 text-[14px] text-[var(--color-gr-text)]">Ingresos vs Egresos {chartLabel}</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gr-border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-gr-muted)' }} axisLine={false} tickLine={false} />
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
                {formatBs(totalEgresos)}
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
  const [search, setSearch]           = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [filterEstado, setFilterEstado]   = useState('');

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

  // Top clientes por monto total
  const topClientes = useMemo(() => {
    const acc: Record<string, { nombre: string; total: number; pedidos: number }> = {};
    filtered.forEach(v => {
      const id     = v.cliente?.id ?? 'sin';
      const nombre = v.cliente?.nombre ?? 'Sin cliente';
      if (!acc[id]) acc[id] = { nombre, total: 0, pedidos: 0 };
      acc[id].total   += Number(v.totalBs);
      acc[id].pedidos += 1;
    });
    return Object.values(acc).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [filtered]);

  const maxTotal = topClientes[0]?.total ?? 1;

  const ESTADO_COLORS: Record<string, 'green' | 'yellow' | 'blue' | 'red'> = {
    [EstadoVenta.ENTREGADA]:  'green',
    [EstadoVenta.DESPACHADA]: 'blue',
    [EstadoVenta.PENDIENTE]:  'yellow',
    [EstadoVenta.CANCELADA]:  'red',
  };
  const ESTADO_LABELS: Record<string, string> = {
    [EstadoVenta.ENTREGADA]:  'Entregada',
    [EstadoVenta.DESPACHADA]: 'Despachada',
    [EstadoVenta.PENDIENTE]:  'Pendiente',
    [EstadoVenta.CANCELADA]:  'Cancelada',
  };

  const ventasLegacy = filtered.map(v => ({
    id: v.id, numero: v.numeroNota, fecha: v.fecha,
    clienteNombre: v.cliente?.nombre ?? '—',
    totalBs: Number(v.totalBs), estado: v.estado,
    detalles: v.detalles.map(d => ({ productoNombre: d.producto?.nombre ?? '—', cantidad: Number(d.cantidad) })),
  }));

  const MEDALS = ['🥇','🥈','🥉'];

  if (ventasQ.isLoading) {
    return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-900 text-[16px] text-gr-text">Ventas</h2>
          <p className="text-[12.5px] text-gr-muted">{filtered.length} ventas · {formatBs(totalFiltered)}</p>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <VentasPDFLink data={{ ventas: ventasLegacy as any, total: totalFiltered }} />
      </div>

      {/* Top clientes */}
      {topClientes.length > 0 && (
        <div className="card-no-pad">
          <div className="px-5 py-3.5 border-b border-gr-border flex items-center gap-2">
            <Trophy size={15} color="var(--color-gr-gold)" />
            <p className="font-800 text-[14px] text-gr-text">Top clientes</p>
            <span className="text-[12px] text-gr-muted ml-1">por monto total en la selección actual</span>
          </div>
          <div className="divide-y divide-gr-border-lite">
            {topClientes.map((c, i) => (
              <div key={c.nombre} className="px-5 py-3 flex items-center gap-3">
                <span className="text-[18px] w-7 shrink-0">{MEDALS[i] ?? `${i+1}.`}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-700 text-[13.5px] text-gr-text truncate">{c.nombre}</p>
                  <div className="mt-1 h-1.5 rounded-full bg-gr-border-lite overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${(c.total / maxTotal) * 100}%`,
                      background: i === 0 ? 'var(--color-gr-gold)' : 'var(--color-gr-primary)',
                    }} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-800 text-[14px] text-gr-text">{formatBs(c.total)}</p>
                  <p className="text-[11.5px] text-gr-muted">{c.pedidos} {c.pedidos === 1 ? 'pedido' : 'pedidos'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="card flex flex-wrap gap-3 py-3">
        <div className="flex-1 min-w-[180px]">
          <SearchBox value={search} onChange={setSearch} placeholder="Buscar nota, cliente, producto…" />
        </div>
        <select value={filterCliente} onChange={e => setFilterCliente(e.target.value)}
          className="border border-gr-border rounded-[8px] px-3 py-2 text-[13px] bg-white min-w-[160px]"
          style={{ color: 'var(--color-gr-text)' }}>
          <option value="">Todos los clientes</option>
          {clientes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
          className="border border-gr-border rounded-[8px] px-3 py-2 text-[13px] bg-white"
          style={{ color: 'var(--color-gr-text)' }}>
          <option value="">Todos los estados</option>
          <option value={EstadoVenta.PENDIENTE}>Pendiente</option>
          <option value={EstadoVenta.DESPACHADA}>Despachada</option>
          <option value={EstadoVenta.ENTREGADA}>Entregada</option>
          <option value={EstadoVenta.CANCELADA}>Cancelada</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="card-no-pad">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse" style={{ minWidth: 580 }}>
            <thead>
              <tr style={{ background: 'var(--color-gr-border-lite)' }}>
                {['N°', 'Cliente', 'Productos', 'Total', 'Estado', 'Fecha'].map(h => (
                  <th key={h} className="px-4 py-3 text-[11px] font-700 text-gr-muted uppercase tracking-wide text-left whitespace-nowrap border-b border-gr-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <tr key={v.id} style={{ background: i % 2 ? 'var(--color-gr-border-lite)' : '#fff' }}
                  className="border-b border-gr-border-lite">
                  <td className="px-4 py-3 font-700 text-gr-primary whitespace-nowrap">N°{v.numeroNota}</td>
                  <td className="px-4 py-3 font-700 whitespace-nowrap">{v.cliente?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-gr-muted text-[12px]">
                    {v.detalles.map(d => `${d.producto?.nombre ?? ''} ×${Number(d.cantidad)}`).join(' · ')}
                  </td>
                  <td className="px-4 py-3 text-right font-700 whitespace-nowrap">{formatBs(Number(v.totalBs))}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge color={ESTADO_COLORS[v.estado] ?? 'gray'}>{ESTADO_LABELS[v.estado] ?? v.estado}</Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gr-muted">{v.fecha}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--color-gr-border-lite)', borderTop: '2px solid var(--color-gr-border)' }}>
                <td colSpan={3} className="px-4 py-3 text-[12.5px] text-gr-muted">{filtered.length} ventas</td>
                <td colSpan={3} className="px-4 py-3 text-right font-900 text-[14px] text-gr-primary">
                  Total: {formatBs(totalFiltered)}
                </td>
              </tr>
            </tfoot>
          </table>
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
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse" style={{ minWidth: 660 }}>
            <thead>
              <tr style={{ background: 'var(--color-gr-border-lite)' }}>
                {['Tipo', 'Materia Prima', 'QQ', 'Costo Bs', 'Lote', 'Fecha', 'Responsable'].map(h => (
                  <th key={h} className="px-4 py-3 text-[11px] font-700 text-gr-muted uppercase tracking-wide text-left whitespace-nowrap border-b border-gr-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} style={{ background: i % 2 ? 'var(--color-gr-border-lite)' : '#fff' }}
                  className="border-b border-gr-border-lite">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge color={m.tipoMovimiento === TipoMovimientoMP.INGRESO ? 'green' : 'red'}>
                      {m.tipoMovimiento === TipoMovimientoMP.INGRESO ? '↑ Ingreso' : '↓ Salida'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-700 whitespace-nowrap">{m.materiaPrima?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-700">{formatNum(Number(m.cantidadKg) / 46, 2)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">{m.costoTotalBs != null ? formatBs(Number(m.costoTotalBs)) : '—'}</td>
                  <td className="px-4 py-3 text-right text-gr-muted">{m.numeroLote ? `#${m.numeroLote}` : '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gr-muted">{m.fecha}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{m.responsable?.nombre ?? '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--color-gr-border-lite)', borderTop: '2px solid var(--color-gr-border)' }}>
                <td colSpan={2} className="px-4 py-3 text-[12.5px] text-gr-muted">{filtered.length} movimientos</td>
                <td colSpan={5} className="px-4 py-3 text-right font-900 text-[13.5px] text-gr-primary">
                  {formatNum(filtered.reduce((s, m) => s + Number(m.cantidadKg) / 46, 0), 2)} QQ totales
                </td>
              </tr>
            </tfoot>
          </table>
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
          <div className="overflow-x-auto">
          <div style={{ minWidth: 540 }}>
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
          </div>
        </div>
      )}

      {tab === 'mp' && (
        <div className="card-no-pad">
          <div className="overflow-x-auto">
          <div style={{ minWidth: 490 }}>
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
          </div>
        </div>
      )}
    </div>
  );
}
