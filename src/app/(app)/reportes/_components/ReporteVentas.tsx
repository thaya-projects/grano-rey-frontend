'use client';
import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useVentas } from '@/lib/api/ventas';
import { EstadoVenta } from '@/lib/types';
import { formatBs, formatNum, kgToQQ } from '@/lib/utils';
import { Badge, SearchBox, Spinner, Pagination, usePagination, KpiCard } from '@/components/ui';
import { Trophy } from 'lucide-react';
import { agruparDetallesPorProducto } from './helpers';

const VentasPDFLink = dynamic(
  () => import('@/components/pdf/VentasPDF').then(m => m.VentasPDFLink),
  { ssr: false, loading: () => <span className="text-[12px] text-gr-muted">…</span> },
);

const COLS_VENTAS = '50px 90px 160px 1fr 90px 110px 105px';

export function ReporteVentas() {
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
    detalles: agruparDetallesPorProducto(v.detalles).map(x => ({ productoNombre: x.nombre, cantidad: x.cantidad })),
  }));

  const MEDALS = ['🥇','🥈','🥉'];

  const ventasPag = usePagination(filtered);
  useEffect(() => { ventasPag.setPage(1); }, [search, filterCliente, filterEstado, fechaDesde, fechaHasta]);

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
        <KpiCard label="Ventas" value={String(filtered.length)} color="primary" />
        <KpiCard label="Quintales (QQ)" value={formatNum(totalQQ, 2)} color="primary" />
        <KpiCard label="Total Bs" value={formatBs(totalBs)} color="success" />
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
          ) : ventasPag.pageItems.map((v, i) => {
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
                  {agruparDetallesPorProducto(v.detalles).map(x => `${x.nombre} ×${formatNum(x.cantidad, 0)}`).join(' · ')}
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
          <Pagination page={ventasPag.page} totalPages={ventasPag.totalPages} onChange={ventasPag.setPage}
            pageSize={ventasPag.pageSize} onPageSizeChange={ventasPag.setPageSize} total={ventasPag.total} />
        </div>
      </div>
    </div>
  );
}
