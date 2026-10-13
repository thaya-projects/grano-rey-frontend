import { type NotaVenta, EstadoVenta } from '@/lib/types';
import { formatBs } from '@/lib/utils';
import { Btn, Modal } from '@/components/ui';
import { Clock, Truck, CheckCircle2 } from 'lucide-react';
import { ReporteFila } from './ReporteFila';

/** Reporte informativo por estado (solo lectura). */
export function ReporteEstadoModal({
  estado, ventas, onClose,
}: {
  estado: EstadoVenta;
  ventas: NotaVenta[];
  onClose: () => void;
}) {
  const meta: Record<string, { titulo: string; Icon: React.ElementType; color: string; bg: string; subtitulo: string }> = {
    [EstadoVenta.PENDIENTE]: {
      titulo: 'Por despachar',
      Icon: Clock,
      color: 'var(--color-gr-warning)',
      bg: '#fff7e6',
      subtitulo: 'Ventas confirmadas esperando salir del depósito',
    },
    [EstadoVenta.DESPACHADA]: {
      titulo: 'En tránsito',
      Icon: Truck,
      color: 'var(--color-gr-info)',
      bg: 'var(--color-gr-info-bg)',
      subtitulo: 'Despachadas y en camino al cliente',
    },
    [EstadoVenta.ENTREGADA]: {
      titulo: 'Entregadas',
      Icon: CheckCircle2,
      color: 'var(--color-gr-success)',
      bg: 'var(--color-gr-success-bg)',
      subtitulo: 'Historial de entregas confirmadas',
    },
    [EstadoVenta.CANCELADA]: {
      titulo: 'Canceladas',
      Icon: CheckCircle2,
      color: 'var(--color-gr-muted)',
      bg: 'var(--color-gr-border-lite)',
      subtitulo: '—',
    },
  };
  const m = meta[estado];
  const ordenadas = [...ventas].sort((a, b) => (b.fecha > a.fecha ? 1 : -1));
  const totalBs = ordenadas.reduce((s, v) => s + Number(v.totalBs), 0);
  const totalBolsas = ordenadas.reduce((s, v) =>
    s + v.detalles.reduce((ss, d) => ss + Number(d.cantidad ?? 0), 0), 0);

  return (
    <Modal xl open title={`Reporte — ${m.titulo}`} onClose={onClose}>
      {/* Header resumen */}
      <div className="rounded-[12px] px-5 py-4 flex items-center gap-4" style={{ background: m.bg }}>
        <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ background: m.color }}>
          <m.Icon size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-900 text-[16px]" style={{ color: m.color }}>{m.titulo}</p>
          <p className="text-[12.5px] text-gr-muted">{m.subtitulo}</p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-[10.5px] font-700 text-gr-muted uppercase tracking-wide">Ventas</p>
            <p className="font-900 text-[20px] text-gr-text">{ordenadas.length}</p>
          </div>
          <div>
            <p className="text-[10.5px] font-700 text-gr-muted uppercase tracking-wide">Bolsas</p>
            <p className="font-900 text-[20px] text-gr-text">{totalBolsas}</p>
          </div>
          <div>
            <p className="text-[10.5px] font-700 text-gr-muted uppercase tracking-wide">Total</p>
            <p className="font-900 text-[20px]" style={{ color: m.color }}>{formatBs(totalBs)}</p>
          </div>
        </div>
      </div>

      {/* Lista de despachos */}
      {ordenadas.length === 0 ? (
        <div className="py-10 text-center text-gr-muted text-[13px]">
          Sin ventas en este estado.
        </div>
      ) : (
        <div className="space-y-2.5">
          {ordenadas.map(v => <ReporteFila key={v.id} venta={v} color={m.color} />)}
        </div>
      )}

      <div className="flex justify-end pt-2 border-t border-gr-border-lite">
        <Btn variant="ghost" onClick={onClose}>Cerrar</Btn>
      </div>
    </Modal>
  );
}
