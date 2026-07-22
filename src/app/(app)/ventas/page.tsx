'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVentas, useCambiarEstadoVenta, useCobrarVenta } from '@/lib/api/ventas';
import type { NotaVenta } from '@/lib/types';
import { EstadoVenta, EstadoPagoVenta, MetodoPago } from '@/lib/types';
import { formatBs } from '@/lib/utils';
import { EstadoBadge, Btn, Modal, SearchBox, Spinner, FormField, Select, Input, useToast, IconBtn } from '@/components/ui';
import { Plus, ShoppingCart, Printer, Eye, CheckCircle, Banknote } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import Image from 'next/image';

const FILTROS = ['Hoy', 'Esta semana', 'Este mes', 'Personalizado', 'Todos'] as const;

const METODO_LABEL: Record<string, string> = {
  efectivo:      'Efectivo',
  qr:            'QR',
  transferencia: 'Transferencia',
};

function PagoBadge({ estado, metodo }: { estado: EstadoPagoVenta; metodo?: string | null }) {
  if (estado === EstadoPagoVenta.COBRADO) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-700 px-2 py-0.5 rounded-full"
        style={{ background: 'var(--color-gr-success)18', color: 'var(--color-gr-success)' }}>
        <CheckCircle size={10} /> {metodo ? METODO_LABEL[metodo] ?? metodo : 'Cobrado'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-700 px-2 py-0.5 rounded-full"
      style={{ background: '#ff980018', color: '#e67e00' }}>
      <Banknote size={10} /> Por cobrar
    </span>
  );
}

