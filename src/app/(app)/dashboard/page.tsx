'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import { useAuth } from '@/lib/auth-store';
import { useVentas } from '@/lib/api/ventas';
import { useProductos } from '@/lib/api/productos';
import { useMateriasPrimas } from '@/lib/api/materia-prima';
import { formatBs, formatNum, kgToQQ, equivPT, equivLabel } from '@/lib/utils';
import { StockBar, EstadoBadge, Spinner } from '@/components/ui';
import { Package, Wheat, ShoppingCart, TrendingUp, AlertTriangle, CheckCircle2, Plus, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { EstadoVenta } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useAuth();

  const ventasQ    = useVentas();
  const productosQ = useProductos();
  const mpQ        = useMateriasPrimas();

  const ventas         = ventasQ.data ?? [];
  const productos      = productosQ.data ?? [];
  const materiasPrimas = mpQ.data ?? [];

  const stats = useMemo(() => {
    const mesKey = new Date().toISOString().slice(0, 7);
    const delMes = ventas.filter(v => v.fecha.startsWith(mesKey));
    return {
      totalVentas: delMes.reduce((s, v) => s + Number(v.totalBs), 0),
      notasMes: delMes.length,
      pendientes: ventas.filter(v => v.estado === EstadoVenta.PENDIENTE).length,
      totalStock: productos.reduce((s, p) => s + Number(p.stockActual), 0),
      totalQQ: productos.reduce(
        (s, p) => s + equivPT(Number(p.stockActual), p.unidadProduccion?.factorABase, p.unidadProduccion?.tipo),
        0,
      ),
      totalMP: kgToQQ(materiasPrimas.reduce((s, m) => s + Number(m.stockActualKg), 0)),
    };
  }, [ventas, productos, materiasPrimas]);

  const chartData = useMemo(() => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return {
        mes: meses[d.getMonth()],
        monto: ventas
          .filter(v => v.fecha.startsWith(key))
          .reduce((s, v) => s + Number(v.totalBs), 0),
      };
    });
  }, [ventas]);

  const nombreMes = new Date().toLocaleDateString('es-BO', { month: 'long', year: 'numeric' });
  const hora      = new Date().getHours();
  const saludo    = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  const stockBajo      = productos.filter(p => Number(p.stockActual) < Number(p.stockMinimo));
  const dispPendientes = stats.pendientes;
  const hayAlertas     = stockBajo.length > 0 || dispPendientes > 0;
  const mpStockBajo    = materiasPrimas.some(m => Number(m.stockActualKg) < Number(m.stockMinimoKg));

  const ultimas5 = [...ventas].slice(0, 5);

  const loading = ventasQ.isLoading || productosQ.isLoading || mpQ.isLoading;
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner size={28} color="var(--color-gr-primary)" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[24px] font-900 text-[var(--color-gr-text)] tracking-tight">
            {saludo}, {user?.nombre.split(' ')[0]} 👋
          </h1>
          <p className="text-[var(--color-gr-muted)] text-[14px] mt-1 capitalize">{nombreMes}</p>
        </div>
        <Link href="/ventas/nueva"
          className="flex items-center gap-2 bg-[var(--color-gr-gold)] text-[#1a0e00] font-700 px-4 py-2.5 rounded-[12px] text-[14px] hover:bg-[var(--color-gr-gold-dark)] transition-all shadow-sm">
          <Plus size={16} /> Nueva venta
        </Link>
      </div>

      {/* Alertas */}
      {hayAlertas ? (
        <div className="bg-[var(--color-gr-warning-bg)] border border-[var(--color-gr-warning)]/30 rounded-[12px] px-5 py-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-[var(--color-gr-warning)] shrink-0 mt-0.5" />
          <div className="space-y-1">
            {stockBajo.length > 0 && (
              <p className="text-[13.5px] text-[var(--color-gr-text)] font-600">
                Stock bajo: <span className="font-700">{stockBajo.map(p => p.nombre.split(' ').slice(0, 3).join(' ')).join(', ')}</span>
              </p>
            )}
            {dispPendientes > 0 && (
              <p className="text-[13.5px] text-[var(--color-gr-text)] font-600">
                {dispPendientes} {dispPendientes === 1 ? 'venta pendiente' : 'ventas pendientes'} de despacho
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[var(--color-gr-success-bg)] border border-[var(--color-gr-success)]/20 rounded-[12px] px-5 py-3.5 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-[var(--color-gr-success)]" />
          <p className="text-[13.5px] text-[var(--color-gr-success)] font-600">Todo en orden — sin alertas activas</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Ventas del mes" value={formatBs(stats.totalVentas)}
          sub={`${stats.notasMes} notas emitidas`}
          icon={<ShoppingCart size={20} />} color="primary" href="/ventas" />
        <KpiCard
          label="Stock productos" value={formatNum(stats.totalStock, 0) + ' bol'}
          sub={`${formatNum(stats.totalQQ, 2)} QQ equivalente`}
          icon={<Package size={20} />} color="gold" href="/stock" />
        <KpiCard
          label="Materia Prima" value={formatNum(stats.totalMP, 2) + ' QQ'}
          sub={mpStockBajo ? '⚠ Hay stock bajo' : 'Stock suficiente'}
          icon={<Wheat size={20} />} color="success" href="/materia-prima" />
        <KpiCard
          label="Pendientes" value={stats.pendientes.toString()}
          sub="ventas por despachar"
          icon={<TrendingUp size={20} />} color="warning" href="/despachos" />
      </div>

      {/* Chart + Quick actions */}
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 card-no-pad">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-gr-border)]">
            <div>
              <p className="font-800 text-[var(--color-gr-text)] text-[14px]">Ventas últimos 6 meses</p>
              <p className="text-[12px] text-[var(--color-gr-muted)]">En bolivianos</p>
            </div>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gr-border)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--color-gr-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-gr-muted)' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip formatter={(v) => [formatBs(v as number), 'Total']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-gr-border)' }} />
                <Bar dataKey="monto" fill="var(--color-gr-primary)" radius={[6, 6, 0, 0]} opacity={0.75} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 card">
          <p className="font-800 text-[var(--color-gr-text)] text-[14px] mb-4">Acciones rápidas</p>
          <div className="space-y-2.5">
            <QuickAction href="/ventas/nueva"  label="Nueva nota de venta"     color="gold"    icon={<ShoppingCart size={16} />} />
            <QuickAction href="/materia-prima" label="Registrar entrada MP"     color="primary" icon={<Wheat size={16} />} />
            <QuickAction href="/produccion"     label="Registrar producción"     color="ghost"   icon={<Package size={16} />} />
            <QuickAction href="/despachos"     label="Ver despachos pendientes" color="ghost"   icon={<TrendingUp size={16} />} />
          </div>
        </div>
      </div>

      {/* Stock visual */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-800 text-[var(--color-gr-text)] text-[15px]">Stock actual por producto</h2>
          <Link href="/stock" className="flex items-center gap-1 text-[var(--color-gr-primary)] text-[13px] font-600 hover:underline">
            Ver detalle <ArrowRight size={13} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {productos.map(p => {
            const low = Number(p.stockActual) < Number(p.stockMinimo);
            return (
              <div key={p.id} className={`card p-4 border-t-[3px] ${low ? 'border-t-[var(--color-gr-danger)]' : 'border-t-[var(--color-gr-success)]'}`}>
                <p className="text-[11px] font-600 text-[var(--color-gr-muted)] uppercase tracking-wide mb-1">{p.codigo}</p>
                <p className="font-700 text-[var(--color-gr-text)] text-[13px] mb-3 leading-tight">{p.nombre}</p>
                <p className="text-[28px] font-900 text-[var(--color-gr-text)] leading-none mb-1">
                  {formatNum(Number(p.stockActual), 0)} <span className="text-[14px] font-500 text-[var(--color-gr-muted)]">bol</span>
                </p>
                <p className="text-[12px] text-[var(--color-gr-muted)] mb-3">{formatNum(equivPT(Number(p.stockActual), p.unidadProduccion?.factorABase, p.unidadProduccion?.tipo), 2)} {equivLabel(p.unidadProduccion?.tipo)}</p>
                <StockBar value={Number(p.stockActual)} min={Number(p.stockMinimo)} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Últimas ventas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-800 text-[var(--color-gr-text)] text-[15px]">Últimas ventas</h2>
          <Link href="/ventas" className="flex items-center gap-1 text-[var(--color-gr-primary)] text-[13px] font-600 hover:underline">
            Ver todas <ArrowRight size={13} />
          </Link>
        </div>
        <div className="card-no-pad">
          {ultimas5.map((v, i) => (
            <div key={v.id} className={`flex items-center gap-4 px-5 py-3.5 ${i < ultimas5.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}>
              <div className="w-9 h-9 rounded-[10px] bg-[var(--color-gr-primary-lite)] flex items-center justify-center shrink-0">
                <ShoppingCart size={16} className="text-[var(--color-gr-primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-700 text-[var(--color-gr-text)] text-[13.5px]">NV-{v.numeroNota} · {v.cliente?.nombre ?? '—'}</p>
                <p className="text-[12px] text-[var(--color-gr-muted)]">{v.detalles?.[0]?.producto?.nombre ?? 'Sin detalle'} · {v.fecha}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-800 text-[var(--color-gr-primary)] text-[14px]">{formatBs(Number(v.totalBs))}</p>
                <EstadoBadge estado={v.estado} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, icon, color, href }: {
  label: string; value: string; sub: string; icon: React.ReactNode;
  color: 'primary' | 'gold' | 'success' | 'warning'; href: string;
}) {
  const colorMap = {
    primary: { bg: 'var(--color-gr-primary-lite)', text: 'var(--color-gr-primary)'  },
    gold:    { bg: 'var(--color-gr-gold-lite)',    text: 'var(--color-gr-gold-dark)' },
    success: { bg: 'var(--color-gr-success-bg)',   text: 'var(--color-gr-success)'  },
    warning: { bg: 'var(--color-gr-warning-bg)',   text: 'var(--color-gr-warning)'  },
  };
  const c = colorMap[color];
  return (
    <Link href={href} className="card block hover:shadow-md hover:border-[var(--color-gr-primary)]/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11.5px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide">{label}</p>
        <div style={{ background: c.bg, color: c.text }} className="w-9 h-9 rounded-[10px] flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-[26px] font-900 text-[var(--color-gr-text)] leading-none mb-1">{value}</p>
      <p className="text-[12px] text-[var(--color-gr-muted)]">{sub}</p>
    </Link>
  );
}

function QuickAction({ href, label, icon, color }: { href: string; label: string; icon: React.ReactNode; color: 'primary' | 'gold' | 'ghost'; }) {
  const styles = {
    primary: 'bg-[var(--color-gr-primary)] text-white hover:bg-[var(--color-gr-primary-mid)]',
    gold:    'bg-[var(--color-gr-gold)] text-[#1a0e00] hover:bg-[var(--color-gr-gold-dark)]',
    ghost:   'bg-[var(--color-gr-border-lite)] text-[var(--color-gr-primary)] hover:bg-[var(--color-gr-primary-lite)]',
  };
  return (
    <Link href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-[10px] font-600 text-[13.5px] transition-all ${styles[color]}`}>
      {icon} {label}
    </Link>
  );
}
