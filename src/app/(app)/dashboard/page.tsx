'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import { useAuth } from '@/lib/auth-store';
import { useVentas } from '@/lib/api/ventas';
import { useProductos } from '@/lib/api/productos';
import { useMateriasPrimas } from '@/lib/api/materia-prima';
import { formatBs, formatNum, kgToQQ, equivPT } from '@/lib/utils';
import { Spinner } from '@/components/ui';
import { Package, Wheat, ShoppingCart, TrendingUp, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { EstadoVenta } from '@/lib/types';
import { KpiCard } from './_components/KpiCard';
import { QuickAction } from './_components/QuickAction';
import { VentasChart } from './_components/VentasChart';
import { StockDestacado } from './_components/StockDestacado';
import { UltimasVentas } from './_components/UltimasVentas';

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

  const ultimas4 = [...ventas].slice(0, 4);
  const productosDestacados = productos.slice(0, 4);

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
          <h1 className="text-[24px] font-900 text-gr-text tracking-tight">
            {saludo}, {user?.nombre.split(' ')[0]} 👋
          </h1>
          <p className="text-gr-muted text-[14px] mt-1 capitalize">{nombreMes}</p>
        </div>
        <Link href="/ventas/nueva"
          className="flex items-center gap-2 bg-gr-gold text-[#1a0e00] font-700 px-4 py-2.5 rounded-[12px] text-[14px] hover:bg-gr-gold-dark transition-all shadow-sm">
          <Plus size={16} /> Nueva venta
        </Link>
      </div>

      {/* Alertas */}
      {hayAlertas ? (
        <div className="bg-gr-warning-bg border border-gr-warning/30 rounded-[12px] px-5 py-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-gr-warning shrink-0 mt-0.5" />
          <div className="space-y-1">
            {stockBajo.length > 0 && (
              <p className="text-[13.5px] text-gr-text font-600">
                Stock bajo: <span className="font-700">{stockBajo.map(p => p.nombre.split(' ').slice(0, 3).join(' ')).join(', ')}</span>
              </p>
            )}
            {dispPendientes > 0 && (
              <p className="text-[13.5px] text-gr-text font-600">
                {dispPendientes} {dispPendientes === 1 ? 'venta pendiente' : 'ventas pendientes'} de despacho
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gr-success-bg border border-gr-success/20 rounded-[12px] px-5 py-3.5 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-gr-success" />
          <p className="text-[13.5px] text-gr-success font-600">Todo en orden — sin alertas activas</p>
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
        <VentasChart data={chartData} />

        <div className="lg:col-span-2 card">
          <p className="font-800 text-gr-text text-[14px] mb-4">Acciones rápidas</p>
          <div className="space-y-2.5">
            <QuickAction href="/ventas/nueva"  label="Nueva nota de venta"     color="gold"    icon={<ShoppingCart size={16} />} />
            <QuickAction href="/materia-prima" label="Registrar entrada MP"     color="primary" icon={<Wheat size={16} />} />
            <QuickAction href="/produccion"     label="Registrar producción"     color="ghost"   icon={<Package size={16} />} />
            <QuickAction href="/despachos"     label="Ver despachos pendientes" color="ghost"   icon={<TrendingUp size={16} />} />
          </div>
        </div>
      </div>

      <StockDestacado productos={productosDestacados} />
      <UltimasVentas ventas={ultimas4} />
    </div>
  );
}
