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
      <div className="print-combined" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6mm' }}>
        <DocumentoVentaSimple venta={venta} tipo="nota" compact />
        <DocumentoVentaSimple venta={venta} tipo="proforma" compact />
      </div>
    );
  }
  return <DocumentoVentaSimple venta={venta} tipo={modo} />;
}

function DocumentoVentaSimple({
  venta, tipo, compact = false,
}: { venta: NotaVenta; tipo: 'nota' | 'proforma'; compact?: boolean }) {
  const v = venta;
  const transp = v.transportista;
  const esProforma = tipo === 'proforma';

  // Tipografías más chicas cuando va a 2 columnas
  const tHeader   = compact ? 'text-[10px]'   : 'text-[12px]';
  const tNumero   = compact ? 'text-[18px]'   : 'text-[22px]';
  const tFecha    = compact ? 'text-[10px]'   : 'text-[12px]';
  const tBody     = compact ? 'text-[11px]'   : 'text-[13px]';
  const tRow      = compact ? 'text-[10.5px]' : 'text-[12.5px]';
  const tTotal    = compact ? 'text-[14px]'   : 'text-[16px]';
  const logoW     = compact ? 70             : 90;
  const logoH     = compact ? 30             : 40;
  const padHead   = compact ? 'px-4 py-3'    : 'px-6 py-4';
  const padBody   = compact ? 'px-4 py-3'    : 'px-6 py-4';

  return (
    <div className="border-[1.5px] border-[var(--color-gr-border)] rounded-[12px] overflow-hidden bg-white">
      <div className={`${padHead} flex items-center justify-between ${esProforma ? 'bg-[var(--color-gr-gold-dark)]' : 'bg-[var(--color-gr-primary)]'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-white rounded-[10px] p-1.5 shrink-0">
            <div className="relative" style={{ width: logoW, height: logoH }}>
              <Image src="/logo-grano-rey.webp" alt="Grano Rey" fill className="object-contain" />
            </div>
          </div>
          {!compact && (
            <p className="text-white/60 text-[10px] uppercase tracking-widest mt-1 whitespace-nowrap">
              Procesadora de Alimentos
            </p>
          )}
        </div>
        <div className="text-right shrink-0 pl-2">
          <p className={`font-800 whitespace-nowrap ${tHeader} ${esProforma ? 'text-white' : 'text-[var(--color-gr-gold)]'}`}>
            {esProforma ? 'PROFORMA' : 'NOTA DE VENTA'}
          </p>
          <p className={`text-white font-900 ${tNumero} whitespace-nowrap leading-tight`}>
            {esProforma ? `P-${v.numeroNota}` : `NV-${v.numeroNota}`}
          </p>
          <p className={`text-white/60 ${tFecha} whitespace-nowrap`}>{v.fecha}</p>
        </div>
      </div>

      <div className={`${padBody} space-y-3 bg-white ${tBody}`}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[9.5px] font-700 text-[var(--color-gr-muted)] uppercase mb-1 tracking-wide">Cliente</p>
            <p className="font-800 text-[var(--color-gr-text)]">{v.cliente?.nombre ?? '—'}</p>
            {v.cliente?.ciudad && <p className="text-[10.5px] text-[var(--color-gr-muted)]">{v.cliente.ciudad}</p>}
            {v.cliente?.nit && <p className="text-[10.5px] text-[var(--color-gr-muted)]">NIT: {v.cliente.nit}</p>}
          </div>
          <div>
            <p className="text-[9.5px] font-700 text-[var(--color-gr-muted)] uppercase mb-1 tracking-wide">N° Guía</p>
            <p className="font-800 text-[var(--color-gr-text)]">{v.numeroGuia ? `G-${v.numeroGuia}` : '—'}</p>
          </div>
        </div>

        {transp && (
          <div className="bg-[var(--color-gr-border-lite)] rounded-[8px] px-3 py-2">
            <p className="text-[9.5px] font-700 text-[var(--color-gr-muted)] uppercase mb-1 tracking-wide">
              Chofer / Transportista
            </p>
            <p className="font-700 text-[var(--color-gr-text)]">
              {transp.nombre}
              {transp.ci ? ` · CI ${transp.ci}` : ''}
            </p>
            <p className="text-[10.5px] text-[var(--color-gr-sub)]">
              {transp.empresa ?? ''}
              {transp.empresa && (transp.marca || transp.placa || transp.color) ? ' · ' : ''}
              {transp.marca ?? ''}
              {transp.marca && transp.placa ? ' · ' : ''}
              {transp.placa ? `Placa: ${transp.placa}` : ''}
              {transp.color ? ` · ${transp.color}` : ''}
            </p>
            {transp.telefono && (
              <p className="text-[10.5px] text-[var(--color-gr-muted)]">Tel: {transp.telefono}</p>
            )}
          </div>
        )}

        {/* Tabla de productos con grid de anchos fijos → siempre alineado */}
        <div className="border border-[var(--color-gr-border)] rounded-[8px] overflow-hidden">
          <div
            className="bg-[var(--color-gr-primary)] px-3 py-2 gap-2 text-[9.5px] font-700 text-white/90 uppercase tracking-wide"
            style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 50px 60px 70px' }}
          >
            <span>Producto</span>
            <span className="text-right">Cant.</span>
            <span className="text-right">Precio</span>
            <span className="text-right">Total</span>
          </div>
          {v.detalles.map((d, i) => (
            <div key={d.id ?? i}
              className={`px-3 py-2 gap-2 ${tRow} ${i < v.detalles.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}
              style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 50px 60px 70px', alignItems: 'center' }}
            >
              <div className="min-w-0">
                <p className="font-600 truncate">{d.producto?.nombre ?? '—'}</p>
                {d.lote && (
                  <p className="text-[9.5px] text-[var(--color-gr-muted)] truncate">Lote {d.lote.codigoLote}</p>
                )}
              </div>
              <span className="text-right whitespace-nowrap">{Number(d.cantidad)} {d.unidad?.abreviatura ?? ''}</span>
              <span className="text-right whitespace-nowrap">{formatBs(Number(d.precioUnitarioBs))}</span>
              <span className="text-right font-800 whitespace-nowrap">{formatBs(Number(d.valorTotalBs))}</span>
            </div>
          ))}
        </div>

        <div className={`space-y-1 ${tRow}`}>
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
          <div className={`flex justify-between font-900 ${tTotal} text-[var(--color-gr-primary)] pt-1 border-t border-[var(--color-gr-border)]`}>
            <span>TOTAL</span><span className="whitespace-nowrap">{formatBs(Number(v.totalBs))}</span>
          </div>
        </div>

        {v.observaciones && (
          <div className="text-[10.5px] text-[var(--color-gr-muted)]">
            <strong>Obs:</strong> {v.observaciones}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-3">
          <div className="border-t border-[var(--color-gr-border)] pt-2 text-center text-[9.5px] uppercase tracking-wide text-[var(--color-gr-muted)] font-700 leading-snug">
            Firma Responsable Grano Rey
          </div>
          <div className="border-t border-[var(--color-gr-border)] pt-2 text-center text-[9.5px] uppercase tracking-wide text-[var(--color-gr-muted)] font-700 leading-snug">
            {esProforma ? 'Recibido conforme — Cliente' : 'Recibido conforme'}
          </div>
        </div>
      </div>
    </div>
  );
}
