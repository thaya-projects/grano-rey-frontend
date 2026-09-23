'use client';
import { TipoFlete, type NotaVenta } from '@/lib/types';
import { formatBs } from '@/lib/utils';
import Image from 'next/image';

export type ModoDocumento = 'nota' | 'proforma' | 'combinada' | 'remision-doble';

interface Props {
  venta: NotaVenta;
  modo: ModoDocumento;
}

const CUT_LINE = (
  <div className="border-t-2 border-dashed border-[var(--color-gr-border)] relative" aria-hidden>
    <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-3 text-[10px] text-[var(--color-gr-muted)] uppercase tracking-widest">
      ✂ cortar aquí
    </span>
  </div>
);

/**
 * Reglas de negocio de cada documento:
 * - NOTA DE VENTA: documento comercial → CON precios y total Bs.
 * - PROFORMA: documento de carga → SIN precios; solo productos, lote y bolsas.
 * - COMBINADA: nota arriba + proforma abajo (vertical) para imprimir juntas
 *   y cortar la hoja — cada mitad va a un destinatario distinto.
 * - REMISIÓN DOBLE: dos proformas idénticas (sin precios), etiquetadas
 *   "COPIA CLIENTE" y "COPIA GRANO REY", para repartir en la entrega:
 *   una se la queda el cliente/chofer, la otra vuelve como comprobante.
 * Ambas llevan datos completos del cliente y del chofer.
 */
export function DocumentoVenta({ venta, modo }: Props) {
  if (modo === 'combinada') {
    return (
      <div className="space-y-4">
        <DocumentoVentaSimple venta={venta} tipo="nota" compact />
        {CUT_LINE}
        <DocumentoVentaSimple venta={venta} tipo="proforma" compact />
      </div>
    );
  }
  if (modo === 'remision-doble') {
    return (
      <div className="space-y-4">
        <DocumentoVentaSimple venta={venta} tipo="proforma" compact copiaLabel="COPIA CLIENTE" />
        {CUT_LINE}
        <DocumentoVentaSimple venta={venta} tipo="proforma" compact copiaLabel="COPIA GRANO REY" />
      </div>
    );
  }
  return <DocumentoVentaSimple venta={venta} tipo={modo} />;
}

