'use client';
import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  ventas, movimientosMP, materiaPrima, productos,
  resumenFinanciero, gastosPorCategoria, ventasPorSemana,
} from '@/lib/mock';
import { formatBs, formatNum } from '@/lib/utils';
import { Badge, SearchBox } from '@/components/ui';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, ShoppingCart, Boxes, Layers, ChevronDown, ChevronUp, Zap } from 'lucide-react';

type ReporteId = 'financiero' | 'ventas' | 'movimientos_mp' | 'stock';
type Periodo   = 'mes_actual' | 'mes_anterior';
type StockTab  = 'productos' | 'mp';

// ── Dynamic PDF imports ───────────────────────────────────────────────────────
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

// ── Report card definitions ───────────────────────────────────────────────────
const REPORT_CARDS: { id: ReporteId; Icon: React.ElementType; title: string; desc: string }[] = [
  { id: 'financiero',     Icon: TrendingUp,  title: 'Resumen Financiero',      desc: 'Ingresos, egresos, utilidad y margen del período' },
  { id: 'ventas',         Icon: ShoppingCart, title: 'Ventas por Período',     desc: 'Detalle de notas de venta con filtros por cliente y estado' },
  { id: 'movimientos_mp', Icon: Boxes,        title: 'Movimientos de MP',      desc: 'Entradas y salidas de materia prima con costos' },
  { id: 'stock',          Icon: Layers,       title: 'Stock Actual',           desc: 'Inventario completo de productos terminados y materia prima' },
];

// ── KPI card ──────────────────────────────────────────────────────────────────
function KPICard({ label, value, color }: { label: string; value: string; color: 'success' | 'danger' | 'warning' | 'primary' }) {
  const C = { success: 'var(--color-gr-success)', danger: 'var(--color-gr-danger)', warning: 'var(--color-gr-warning)', primary: 'var(--color-gr-primary)' };
  return (
    <div className="card text-center">
      <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide mb-2">{label}</p>
      <p className="text-[24px] font-900 leading-none" style={{ color: C[color] }}>{value}</p>
    </div>
  );
}

// ── Periodo toggle ────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
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

      {/* 2×2 card grid */}
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

      {/* Expanded report sections */}
      {activo === 'financiero'     && <ReporteFinanciero />}
      {activo === 'ventas'         && <ReporteVentas />}
      {activo === 'movimientos_mp' && <ReporteMovimientosMP />}
      {activo === 'stock'          && <ReporteStock />}
    </div>
  );
}