export default function VentasPage() {
  const toast              = useToast(s => s.show);
  const ventasQ            = useVentas();
  const cambiarEstadoMut   = useCambiarEstadoVenta();
  const ventas             = ventasQ.data ?? [];
  const [filtro, setFiltro]             = useState<typeof FILTROS[number]>('Todos');
  const [search, setSearch]             = useState('');
  const [detalleVenta, setDetalleVenta] = useState<NotaVenta | null>(null);
  const [cobrarVenta, setCobrarVenta]   = useState<NotaVenta | null>(null);
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
          <h1 className="text-[22px] font-900 text-[var(--color-gr-text)]">Ventas</h1>
          <p className="text-[var(--color-gr-muted)] text-[13.5px] mt-0.5">Historial de notas de venta</p>
        </div>
        <Link href="/ventas/nueva"
          className="flex items-center gap-2 bg-[var(--color-gr-gold)] text-[#1a0e00] font-700 px-4 py-2.5 rounded-[12px] text-[14px] hover:bg-[var(--color-gr-gold-dark)] transition-all">
          <Plus size={16} /> Nueva venta
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
        {/* Por cobrar — destacado */}
        <div className="card text-center border-l-4" style={{ borderLeftColor: '#e67e00' }}>
          <p className="text-[28px] font-900" style={{ color: '#e67e00' }}>{porCobrarCount}</p>
          <p className="text-[12px] text-[var(--color-gr-muted)] font-500">Por cobrar</p>
          {porCobrarCount > 0 && (
            <p className="text-[11px] font-700 mt-0.5" style={{ color: '#e67e00' }}>{formatBs(porCobrarTotal)}</p>
          )}
        </div>
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

      {filtro === 'Personalizado' && (
        <div className="flex flex-wrap items-end gap-3 bg-[var(--color-gr-border-lite)] rounded-[10px] p-3">
          <div>
            <label className="block text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">Desde</label>
            <input type="date" value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              className="border border-[var(--color-gr-border)] rounded-[8px] px-3 py-1.5 text-[13px] bg-white" />
          </div>
          <div>
            <label className="block text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">Hasta</label>
            <input type="date" value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
              className="border border-[var(--color-gr-border)] rounded-[8px] px-3 py-1.5 text-[13px] bg-white" />
          </div>
          {(fechaDesde || fechaHasta) && (
            <button
              onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
              className="text-[12px] font-600 text-[var(--color-gr-primary)] underline">
              Limpiar
            </button>
          )}
        </div>
      )}

      {/* Total visible */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[13px] text-[var(--color-gr-muted)]">{filtradas.length} {filtradas.length === 1 ? 'nota' : 'notas'}</p>
        <p className="text-[14px] font-700 text-[var(--color-gr-primary)]">Total: {formatBs(totalMostrado)}</p>
      </div>

      {/* Table */}
      <div className="rounded-[16px] border border-[var(--color-gr-border)] overflow-x-auto bg-white">
        <table className="w-full text-[13px]" style={{ minWidth: 680 }}>
          <thead>
            <tr style={{ background: 'var(--color-gr-primary)' }}>
              {['Nota', 'Guía', 'Cliente', 'Producto(s)', 'Total', 'Estado', 'Cobro', ''].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] font-700 text-white uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-[var(--color-gr-muted)]">Sin resultados para este filtro</td>
              </tr>
            ) : filtradas.map((v, i) => (
              <tr key={v.id}
                className="cursor-pointer hover:bg-[var(--color-gr-primary-lite)] transition-colors border-b border-[var(--color-gr-border-lite)]"
                style={{ background: i % 2 === 1 ? 'var(--color-gr-border-lite)' : '#fff' }}
                onClick={() => setDetalleVenta(v)}>
                <td className="px-4 py-3 font-800 whitespace-nowrap">NV-{v.numeroNota}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {v.numeroGuia ? (
                    <span className="font-700 text-[var(--color-gr-gold-dark)]">G-{v.numeroGuia}</span>
                  ) : (
                    <span className="text-[var(--color-gr-muted)]">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-600 text-[var(--color-gr-text)] whitespace-nowrap">{v.cliente?.nombre ?? '—'}</p>
                  <p className="text-[11.5px] text-[var(--color-gr-muted)]">{v.fecha}</p>
                </td>
                <td className="px-4 py-3 text-[var(--color-gr-sub)] whitespace-nowrap">
                  {v.detalles[0]?.producto?.nombre ?? '—'}
                  {v.detalles.length > 1 && <span className="text-[var(--color-gr-muted)]"> +{v.detalles.length - 1}</span>}
                </td>
                <td className="px-4 py-3 font-800 text-[var(--color-gr-primary)] whitespace-nowrap text-right">
                  {formatBs(Number(v.totalBs))}
                </td>
                <td className="px-4 py-3 whitespace-nowrap"><EstadoBadge estado={v.estado} /></td>
                <td className="px-4 py-3 whitespace-nowrap"><PagoBadge estado={v.estadoPago} metodo={v.metodoPago} /></td>
                <td className="px-4 py-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-1.5 justify-end">
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detalleVenta && (
        <DetalleModal
          venta={detalleVenta}
          onClose={() => setDetalleVenta(null)}
          onCambiarEstado={cambiarEstado}
          onCobrar={(v) => { setDetalleVenta(null); setCobrarVenta(v); }}
        />
      )}

      {cobrarVenta && (
        <CobrarModal
          venta={cobrarVenta}
          onClose={() => setCobrarVenta(null)}
          onCobrada={() => { setCobrarVenta(null); toast('Cobro registrado', 'success'); }}
        />
      )}
    </div>
  );
}

// ─── Cobrar Modal ──────────────────────────────────────────────────────────
function CobrarModal({ venta, onClose, onCobrada }: {
  venta: NotaVenta;
  onClose: () => void;
  onCobrada: () => void;
}) {
  const cobrar = useCobrarVenta();
  const toast  = useToast(s => s.show);
  const [metodo, setMetodo] = useState<MetodoPago>(MetodoPago.EFECTIVO);
  const [fecha, setFecha]   = useState(new Date().toISOString().slice(0, 10));

  async function handleCobrar() {
    try {
      await cobrar.mutateAsync({ id: venta.id, metodoPago: metodo, fechaCobro: fecha });
      onCobrada();
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo registrar el cobro'), 'error');
    }
  }

  return (
    <Modal open title={`Registrar cobro — NV-${venta.numeroNota}`} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleCobrar} loading={cobrar.isPending} variant="green">
          <CheckCircle size={14} /> Confirmar cobro
        </Btn>
      </>}>
      <div className="rounded-[10px] px-4 py-3 text-[13.5px]" style={{ background: 'var(--color-gr-primary-lite)' }}>
        <p className="text-[var(--color-gr-muted)]">Cliente</p>
        <p className="font-800 text-[var(--color-gr-text)]">{venta.cliente?.nombre}</p>
        <p className="text-[22px] font-900 text-[var(--color-gr-primary)] mt-1">{formatBs(Number(venta.totalBs))}</p>
      </div>
      <FormField label="Método de pago" required>
        <Select value={metodo} onChange={e => setMetodo(e.target.value as MetodoPago)}>
          <option value={MetodoPago.EFECTIVO}>Efectivo</option>
          <option value={MetodoPago.QR}>QR</option>
          <option value={MetodoPago.TRANSFERENCIA}>Transferencia bancaria</option>
        </Select>
      </FormField>
      <FormField label="Fecha de cobro" required>
        <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
      </FormField>
    </Modal>
  );
}

