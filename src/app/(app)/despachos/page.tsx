'use client';
import { useState } from 'react';
import { useVentas, useCambiarEstadoVenta } from '@/lib/api/ventas';
import { type NotaVenta, EstadoVenta, TipoFlete } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { formatBs } from '@/lib/utils';
import { Btn, Modal, EstadoBadge, Badge, Spinner, useToast } from '@/components/ui';
import { Truck, CheckCircle2, Clock, Printer, ArrowRight, Package, Zap } from 'lucide-react';
import Image from 'next/image';

export default function DespachosPage() {
  const toast              = useToast(s => s.show);
  const ventasQ            = useVentas();
  const cambiarEstadoMut   = useCambiarEstadoVenta();
  const ventas             = ventasQ.data ?? [];
  const [remisionModal, setRemisionModal] = useState<NotaVenta | null>(null);

  const pendientes  = ventas.filter(v => v.estado === EstadoVenta.PENDIENTE);
  const despachadas = ventas.filter(v => v.estado === EstadoVenta.DESPACHADA);
  const entregadas  = ventas.filter(v => v.estado === EstadoVenta.ENTREGADA);

  async function marcarEstado(id: string, estado: EstadoVenta, msg: string) {
    try {
      await cambiarEstadoMut.mutateAsync({ id, estado });
      toast(msg, 'success');
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo cambiar el estado'), 'error');
    }
  }

  function marcarDespachado(id: string) {
    marcarEstado(id, EstadoVenta.DESPACHADA, 'Venta marcada como despachada');
    setRemisionModal(null);
  }

  function marcarEntregado(id: string) {
    marcarEstado(id, EstadoVenta.ENTREGADA, 'Venta marcada como entregada');
  }

  if (ventasQ.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner size={28} color="var(--color-gr-primary)" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-[22px] font-900 text-[var(--color-gr-text)]">Despachos</h1>
        <p className="text-[var(--color-gr-muted)] text-[13.5px] mt-0.5">
          Remisiones generadas automáticamente — revisa y despacha
        </p>
      </div>

      <div className="rounded-[12px] px-5 py-3.5 flex items-center gap-3"
        style={{ background: 'var(--color-gr-success-bg)', border: '1px solid rgba(46,125,82,0.2)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--color-gr-success)' }}>
          <Zap size={14} className="text-white" />
        </div>
        <div>
          <p className="font-700 text-[13.5px]" style={{ color: 'var(--color-gr-success)' }}>
            Remisión generada automáticamente ✓
          </p>
          <p className="text-[12px] text-[var(--color-gr-sub)]">
            Cada venta genera su remisión con número de guía, fecha y datos del cliente — lista para imprimir.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Por despachar', value: pendientes.length,  color: 'var(--color-gr-warning)' },
          { label: 'En tránsito',   value: despachadas.length, color: 'var(--color-gr-info)'    },
          { label: 'Entregadas',    value: entregadas.length,  color: 'var(--color-gr-success)'  },
        ].map(s => (
          <div key={s.label} className="card border-t-4 text-center"
            style={{ borderTopColor: s.color }}>
            <p className="text-[32px] font-900 leading-tight" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[12px] text-[var(--color-gr-muted)] font-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pendientes */}
      {pendientes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} style={{ color: 'var(--color-gr-warning)' }} />
            <h2 className="font-800 text-[var(--color-gr-text)] text-[15px]">Por despachar</h2>
          </div>
          <div className="space-y-3">
            {pendientes.map(v => (
              <RemisionCard key={v.id} venta={v}
                onVerRemision={() => setRemisionModal(v)}
                onDespachar={() => marcarDespachado(v.id)} />
            ))}
          </div>
        </div>
      )}

      {/* En tránsito */}
      {despachadas.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Truck size={15} style={{ color: 'var(--color-gr-info)' }} />
            <h2 className="font-800 text-[var(--color-gr-text)] text-[15px]">En tránsito</h2>
          </div>
          <div className="space-y-3">
            {despachadas.map(v => {
              const transp = v.transportista;
              return (
                <div key={v.id} className="card flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ background: 'var(--color-gr-info-bg)' }}>
                    <Truck size={18} style={{ color: 'var(--color-gr-info)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-700 text-[var(--color-gr-text)]">
                        NV-{v.numeroNota}
                        {v.numeroGuia ? ` · G-${v.numeroGuia}` : ''}
                      </p>
                      <EstadoBadge estado={v.estado} />
                      {v.tipoFlete === TipoFlete.CLIENTE_PAGA_DIRECTO && (
                        <span className="text-[11px] font-600 px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--color-gr-info-bg)', color: 'var(--color-gr-info)' }}>
                          Cliente paga flete
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[var(--color-gr-muted)]">
                      {v.cliente?.nombre ?? '—'} · {v.fecha} · {formatBs(Number(v.totalBs))}
                      {transp && ` · ${transp.nombre}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Btn size="sm" variant="ghost" onClick={() => setRemisionModal(v)}>Ver</Btn>
                    <Btn size="sm" variant="primary" onClick={() => marcarEntregado(v.id)}>
                      <CheckCircle2 size={13} /> Entregado
                    </Btn>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pendientes.length === 0 && despachadas.length === 0 && (
        <div className="rounded-[14px] px-6 py-10 text-center"
          style={{ background: 'var(--color-gr-success-bg)', border: '1px solid rgba(46,125,82,0.15)' }}>
          <CheckCircle2 size={36} style={{ color: 'var(--color-gr-success)' }} className="mx-auto mb-3" />
          <p className="font-800 text-[var(--color-gr-text)] text-[16px]">Todo al día</p>
          <p className="text-[var(--color-gr-muted)] text-[13px] mt-1">No hay ventas pendientes de despacho</p>
        </div>
      )}

      {remisionModal && (
        <RemisionModal
          venta={remisionModal}
          onClose={() => setRemisionModal(null)}
          onDespachar={(id) => {
            if (remisionModal.estado === EstadoVenta.PENDIENTE) marcarDespachado(id);
            else marcarEntregado(id);
          }}
        />
      )}
    </div>
  );
}

// ─── RemisionCard ──────────────────────────────────────────────────────────
function RemisionCard({ venta: v, onVerRemision, onDespachar }: {
  venta: NotaVenta; onVerRemision: () => void; onDespachar: () => void;
}) {
  const transp = v.transportista;
  return (
    <div className="card border-l-4 space-y-3"
      style={{ borderLeftColor: 'var(--color-gr-warning)' }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-800 text-[var(--color-gr-text)] text-[15px]">NV-{v.numeroNota}</p>
            {v.numeroGuia && <Badge color="gray">G-{v.numeroGuia}</Badge>}
            <EstadoBadge estado={v.estado} />
            {v.tipoFlete === TipoFlete.CLIENTE_PAGA_DIRECTO && (
              <span className="inline-flex items-center gap-1 text-[11px] font-600 px-2 py-0.5 rounded-full"
                style={{ background: 'var(--color-gr-info-bg)', color: 'var(--color-gr-info)' }}>
                <Truck size={10} /> Cliente paga flete al transportista
              </span>
            )}
          </div>
          <p className="text-[13px] text-[var(--color-gr-sub)]">{v.cliente?.nombre ?? '—'} · {v.fecha}</p>
        </div>
        <p className="font-900 text-[var(--color-gr-primary)] text-[18px]">{formatBs(Number(v.totalBs))}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {v.detalles.map((d, i) => (
          <div key={d.id ?? i} className="flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12px]"
            style={{ background: 'var(--color-gr-border-lite)' }}>
            <Package size={12} className="text-[var(--color-gr-primary)]" />
            <span className="font-600">{Number(d.cantidad)} {d.unidad?.abreviatura ?? ''}</span>
            <span className="text-[var(--color-gr-muted)]">{(d.producto?.nombre ?? '').split(' ').slice(0, 3).join(' ')}</span>
            {d.lote && <span className="text-[var(--color-gr-muted)]">· {d.lote.codigoLote}</span>}
          </div>
        ))}
      </div>

      {transp && (
        <p className="text-[12.5px] text-[var(--color-gr-muted)]">
          <Truck size={12} className="inline mr-1" />
          {transp.nombre}
          {transp.placa ? ` · ${transp.placa}` : ''}
          {transp.marca ? ` · ${transp.marca}` : ''}
        </p>
      )}

      <div className="flex gap-2">
        <Btn variant="ghost" size="sm" onClick={onVerRemision}><Printer size={13} /> Ver remisión</Btn>
        <Btn variant="primary" size="sm" onClick={onDespachar}>
          <Truck size={13} /> Marcar despachado <ArrowRight size={13} />
        </Btn>
      </div>
    </div>
  );
}

// ─── RemisionModal ─────────────────────────────────────────────────────────
function RemisionModal({ venta: v, onClose, onDespachar }: {
  venta: NotaVenta; onClose: () => void; onDespachar: (id: string) => void;
}) {
  const transp = v.transportista;
  const cliente = v.cliente;
  return (
    <Modal open title={`Remisión — NV-${v.numeroNota}`} onClose={onClose} wide>
      <div className="flex items-center gap-2 rounded-[10px] px-4 py-2.5 mb-2"
        style={{ background: 'var(--color-gr-success-bg)' }}>
        <Zap size={14} style={{ color: 'var(--color-gr-success)' }} />
        <p className="text-[12.5px] font-600" style={{ color: 'var(--color-gr-success)' }}>
          Remisión generada automáticamente ✓
        </p>
        <span className="ml-auto"><EstadoBadge estado={v.estado} /></span>
      </div>

      {v.tipoFlete === TipoFlete.CLIENTE_PAGA_DIRECTO && (
        <div className="flex items-center gap-2 rounded-[10px] px-4 py-2.5 mb-2"
          style={{ background: 'var(--color-gr-info-bg)' }}>
          <Truck size={14} style={{ color: 'var(--color-gr-info)' }} />
          <p className="text-[12.5px] font-600" style={{ color: 'var(--color-gr-info)' }}>
            Cliente paga flete directamente al transportista
          </p>
        </div>
      )}

      <div className="border border-[var(--color-gr-border)] rounded-[12px] overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between"
          style={{ background: 'var(--color-gr-primary)' }}>
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-[10px] p-1.5">
              <div className="relative w-[100px] h-[46px]">
                <Image src="/logo-grano-rey.webp" alt="Grano Rey" fill className="object-contain" />
              </div>
            </div>
            <p className="text-white/60 text-[10px] uppercase tracking-widest">Remisión de Entrega</p>
          </div>
          <div className="text-right">
            <p className="text-[var(--color-gr-gold)] font-700 text-[12px]">N° GUÍA</p>
            <p className="text-white font-900 text-[28px]">{v.numeroGuia ? `G-${v.numeroGuia}` : '—'}</p>
            <p className="text-white/60 text-[12px]">{v.fecha}</p>
          </div>
        </div>

        <div className="bg-white px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1.5">Cliente / Destinatario</p>
              <p className="font-800 text-[var(--color-gr-text)] text-[15px]">{cliente?.nombre ?? '—'}</p>
              <p className="text-[12.5px] text-[var(--color-gr-muted)]">{cliente?.ciudad ?? ''}</p>
            </div>
            <div>
              <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1.5">Transportista</p>
              {transp ? (
                <>
                  <p className="font-800 text-[var(--color-gr-text)]">{transp.nombre}</p>
                  <p className="text-[12.5px] text-[var(--color-gr-muted)]">
                    {transp.marca ?? ''}{transp.placa ? ` · Placa: ` : ''}{transp.placa && <strong>{transp.placa}</strong>}
                  </p>
                </>
              ) : <p className="text-[var(--color-gr-muted)] text-[13px]">Sin asignar</p>}
            </div>
          </div>

          <div className="border border-[var(--color-gr-border)] rounded-[10px] overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] px-4 py-2.5 gap-3 text-[11px] font-700 text-white/80 uppercase"
              style={{ background: 'var(--color-gr-primary)' }}>
              <span>Producto</span><span>Lote</span><span>Cantidad</span><span>Total Bs</span>
            </div>
            {v.detalles.map((d, i) => (
              <div key={d.id ?? i} className={`grid grid-cols-[1fr_auto_auto_auto] px-4 py-3 gap-3 text-[13px] ${i < v.detalles.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}>
                <span className="font-600">{d.producto?.nombre ?? '—'}</span>
                <span className="text-[var(--color-gr-muted)]">{d.lote?.codigoLote ?? '—'}</span>
                <span className="font-700">{Number(d.cantidad)} {d.unidad?.abreviatura ?? ''}</span>
                <span className="font-800 text-[var(--color-gr-primary)]">{formatBs(Number(d.valorTotalBs))}</span>
              </div>
            ))}
          </div>

          {v.tipoFlete === TipoFlete.INCLUIDO_EN_VENTA && Number(v.fleteBs) > 0 && (
            <div className="flex justify-between text-[13px] text-[var(--color-gr-info)]">
              <span>Flete incluido</span><span>+{formatBs(Number(v.fleteBs))}</span>
            </div>
          )}

          <div className="flex justify-between font-900 text-[18px] text-[var(--color-gr-primary)] border-t border-[var(--color-gr-border)] pt-3">
            <span>TOTAL</span><span>{formatBs(Number(v.totalBs))}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="border border-[var(--color-gr-border)] rounded-[10px] px-4 py-8 text-center">
              <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase">Firma Responsable Producción</p>
            </div>
            <div className="border border-[var(--color-gr-border)] rounded-[10px] px-4 py-8 text-center">
              <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase">Firma Transportista / Receptor</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[var(--color-gr-border-lite)]">
            <EstadoBadge estado={v.estado} />
            <div className="flex items-center gap-2 opacity-70">
              <span className="text-[10px] text-[var(--color-gr-muted)] uppercase tracking-wide">Producto</span>
              <div className="relative w-[80px] h-[36px]">
                <Image src="/logo-reynales.webp" alt="Reynales" fill className="object-contain" />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[var(--color-gr-muted)] text-center italic">
            Próximamente: el cliente recibirá confirmación por WhatsApp al despachar
          </p>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Btn variant="ghost" onClick={onClose}>Cerrar</Btn>
        <Btn variant="secondary" onClick={() => window.print()}><Printer size={14} /> Imprimir</Btn>
        {v.estado === EstadoVenta.PENDIENTE && (
          <Btn onClick={() => onDespachar(v.id)}>
            <Truck size={14} /> Marcar despachado
          </Btn>
        )}
        {v.estado === EstadoVenta.DESPACHADA && (
          <Btn variant="primary" onClick={() => { onDespachar(v.id); onClose(); }}>
            <CheckCircle2 size={14} /> Confirmar entregado
          </Btn>
        )}
      </div>
    </Modal>
  );
}