// ── Report 1: Resumen Financiero ─────────────────────────────────────────────
function ReporteFinanciero() {
  const [periodo, setPeriodo] = useState<Periodo>('mes_actual');
  const resumen    = resumenFinanciero(periodo);
  const gastosCat  = gastosPorCategoria(periodo);
  const semanales  = ventasPorSemana(periodo);
  const periodoLabel = periodo === 'mes_actual' ? 'Mayo 2026' : 'Abril 2026';

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-900 text-[16px] text-[var(--color-gr-text)]">Resumen Financiero</h2>
          <p className="text-[12.5px] text-[var(--color-gr-muted)]">{periodoLabel}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <PeriodoToggle value={periodo} onChange={setPeriodo} />
          <ResumenFinancieroPDFLink data={{ resumen, gastosCat, semanales, periodo }} />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard label="Ingresos"     value={formatBs(resumen.ingresosBs)}  color="success" />
        <KPICard label="Egresos"      value={formatBs(resumen.egresosBs)}   color="danger" />
        <KPICard label="Utilidad"     value={formatBs(resumen.utilidadBs)}  color={resumen.utilidadBs >= 0 ? 'success' : 'danger'} />
        <KPICard label="Margen"       value={`${resumen.margenPct.toFixed(1)}%`}
          color={resumen.margenPct >= 20 ? 'success' : resumen.margenPct >= 10 ? 'warning' : 'danger'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Weekly bar chart */}
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

        {/* Expense breakdown */}
        <div className="card-no-pad">
          <div className="px-5 py-3.5 border-b border-[var(--color-gr-border)]">
            <p className="font-800 text-[14px] text-[var(--color-gr-text)]">Egresos por categoría</p>
            <p className="text-[11.5px] text-[var(--color-gr-muted)] mt-0.5">
              <Zap size={10} className="inline mr-1" style={{ color: 'var(--color-gr-gold)' }} />
              = registrado automáticamente
            </p>
          </div>
          <div className="divide-y divide-[var(--color-gr-border-lite)]">
            {gastosCat.map(cat => (
              <div key={cat.label} className="px-5 py-3 flex items-center gap-3">
                {cat.esAutomatico
                  ? <Zap size={13} style={{ color: 'var(--color-gr-gold)' }} className="shrink-0" />
                  : <span className="w-[13px] shrink-0" />}
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
                {formatBs(gastosCat.reduce((s, c) => s + c.monto, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Report 2: Ventas por período ─────────────────────────────────────────────
function ReporteVentas() {
  const [search, setSearch]             = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [filterEstado, setFilterEstado]   = useState('');

  const clientes = useMemo(() => [...new Set(ventas.map(v => v.clienteNombre))].sort(), []);

  const filtered = useMemo(() => ventas.filter(v => {
    if (filterCliente && v.clienteNombre !== filterCliente) return false;
    if (filterEstado  && v.estado        !== filterEstado)  return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        v.clienteNombre.toLowerCase().includes(q) ||
        v.numero.toString().includes(q) ||
        v.detalles.some(d => d.productoNombre.toLowerCase().includes(q))
      );
    }
    return true;
  }), [search, filterCliente, filterEstado]);

  const totalFiltered = filtered.reduce((s, v) => s + v.totalBs, 0);

  const ESTADO_COLORS: Record<string, 'green' | 'yellow' | 'blue' | 'red'> = {
    entregado: 'green', despachado: 'blue', pendiente: 'yellow', cancelado: 'red',
  };
  const ESTADO_LABELS: Record<string, string> = {
    entregado: 'Entregado', despachado: 'Despachado', pendiente: 'Pendiente', cancelado: 'Cancelado',
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-900 text-[16px] text-[var(--color-gr-text)]">Ventas por período</h2>
          <p className="text-[12.5px] text-[var(--color-gr-muted)]">
            {filtered.length} ventas · {formatBs(totalFiltered)}
          </p>
        </div>
        <VentasPDFLink data={{ ventas: filtered, total: totalFiltered }} />
      </div>

      {/* Filters */}
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
          <option value="pendiente">Pendiente</option>
          <option value="despachado">Despachado</option>
          <option value="entregado">Entregado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {/* Table */}
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
            {/* Mobile */}
            <div className="md:hidden flex items-start justify-between gap-2">
              <div>
                <p className="font-700 text-[var(--color-gr-text)] text-[13.5px]">N°{v.numero} · {v.clienteNombre}</p>
                <p className="text-[12px] text-[var(--color-gr-muted)] mt-0.5">
                  {v.detalles.map(d => d.productoNombre).join(', ')} · {v.fecha}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-800 text-[var(--color-gr-text)] text-[13.5px]">{formatBs(v.totalBs)}</p>
                <Badge color={ESTADO_COLORS[v.estado]}>{ESTADO_LABELS[v.estado]}</Badge>
              </div>
            </div>
            {/* Desktop */}
            <div className="hidden md:grid gap-3 items-center"
              style={{ gridTemplateColumns: '60px 1fr 1.5fr 90px 90px 80px' }}>
              <span className="font-700 text-[var(--color-gr-text)] text-[13px]">N°{v.numero}</span>
              <span className="text-[13px] text-[var(--color-gr-text)]">{v.clienteNombre}</span>
              <span className="text-[12.5px] text-[var(--color-gr-muted)] truncate">
                {v.detalles.map(d => `${d.productoNombre} ×${d.cantidad}`).join(' · ')}
              </span>
              <span className="text-right font-700 text-[var(--color-gr-text)] text-[13.5px]">{formatBs(v.totalBs)}</span>
              <Badge color={ESTADO_COLORS[v.estado]}>{ESTADO_LABELS[v.estado]}</Badge>
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

// ── Report 3: Movimientos MP ─────────────────────────────────────────────────
function ReporteMovimientosMP() {
  const [filterMP,   setFilterMP]   = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  const mpNames = useMemo(() => [...new Set(movimientosMP.map(m => m.mpNombre))].sort(), []);

  const filtered = useMemo(() => movimientosMP.filter(m => {
    if (filterMP   && m.mpNombre !== filterMP)   return false;
    if (filterTipo && m.tipo     !== filterTipo) return false;
    return true;
  }), [filterMP, filterTipo]);

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-900 text-[16px] text-[var(--color-gr-text)]">Movimientos de Materia Prima</h2>
          <p className="text-[12.5px] text-[var(--color-gr-muted)]">{filtered.length} registros</p>
        </div>
        <MovimientosMPPDFLink data={{ movimientos: filtered }} />
      </div>

      {/* Filters */}
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
          <option value="ingreso">Ingreso</option>
          <option value="salida">Salida</option>
        </select>
      </div>

      {/* Table */}
      <div className="card-no-pad">
        <div className="hidden md:grid gap-3 px-5 py-3 text-[11px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide border-b border-[var(--color-gr-border)]"
          style={{ gridTemplateColumns: '80px 1fr 80px 80px 50px 80px 1fr', background: 'var(--color-gr-border-lite)' }}>
          <span>Tipo</span>
          <span>Materia Prima</span>
          <span className="text-right">Total QQ</span>
          <span className="text-right">Costo Bs</span>
          <span className="text-right">Lote</span>
          <span>Fecha</span>
          <span>Responsable</span>
        </div>
        {filtered.map((m, i) => (
          <div key={m.id}
            className={`px-5 py-3.5 ${i < filtered.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}>
            {/* Mobile */}
            <div className="md:hidden flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge color={m.tipo === 'ingreso' ? 'green' : 'red'}>
                    {m.tipo === 'ingreso' ? '↑ Ingreso' : '↓ Salida'}
                  </Badge>
                  <span className="font-600 text-[var(--color-gr-text)] text-[13px]">{m.mpNombre}</span>
                </div>
                <p className="text-[12px] text-[var(--color-gr-muted)]">
                  {m.fecha} · {m.responsable}{m.lote ? ` · Lote #${m.lote}` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-800 text-[var(--color-gr-text)]">{formatNum(m.totalQQ, 1)} QQ</p>
                {m.costoBs != null && <p className="text-[12px] text-[var(--color-gr-muted)]">{formatBs(m.costoBs)}</p>}
              </div>
            </div>
            {/* Desktop */}
            <div className="hidden md:grid gap-3 items-center"
              style={{ gridTemplateColumns: '80px 1fr 80px 80px 50px 80px 1fr' }}>
              <Badge color={m.tipo === 'ingreso' ? 'green' : 'red'}>
                {m.tipo === 'ingreso' ? '↑ Ingreso' : '↓ Salida'}
              </Badge>
              <span className="font-700 text-[var(--color-gr-text)] text-[13px]">{m.mpNombre}</span>
              <span className="text-right font-700 text-[var(--color-gr-text)] text-[13.5px]">
                {formatNum(m.totalQQ, 1)}
              </span>
              <span className="text-right text-[13px] text-[var(--color-gr-text)]">
                {m.costoBs != null ? formatBs(m.costoBs) : '—'}
              </span>
              <span className="text-right text-[13px] text-[var(--color-gr-muted)]">
                {m.lote ? `#${m.lote}` : '—'}
              </span>
              <span className="text-[12px] text-[var(--color-gr-muted)]">{m.fecha}</span>
              <span className="text-[12.5px] text-[var(--color-gr-text)]">{m.responsable}</span>
            </div>
          </div>
        ))}
        <div className="px-5 py-3 flex items-center justify-between border-t border-[var(--color-gr-border)]"
          style={{ background: 'var(--color-gr-border-lite)' }}>
          <span className="text-[13px] text-[var(--color-gr-muted)]">{filtered.length} movimientos</span>
          <span className="font-900 text-[13.5px] text-[var(--color-gr-primary)]">
            {formatNum(filtered.reduce((s, m) => s + m.totalQQ, 0), 1)} QQ totales
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Report 4: Stock Actual ───────────────────────────────────────────────────
function ReporteStock() {
  const [tab, setTab] = useState<StockTab>('productos');

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-900 text-[16px] text-[var(--color-gr-text)]">Stock Actual</h2>
          <p className="text-[12.5px] text-[var(--color-gr-muted)]">
            Inventario al 9 de mayo de 2026
          </p>
        </div>
        <StockActualPDFLink data={{ productos, materiaPrima }} />
      </div>

      {/* Tabs */}
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
            <span>Código</span>
            <span>Producto</span>
            <span className="text-right">Bolsas</span>
            <span className="text-right">QQ equiv.</span>
            <span className="text-right">Precio/bol</span>
            <span>Estado</span>
          </div>
          {productos.map((p, i) => {
            const qq  = p.stockActual * p.kgPorBolsa / 46;
            const low = p.stockActual < p.stockMinimo;
            const warn = !low && p.stockActual < p.stockMinimo * 2;
            return (
              <div key={p.id}
                className={`px-5 py-3.5 ${i < productos.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}>
                <div className="md:hidden flex items-center justify-between gap-2">
                  <div>
                    <p className="font-700 text-[var(--color-gr-text)] text-[13.5px]">{p.nombre}</p>
                    <p className="text-[12px] text-[var(--color-gr-muted)]">
                      {p.codigo} · {formatNum(p.stockActual, 0)} bol · {formatNum(qq, 1)} QQ
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
                    {formatNum(p.stockActual, 0)}
                  </span>
                  <span className="text-right font-700 text-[var(--color-gr-text)] text-[13px]">{formatNum(qq, 1)}</span>
                  <span className="text-right text-[13px] text-[var(--color-gr-text)]">{formatBs(p.precioUnitarioBs)}</span>
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
              {formatNum(productos.reduce((s, p) => s + p.stockActual, 0), 0)} bolsas totales
            </span>
          </div>
        </div>
      )}

      {tab === 'mp' && (
        <div className="card-no-pad">
          <div className="hidden md:grid gap-3 px-5 py-3 text-[11px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide border-b border-[var(--color-gr-border)]"
            style={{ gridTemplateColumns: '1fr 80px 80px 80px 80px 70px 80px', background: 'var(--color-gr-border-lite)' }}>
            <span>Materia Prima</span>
            <span className="text-right">QQ Entero</span>
            <span className="text-right">QQ P.Chico</span>
            <span className="text-right">QQ P.Grande</span>
            <span className="text-right">Total QQ</span>
            <span className="text-right">Unidad</span>
            <span>Estado</span>
          </div>
          {materiaPrima.map((mp, i) => {
            const low  = mp.stockMinimo > 0 && mp.stockTotal < mp.stockMinimo;
            const warn = !low && mp.stockMinimo > 0 && mp.stockTotal < mp.stockMinimo * 2;
            const has  = mp.stockEntero !== undefined;
            return (
              <div key={mp.id}
                className={`px-5 py-3.5 ${i < materiaPrima.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}>
                <div className="md:hidden flex items-center justify-between gap-2">
                  <div>
                    <p className="font-700 text-[var(--color-gr-text)] text-[13.5px]">{mp.nombre}</p>
                    <p className="text-[12px] text-[var(--color-gr-muted)]">{formatNum(mp.stockTotal, 1)} {mp.unidad}</p>
                  </div>
                  <Badge color={low ? 'red' : warn ? 'yellow' : 'green'}>
                    {low ? 'Bajo' : warn ? 'Alerta' : 'OK'}
                  </Badge>
                </div>
                <div className="hidden md:grid gap-3 items-center"
                  style={{ gridTemplateColumns: '1fr 80px 80px 80px 80px 70px 80px' }}>
                  <span className="font-700 text-[var(--color-gr-text)] text-[13.5px]">{mp.nombre}</span>
                  <span className="text-right text-[13px] font-600 text-[var(--color-gr-text)]">
                    {has ? formatNum(mp.stockEntero || 0, 1) : '—'}
                  </span>
                  <span className="text-right text-[13px] font-600 text-[var(--color-gr-text)]">
                    {has ? formatNum(mp.stockParChico || 0, 1) : '—'}
                  </span>
                  <span className="text-right text-[13px] font-600 text-[var(--color-gr-text)]">
                    {has ? formatNum(mp.stockParGrande || 0, 1) : '—'}
                  </span>
                  <span className="text-right font-900 text-[14px] text-[var(--color-gr-primary)]">
                    {formatNum(mp.stockTotal, 1)}
                  </span>
                  <span className="text-right text-[12px] text-[var(--color-gr-muted)]">{mp.unidad}</span>
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
              {formatNum(materiaPrima.reduce((s, m) => s + m.stockTotal, 0), 1)} unidades totales
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
