'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVentas, useCambiarEstadoVenta } from '@/lib/api/ventas';
import type { NotaVenta } from '@/lib/types';
import { EstadoVenta } from '@/lib/types';
import { formatBs } from '@/lib/utils';
import { EstadoBadge, Btn, Modal, SearchBox, Spinner, useToast } from '@/components/ui';
import { Plus, ShoppingCart, Printer, Eye } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import Image from 'next/image';

const FILTROS = ['Hoy', 'Esta semana', 'Este mes', 'Todos'] as const;

export default function VentasPage() {
  const toast              = useToast(s => s.show);
  const ventasQ            = useVentas();
  const cambiarEstadoMut   = useCambiarEstadoVenta();
  const ventas             = ventasQ.data ?? [];
  const [filtro, setFiltro]           = useState<typeof FILTROS[number]>('Todos');
  const [search, setSearch]           = useState('');
  const [detalleVenta, setDetalleVenta] = useState<NotaVenta | null>(null);

  const ahora    = new Date();
  const hoy      = ahora.toISOString().slice(0, 10);
  const lunes    = new Date(ahora); lunes.setDate(ahora.getDate() - ahora.getDay() + 1);
  const primerMes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

  const filtradas = ventas.filter(v => {
    const matchFiltro =
      filtro === 'Todos'       ? true :
      filtro === 'Hoy'         ? v.fecha === hoy :
      filtro === 'Esta semana' ? new Date(v.fecha) >= lunes :
      v.fecha.startsWith(primerMes);
    const clienteNombre = v.cliente?.nombre ?? '';
    const matchSearch = !search
      || clienteNombre.toLowerCase().includes(search.toLowerCase())
      || String(v.numeroNota).includes(search)
      || v.detalles.some(d => (d.producto?.nombre ?? '').toLowerCase().includes(search.toLowerCase()));
    return matchFiltro && matchSearch;
  });

  const totalMostrado = filtradas.reduce((s, v) => s + Number(v.totalBs), 0);

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
          <h1 className="text-[22px] font-900 text-[var(--color-gr-text)]">Ventas</h1>
          <p className="text-[var(--color-gr-muted)] text-[13.5px] mt-0.5">Historial de notas de venta</p>
        </div>
        <Link href="/ventas/nueva"
          className="flex items-center gap-2 bg-[var(--color-gr-gold)] text-[#1a0e00] font-700 px-4 py-2.5 rounded-[12px] text-[14px] hover:bg-[var(--color-gr-gold-dark)] transition-all">
          <Plus size={16} /> Nueva venta
        </Link>
      </div>

      {/* Stats quick */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pendientes',  value: ventas.filter(v => v.estado === EstadoVenta.PENDIENTE).length,  color: 'text-[var(--color-gr-warning)]' },
          { label: 'Despachadas', value: ventas.filter(v => v.estado === EstadoVenta.DESPACHADA).length, color: 'text-[var(--color-gr-info)]'    },
          { label: 'Entregadas',  value: ventas.filter(v => v.estado === EstadoVenta.ENTREGADA).length,  color: 'text-[var(--color-gr-success)]' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className={`text-[28px] font-900 ${s.color}`}>{s.value}</p>
            <p className="text-[12px] text-[var(--color-gr-muted)] font-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 bg-white border border-[var(--color-gr-border)] rounded-[10px] p-1">
          {FILTROS.map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-600 transition-all ${filtro === f ? 'bg-[var(--color-gr-primary)] text-white' : 'text-[var(--color-gr-muted)] hover:text-[var(--color-gr-text)]'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px]">
          <SearchBox value={search} onChange={setSearch} placeholder="Buscar por nota, cliente o producto..." />
        </div>
      </div>

      {/* Total visible */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[13px] text-[var(--color-gr-muted)]">{filtradas.length} {filtradas.length === 1 ? 'nota' : 'notas'}</p>
        <p className="text-[14px] font-700 text-[var(--color-gr-primary)]">Total: {formatBs(totalMostrado)}</p>
      </div>

      {/* Table */}
      <div className="card-no-pad">
        <div className="hidden md:grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-4 px-5 py-3 bg-[var(--color-gr-border-lite)] border-b border-[var(--color-gr-border)] text-[11.5px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide">
          <span>Nota</span><span>Cliente</span><span>Producto(s)</span><span>Total</span><span>Estado</span><span></span>
        </div>

        {filtradas.length === 0 ? (
          <div className="py-16 text-center text-[var(--color-gr-muted)] text-[14px]">Sin resultados para este filtro</div>
        ) : (
          filtradas.map((v, i) => (
            <div key={v.id}
              className={`flex flex-col md:grid md:grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-3 md:gap-4 px-5 py-4 items-start md:items-center cursor-pointer hover:bg-[var(--color-gr-border-lite)] transition-colors ${i < filtradas.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}
              onClick={() => setDetalleVenta(v)}>
              <span className="font-800 text-[var(--color-gr-text)] text-[13px]">NV-{v.numeroNota}</span>
              <div>
                <p className="font-600 text-[var(--color-gr-text)] text-[13.5px]">{v.cliente?.nombre ?? '—'}</p>
                <p className="text-[12px] text-[var(--color-gr-muted)]">{v.fecha}</p>
              </div>
              <div>
                <p className="text-[13px] text-[var(--color-gr-sub)]">
                  {v.detalles[0]?.producto?.nombre ?? '—'}
                  {v.detalles.length > 1 && <span className="text-[var(--color-gr-muted)]"> +{v.detalles.length - 1}</span>}
                </p>
              </div>
              <span className="font-800 text-[var(--color-gr-primary)] text-[14px]">{formatBs(Number(v.totalBs))}</span>
              <EstadoBadge estado={v.estado} />
              <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                <Btn size="sm" variant="ghost" className="px-2.5" onClick={() => setDetalleVenta(v)}>
                  <Eye size={13} />
                </Btn>
                <Btn size="sm" variant="secondary" className="px-2.5" onClick={() => cambiarEstado(v.id)}>
                  <ShoppingCart size={13} />
                </Btn>
              </div>
            </div>
          ))
        )}
      </div>

      {detalleVenta && (
        <DetalleModal venta={detalleVenta} onClose={() => setDetalleVenta(null)} onCambiarEstado={cambiarEstado} />
      )}
    </div>
  );
}

function DetalleModal({ venta: v, onClose, onCambiarEstado }: { venta: NotaVenta; onClose: () => void; onCambiarEstado: (id: string) => void }) {
  const transportista = v.transportista;
  return (
    <Modal open title={`Nota de Venta NV-${v.numeroNota}`} onClose={onClose} wide>
      <div className="border-[1.5px] border-[var(--color-gr-border)] rounded-[12px] overflow-hidden">
        <div className="bg-[var(--color-gr-primary)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-[10px] p-1.5">
              <div className="relative w-[100px] h-[46px]">
                <Image src="/logo-grano-rey.webp" alt="Grano Rey" fill className="object-contain" />
              </div>
            </div>
            <p className="text-white/60 text-[10px] uppercase tracking-widest mt-1">Procesadora de Alimentos</p>
          </div>
          <div className="text-right">
            <p className="text-[var(--color-gr-gold)] font-800 text-[13px]">NOTA DE VENTA</p>
            <p className="text-white font-900 text-[22px]">NV-{v.numeroNota}</p>
            <p className="text-white/60 text-[12px]">{v.fecha}</p>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">Cliente</p>
              <p className="font-800 text-[var(--color-gr-text)]">{v.cliente?.nombre ?? '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">N° Guía</p>
              <p className="font-800 text-[var(--color-gr-text)]">{v.numeroGuia ? `G-${v.numeroGuia}` : '—'}</p>
            </div>
          </div>

          <div className="border border-[var(--color-gr-border)] rounded-[10px] overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] bg-[var(--color-gr-primary)] px-4 py-2.5 gap-3 text-[11px] font-700 text-white/80 uppercase">
              <span>Producto</span><span>Cant.</span><span>Precio</span><span>Total</span>
            </div>
            {v.detalles.map((d, i) => (
              <div key={d.id ?? i} className={`grid grid-cols-[1fr_auto_auto_auto] px-4 py-3 gap-3 text-[13px] ${i < v.detalles.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}>
                <div>
                  <p className="font-600">{d.producto?.nombre ?? '—'}</p>
                  {d.lote && (
                    <p className="text-[11.5px] text-[var(--color-gr-muted)]">Lote {d.lote.codigoLote}</p>
                  )}
                </div>
                <span>{Number(d.cantidad)} {d.unidad?.abreviatura ?? d.unidad?.codigo ?? ''}</span>
                <span>{formatBs(Number(d.precioUnitarioBs))}</span>
                <span className="font-800 text-[var(--color-gr-primary)]">{formatBs(Number(d.valorTotalBs))}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 text-[13.5px]">
            {Number(v.descuentoBs) > 0 && (
              <div className="flex justify-between text-[var(--color-gr-muted)]">
                <span>Descuento</span><span>-{formatBs(Number(v.descuentoBs))}</span>
              </div>
            )}
            {Number(v.fleteBs) > 0 && (
              <div className="flex justify-between text-[var(--color-gr-muted)]">
                <span>Flete</span><span>{formatBs(Number(v.fleteBs))}</span>
              </div>
            )}
            <div className="flex justify-between font-900 text-[18px] text-[var(--color-gr-primary)] pt-1 border-t border-[var(--color-gr-border)]">
              <span>TOTAL</span><span>{formatBs(Number(v.totalBs))}</span>
            </div>
          </div>

          {transportista && (
            <div className="bg-[var(--color-gr-border-lite)] rounded-[10px] px-4 py-3 text-[12.5px]">
              <p className="font-700 text-[var(--color-gr-sub)] mb-1">Transportista</p>
              <p>
                {transportista.nombre}
                {transportista.marca ? ` · ${transportista.marca}` : ''}
                {transportista.placa ? ` · ${transportista.placa}` : ''}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-[var(--color-gr-border-lite)]">
            <EstadoBadge estado={v.estado} />
            <div className="flex items-center gap-2 opacity-70">
              <span className="text-[10px] text-[var(--color-gr-muted)] uppercase tracking-wide">Producto</span>
              <div className="relative w-[80px] h-[36px]">
                <Image src="/logo-reynales.webp" alt="Reynales" fill className="object-contain" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Btn variant="ghost" onClick={onClose}>Cerrar</Btn>
        <Btn variant="secondary" onClick={() => { onCambiarEstado(v.id); onClose(); }}>
          <ShoppingCart size={14} /> Cambiar estado
        </Btn>
        <Btn onClick={() => window.print()}>
          <Printer size={14} /> Imprimir
        </Btn>
      </div>
    </Modal>
  );
}
