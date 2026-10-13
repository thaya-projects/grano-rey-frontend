import { TipoFlete, type Cliente, type Transportista } from '@/lib/types';
import { formatBs } from '@/lib/utils';
import { Btn } from '@/components/ui';
import { ChevronLeft, Package, Truck, User, CheckCircle2 } from 'lucide-react';
import { type DetalleUI } from './types';

export function PasoConfirmar({
  clienteSel, fecha, detallesUI, subtotal, tipoFlete, fleteNum, descNum, totalFinal,
  transportistaSel, onVolver, onConfirmar, guardando,
}: {
  clienteSel?: Cliente;
  fecha: string;
  detallesUI: DetalleUI[];
  subtotal: number;
  tipoFlete: TipoFlete;
  fleteNum: number;
  descNum: number;
  totalFinal: number;
  transportistaSel?: Transportista;
  onVolver: () => void;
  onConfirmar: () => void;
  guardando: boolean;
}) {
  return (
    <div className="space-y-4 animate-fade-up">
      <div className="card">
        {/* Cabecera */}
        <div className="flex items-center gap-4 pb-4 mb-4 border-b border-gr-border-lite">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-gr-primary-lite)' }}>
            <User size={18} style={{ color: 'var(--color-gr-primary)' }} />
          </div>
          <div>
            <p className="font-800 text-gr-text text-[15px]">{clienteSel?.nombre}</p>
            <p className="text-[12px] text-gr-muted">
              {clienteSel?.ciudad}{clienteSel?.nit ? ` · NIT ${clienteSel.nit}` : ''} · {fecha}
            </p>
          </div>
        </div>

        {/* Líneas */}
        <div className="space-y-2 mb-4">
          {detallesUI.map(d => (
            <div key={d.key} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
                style={{ background: 'var(--color-gr-primary-lite)' }}>
                <Package size={13} style={{ color: 'var(--color-gr-primary)' }} />
              </div>
              <div className="flex-1">
                <p className="font-600 text-gr-text text-[13px]">{d.productoNombre}</p>
                <p className="text-[11px] text-gr-muted">
                  {d.cantidad} {d.unidadLabel} × {formatBs(d.precioUnitario)}
                  {d.lotes.length === 1 ? ` · ${d.lotes[0].lote.codigoLote}` : ''}
                  {d.lotes.length > 1
                    ? ` · ${d.lotes.map(a => `${a.lote.codigoLote} (${a.cantidad})`).join(' + ')}`
                    : ''}
                </p>
              </div>
              <span className="font-800 text-gr-primary text-[14px]">{formatBs(d.totalBs)}</span>
            </div>
          ))}
        </div>

        {/* Totales */}
        <div className="space-y-2 text-[13.5px] border-t border-gr-border-lite pt-3">
          <div className="flex justify-between text-gr-sub">
            <span>Subtotal productos</span><span>{formatBs(subtotal)}</span>
          </div>
          {tipoFlete === TipoFlete.INCLUIDO_EN_VENTA && fleteNum > 0 && (
            <div className="flex justify-between" style={{ color: 'var(--color-gr-info)' }}>
              <span className="flex items-center gap-1"><Truck size={12} /> Flete incluido</span>
              <span>+{formatBs(fleteNum)}</span>
            </div>
          )}
          {tipoFlete === TipoFlete.GRANO_REY_PAGA && fleteNum > 0 && (
            <div className="flex justify-between" style={{ color: 'var(--color-gr-warning)' }}>
              <span className="flex items-center gap-1"><Truck size={12} /> Flete Grano Rey</span>
              <span>{formatBs(fleteNum)} (egreso)</span>
            </div>
          )}
          {tipoFlete === TipoFlete.CLIENTE_PAGA_DIRECTO && (
            <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--color-gr-info)' }}>
              <Truck size={12} /><span>El cliente paga el flete al transportista</span>
            </div>
          )}
          {descNum > 0 && (
            <div className="flex justify-between text-gr-muted">
              <span>Descuento</span><span>-{formatBs(descNum)}</span>
            </div>
          )}
          <div className="flex justify-between font-900 text-[24px] text-gr-primary pt-2 border-t border-gr-border">
            <span>Total</span><span>{formatBs(totalFinal)}</span>
          </div>
        </div>

        {transportistaSel && (
          <div className="mt-4 rounded-[10px] px-4 py-3 text-[12.5px] flex items-center gap-3"
            style={{ background: 'var(--color-gr-border-lite)' }}>
            <Truck size={14} style={{ color: 'var(--color-gr-muted)' }} />
            <span className="text-gr-sub">
              {transportistaSel.nombre}
              {transportistaSel.marca ? ` · ${transportistaSel.marca}` : ''}
              {transportistaSel.placa ? ` · ${transportistaSel.placa}` : ''}
            </span>
          </div>
        )}
      </div>

      <div className="rounded-[12px] px-5 py-4 flex items-start gap-3"
        style={{ background: 'var(--color-gr-success-bg)', border: '1px solid rgba(46,125,82,0.15)' }}>
        <CheckCircle2 size={18} style={{ color: 'var(--color-gr-success)', flexShrink: 0, marginTop: 2 }} />
        <p className="text-[13px] text-gr-sub">
          La remisión se genera automáticamente al guardar — solo deberás imprimirla.
        </p>
      </div>

      <div className="flex gap-3 justify-between">
        <Btn variant="ghost" onClick={onVolver}><ChevronLeft size={15} /> Volver</Btn>
        <Btn variant="gold" onClick={onConfirmar} loading={guardando}>
          <CheckCircle2 size={15} /> Confirmar venta
        </Btn>
      </div>
    </div>
  );
}
