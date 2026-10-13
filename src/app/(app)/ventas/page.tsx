'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVentas, useCambiarEstadoVenta } from '@/lib/api/ventas';
import type { NotaVenta } from '@/lib/types';
import { EstadoVenta, EstadoPagoVenta } from '@/lib/types';
import { formatBs } from '@/lib/utils';
import { EstadoBadge, SearchBox, Spinner, useToast, IconBtn } from '@/components/ui';
import { DataTable } from '@/components/ui/Table';
import { Plus, ShoppingCart, Eye, Banknote, Ban } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { PagoBadge } from './_components/PagoBadge';
import { DetalleModal } from './_components/DetalleModal';
import { CobrarModal } from './_components/CobrarModal';
import { AnularVentaModal } from './_components/AnularVentaModal';

const FILTROS = ['Hoy', 'Esta semana', 'Este mes', 'Personalizado', 'Todos'] as const;

export default function VentasPage() {
  const toast              = useToast(s => s.show);
  const ventasQ            = useVentas();
  const cambiarEstadoMut   = useCambiarEstadoVenta();
  const ventas             = ventasQ.data ?? [];
  const [filtro, setFiltro]             = useState<typeof FILTROS[number]>('Todos');
  const [search, setSearch]             = useState('');
  const [detalleVenta, setDetalleVenta] = useState<NotaVenta | null>(null);
  const [cobrarVenta, setCobrarVenta]   = useState<NotaVenta | null>(null);
  const [anularVenta, setAnularVenta]   = useState<NotaVenta | null>(null);
  const [fechaDesde, setFechaDesde]     = useState('');
  const [fechaHasta, setFechaHasta]     = useState('');

  const ahora    = new Date();
  const hoy      = ahora.toISOString().slice(0, 10);
  const lunes    = new Date(ahora); lunes.setDate(ahora.getDate() - ahora.getDay() + 1);
  const primerMes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

  const filtradas = ventas.filter(v => {
    let matchFiltro = true;
    if (filtro === 'Hoy')              matchFiltro = v.fecha === hoy;
    else if (filtro === 'Esta semana') matchFiltro = new Date(v.fecha) >= lunes;
    else if (filtro === 'Este mes')    matchFiltro = v.fecha.startsWith(primerMes);
    else if (filtro === 'Personalizado') {
      if (fechaDesde && v.fecha < fechaDesde) matchFiltro = false;
      if (fechaHasta && v.fecha > fechaHasta) matchFiltro = false;
    }
    const clienteNombre = v.cliente?.nombre ?? '';
    const matchSearch = !search
      || clienteNombre.toLowerCase().includes(search.toLowerCase())
      || String(v.numeroNota).includes(search)
      || v.detalles.some(d => (d.producto?.nombre ?? '').toLowerCase().includes(search.toLowerCase()));
    return matchFiltro && matchSearch;
  });

  const totalMostrado   = filtradas.reduce((s, v) => s + Number(v.totalBs), 0);
  const porCobrarCount  = ventas.filter(v => v.estadoPago === EstadoPagoVenta.PENDIENTE).length;
  const porCobrarTotal  = ventas
    .filter(v => v.estadoPago === EstadoPagoVenta.PENDIENTE)
    .reduce((s, v) => s + Number(v.totalBs), 0);

  async function cambiarEstado(id: string) {
    const venta = ventas.find(v => v.id === id);
    if (!venta) return;
    const cycle: Record<string, EstadoVenta> = {
      [EstadoVenta.PENDIENTE]:  EstadoVenta.DESPACHADA,
      [EstadoVenta.DESPACHADA]: EstadoVenta.ENTREGADA,
      [EstadoVenta.ENTREGADA]:  EstadoVenta.PENDIENTE,
    };
    const next = cycle[venta.estado];
    if (!next) return;
    try {
      await cambiarEstadoMut.mutateAsync({ id, estado: next });
      toast('Estado actualizado', 'success');
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo cambiar el estado'), 'error');
    }
  }

  if (ventasQ.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner size={28} color="var(--color-gr-primary)" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-900 text-gr-text">Ventas</h1>
          <p className="text-gr-muted text-[13.5px] mt-0.5">Historial de notas de venta</p>
        </div>
        <Link href="/ventas/nueva"
          className="flex items-center gap-2 bg-gr-gold text-[#1a0e00] font-700 px-4 py-2.5 rounded-[12px] text-[14px] hover:bg-gr-gold-dark transition-all">
          <Plus size={16} /> Nueva venta
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pendientes',  value: ventas.filter(v => v.estado === EstadoVenta.PENDIENTE).length,  color: 'text-gr-warning' },
          { label: 'Despachadas', value: ventas.filter(v => v.estado === EstadoVenta.DESPACHADA).length, color: 'text-gr-info'    },
          { label: 'Entregadas',  value: ventas.filter(v => v.estado === EstadoVenta.ENTREGADA).length,  color: 'text-gr-success' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className={`text-[28px] font-900 ${s.color}`}>{s.value}</p>
            <p className="text-[12px] text-gr-muted font-500">{s.label}</p>
          </div>
        ))}
        {/* Por cobrar — destacado */}
        <div className="card text-center border-l-4" style={{ borderLeftColor: '#e67e00' }}>
          <p className="text-[28px] font-900" style={{ color: '#e67e00' }}>{porCobrarCount}</p>
          <p className="text-[12px] text-gr-muted font-500">Por cobrar</p>
          {porCobrarCount > 0 && (
            <p className="text-[11px] font-700 mt-0.5" style={{ color: '#e67e00' }}>{formatBs(porCobrarTotal)}</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 bg-white border border-gr-border rounded-[10px] p-1">
          {FILTROS.map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-600 transition-all ${filtro === f ? 'bg-gr-primary text-white' : 'text-gr-muted hover:text-gr-text'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px]">
          <SearchBox value={search} onChange={setSearch} placeholder="Buscar por nota, cliente o producto..." />
        </div>
      </div>

      {filtro === 'Personalizado' && (
        <div className="flex flex-wrap items-end gap-3 bg-gr-border-lite rounded-[10px] p-3">
          <div>
            <label className="block text-[11px] font-700 text-gr-muted uppercase mb-1">Desde</label>
            <input type="date" value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              className="border border-gr-border rounded-[8px] px-3 py-1.5 text-[13px] bg-white" />
          </div>
          <div>
            <label className="block text-[11px] font-700 text-gr-muted uppercase mb-1">Hasta</label>
            <input type="date" value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
              className="border border-gr-border rounded-[8px] px-3 py-1.5 text-[13px] bg-white" />
          </div>
          {(fechaDesde || fechaHasta) && (
            <button
              onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
              className="text-[12px] font-600 text-gr-primary underline">
              Limpiar
            </button>
          )}
        </div>
      )}

      {/* Total visible */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[13px] text-gr-muted">{filtradas.length} {filtradas.length === 1 ? 'nota' : 'notas'}</p>
        <p className="text-[14px] font-700 text-gr-primary">Total: {formatBs(totalMostrado)}</p>
      </div>

      <DataTable
        data={filtradas}
        keyFn={v => v.id}
        onRowClick={setDetalleVenta}
        emptyMessage="Sin resultados para este filtro"
        minWidth={1100}
        columns={[
          { header: 'Nota', width: '90px', render: v => <span className="font-800">NV-{v.numeroNota}</span> },
          {
            header: 'Guía', width: '80px',
            render: v => v.numeroGuia
              ? <span className="font-700 text-gr-gold-dark">G-{v.numeroGuia}</span>
              : <span className="text-gr-muted">—</span>,
          },
          {
            header: 'Cliente', width: '180px',
            render: v => (
              <>
                <p className="font-600 text-gr-text truncate">{v.cliente?.nombre ?? '—'}</p>
                <p className="text-[11.5px] text-gr-muted">{v.fecha}</p>
              </>
            ),
          },
          {
            header: 'Producto(s)', width: '170px',
            className: 'text-gr-sub',
            render: v => {
              // Un mismo producto puede venir repartido en varios lotes (varios "detalles"
              // del backend) — contamos productos DISTINTOS, no filas de detalle crudas,
              // para no mostrar "+1" cuando en realidad es el mismo producto en otro lote.
              const productosUnicos = [...new Set(v.detalles.map(d => d.producto?.id ?? d.producto?.nombre ?? ''))];
              return (
                <span className="truncate block">
                  {v.detalles[0]?.producto?.nombre ?? '—'}
                  {productosUnicos.length > 1 && <span className="text-gr-muted"> +{productosUnicos.length - 1}</span>}
                </span>
              );
            },
          },
          {
            header: 'Total', align: 'right', width: '110px',
            render: v => <span className="font-800 text-gr-primary">{formatBs(Number(v.totalBs))}</span>,
          },
          { header: 'Estado', width: '120px', render: v => <EstadoBadge estado={v.estado} /> },
          { header: 'Cobro', width: '130px', render: v => <PagoBadge estado={v.estadoPago} metodo={v.metodoPago} /> },
          {
            header: '', align: 'right', width: '220px',
            render: v => (
              <div className="flex gap-1.5 justify-end" onClick={e => e.stopPropagation()}>
                <IconBtn tooltip="Ver detalle" onClick={() => setDetalleVenta(v)}>
                  <Eye size={15} />
                </IconBtn>
                <IconBtn tooltip="Cambiar estado (despachar/entregar)" variant="primary" onClick={() => cambiarEstado(v.id)}>
                  <ShoppingCart size={15} />
                </IconBtn>
                {v.estadoPago === EstadoPagoVenta.PENDIENTE && (
                  <IconBtn tooltip="Registrar cobro" variant="gold" onClick={() => setCobrarVenta(v)}>
                    <Banknote size={15} />
                  </IconBtn>
                )}
                {v.estado === EstadoVenta.PENDIENTE && (
                  <IconBtn tooltip="Anular venta" variant="danger" onClick={() => setAnularVenta(v)}>
                    <Ban size={15} />
                  </IconBtn>
                )}
              </div>
            ),
          },
        ]}
      />

      {detalleVenta && (
        <DetalleModal
          venta={detalleVenta}
          onClose={() => setDetalleVenta(null)}
          onCambiarEstado={cambiarEstado}
          onCobrar={(v) => { setDetalleVenta(null); setCobrarVenta(v); }}
          onAnular={(v) => { setDetalleVenta(null); setAnularVenta(v); }}
        />
      )}

      {cobrarVenta && (
        <CobrarModal
          venta={cobrarVenta}
          onClose={() => setCobrarVenta(null)}
          onCobrada={() => { setCobrarVenta(null); toast('Cobro registrado', 'success'); }}
        />
      )}

      {anularVenta && (
        <AnularVentaModal
          venta={anularVenta}
          onClose={() => setAnularVenta(null)}
          onAnulada={() => { setAnularVenta(null); toast('Venta anulada', 'warning'); }}
        />
      )}
    </div>
  );
}
