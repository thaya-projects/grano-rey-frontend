'use client';
import { Fragment } from 'react';
import { TipoFlete, type NotaVenta } from '@/lib/types';
import { formatBs, formatNum, montoEnLetras } from '@/lib/utils';
import Image from 'next/image';

export type ModoDocumento = 'nota' | 'proforma' | 'combinada' | 'remision-doble' | 'nota-doble';

interface Props {
  venta: NotaVenta;
  modo: ModoDocumento;
}

const CUT_LINE = (
  <div className="border-t-2 border-dashed border-gr-border relative" aria-hidden>
    <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-3 text-[10px] text-gr-muted uppercase tracking-widest">
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
 * - REMISIÓN DOBLE: dos proformas idénticas (sin precios) en la misma
 *   hoja, para repartir en la entrega: una se la queda el cliente/chofer,
 *   la otra vuelve como comprobante.
 * - NOTA DOBLE: dos notas de venta idénticas (con precios) en la misma hoja.
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
        <DocumentoVentaSimple venta={venta} tipo="proforma" compact />
        {CUT_LINE}
        <DocumentoVentaSimple venta={venta} tipo="proforma" compact />
      </div>
    );
  }
  if (modo === 'nota-doble') {
    return (
      <div className="space-y-4">
        <DocumentoVentaSimple venta={venta} tipo="nota" compact />
        {CUT_LINE}
        <DocumentoVentaSimple venta={venta} tipo="nota" compact />
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
  const cliente = v.cliente;
  const esProforma = tipo === 'proforma';

  const totalBolsas = v.detalles.reduce((s, d) => s + Number(d.cantidad ?? 0), 0);
  // Lo que importa para la carga es el peso real, no "cuántas bolsas" (una bolsa de 23kg y una
  // de 46kg no pesan lo mismo) — normalizamos todo a quintales (QQ) usando totalQq del backend.
  const totalQQSum = v.detalles.reduce((s, d) => s + Number(d.totalQq ?? 0), 0);
  const totalKgSum = v.detalles.reduce((s, d) => s + Number(d.totalKg ?? 0), 0);

  // Nota de pie reutilizada para explicar el caso de flete de esta venta.
  const fleteNota =
    v.tipoFlete === TipoFlete.INCLUIDO_EN_VENTA && Number(v.fleteBs) > 0
      ? `Incluye flete por ${formatBs(Number(v.fleteBs))}.`
      : v.tipoFlete === TipoFlete.GRANO_REY_PAGA && Number(v.fleteBs) > 0
      ? `Flete por ${formatBs(Number(v.fleteBs))} asumido por Grano Rey — no incluido en este total.`
      : v.tipoFlete === TipoFlete.CLIENTE_PAGA_DIRECTO
      ? 'El cliente paga el flete directo al transportista — no incluido en este total.'
      : null;

  // Responsable de producción: del primer lote que tenga uno; si no, el vendedor.
  const responsableProduccion =
    v.detalles.map(d => d.lote?.responsable?.nombre).find(Boolean) ?? null;

  // Tipografías compactas cuando va apilado en la combinada
  const tNumero = compact ? 'text-[17px]'   : 'text-[22px]';
  const tBody   = compact ? 'text-[11px]'   : 'text-[13px]';
  const tRow    = compact ? 'text-[10.5px]' : 'text-[12.5px]';
  const tTotal  = compact ? 'text-[13.5px]' : 'text-[16px]';
  const logoW   = compact ? 128 : 180;
  const logoH   = compact ? 56 : 80;
  const padHead = compact ? 'px-4 py-2.5' : 'px-6 py-4';
  const padBody = compact ? 'px-4 py-3'   : 'px-6 py-4';

  // Grillas de la tabla según el documento
  const gridNota     = 'auto minmax(0, 1fr) 78px 56px 56px 56px 62px 86px';
  const gridProforma = 'auto minmax(0, 1fr) 78px 64px 64px 64px';

  return (
    <div className="print-doc border-[1.5px] border-gr-border rounded-[12px] overflow-hidden bg-white">
      {/* ── Header ── */}
      <div className={`${padHead} flex items-center justify-between gap-2 ${esProforma ? 'bg-gr-proforma' : 'bg-gr-primary'}`}>
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <div className="relative shrink-0" style={{ width: logoW, height: logoH }}>
            <Image src="/logo-grano-rey.webp" alt="Grano Rey" fill className="object-contain" />
          </div>
        </div>
        <p className={`flex-1 text-center font-bold uppercase tracking-wide whitespace-nowrap ${compact ? 'text-[14px]' : 'text-[16px]'} ${esProforma ? 'text-gr-proforma-dark' : 'text-white'}`}>
          {esProforma ? 'NOTA DE REMISIÓN DE CARGA' : 'NOTA DE VENTA'}
        </p>
        <div className="text-right shrink-0 pl-2">
          <p className={`font-900 ${tNumero} whitespace-nowrap leading-tight ${esProforma ? 'text-gr-proforma-dark' : 'text-white'}`}>
            {esProforma ? `P-${v.numeroNota}` : `NV-${v.numeroNota}`}
          </p>
          {v.numeroGuia && (
            <p className={`whitespace-nowrap ${compact ? 'text-[10px]' : 'text-[12px]'} ${esProforma ? 'text-gr-sub' : 'text-white/60'}`}>
              Guía G-{v.numeroGuia}
            </p>
          )}
          <p className={`whitespace-nowrap ${compact ? 'text-[10px]' : 'text-[12px]'} ${esProforma ? 'text-gr-sub' : 'text-white/60'}`}>
            {v.fecha}
          </p>
        </div>
      </div>

      <div className={`${padBody} space-y-3 bg-white ${tBody}`}>
        {/* ── Cliente completo + chofer ── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[9.5px] font-700 text-gr-muted uppercase mb-1 tracking-wide">Cliente</p>
            <p className="font-800 text-gr-text">{cliente?.nombre ?? '—'}</p>
            {(cliente?.ciudad || cliente?.direccion) && (
              <p className="text-[10.5px] text-gr-muted">
                {[cliente?.ciudad, cliente?.direccion].filter(Boolean).join(' · ')}
              </p>
            )}
            {cliente?.telefono && (
              <p className="text-[10.5px] text-gr-muted">Cel: {cliente.telefono}</p>
            )}
            {!esProforma && cliente?.nit && (
              <p className="text-[10.5px] text-gr-muted">NIT: {cliente.nit}</p>
            )}
          </div>
          <div>
            <p className="text-[9.5px] font-700 text-gr-muted uppercase mb-1 tracking-wide">
              Chofer / Transportista
            </p>
            {transp ? (
              <>
                <p className="font-700 text-gr-text">
                  {transp.nombre}{transp.ci ? ` · CI ${transp.ci}` : ''}
                </p>
                <p className="text-[10.5px] text-gr-sub">
                  {[transp.marca, transp.placa ? `Placa ${transp.placa}` : null, transp.color]
                    .filter(Boolean).join(' · ')}
                </p>
                {transp.telefono && (
                  <p className="text-[10.5px] text-gr-muted">Cel: {transp.telefono}</p>
                )}
              </>
            ) : <p className="text-gr-muted">Sin asignar</p>}
          </div>
        </div>

        {/* ── Tabla de productos ── */}
        {esProforma ? (
          /* PROFORMA: detalle del producto enviado — sin precios */
          <div className="border border-gr-border rounded-[8px] overflow-hidden">
            <div className="text-center font-800 uppercase tracking-wide text-[10px] py-1.5 bg-gr-proforma-lite text-gr-proforma-dark">
              Detalle del producto enviado
            </div>
            {/* Un único grid para header + filas + total: así las columnas
                (en especial la de ancho "auto") se alinean exactamente igual
                en todas las filas — cada `div` por fila tenía su propio grid
                y el ancho "auto" se calculaba distinto en cada uno. */}
            <div style={{ display: 'grid', gridTemplateColumns: gridProforma, alignItems: 'center' }}>
              {(() => {
                const th = 'py-2 bg-gr-proforma text-gr-proforma-dark font-800 text-[8.5px] uppercase tracking-wide border-b border-gr-border whitespace-nowrap';
                return (
                  <>
                    <span className={`${th} pl-3 pr-4`}>Código</span>
                    <span className={`${th} px-2`}>Descripción</span>
                    <span className={`${th} px-2 text-right`}>Cant. bolsas</span>
                    <span className={`${th} px-2 text-right`}>P. unit. kg</span>
                    <span className={`${th} px-2 text-right`}>Total kg</span>
                    <span className={`${th} pl-2 pr-3 text-right`}>Total QQ</span>
                  </>
                );
              })()}
              {v.detalles.map((d, i) => {
                const td = `py-2 border-b border-gr-border-lite ${tRow}`;
                return (
                  <Fragment key={d.id ?? i}>
                    <p className={`${td} pl-3 pr-4 text-gr-muted whitespace-nowrap`}>{d.producto?.codigo ?? '—'}</p>
                    <p className={`${td} px-2 font-600 truncate`}>{d.producto?.nombre ?? '—'}</p>
                    <p className={`${td} px-2 text-right whitespace-nowrap`}>{formatNum(Number(d.cantidad), 0)}</p>
                    <p className={`${td} px-2 text-right whitespace-nowrap`}>{formatNum(Number(d.pesoUnitarioKg), 2)}</p>
                    <p className={`${td} px-2 text-right whitespace-nowrap`}>{formatNum(Number(d.totalKg), 2)}</p>
                    <p className={`${td} pl-2 pr-3 text-right font-800 whitespace-nowrap`}>{formatNum(Number(d.totalQq ?? 0), 2)}</p>
                  </Fragment>
                );
              })}
              {(() => {
                const tt = 'py-2 bg-gr-border-lite font-800 text-[9.5px] whitespace-nowrap';
                return (
                  <>
                    <span className={`${tt} pl-3 pr-4`} style={{ gridColumn: 'span 2' }}>TOTAL</span>
                    <span className={`${tt} px-2 text-right`}>{formatNum(totalBolsas, 0)}</span>
                    <span className={`${tt} self-stretch`} />
                    <span className={`${tt} px-2 text-right`}>{formatNum(totalKgSum, 2)}</span>
                    <span className={`${tt} pl-2 pr-3 text-right`}>{formatNum(totalQQSum, 2)}</span>
                  </>
                );
              })()}
            </div>
          </div>
        ) : (
          /* NOTA DE VENTA: con precios */
          <div className="border border-gr-border rounded-[8px] overflow-hidden">
            {/* Un único grid para header + filas + total (ver nota en la proforma de más arriba). */}
            <div style={{ display: 'grid', gridTemplateColumns: gridNota, alignItems: 'center' }}>
              {(() => {
                const th = 'py-2 bg-gr-primary text-white/90 font-700 text-[8.5px] uppercase tracking-wide whitespace-nowrap';
                return (
                  <>
                    <span className={`${th} pl-3 pr-4`}>Código</span>
                    <span className={`${th} px-2`}>Descripción</span>
                    <span className={`${th} px-2 text-right`}>Cant. bolsas</span>
                    <span className={`${th} px-2 text-right`}>P. unit. kg</span>
                    <span className={`${th} px-2 text-right`}>Total kg</span>
                    <span className={`${th} px-2 text-right`}>Total QQ</span>
                    <span className={`${th} px-2 text-right`}>Valor unit.</span>
                    <span className={`${th} pl-2 pr-3 text-right`}>Valor total</span>
                  </>
                );
              })()}
              {v.detalles.map((d, i) => {
                const td = `py-2 border-b border-gr-border-lite ${tRow}`;
                return (
                  <Fragment key={d.id ?? i}>
                    <p className={`${td} pl-3 pr-4 text-gr-muted whitespace-nowrap`}>{d.producto?.codigo ?? '—'}</p>
                    <p className={`${td} px-2 font-600 truncate`}>{d.producto?.nombre ?? '—'}</p>
                    <p className={`${td} px-2 text-right whitespace-nowrap`}>{formatNum(Number(d.cantidad), 0)}</p>
                    <p className={`${td} px-2 text-right whitespace-nowrap`}>{formatNum(Number(d.pesoUnitarioKg), 2)}</p>
                    <p className={`${td} px-2 text-right whitespace-nowrap`}>{formatNum(Number(d.totalKg), 2)}</p>
                    <p className={`${td} px-2 text-right whitespace-nowrap`}>{formatNum(Number(d.totalQq ?? 0), 2)}</p>
                    <p className={`${td} px-2 text-right whitespace-nowrap`}>{formatBs(Number(d.precioUnitarioBs))}</p>
                    <p className={`${td} pl-2 pr-3 text-right font-800 whitespace-nowrap`}>{formatBs(Number(d.valorTotalBs))}</p>
                  </Fragment>
                );
              })}
              {(() => {
                const tt = 'py-2 bg-gr-border-lite font-800 text-[9.5px] whitespace-nowrap';
                return (
                  <>
                    <span className={`${tt} pl-3 pr-4`} style={{ gridColumn: 'span 2' }}>TOTAL</span>
                    <span className={`${tt} px-2 text-right`}>{formatNum(totalBolsas, 0)}</span>
                    <span className={`${tt} self-stretch`} />
                    <span className={`${tt} px-2 text-right`}>{formatNum(totalKgSum, 2)}</span>
                    <span className={`${tt} px-2 text-right`}>{formatNum(totalQQSum, 2)}</span>
                    <span className={`${tt} self-stretch`} />
                    <span className={`${tt} pl-2 pr-3 text-right`}>{formatBs(Number(v.subtotalBs))}</span>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── Totales ── */}
        {!esProforma && (
          <div className={`space-y-1 ${tRow}`}>
            {Number(v.descuentoBs) > 0 && (
              <div className="flex justify-between text-gr-muted">
                <span>Descuento</span><span>-{formatBs(Number(v.descuentoBs))}</span>
              </div>
            )}
            <div className={`flex justify-between font-900 ${tTotal} text-gr-primary pt-1 border-t border-gr-border`}>
              <span>TOTAL A COBRAR</span><span className="whitespace-nowrap">{formatBs(Number(v.totalBs))}</span>
            </div>
            <p className="font-700">
              <span className="text-gr-muted font-800">SON:</span> {montoEnLetras(Number(v.totalBs))}
            </p>
            {fleteNota && (
              <p
                className={`text-[10.5px] italic ${
                  v.tipoFlete === TipoFlete.GRANO_REY_PAGA
                    ? 'font-700 not-italic'
                    : 'text-gr-muted'
                }`}
                style={v.tipoFlete === TipoFlete.GRANO_REY_PAGA ? { color: 'var(--color-gr-warning)' } : undefined}
              >
                <strong className="not-italic">NOTA:</strong> {fleteNota}
              </p>
            )}
          </div>
        )}

        {/* ── Responsables (solo nota de venta) ── */}
        {!esProforma && (v.vendedor?.nombre || responsableProduccion) && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10.5px] text-gr-muted">
            {v.vendedor?.nombre && (
              <p><strong className="text-gr-sub">Responsable venta:</strong> {v.vendedor.nombre}</p>
            )}
            {responsableProduccion && (
              <p><strong className="text-gr-sub">Responsable producción:</strong> {responsableProduccion}</p>
            )}
          </div>
        )}

        {v.observaciones && (
          <div className="text-[10.5px] text-gr-muted">
            <strong>Obs:</strong> {v.observaciones}
          </div>
        )}

        {/* ── Firmas ── */}
        <div className="grid grid-cols-2 gap-3 pt-3">
          <div className="border-t border-gr-border pt-2 text-center text-[9.5px] uppercase tracking-wide text-gr-muted font-700 leading-snug">
            Firma Responsable Grano Rey
          </div>
          <div className="border-t border-gr-border pt-2 text-center text-[9.5px] uppercase tracking-wide text-gr-muted font-700 leading-snug">
            {esProforma ? 'Recibido conforme — Chofer' : 'Recibido conforme — Cliente'}
          </div>
        </div>
      </div>
    </div>
  );
}
