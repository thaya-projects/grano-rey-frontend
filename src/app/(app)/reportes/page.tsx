'use client';
import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useVentas } from '@/lib/api/ventas';
import { useGastos } from '@/lib/api/gastos';
import { useKardexMP } from '@/lib/api/materia-prima';
import { useMateriasPrimas } from '@/lib/api/materia-prima';
import { useProductos } from '@/lib/api/productos';
import { useReporteCargadores } from '@/lib/api/cargadores';
import { CategoriaGasto, EstadoVenta, TipoMovimientoMP } from '@/lib/types';
import { formatBs, formatNum, kgToQQ, equivPT, equivLabel } from '@/lib/utils';
import { Badge, SearchBox, Spinner } from '@/components/ui';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, ShoppingCart, Boxes, Layers, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Trophy, HardHat } from 'lucide-react';

type ReporteId      = 'financiero' | 'ventas' | 'movimientos_mp' | 'stock' | 'cargadores';
type AgrupacionTipo = 'semana' | 'mes' | 'año';
type StockTab       = 'productos' | 'mp';

// ── Dynamic PDF imports ────────────────────────────────────────────────────
const ResumenFinancieroPDFLink = dynamic(
  () => import('@/components/pdf/ResumenFinancieroPDF').then(m => m.ResumenFinancieroPDFLink),
  { ssr: false, loading: () => <span className="text-[12px] text-gr-muted">…</span> },
);
const VentasPDFLink = dynamic(
  () => import('@/components/pdf/VentasPDF').then(m => m.VentasPDFLink),
  { ssr: false, loading: () => <span className="text-[12px] text-gr-muted">…</span> },
);
const MovimientosMPPDFLink = dynamic(
  () => import('@/components/pdf/MovimientosMPPDF').then(m => m.MovimientosMPPDFLink),
  { ssr: false, loading: () => <span className="text-[12px] text-gr-muted">…</span> },
);
const StockActualPDFLink = dynamic(
  () => import('@/components/pdf/StockActualPDF').then(m => m.StockActualPDFLink),
  { ssr: false, loading: () => <span className="text-[12px] text-gr-muted">…</span> },
);

const REPORT_CARDS: { id: ReporteId; Icon: React.ElementType; title: string; desc: string }[] = [
  { id: 'financiero',     Icon: TrendingUp,   title: 'Resumen Financiero',  desc: 'Ingresos, egresos, utilidad y margen del período' },
  { id: 'ventas',         Icon: ShoppingCart, title: 'Ventas por Período',   desc: 'Detalle de notas de venta con filtros por cliente y estado' },
  { id: 'movimientos_mp', Icon: Boxes,        title: 'Movimientos de MP',    desc: 'Entradas y salidas de materia prima con costos' },
  { id: 'stock',          Icon: Layers,       title: 'Stock Actual',         desc: 'Inventario completo de productos terminados y materia prima' },
  { id: 'cargadores',     Icon: HardHat,      title: 'Gastos en cargadores', desc: 'Total pagado + pendiente por cargador con filtro de fechas' },
];

function KPICard({ label, value, color }: { label: string; value: string; color: 'success' | 'danger' | 'warning' | 'primary' }) {
  const C = { success: 'var(--color-gr-success)', danger: 'var(--color-gr-danger)', warning: 'var(--color-gr-warning)', primary: 'var(--color-gr-primary)' };
  return (
    <div className="card text-center">
      <p className="text-[11px] font-700 text-gr-muted uppercase tracking-wide mb-2">{label}</p>
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
      <div className="flex rounded-[8px] overflow-hidden border border-gr-border">
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
        <span className="text-[13px] font-700 text-gr-text min-w-[160px] text-center">
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
        <h1 className="text-[22px] font-900 text-gr-text">Reportes</h1>
        <p className="text-gr-muted text-[13.5px] mt-0.5">
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
              <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: isActive ? 'var(--color-gr-primary)' : 'var(--color-gr-border-lite)' }}>
                <Icon size={18} style={{ color: isActive ? '#fff' : 'var(--color-gr-primary)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-800 text-gr-text text-[14px]">{title}</p>
                <p className="text-[12.5px] text-gr-muted mt-0.5">{desc}</p>
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
      {activo === 'cargadores'     && <ReporteCargadores />}
    </div>
  );
}

