import { type NotaVenta, TipoFlete } from '@/lib/types';
import { formatBs } from '@/lib/utils';
import { Btn, EstadoBadge, Badge } from '@/components/ui';
import { Truck, Printer, ArrowRight, Package } from 'lucide-react';
import { desgloseFleteIncluido } from './helpers';

export function RemisionCard({ venta: v, onVerRemision, onDespachar }: {
  venta: NotaVenta; onVerRemision: () => void; onDespachar: () => void;
}) {
  const transp = v.transportista;
  return (
    <div className="card border-l-4 space-y-3"
      style={{ borderLeftColor: 'var(--color-gr-warning)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-800 text-gr-text text-[15px]">NV-{v.numeroNota}</p>
            {v.numeroGuia && <Badge color="gray">G-{v.numeroGuia}</Badge>}
            <EstadoBadge estado={v.estado} />
            {v.tipoFlete === TipoFlete.CLIENTE_PAGA_DIRECTO && (
              <span className="inline-flex items-center gap-1 text-[11px] font-600 px-2 py-0.5 rounded-full"
                style={{ background: 'var(--color-gr-info-bg)', color: 'var(--color-gr-info)' }}>
                <Truck size={10} /> Cliente paga flete
              </span>
            )}
            {v.tipoFlete === TipoFlete.GRANO_REY_PAGA && Number(v.fleteBs) > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-600 px-2 py-0.5 rounded-full"
                style={{ background: 'var(--color-gr-gold-lite)', color: 'var(--color-gr-gold-dark)' }}>
                <Truck size={10} /> Grano Rey paga flete ({formatBs(Number(v.fleteBs))})
              </span>
            )}
          </div>
          <p className="font-600 text-gr-text text-[13.5px] truncate">{v.cliente?.nombre ?? '—'}</p>
          <p className="text-[12px] text-gr-muted">
            {v.fecha}
            {v.cliente?.telefono && <> · Cel: {v.cliente.telefono}</>}
            {v.cliente?.ciudad && <> · {v.cliente.ciudad}</>}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-900 text-gr-primary text-[18px] whitespace-nowrap">{formatBs(Number(v.totalBs))}</p>
          {(() => {
            const d = desgloseFleteIncluido(v);
            if (!d) return null;
            return (
              <>
                <p className="text-[10px] text-gr-muted whitespace-nowrap">{d.texto}</p>
                {!d.coincide && (
                  <p className="text-[10px] font-700 text-gr-danger whitespace-nowrap">
                    ⚠ no coincide con el total del sistema
                  </p>
                )}
              </>
            );
          })()}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {v.detalles.map((d, i) => (
          <div key={d.id ?? i} className="flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12px]"
            style={{ background: 'var(--color-gr-border-lite)' }}>
            <Package size={12} className="text-gr-primary" />
            <span className="font-600">{Number(d.cantidad)} {d.unidad?.abreviatura ?? ''}</span>
            <span className="text-gr-muted">{(d.producto?.nombre ?? '').split(' ').slice(0, 3).join(' ')}</span>
            {d.lote && <span className="text-gr-muted">· {d.lote.codigoLote}</span>}
          </div>
        ))}
      </div>

      {transp && (
        <p className="text-[12.5px] text-gr-muted">
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