function DocumentoVentaSimple({
  venta, tipo, compact = false, copiaLabel,
}: { venta: NotaVenta; tipo: 'nota' | 'proforma'; compact?: boolean; copiaLabel?: string }) {
  const v = venta;
  const transp = v.transportista;
  const cliente = v.cliente;
  const esProforma = tipo === 'proforma';

  const totalBolsas = v.detalles.reduce((s, d) => s + Number(d.cantidad ?? 0), 0);

  // Responsable de producción: del primer lote que tenga uno; si no, el vendedor.
  const responsableProduccion =
    v.detalles.map(d => d.lote?.responsable?.nombre).find(Boolean) ?? null;

  // Tipografías compactas cuando va apilado en la combinada
  const tNumero = compact ? 'text-[17px]'   : 'text-[22px]';
  const tBody   = compact ? 'text-[11px]'   : 'text-[13px]';
  const tRow    = compact ? 'text-[10.5px]' : 'text-[12.5px]';
  const tTotal  = compact ? 'text-[13.5px]' : 'text-[16px]';
  const logoW   = compact ? 64 : 90;
  const logoH   = compact ? 28 : 40;
  const padHead = compact ? 'px-4 py-2.5' : 'px-6 py-4';
  const padBody = compact ? 'px-4 py-3'   : 'px-6 py-4';

  // Grillas de la tabla según el documento
  const gridNota     = 'minmax(0, 1fr) 90px 55px 62px 72px';
  const gridProforma = 'minmax(0, 1fr) 120px 90px';

  return (
    <div className="print-doc border-[1.5px] border-[var(--color-gr-border)] rounded-[12px] overflow-hidden bg-white">
      {copiaLabel && (
        <div className={`text-center text-[10px] font-800 uppercase tracking-widest py-1 ${esProforma ? 'bg-[var(--color-gr-gold)] text-[#1a0e00]' : 'bg-[var(--color-gr-primary-lite)] text-[var(--color-gr-primary)]'}`}>
          {copiaLabel}
        </div>
      )}
      {/* ── Header ── */}
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
          <p className={`font-800 whitespace-nowrap ${compact ? 'text-[10px]' : 'text-[12px]'} ${esProforma ? 'text-white' : 'text-[var(--color-gr-gold)]'}`}>
            {esProforma ? 'PROFORMA DE CARGA' : 'NOTA DE VENTA'}
          </p>
          <p className={`text-white font-900 ${tNumero} whitespace-nowrap leading-tight`}>
            {esProforma ? `P-${v.numeroNota}` : `NV-${v.numeroNota}`}
          </p>
          <p className={`text-white/60 whitespace-nowrap ${compact ? 'text-[10px]' : 'text-[12px]'}`}>
            {v.fecha}{v.numeroGuia ? ` · Guía G-${v.numeroGuia}` : ''}
          </p>
        </div>
      </div>

      <div className={`${padBody} space-y-3 bg-white ${tBody}`}>
        {/* ── Cliente completo + chofer ── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[9.5px] font-700 text-[var(--color-gr-muted)] uppercase mb-1 tracking-wide">Cliente</p>
            <p className="font-800 text-[var(--color-gr-text)]">{cliente?.nombre ?? '—'}</p>
            {(cliente?.ciudad || cliente?.direccion) && (
              <p className="text-[10.5px] text-[var(--color-gr-muted)]">
                {[cliente?.ciudad, cliente?.direccion].filter(Boolean).join(' · ')}
              </p>
            )}
            {cliente?.telefono && (
              <p className="text-[10.5px] text-[var(--color-gr-muted)]">Cel: {cliente.telefono}</p>
            )}
            {!esProforma && cliente?.nit && (
              <p className="text-[10.5px] text-[var(--color-gr-muted)]">NIT: {cliente.nit}</p>
            )}
          </div>
          <div>
            <p className="text-[9.5px] font-700 text-[var(--color-gr-muted)] uppercase mb-1 tracking-wide">
              Chofer / Transportista
            </p>
            {transp ? (
              <>
                <p className="font-700 text-[var(--color-gr-text)]">
                  {transp.nombre}{transp.ci ? ` · CI ${transp.ci}` : ''}
                </p>
                <p className="text-[10.5px] text-[var(--color-gr-sub)]">
                  {[transp.marca, transp.placa ? `Placa ${transp.placa}` : null, transp.color]
                    .filter(Boolean).join(' · ')}
                </p>
                {transp.telefono && (
                  <p className="text-[10.5px] text-[var(--color-gr-muted)]">Cel: {transp.telefono}</p>
                )}
              </>
            ) : <p className="text-[var(--color-gr-muted)]">Sin asignar</p>}
          </div>
        </div>

        {/* ── Tabla de productos ── */}
        {esProforma ? (
          /* PROFORMA: sin precios — solo producto, lote y bolsas */
          <div className="border border-[var(--color-gr-border)] rounded-[8px] overflow-hidden">
            <div
              className="bg-[var(--color-gr-gold-dark)] px-3 py-2 gap-2 text-[9.5px] font-700 text-white/90 uppercase tracking-wide"
              style={{ display: 'grid', gridTemplateColumns: gridProforma }}
            >
              <span>Producto</span>
              <span>Lote</span>
              <span className="text-right">Bolsas</span>
            </div>
            {v.detalles.map((d, i) => (
              <div key={d.id ?? i}
                className={`px-3 py-2 gap-2 ${tRow} ${i < v.detalles.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}
                style={{ display: 'grid', gridTemplateColumns: gridProforma, alignItems: 'center' }}
              >
                <p className="font-600 truncate">{d.producto?.nombre ?? '—'}</p>
                <p className="text-[var(--color-gr-muted)] truncate">{d.lote?.codigoLote ?? '—'}</p>
                <p className="text-right font-800 whitespace-nowrap">
                  {Number(d.cantidad)} {d.unidad?.abreviatura ?? ''}
                </p>
              </div>
            ))}
          </div>
        ) : (
          /* NOTA DE VENTA: con precios */
          <div className="border border-[var(--color-gr-border)] rounded-[8px] overflow-hidden">
            <div
              className="bg-[var(--color-gr-primary)] px-3 py-2 gap-2 text-[9.5px] font-700 text-white/90 uppercase tracking-wide"
              style={{ display: 'grid', gridTemplateColumns: gridNota }}
            >
              <span>Producto</span>
              <span>Lote</span>
              <span className="text-right">Cant.</span>
              <span className="text-right">Precio</span>
              <span className="text-right">Total</span>
            </div>
            {v.detalles.map((d, i) => (
              <div key={d.id ?? i}
                className={`px-3 py-2 gap-2 ${tRow} ${i < v.detalles.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}
                style={{ display: 'grid', gridTemplateColumns: gridNota, alignItems: 'center' }}
              >
                <p className="font-600 truncate">{d.producto?.nombre ?? '—'}</p>
                <p className="text-[var(--color-gr-muted)] text-[9.5px] truncate">{d.lote?.codigoLote ?? '—'}</p>
                <p className="text-right whitespace-nowrap">{Number(d.cantidad)} {d.unidad?.abreviatura ?? ''}</p>
                <p className="text-right whitespace-nowrap">{formatBs(Number(d.precioUnitarioBs))}</p>
                <p className="text-right font-800 whitespace-nowrap">{formatBs(Number(d.valorTotalBs))}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Totales ── */}
        {esProforma ? (
          <div className={`flex justify-between font-900 ${tTotal} text-[var(--color-gr-gold-dark)] pt-1 border-t border-[var(--color-gr-border)]`}>
            <span>TOTAL BOLSAS</span>
            <span>{totalBolsas}</span>
          </div>
        ) : (
          <div className={`space-y-1 ${tRow}`}>
            <div className="flex justify-between text-[var(--color-gr-muted)]">
              <span>Subtotal productos</span><span>{formatBs(Number(v.subtotalBs))}</span>
            </div>
            {Number(v.descuentoBs) > 0 && (
              <div className="flex justify-between text-[var(--color-gr-muted)]">
                <span>Descuento</span><span>-{formatBs(Number(v.descuentoBs))}</span>
              </div>
            )}
            {v.tipoFlete === TipoFlete.INCLUIDO_EN_VENTA && Number(v.fleteBs) > 0 && (
              <div className="flex justify-between text-[var(--color-gr-muted)]">
                <span>Flete (incluido)</span><span>+{formatBs(Number(v.fleteBs))}</span>
              </div>
            )}
            {v.tipoFlete === TipoFlete.GRANO_REY_PAGA && Number(v.fleteBs) > 0 && (
              <div className="flex justify-between font-700 text-[10.5px]" style={{ color: 'var(--color-gr-warning)' }}>
                <span>Flete Grano Rey — NO incluido en el total</span>
                <span>{formatBs(Number(v.fleteBs))}</span>
              </div>
            )}
            {v.tipoFlete === TipoFlete.CLIENTE_PAGA_DIRECTO && (
              <p className="text-[10.5px] italic text-[var(--color-gr-muted)]">
                El cliente paga el flete directo al transportista (no incluido en el total)
              </p>
            )}
            <div className={`flex justify-between font-900 ${tTotal} text-[var(--color-gr-primary)] pt-1 border-t border-[var(--color-gr-border)]`}>
              <span>TOTAL A COBRAR</span><span className="whitespace-nowrap">{formatBs(Number(v.totalBs))}</span>
            </div>
          </div>
        )}

        {/* ── Responsables (solo nota de venta) ── */}
        {!esProforma && (v.vendedor?.nombre || responsableProduccion) && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10.5px] text-[var(--color-gr-muted)]">
            {v.vendedor?.nombre && (
              <p><strong className="text-[var(--color-gr-sub)]">Responsable venta:</strong> {v.vendedor.nombre}</p>
            )}
            {responsableProduccion && (
              <p><strong className="text-[var(--color-gr-sub)]">Responsable producción:</strong> {responsableProduccion}</p>
            )}
          </div>
        )}

        {v.observaciones && (
          <div className="text-[10.5px] text-[var(--color-gr-muted)]">
            <strong>Obs:</strong> {v.observaciones}
          </div>
        )}

        {/* ── Firmas ── */}
        <div className="grid grid-cols-2 gap-3 pt-3">
          <div className="border-t border-[var(--color-gr-border)] pt-2 text-center text-[9.5px] uppercase tracking-wide text-[var(--color-gr-muted)] font-700 leading-snug">
            Firma Responsable Grano Rey
          </div>
          <div className="border-t border-[var(--color-gr-border)] pt-2 text-center text-[9.5px] uppercase tracking-wide text-[var(--color-gr-muted)] font-700 leading-snug">
            {esProforma ? 'Recibido conforme — Chofer' : 'Recibido conforme — Cliente'}
          </div>
        </div>
      </div>
    </div>
  );
}
