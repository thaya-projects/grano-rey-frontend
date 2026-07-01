'use client';
import type { NotaVenta } from '@/lib/types';
import { formatBs } from '@/lib/utils';
import Image from 'next/image';

export type ModoDocumento = 'nota' | 'proforma' | 'combinada';

interface Props {
  venta: NotaVenta;
  modo: ModoDocumento;
}

export function DocumentoVenta({ venta, modo }: Props) {
  if (modo === 'combinada') {
    return (
      <div className="print-combined" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8mm' }}>
        <DocumentoVentaSimple venta={venta} tipo="nota" />
        <DocumentoVentaSimple venta={venta} tipo="proforma" />
      </div>
    );
  }
  return <DocumentoVentaSimple venta={venta} tipo={modo} />;
}

function DocumentoVentaSimple({ venta, tipo }: { venta: NotaVenta; tipo: 'nota' | 'proforma' }) {
  const v = venta;
  const transp = v.transportista;
  const esProforma = tipo === 'proforma';

  return (
    <div className="border-[1.5px] border-[var(--color-gr-border)] rounded-[12px] overflow-hidden bg-white">
      <div className={`px-6 py-4 flex items-center justify-between ${esProforma ? 'bg-[var(--color-gr-gold-dark)]' : 'bg-[var(--color-gr-primary)]'}`}>
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-[10px] p-1.5">
            <div className="relative w-[90px] h-[40px]">
              <Image src="/logo-grano-rey.webp" alt="Grano Rey" fill className="object-contain" />
            </div>
          </div>
          <p className="text-white/60 text-[10px] uppercase tracking-widest mt-1">
            Procesadora de Alimentos
          </p>
        </div>
        <div className="text-right">
          <p className={`font-800 text-[12px] ${esProforma ? 'text-white' : 'text-[var(--color-gr-gold)]'}`}>
            {esProforma ? 'PROFORMA' : 'NOTA DE VENTA'}
          </p>
          <p className="text-white font-900 text-[22px]">
            {esProforma ? `P-${v.numeroNota}` : `NV-${v.numeroNota}`}
          </p>
          <p className="text-white/60 text-[12px]">{v.fecha}</p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-3 bg-white text-[13px]">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">Cliente</p>
            <p className="font-800 text-[var(--color-gr-text)]">{v.cliente?.nombre ?? '—'}</p>
            {v.cliente?.ciudad && <p className="text-[12px] text-[var(--color-gr-muted)]">{v.cliente.ciudad}</p>}
            {v.cliente?.nit && <p className="text-[12px] text-[var(--color-gr-muted)]">NIT: {v.cliente.nit}</p>}
          </div>
          <div>
            <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">N° Guía</p>
            <p className="font-800 text-[var(--color-gr-text)]">{v.numeroGuia ? `G-${v.numeroGuia}` : '—'}</p>
          </div>
        </div>

        {transp && (
          <div className="bg-[var(--color-gr-border-lite)] rounded-[8px] px-3 py-2">
            <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">
              Chofer / Transportista
            </p>
            <p className="font-700 text-[var(--color-gr-text)]">
              {transp.nombre}
              {transp.ci ? ` · CI ${transp.ci}` : ''}
            </p>
            <p className="text-[12px] text-[var(--color-gr-sub)]">
              {transp.empresa ?? ''}
              {transp.empresa && (transp.marca || transp.placa || transp.color) ? ' · ' : ''}
              {transp.marca ?? ''}
              {transp.marca && transp.placa ? ' · ' : ''}
              {transp.placa ? `Placa: ${transp.placa}` : ''}
              {transp.color ? ` · ${transp.color}` : ''}
            </p>
            {transp.telefono && (
              <p className="text-[12px] text-[var(--color-gr-muted)]">Tel: {transp.telefono}</p>
            )}
          </div>
        )}

        <div className="border border-[var(--color-gr-border)] rounded-[8px] overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] bg-[var(--color-gr-primary)] px-3 py-2 gap-3 text-[10.5px] font-700 text-white/85 uppercase">
            <span>Producto</span><span>Cant.</span><span>Precio</span><span>Total</span>
          </div>
          {v.detalles.map((d, i) => (
            <div key={d.id ?? i}
              className={`grid grid-cols-[1fr_auto_auto_auto] px-3 py-2 gap-3 text-[12.5px] ${i < v.detalles.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}>
              <div>
                <p className="font-600">{d.producto?.nombre ?? '—'}</p>
                {d.lote && (
                  <p className="text-[10.5px] text-[var(--color-gr-muted)]">Lote {d.lote.codigoLote}</p>
                )}
              </div>
              <span>{Number(d.cantidad)} {d.unidad?.abreviatura ?? ''}</span>
              <span>{formatBs(Number(d.precioUnitarioBs))}</span>
              <span className="font-800">{formatBs(Number(d.valorTotalBs))}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1 text-[12.5px]">
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
          <div className="flex justify-between font-900 text-[16px] text-[var(--color-gr-primary)] pt-1 border-t border-[var(--color-gr-border)]">
            <span>TOTAL</span><span>{formatBs(Number(v.totalBs))}</span>
          </div>
        </div>

        {v.observaciones && (
          <div className="text-[11.5px] text-[var(--color-gr-muted)]">
            <strong>Obs:</strong> {v.observaciones}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-3">
          <div className="border-t border-[var(--color-gr-border)] pt-2 text-center text-[10.5px] uppercase tracking-wide text-[var(--color-gr-muted)] font-700">
            Firma Responsable Grano Rey
          </div>
          <div className="border-t border-[var(--color-gr-border)] pt-2 text-center text-[10.5px] uppercase tracking-wide text-[var(--color-gr-muted)] font-700">
            {esProforma ? 'Recibido conforme — Cliente' : 'Recibido conforme'}
          </div>
        </div>
      </div>
    </div>
  );
}
