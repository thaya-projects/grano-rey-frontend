import Link from 'next/link';
import Image from 'next/image';
import { type NotaVenta, EstadoVenta, TipoFlete } from '@/lib/types';
import { Btn, Modal, EstadoBadge } from '@/components/ui';
import { BotonImprimir } from '@/components/print/BotonImprimir';
import { Zap, Truck, Printer, CheckCircle2 } from 'lucide-react';

export function RemisionModal({ venta: v, onClose, onDespachar }: {
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

      <div className="border border-gr-border rounded-[12px] overflow-hidden">
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
            <p className="text-gr-gold font-700 text-[12px]">N° GUÍA</p>
            <p className="text-white font-900 text-[28px]">{v.numeroGuia ? `G-${v.numeroGuia}` : '—'}</p>
            <p className="text-white/60 text-[12px]">{v.fecha}</p>
          </div>
        </div>

        <div className="bg-white px-6 py-5 space-y-4">
          {/* Destinatario + chofer — sin datos comerciales */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-700 text-gr-muted uppercase mb-1.5">Destinatario</p>
              <p className="font-800 text-gr-text text-[15px]">{cliente?.nombre ?? '—'}</p>
              {(cliente?.ciudad || cliente?.direccion) && (
                <p className="text-[12.5px] text-gr-muted">
                  {[cliente?.ciudad, cliente?.direccion].filter(Boolean).join(' · ')}
                </p>
              )}
              {cliente?.telefono && (
                <p className="text-[12.5px] text-gr-muted">Cel: <strong>{cliente.telefono}</strong></p>
              )}
            </div>
            <div>
              <p className="text-[11px] font-700 text-gr-muted uppercase mb-1.5">Chofer / Transportista</p>
              {transp ? (
                <>
                  <p className="font-800 text-gr-text">{transp.nombre}</p>
                  {transp.ci && (
                    <p className="text-[12.5px] text-gr-muted">CI {transp.ci}</p>
                  )}
                  <p className="text-[12.5px] text-gr-muted">
                    {transp.marca ?? ''}
                    {transp.placa ? ` · Placa: ` : ''}
                    {transp.placa && <strong>{transp.placa}</strong>}
                  </p>
                  {transp.telefono && (
                    <p className="text-[12.5px] text-gr-muted">Cel: {transp.telefono}</p>
                  )}
                </>
              ) : <p className="text-gr-muted text-[13px]">Sin asignar</p>}
            </div>
          </div>

          {/* Tabla de productos — SIN precios, solo cantidad de bolsas y lote */}
          <div className="border border-gr-border rounded-[10px] overflow-hidden">
            <div
              className="px-4 py-2.5 gap-3 text-[11px] font-700 text-white/85 uppercase tracking-wide"
              style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 120px 100px', background: 'var(--color-gr-primary)' }}
            >
              <span>Producto</span>
              <span>Lote</span>
              <span className="text-right">Bolsas</span>
            </div>
            {v.detalles.map((d, i) => (
              <div key={d.id ?? i}
                className={`px-4 py-3 gap-3 text-[13px] ${i < v.detalles.length - 1 ? 'border-b border-gr-border-lite' : ''}`}
                style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 120px 100px', alignItems: 'center' }}
              >
                <span className="font-600 truncate">{d.producto?.nombre ?? '—'}</span>
                <span className="text-gr-muted text-[12px] truncate">{d.lote?.codigoLote ?? '—'}</span>
                <span className="font-800 text-right whitespace-nowrap">
                  {Number(d.cantidad)} {d.unidad?.abreviatura ?? ''}
                </span>
              </div>
            ))}
          </div>

          {/* Total de bolsas — sin monto Bs */}
          <div className="flex justify-between font-900 text-[16px] text-gr-primary border-t border-gr-border pt-3">
            <span>TOTAL BOLSAS</span>
            <span>{v.detalles.reduce((s, d) => s + Number(d.cantidad ?? 0), 0)}</span>
          </div>

          {(() => {
            const responsableProd = v.detalles.map(d => d.lote?.responsable?.nombre).find(Boolean);
            return (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="border border-gr-border rounded-[10px] px-4 pt-8 pb-3 text-center">
                  <p className="text-[11px] font-700 text-gr-muted uppercase">Firma Responsable Producción</p>
                  {responsableProd && (
                    <p className="text-[12px] font-700 text-gr-text mt-1">{responsableProd}</p>
                  )}
                </div>
                <div className="border border-gr-border rounded-[10px] px-4 pt-8 pb-3 text-center">
                  <p className="text-[11px] font-700 text-gr-muted uppercase">Firma Transportista / Receptor</p>
                  {transp?.nombre && (
                    <p className="text-[12px] font-700 text-gr-text mt-1">{transp.nombre}</p>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="flex items-center justify-between pt-1 border-t border-gr-border-lite">
            <EstadoBadge estado={v.estado} />
            <div className="flex items-center gap-2 opacity-70">
              <span className="text-[10px] text-gr-muted uppercase tracking-wide">Producto</span>
              <div className="relative w-[80px] h-[36px]">
                <Image src="/logo-reynales.webp" alt="Reynales" fill className="object-contain" />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-gr-muted text-center italic">
            Próximamente: el cliente recibirá confirmación por WhatsApp al despachar
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-end items-center">
        <Btn variant="ghost" onClick={onClose}>Cerrar</Btn>
        <BotonImprimir ventaId={v.id} tipo="proforma"
          className="inline-flex items-center gap-2 bg-gr-gold-lite hover:bg-gr-gold text-gr-gold-dark font-700 px-3 py-2 rounded-[10px] text-[13px]" />
        <BotonImprimir ventaId={v.id} tipo="nota"
          className="inline-flex items-center gap-2 bg-gr-border-lite hover:bg-gr-border text-gr-text font-700 px-3 py-2 rounded-[10px] text-[13px]" />
        <Link href={`/ventas/${v.id}/imprimir?modo=combinada`}
          className="inline-flex items-center gap-2 bg-gr-border-lite hover:bg-gr-border text-gr-text font-700 px-3 py-2 rounded-[10px] text-[13px]">
          <Printer size={14} /> Combinada (nota + proforma)
        </Link>
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
