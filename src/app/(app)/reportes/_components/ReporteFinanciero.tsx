'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useVentas } from '@/lib/api/ventas';
import { useGastos } from '@/lib/api/gastos';
import { CategoriaGasto } from '@/lib/types';
import { formatBs } from '@/lib/utils';
import { Spinner, KpiCard } from '@/components/ui';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { type AgrupacionTipo, filterByPeriod, buildChartData, getPeriodLabel } from './helpers';
import { AgrupacionSelector } from './AgrupacionSelector';

const ResumenFinancieroPDFLink = dynamic(
  () => import('@/components/pdf/ResumenFinancieroPDF').then(m => m.ResumenFinancieroPDFLink),
  { ssr: false, loading: () => <span className="text-[12px] text-gr-muted">…</span> },
);

export function ReporteFinanciero() {
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
        <KpiCard label="Ingresos" value={formatBs(resumen.ingresosBs)} color="success" />
        <KpiCard label="Egresos"  value={formatBs(resumen.egresosBs)}  color="danger" />
        <KpiCard label="Utilidad" value={formatBs(resumen.utilidadBs)} color={resumen.utilidadBs >= 0 ? 'success' : 'danger'} />
        <KpiCard label="Margen"   value={`${resumen.margenPct.toFixed(1)}%`}
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
          <div className="divide-y divide-gr-border-lite">
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