// ── Report 5: Gastos en cargadores ───────────────────────────────────────
function ReporteCargadores() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const reporteQ = useReporteCargadores(desde || undefined, hasta || undefined);
  const r = reporteQ.data;

  if (reporteQ.isLoading) {
    return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-900 text-[16px] text-gr-text">Gastos en cargadores</h2>
          <p className="text-[12.5px] text-gr-muted">
            {desde || hasta
              ? `Período ${desde || '…'} → ${hasta || '…'}`
              : 'Todo el histórico'}
          </p>
        </div>
      </div>

      {/* Filtros de fecha */}
      <div className="card flex flex-wrap gap-3 items-end py-3">
        <div>
          <label className="block text-[11px] font-700 text-gr-muted uppercase mb-1">Desde</label>
          <input type="date" value={desde}
            onChange={e => setDesde(e.target.value)}
            className="border border-gr-border rounded-[8px] px-3 py-2 text-[13px] bg-white" />
        </div>
        <div>
          <label className="block text-[11px] font-700 text-gr-muted uppercase mb-1">Hasta</label>
          <input type="date" value={hasta}
            onChange={e => setHasta(e.target.value)}
            className="border border-gr-border rounded-[8px] px-3 py-2 text-[13px] bg-white" />
        </div>
        {(desde || hasta) && (
          <button onClick={() => { setDesde(''); setHasta(''); }}
            className="text-[12px] font-600 text-gr-primary underline pb-2">
            Limpiar
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KPICard label="Total pagado" value={formatBs(r?.totalPagadoBs ?? 0)} color="success" />
        <KPICard label="Pendiente" value={formatBs(r?.totalPendienteBs ?? 0)} color="danger" />
        <KPICard label="Cargadores activos" value={String(r?.cantidadCargadores ?? 0)} color="primary" />
      </div>

      {/* Desglose por origen del trabajo */}
      {r?.porOrigen && (r.porOrigen.materiaPrima.cantidad + r.porOrigen.despacho.cantidad > 0) && (
        <div className="card-no-pad">
          <div className="px-5 py-3.5 border-b border-[var(--color-gr-border)]">
            <p className="font-800 text-[14px] text-[var(--color-gr-text)]">Desglose por tipo de trabajo</p>
            <p className="text-[12px] text-[var(--color-gr-muted)] mt-0.5">
              De dónde vienen los pagos a cargadores en el período
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-[var(--color-gr-border-lite)]">
            <OrigenBox
              label="Descarga de Materia Prima"
              hint="Recepción y descarga de compras de MP"
              cantidad={r.porOrigen.materiaPrima.cantidad}
              pagadoBs={r.porOrigen.materiaPrima.totalPagadoBs}
              pendienteBs={r.porOrigen.materiaPrima.pendienteBs}
              color="var(--color-gr-primary)"
            />
            <OrigenBox
              label="Despachos a clientes"
              hint="Carga a camión para llevar al cliente"
              cantidad={r.porOrigen.despacho.cantidad}
              pagadoBs={r.porOrigen.despacho.totalPagadoBs}
              pendienteBs={r.porOrigen.despacho.pendienteBs}
              color="var(--color-gr-info)"
            />
          </div>
        </div>
      )}

      {/* Desglose por cargador */}
      <div className="card-no-pad">
        <div className="px-5 py-3.5 border-b border-gr-border">
          <p className="font-800 text-[14px] text-gr-text">Desglose por cargador</p>
        </div>

        {!r || r.porCargador.length === 0 ? (
          <p className="px-5 py-6 text-[13px] text-gr-muted text-center">
            Sin movimientos en el período
          </p>
        ) : (
          <>
            <div
              className="hidden md:grid gap-3 px-5 py-3 text-[11px] font-700 text-gr-muted uppercase tracking-wide border-b border-gr-border"
              style={{ gridTemplateColumns: '1fr 90px 130px 130px', background: 'var(--color-gr-border-lite)' }}
            >
              <span>Cargador</span>
              <span className="text-right">Pagos</span>
              <span className="text-right">Total pagado</span>
              <span className="text-right">Pendiente</span>
            </div>
            {r.porCargador.map(c => (
              <div key={c.cargadorId}
                className="px-5 py-3 border-b border-gr-border-lite last:border-b-0"
              >
                <div className="hidden md:grid gap-3 items-center"
                  style={{ gridTemplateColumns: '1fr 90px 130px 130px' }}>
                  <span className="font-700 text-[13.5px] text-gr-text">{c.cargadorNombre}</span>
                  <span className="text-right text-[13px]">{c.cantidadPagos}</span>
                  <span className="text-right font-800 text-[13.5px]" style={{ color: 'var(--color-gr-success)' }}>
                    {formatBs(c.totalPagadoBs)}
                  </span>
                  <span className="text-right font-800 text-[13.5px]" style={{ color: c.pendienteBs > 0 ? 'var(--color-gr-danger)' : 'var(--color-gr-muted)' }}>
                    {formatBs(c.pendienteBs)}
                  </span>
                </div>
                <div className="md:hidden">
                  <p className="font-700 text-[13.5px] text-gr-text">{c.cargadorNombre}</p>
                  <p className="text-[12px] text-gr-muted">
                    {c.cantidadPagos} pagos ·{' '}
                    <span style={{ color: 'var(--color-gr-success)' }}>{formatBs(c.totalPagadoBs)}</span>
                    {c.pendienteBs > 0 && (
                      <> · pendiente <span style={{ color: 'var(--color-gr-danger)' }}>{formatBs(c.pendienteBs)}</span></>
                    )}
                  </p>
                </div>
              </div>
            ))}
            <div
              className="px-5 py-3 flex items-center justify-between border-t border-gr-border"
              style={{ background: 'var(--color-gr-border-lite)' }}
            >
              <span className="text-[13px] font-700 text-gr-text">Total</span>
              <span className="font-900 text-[14px] text-gr-primary">
                {formatBs(r.totalPagadoBs)} pagado + {formatBs(r.totalPendienteBs)} pendiente
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OrigenBox({
  label, hint, cantidad, pagadoBs, pendienteBs, color,
}: {
  label: string; hint: string; cantidad: number;
  pagadoBs: number; pendienteBs: number; color: string;
}) {
  return (
    <div className="px-5 py-4 space-y-2">
      <div>
        <p className="font-800 text-[13.5px]" style={{ color }}>{label}</p>
        <p className="text-[11.5px] text-[var(--color-gr-muted)]">{hint}</p>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10.5px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide">
            Pagado
          </p>
          <p className="font-900 text-[18px]" style={{ color: 'var(--color-gr-success)' }}>
            {formatBs(pagadoBs)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10.5px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide">
            Pendiente
          </p>
          <p className="font-800 text-[14.5px]"
            style={{ color: pendienteBs > 0 ? 'var(--color-gr-danger)' : 'var(--color-gr-muted)' }}>
            {formatBs(pendienteBs)}
          </p>
        </div>
      </div>
      <p className="text-[11px] text-[var(--color-gr-muted)]">
        {cantidad} movimiento{cantidad !== 1 ? 's' : ''} de carga
      </p>
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
    [CategoriaGasto.MATERIA_PRIMA]:   'Materia Prima',
    [CategoriaGasto.TRANSPORTE]:      'Transporte/Flete',
    [CategoriaGasto.MANO_DE_OBRA]:    'Mano de Obra',
    [CategoriaGasto.MANTENIMIENTO]:   'Mantenimiento',
    [CategoriaGasto.SERVICIOS_BASICOS]: 'Servicios básicos',
    [CategoriaGasto.ADMINISTRATIVO]:  'Administrativo',
    [CategoriaGasto.IMPUESTOS]:       'Impuestos',
    [CategoriaGasto.OTROS]:           'Otros',
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
          <h2 className="font-900 text-[16px] text-gr-text">Resumen Financiero</h2>
          <p className="text-[12.5px] text-gr-muted">{getPeriodLabel(anchor, tipo)}</p>
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
          <div className="px-5 py-3.5 border-b border-gr-border">
            <p className="font-800 text-[14px] text-gr-text">Ingresos vs Egresos {chartLabel}</p>
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
          <div className="px-5 py-3.5 border-b border-gr-border">
            <p className="font-800 text-[14px] text-gr-text">Egresos por categoría</p>
          </div>
          <div className="divide-y divide-[var(--color-gr-border-lite)]">
            {gastosCat.length === 0 && (
              <p className="px-5 py-6 text-[13px] text-gr-muted text-center">Sin egresos en el período</p>
            )}
            {gastosCat.map(cat => (
              <div key={cat.label} className="px-5 py-3 flex items-center gap-3">
                <span className="w-[13px] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-600 text-gr-text">{cat.label}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13.5px] font-700 text-gr-text">{formatBs(cat.monto)}</p>
                  <p className="text-[11px] text-gr-muted">{cat.pct.toFixed(1)}%</p>
                </div>
              </div>
            ))}
            <div className="px-5 py-3 flex items-center justify-between"
              style={{ background: 'var(--color-gr-border-lite)' }}>
              <span className="text-[13px] font-700 text-gr-text">Total egresos</span>
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
const COLS_VENTAS = '50px 90px 160px 1fr 90px 110px 105px';

function ReporteVentas() {
  const ventasQ = useVentas();
  const ventas  = ventasQ.data ?? [];
  const [search, setSearch]               = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [filterEstado, setFilterEstado]   = useState('');
  const [fechaDesde, setFechaDesde]       = useState('');
  const [fechaHasta, setFechaHasta]       = useState('');

  const clientes = useMemo(() => [...new Set(ventas.map(v => v.cliente?.nombre ?? '—'))].sort(), [ventas]);

  const filtered = useMemo(() => ventas.filter(v => {
    const nombre = v.cliente?.nombre ?? '—';
    if (filterCliente && nombre !== filterCliente) return false;
    if (filterEstado  && v.estado !== filterEstado) return false;
    if (fechaDesde && v.fecha < fechaDesde) return false;
    if (fechaHasta && v.fecha > fechaHasta) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        nombre.toLowerCase().includes(q) ||
        v.numeroNota.toString().includes(q) ||
        v.detalles.some(d => (d.producto?.nombre ?? '').toLowerCase().includes(q))
      );
    }
    return true;
  }), [ventas, search, filterCliente, filterEstado, fechaDesde, fechaHasta]);

  const totalBs = filtered.reduce((s, v) => s + Number(v.totalBs), 0);
  const totalQQ = filtered.reduce((s, v) =>
    s + v.detalles.reduce((ds, d) => ds + kgToQQ(Number(d.totalKg)), 0), 0);

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
          <p className="text-[12.5px] text-gr-muted">
            {filtered.length} ventas · <strong>{formatNum(totalQQ, 2)} QQ</strong> · {formatBs(totalBs)}
          </p>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <VentasPDFLink data={{ ventas: ventasLegacy as any, total: totalBs }} />
      </div>

      {/* KPIs de la selección */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KPICard label="Ventas" value={String(filtered.length)} color="primary" />
        <KPICard label="Quintales (QQ)" value={formatNum(totalQQ, 2)} color="primary" />
        <KPICard label="Total Bs" value={formatBs(totalBs)} color="success" />
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
        <div className="flex-1 min-w-45">
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
        <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
          aria-label="Desde"
          className="border border-gr-border rounded-[8px] px-3 py-2 text-[13px] bg-white" />
        <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
          aria-label="Hasta"
          className="border border-gr-border rounded-[8px] px-3 py-2 text-[13px] bg-white" />
        {(fechaDesde || fechaHasta) && (
          <button onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
            className="text-[12px] font-600 text-gr-primary underline">
            Limpiar fechas
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="card-no-pad overflow-x-auto">
        <div style={{ minWidth: 700 }}>
          {/* Header */}
          <div className="grid gap-x-3 px-4 py-3 text-[11px] font-700 text-gr-muted uppercase tracking-wide border-b border-gr-border"
            style={{ gridTemplateColumns: COLS_VENTAS, background: 'var(--color-gr-border-lite)' }}>
            <span>N°</span>
            <span>Fecha</span>
            <span>Cliente</span>
            <span>Productos</span>
            <span className="text-right">QQ</span>
            <span className="text-right">Total Bs</span>
            <span>Estado</span>
          </div>
          {/* Rows */}
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-gr-muted">Sin ventas para los filtros seleccionados</p>
          ) : filtered.map((v, i) => {
            const ventaQQ = v.detalles.reduce((s, d) => s + kgToQQ(Number(d.totalKg)), 0);
            return (
              <div key={v.id}
                className="grid gap-x-3 px-4 py-3 items-center border-b border-gr-border-lite last:border-b-0 text-[13px]"
                style={{
                  gridTemplateColumns: COLS_VENTAS,
                  background: i % 2 ? 'var(--color-gr-border-lite)' : '#fff',
                }}>
                <span className="font-700 text-gr-primary whitespace-nowrap">N°{v.numeroNota}</span>
                <span className="text-gr-muted whitespace-nowrap">{v.fecha}</span>
                <span className="font-600 truncate">{v.cliente?.nombre ?? '—'}</span>
                <span className="text-gr-muted text-[12px] truncate">
                  {v.detalles.map(d => `${d.producto?.nombre ?? ''} ×${Number(d.cantidad)}`).join(' · ')}
                </span>
                <span className="text-right font-700">{formatNum(ventaQQ, 2)}</span>
                <span className="text-right font-700 whitespace-nowrap">{formatBs(Number(v.totalBs))}</span>
                <span className="whitespace-nowrap">
                  <Badge color={ESTADO_COLORS[v.estado] ?? 'gray'}>{ESTADO_LABELS[v.estado] ?? v.estado}</Badge>
                </span>
              </div>
            );
          })}
          {/* Footer */}
          <div className="grid gap-x-3 px-4 py-3 items-center border-t-2 border-gr-border"
            style={{ gridTemplateColumns: COLS_VENTAS, background: 'var(--color-gr-border-lite)' }}>
            <span className="col-span-4 text-[12.5px] text-gr-muted">{filtered.length} ventas</span>
            <span className="text-right font-900 text-[14px] text-gr-primary whitespace-nowrap">
              {formatNum(totalQQ, 2)} QQ
            </span>
            <span className="text-right font-900 text-[14px] text-gr-primary whitespace-nowrap">
              {formatBs(totalBs)}
            </span>
            <span />
          </div>
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
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const mpNames = useMemo(() => [...new Set(movs.map(m => m.materiaPrima?.nombre ?? '—'))].sort(), [movs]);

  const filtered = useMemo(() => movs.filter(m => {
    if (filterMP   && (m.materiaPrima?.nombre ?? '') !== filterMP) return false;
    if (filterTipo && m.tipoMovimiento !== filterTipo) return false;
    if (fechaDesde && m.fecha < fechaDesde) return false;
    if (fechaHasta && m.fecha > fechaHasta) return false;
    return true;
  }), [movs, filterMP, filterTipo, fechaDesde, fechaHasta]);

  const movsLegacy = filtered.map(m => ({
    id: m.id,
    fecha: m.fecha,
    mpNombre: m.materiaPrima?.nombre ?? '—',
    tipo: m.tipoMovimiento,
    totalQQ: kgToQQ(Number(m.cantidadKg)),
    costoBs: m.costoUnitarioBs != null ? Number(m.costoUnitarioBs) * Number(m.cantidad) : null,
    lote: m.numeroLotePropio ?? null,
    responsable: m.responsable?.nombre ?? '—',
  }));

  const totalQQMovs = filtered.reduce((s, m) => s + kgToQQ(Number(m.cantidadKg)), 0);
  const totalBsMovs = filtered.reduce((s, m) =>
    m.costoUnitarioBs != null ? s + Number(m.costoUnitarioBs) * Number(m.cantidad) : s, 0);

  // Balance por tipo de movimiento
  const balance = useMemo(() => {
    // Costo promedio ponderado por KG desde todos los ingresos con precio
    const ingresosConPrecio = filtered.filter(
      m => m.tipoMovimiento === TipoMovimientoMP.INGRESO && m.costoUnitarioBs != null
    );
    const totalCostIngresos = ingresosConPrecio.reduce(
      (s, m) => s + Number(m.costoUnitarioBs!) * Number(m.cantidad), 0
    );
    const totalKgIngresos = ingresosConPrecio.reduce((s, m) => s + Number(m.cantidadKg), 0);
    const avgCostPerKg = totalKgIngresos > 0 ? totalCostIngresos / totalKgIngresos : 0;

    let comprasQQ = 0, comprasBs = 0;
    let produccionQQ = 0, produccionBs = 0;
    let mermaProcesoQQ = 0, mermaProcesoBs = 0;
    let mermaExternaQQ = 0, mermaExternaBs = 0;
    let desechoQQ = 0, desechoBs = 0;
    let ajusteQQ = 0;
    let devolucionQQ = 0, devolucionBs = 0;

    filtered.forEach(m => {
      const qq  = kgToQQ(Number(m.cantidadKg));
      const kg  = Number(m.cantidadKg);
      // Precio propio si existe, sino estimado por costo promedio de compra
      const bs  = m.costoUnitarioBs != null
        ? Number(m.costoUnitarioBs) * Number(m.cantidad)
        : avgCostPerKg * kg;

      switch (m.tipoMovimiento) {
        case TipoMovimientoMP.INGRESO:
          comprasQQ += qq; comprasBs += (m.costoUnitarioBs != null ? Number(m.costoUnitarioBs) * Number(m.cantidad) : 0); break;
        case TipoMovimientoMP.SALIDA:
          produccionQQ += qq; produccionBs += bs; break;
        case TipoMovimientoMP.MERMA:
          if (m.loteProduccion) { mermaProcesoQQ += qq; mermaProcesoBs += bs; }
          else                  { mermaExternaQQ += qq; mermaExternaBs += bs; }
          break;
        case TipoMovimientoMP.DESECHO:
          desechoQQ += qq; desechoBs += bs; break;
        case TipoMovimientoMP.AJUSTE:
          ajusteQQ += qq; break;
        case TipoMovimientoMP.DEVOLUCION:
          devolucionQQ += qq; devolucionBs += bs; break;
      }
    });

    const perdidasQQ = mermaProcesoQQ + mermaExternaQQ + desechoQQ;
    const perdidasBs = mermaProcesoBs + mermaExternaBs + desechoBs;
    const netoQQ     = comprasQQ + devolucionQQ + ajusteQQ - produccionQQ - perdidasQQ;
    const pctPerdida = comprasBs > 0 ? (perdidasBs / comprasBs) * 100 : 0;
    const usaEstimado = avgCostPerKg > 0 && (produccionQQ > 0 || mermaProcesoQQ > 0);

    return {
      comprasQQ, comprasBs,
      produccionQQ, produccionBs,
      mermaProcesoQQ, mermaProcesoBs,
      mermaExternaQQ, mermaExternaBs,
      desechoQQ, desechoBs,
      ajusteQQ,
      devolucionQQ, devolucionBs,
      perdidasQQ, perdidasBs,
      netoQQ, pctPerdida,
      avgCostPerKg, usaEstimado,
    };
  }, [filtered]);

  const COLS_MOVS = '120px 1fr 80px 110px 80px 90px 130px';

  if (kardexQ.isLoading) {
    return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-900 text-[16px] text-gr-text">Movimientos de Materia Prima</h2>
          <p className="text-[12.5px] text-gr-muted">
            {filtered.length} registros · <strong>{formatNum(totalQQMovs, 2)} QQ</strong>
            {totalBsMovs > 0 && <> · {formatBs(totalBsMovs)}</>}
          </p>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <MovimientosMPPDFLink data={{ movimientos: movsLegacy as any }} />
      </div>

      {/* Balance — 4 tarjetas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Comprado */}
        <div className="card border-t-2" style={{ borderTopColor: 'var(--color-gr-success)' }}>
          <p className="text-[11px] font-700 text-gr-muted uppercase tracking-wide mb-2">Comprado</p>
          <p className="text-[19px] font-900 leading-none" style={{ color: 'var(--color-gr-success)' }}>
            {formatNum(balance.comprasQQ, 2)} QQ
          </p>
          <p className="text-[12px] text-gr-muted mt-1">
            {balance.comprasBs > 0 ? formatBs(balance.comprasBs) : '—'}
          </p>
        </div>

        {/* Usado en producción */}
        <div className="card border-t-2" style={{ borderTopColor: 'var(--color-gr-primary)' }}>
          <p className="text-[11px] font-700 text-gr-muted uppercase tracking-wide mb-2">A producción</p>
          <p className="text-[19px] font-900 leading-none" style={{ color: 'var(--color-gr-primary)' }}>
            {formatNum(balance.produccionQQ, 2)} QQ
          </p>
          <p className="text-[12px] text-gr-muted mt-1">
            {balance.produccionBs > 0 ? `${formatBs(balance.produccionBs)}${balance.usaEstimado ? ' *' : ''}` : '—'}
          </p>
        </div>

        {/* Pérdidas totales */}
        <div className="card border-t-2" style={{ borderTopColor: 'var(--color-gr-danger)' }}>
          <p className="text-[11px] font-700 text-gr-muted uppercase tracking-wide mb-2">
            Pérdidas
            {balance.pctPerdida > 0 && (
              <span className="ml-1 font-600 normal-case" style={{
                color: balance.pctPerdida > 5 ? 'var(--color-gr-danger)'
                  : balance.pctPerdida > 2 ? 'var(--color-gr-warning)'
                  : 'var(--color-gr-success)',
              }}>
                ({balance.pctPerdida.toFixed(1)}%)
              </span>
            )}
          </p>
          <p className="text-[19px] font-900 leading-none" style={{ color: 'var(--color-gr-danger)' }}>
            {formatNum(balance.perdidasQQ, 2)} QQ
          </p>
          <p className="text-[12px] text-gr-muted mt-1">
            {balance.perdidasBs > 0 ? formatBs(balance.perdidasBs) : '—'}
          </p>
        </div>

        {/* Ajustes */}
        <div className="card border-t-2" style={{ borderTopColor: 'var(--color-gr-muted)' }}>
          <p className="text-[11px] font-700 text-gr-muted uppercase tracking-wide mb-2">Ajustes</p>
          <p className="text-[19px] font-900 leading-none text-gr-muted">
            {balance.ajusteQQ !== 0
              ? `${balance.ajusteQQ > 0 ? '+' : ''}${formatNum(balance.ajusteQQ, 2)} QQ`
              : '—'}
          </p>
          <p className="text-[12px] text-gr-muted mt-1">
            {balance.ajusteQQ === 0 ? 'Sin ajustes' : 'corrección de inventario'}
          </p>
        </div>
      </div>
      {balance.usaEstimado && (
        <p className="text-[11.5px] text-gr-muted px-1">
          * Bs estimados al precio promedio de compra — {formatBs(balance.avgCostPerKg)}/kg
        </p>
      )}

      {/* Filtros */}
      <div className="card flex flex-wrap gap-3 py-3">
        <select value={filterMP} onChange={e => setFilterMP(e.target.value)}
          className="border border-gr-border rounded-lg px-3 py-2 text-[13px] bg-white flex-1 min-w-45 text-gr-text">
          <option value="">Todas las materias primas</option>
          {mpNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}
          className="border border-gr-border rounded-lg px-3 py-2 text-[13px] bg-white text-gr-text">
          <option value="">Todos los tipos</option>
          <option value={TipoMovimientoMP.INGRESO}>Ingreso</option>
          <option value={TipoMovimientoMP.SALIDA}>Salida</option>
          <option value={TipoMovimientoMP.MERMA}>Merma</option>
          <option value={TipoMovimientoMP.DESECHO}>Desecho</option>
          <option value={TipoMovimientoMP.AJUSTE}>Ajuste</option>
          <option value={TipoMovimientoMP.DEVOLUCION}>Devolución</option>
        </select>
        <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
          aria-label="Desde"
          className="border border-gr-border rounded-lg px-3 py-2 text-[13px] bg-white" />
        <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
          aria-label="Hasta"
          className="border border-gr-border rounded-lg px-3 py-2 text-[13px] bg-white" />
        {(fechaDesde || fechaHasta) && (
          <button onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
            className="text-[12px] font-600 text-gr-primary underline">
            Limpiar fechas
          </button>
        )}
      </div>

      <div className="card-no-pad overflow-x-auto">
        <div style={{ minWidth: 700 }}>
          {/* Header */}
          <div className="grid gap-x-3 px-4 py-3 text-[11px] font-700 text-gr-muted uppercase tracking-wide border-b border-gr-border"
            style={{ gridTemplateColumns: COLS_MOVS, background: 'var(--color-gr-border-lite)' }}>
            <span>Tipo</span>
            <span>Materia Prima</span>
            <span className="text-right">QQ</span>
            <span className="text-right">Costo Bs</span>
            <span className="text-right">Lote</span>
            <span>Fecha</span>
            <span>Responsable</span>
          </div>
          {/* Rows */}
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-gr-muted">Sin movimientos para los filtros seleccionados</p>
          ) : filtered.map((m, i) => {
            const t = m.tipoMovimiento;
            const [color, label] =
              t === TipoMovimientoMP.INGRESO    ? ['green',  '↑ Ingreso']    :
              t === TipoMovimientoMP.AJUSTE     ? ['green',  '↑ Ajuste']     :
              t === TipoMovimientoMP.SALIDA     ? ['red',    '↓ Salida']     :
              t === TipoMovimientoMP.MERMA      ? ['yellow', '↓ Merma']      :
              t === TipoMovimientoMP.DESECHO    ? ['yellow', '↓ Desecho']    :
              t === TipoMovimientoMP.DEVOLUCION ? ['gray',   '↩ Devolución'] :
              ['gray', t];
            return (
              <div key={m.id}
                className="grid gap-x-3 px-4 py-3 items-center border-b border-gr-border-lite last:border-b-0 text-[13px]"
                style={{
                  gridTemplateColumns: COLS_MOVS,
                  background: i % 2 ? 'var(--color-gr-border-lite)' : '#fff',
                }}>
                <span className="whitespace-nowrap">
                  <Badge color={color as 'green' | 'red' | 'yellow' | 'gray'}>{label}</Badge>
                </span>
                <span className="font-700 truncate">{m.materiaPrima?.nombre ?? '—'}</span>
                <span className="text-right font-700">{formatNum(kgToQQ(Number(m.cantidadKg)), 2)}</span>
                <span className="text-right whitespace-nowrap">
                  {m.costoUnitarioBs != null ? formatBs(Number(m.costoUnitarioBs) * Number(m.cantidad)) : '—'}
                </span>
                <span className="text-right text-gr-muted">{m.numeroLotePropio ?? '—'}</span>
                <span className="whitespace-nowrap text-gr-muted">{m.fecha}</span>
                <span className="whitespace-nowrap truncate">{m.responsable?.nombre ?? '—'}</span>
              </div>
            );
          })}
          {/* Footer */}
          <div className="px-4 py-3 border-t border-gr-border text-[12.5px] text-gr-muted"
            style={{ background: 'var(--color-gr-border-lite)' }}>
            {filtered.length} movimientos
          </div>
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
    factorABase: Number(p.unidadProduccion?.factorABase ?? 0),
    tipo: p.unidadProduccion?.tipo ?? null,
    precioUnitarioBs: Number(p.precioUnitarioBs ?? 0),
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
    stockTotal: kgToQQ(Number(m.stockActualKg)),
    stockMinimo: kgToQQ(Number(m.stockMinimoKg)),
  }));

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-900 text-[16px] text-gr-text">Stock Actual</h2>
          <p className="text-[12.5px] text-gr-muted">
            Inventario al {new Date().toLocaleDateString('es-BO')}
          </p>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <StockActualPDFLink data={{ productos: productosLegacy as any, materiaPrima: mpLegacy as any }} />
      </div>

      <div className="flex gap-1 rounded-md p-1 border border-gr-border w-fit"
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
          <div className="hidden md:grid gap-3 px-5 py-3 text-[11px] font-700 text-gr-muted uppercase tracking-wide border-b border-gr-border"
            style={{ gridTemplateColumns: '80px 1fr 90px 80px 80px 70px', background: 'var(--color-gr-border-lite)' }}>
            <span>Código</span><span>Producto</span><span className="text-right">Stock</span><span className="text-right">Equiv.</span><span className="text-right">Precio/u</span><span>Estado</span>
          </div>
          {productos.map((p, i) => {
            const stock = Number(p.stockActual);
            const min   = Number(p.stockMinimo);
            const qq    = equivPT(stock, p.unidadProduccion?.factorABase, p.unidadProduccion?.tipo);
            const qlbl  = equivLabel(p.unidadProduccion?.tipo);
            const low   = stock < min;
            const warn  = !low && stock < min * 2;
            return (
              <div key={p.id}
                className={`px-5 py-3.5 ${i < productos.length - 1 ? 'border-b border-gr-border-lite' : ''}`}>
                <div className="md:hidden flex items-center justify-between gap-2">
                  <div>
                    <p className="font-700 text-gr-text text-[13.5px]">{p.nombre}</p>
                    <p className="text-[12px] text-gr-muted">
                      {p.codigo} · {formatNum(stock, 0)} · {formatNum(qq, 2)} {qlbl}
                    </p>
                  </div>
                  <Badge color={low ? 'red' : warn ? 'yellow' : 'green'}>
                    {low ? 'Bajo' : warn ? 'Alerta' : 'OK'}
                  </Badge>
                </div>
                <div className="hidden md:grid gap-3 items-center"
                  style={{ gridTemplateColumns: '80px 1fr 90px 80px 80px 70px' }}>
                  <span className="text-[12px] font-600 text-gr-muted">{p.codigo}</span>
                  <span className="font-700 text-gr-text text-[13.5px]">{p.nombre}</span>
                  <span className="text-right font-900 text-[14px] text-gr-primary">
                    {formatNum(stock, 0)}
                  </span>
                  <span className="text-right font-700 text-gr-text text-[13px]">{formatNum(qq, 2)}</span>
                  <span className="text-right text-[13px] text-gr-text">{p.precioUnitarioBs ? formatBs(Number(p.precioUnitarioBs)) : '—'}</span>
                  <Badge color={low ? 'red' : warn ? 'yellow' : 'green'}>
                    {low ? 'Bajo' : warn ? 'Alerta' : 'OK'}
                  </Badge>
                </div>
              </div>
            );
          })}
          <div className="px-5 py-3 flex items-center justify-between border-t border-gr-border"
            style={{ background: 'var(--color-gr-border-lite)' }}>
            <span className="text-[13px] text-gr-muted">{productos.length} productos</span>
            <span className="font-900 text-[14px] text-gr-primary">
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
          <div className="hidden md:grid gap-3 px-5 py-3 text-[11px] font-700 text-gr-muted uppercase tracking-wide border-b border-gr-border"
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
                className={`px-5 py-3.5 ${i < materiaPrima.length - 1 ? 'border-b border-gr-border-lite' : ''}`}>
                <div className="md:hidden flex items-center justify-between gap-2">
                  <div>
                    <p className="font-700 text-gr-text text-[13.5px]">{mp.nombre}</p>
                    <p className="text-[12px] text-gr-muted">{formatNum(stockKg, 1)} kg · {formatNum(kgToQQ(stockKg), 2)} QQ</p>
                  </div>
                  <Badge color={low ? 'red' : warn ? 'yellow' : 'green'}>
                    {low ? 'Bajo' : warn ? 'Alerta' : 'OK'}
                  </Badge>
                </div>
                <div className="hidden md:grid gap-3 items-center"
                  style={{ gridTemplateColumns: '1fr 110px 110px 90px 80px' }}>
                  <span className="font-700 text-gr-text text-[13.5px]">{mp.nombre}</span>
                  <span className="text-right font-900 text-[14px] text-gr-text">
                    {formatNum(stockKg, 1)}
                  </span>
                  <span className="text-right font-900 text-[14px] text-gr-primary">
                    {formatNum(kgToQQ(stockKg), 2)}
                  </span>
                  <span className="text-right text-[12.5px] text-gr-muted">{formatNum(minKg, 1)}</span>
                  <Badge color={low ? 'red' : warn ? 'yellow' : 'green'}>
                    {low ? 'Bajo' : warn ? 'Alerta' : 'OK'}
                  </Badge>
                </div>
              </div>
            );
          })}
          <div className="px-5 py-3 flex items-center justify-between border-t border-gr-border"
            style={{ background: 'var(--color-gr-border-lite)' }}>
            <span className="text-[13px] text-gr-muted">{materiaPrima.length} materias primas</span>
            <span className="font-900 text-[14px] text-gr-primary">
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
