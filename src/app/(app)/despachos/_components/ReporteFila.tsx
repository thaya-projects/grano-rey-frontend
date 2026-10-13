import { type NotaVenta, TipoFlete, TipoPagoCarga } from '@/lib/types';
import { formatBs, formatNum } from '@/lib/utils';
import { EstadoBadge, Badge } from '@/components/ui';
import { Receipt, User, Calendar, Truck, Package, HardHat } from 'lucide-react';
import { desgloseFleteIncluido } from './helpers';
import { InfoBox } from './InfoBox';

/** Fila informativa (read-only) — sin botones de acción. */
export function ReporteFila({ venta: v, color }: { venta: NotaVenta; color: string }) {
  // Un mismo producto puede venir repartido en varios lotes (varios "detalles" del backend) —
  // se agrupan por producto sumando cantidades, para no repetir el nombre como si fueran
  // productos distintos (ej. "3 qq Maíz · 2 qq Maíz" en vez de "5 qq Maíz").
  const detallesPorProducto = Object.values(
    v.detalles.reduce<Record<string, { nombre: string; abrev: string; cantidad: number }>>((acc, d) => {
      const key = d.producto?.id ?? d.producto?.nombre ?? '';
      if (!acc[key]) acc[key] = { nombre: d.producto?.nombre ?? '', abrev: d.unidad?.abreviatura ?? '', cantidad: 0 };
      acc[key].cantidad += Number(d.cantidad ?? 0);
      return acc;
    }, {}),
  );
  const productos = detallesPorProducto.map(x => `${formatNum(x.cantidad, 0)} ${x.abrev} ${x.nombre}`.trim()).join(' · ');
  const bolsas = v.detalles.reduce((s, d) => s + Number(d.cantidad ?? 0), 0);
  const cargas = v.cargas ?? [];

  return (
    <div className="rounded-[12px] border border-gr-border-lite p-4 bg-white">
      {/* Cabecera de la fila */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: color + '15' }}>
          <Receipt size={18} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-900 text-[15px] text-gr-text">
              NV-{v.numeroNota}
              {v.numeroGuia ? ` · G-${v.numeroGuia}` : ''}
            </p>
            <EstadoBadge estado={v.estado} />
            {v.tipoFlete === TipoFlete.CLIENTE_PAGA_DIRECTO && (
              <Badge color="blue">Cliente paga flete</Badge>
            )}
            {v.tipoFlete === TipoFlete.GRANO_REY_PAGA && Number(v.fleteBs) > 0 && (
              <Badge color="yellow">Grano Rey paga flete ({formatBs(Number(v.fleteBs))})</Badge>
            )}
          </div>
          <p className="text-[12.5px] text-gr-muted mt-0.5">
            {productos || 'Sin productos'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10.5px] font-700 text-gr-muted uppercase">Total</p>
          <p className="font-900 text-[18px]" style={{ color }}>{formatBs(Number(v.totalBs))}</p>
          {(() => {
            const d = desgloseFleteIncluido(v);
            if (!d) return null;
            return (
              <>
                <p className="text-[10px] text-gr-muted">{d.texto}</p>
                {!d.coincide && (
                  <p className="text-[10px] font-700 text-gr-danger">⚠ no coincide con el total del sistema</p>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* Recuadros informativos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
        <InfoBox
          icon={<User size={13} />}
          label="Cliente"
          value={[v.cliente?.nombre, v.cliente?.telefono ? `Cel ${v.cliente.telefono}` : null]
            .filter(Boolean).join(' · ') || '—'}
        />
        <InfoBox icon={<Calendar size={13} />} label="Fecha" value={v.fecha} />
        <InfoBox
          icon={<Truck size={13} />}
          label="Transportista"
          value={v.transportista
            ? `${v.transportista.nombre}${v.transportista.placa ? ` · ${v.transportista.placa}` : ''}`
            : 'Sin asignar'}
        />
        <InfoBox icon={<Package size={13} />} label="Bolsas totales" value={String(bolsas)} />
      </div>

      {/* Cargadores del despacho (si hay) */}
      {cargas.length > 0 && (
        <div className="mt-3 rounded-[10px] px-3 py-2.5"
          style={{ background: 'var(--color-gr-primary-lite)' }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <HardHat size={13} style={{ color: 'var(--color-gr-primary)' }} />
            <p className="text-[11px] font-700 uppercase tracking-wide" style={{ color: 'var(--color-gr-primary)' }}>
              Cargadores del despacho
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cargas.map(c => (
              <span key={c.id}
                className="text-[11.5px] font-600 rounded-full px-2.5 py-1"
                style={{ background: '#fff', color: 'var(--color-gr-text)' }}>
                {c.cargador?.nombre ?? '—'} ·{' '}
                {Number(c.cantidad)}{' '}
                {c.tipoPago === TipoPagoCarga.BOLSA ? 'bolsas' : 'jornal'} ·{' '}
                {formatBs(Number(c.montoBs))}
                {c.pagado
                  ? <span style={{ color: 'var(--color-gr-success)' }}> ✓</span>
                  : <span style={{ color: 'var(--color-gr-warning)' }}> ⏳</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