// ─── Detalle Modal ─────────────────────────────────────────────────────────
function DetalleModal({ venta: v, onClose, onCambiarEstado, onCobrar }: {
  venta: NotaVenta;
  onClose: () => void;
  onCambiarEstado: (id: string) => void;
  onCobrar: (v: NotaVenta) => void;
}) {
  const transportista = v.transportista;
  return (
    <Modal open title={`Nota de Venta NV-${v.numeroNota}`} onClose={onClose} xl>
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
            <div
              className="bg-[var(--color-gr-primary)] px-4 py-2.5 gap-3 text-[11px] font-700 text-white/80 uppercase tracking-wide"
              style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 90px 110px 120px' }}
            >
              <span>Producto</span>
              <span className="text-right">Cant.</span>
              <span className="text-right">Precio</span>
              <span className="text-right">Total</span>
            </div>
            {v.detalles.map((d, i) => (
              <div key={d.id ?? i}
                className={`px-4 py-3 gap-3 text-[13.5px] ${i < v.detalles.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}
                style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 90px 110px 120px', alignItems: 'center' }}
              >
                <div className="min-w-0">
                  <p className="font-600 truncate">{d.producto?.nombre ?? '—'}</p>
                  {d.lote && (
                    <p className="text-[11.5px] text-[var(--color-gr-muted)] truncate">Lote {d.lote.codigoLote}</p>
                  )}
                </div>
                <span className="text-right whitespace-nowrap">{Number(d.cantidad)} {d.unidad?.abreviatura ?? d.unidad?.codigo ?? ''}</span>
                <span className="text-right whitespace-nowrap">{formatBs(Number(d.precioUnitarioBs))}</span>
                <span className="text-right font-800 text-[var(--color-gr-primary)] whitespace-nowrap">{formatBs(Number(d.valorTotalBs))}</span>
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

          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-gr-border-lite)]">
            <div className="flex items-center gap-2">
              <EstadoBadge estado={v.estado} />
              <PagoBadge estado={v.estadoPago} metodo={v.metodoPago} />
            </div>
            {v.estadoPago === EstadoPagoVenta.COBRADO && v.fechaCobro && (
              <p className="text-[11.5px] text-[var(--color-gr-muted)]">Cobrado el {v.fechaCobro}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Btn variant="ghost" onClick={onClose}>Cerrar</Btn>
        {v.estadoPago === EstadoPagoVenta.PENDIENTE && (
          <Btn variant="green" onClick={() => onCobrar(v)}>
            <Banknote size={14} /> Cobrar
          </Btn>
        )}
        <Btn variant="secondary" onClick={() => { onCambiarEstado(v.id); onClose(); }}>
          <ShoppingCart size={14} /> Cambiar estado
        </Btn>
        <Link href={`/ventas/${v.id}/imprimir?modo=nota`}
          className="inline-flex items-center gap-2 bg-[var(--color-gr-border-lite)] hover:bg-[var(--color-gr-border)] text-[var(--color-gr-text)] font-700 px-3 py-2 rounded-[10px] text-[13px]">
          <Printer size={14} /> Nota
        </Link>
        <Link href={`/ventas/${v.id}/imprimir?modo=proforma`}
          className="inline-flex items-center gap-2 bg-[var(--color-gr-gold-lite)] hover:bg-[var(--color-gr-gold)] text-[var(--color-gr-gold-dark)] font-700 px-3 py-2 rounded-[10px] text-[13px]">
          <Printer size={14} /> Proforma
        </Link>
        <Link href={`/ventas/${v.id}/imprimir?modo=combinada`}
          className="inline-flex items-center gap-2 bg-[var(--color-gr-primary)] hover:bg-[var(--color-gr-primary-mid)] text-white font-700 px-3 py-2 rounded-[10px] text-[13px]">
          <Printer size={14} /> Combinada (Grano Rey)
        </Link>
      </div>
    </Modal>
  );
}
