'use client';
import { useState } from 'react';
import { useCambiarEstadoVenta } from '@/lib/api/ventas';
import { apiErrorMessage } from '@/lib/api';
import { EstadoVenta, type NotaVenta } from '@/lib/types';
import { formatBs } from '@/lib/utils';
import { Modal, Btn, FormField, Textarea, useToast } from '@/components/ui';
import { Ban } from 'lucide-react';

export function AnularVentaModal({ venta, onClose, onAnulada }: {
  venta: NotaVenta;
  onClose: () => void;
  onAnulada: () => void;
}) {
  const cambiar = useCambiarEstadoVenta();
  const toast   = useToast(s => s.show);
  const [motivo, setMotivo] = useState('');

  async function handleAnular() {
    if (!motivo.trim()) return;
    try {
      await cambiar.mutateAsync({ id: venta.id, estado: EstadoVenta.CANCELADA, motivo: motivo.trim() });
      onAnulada();
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo anular la venta'), 'error');
    }
  }

  return (
    <Modal open title={`Anular NV-${venta.numeroNota}`} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cerrar</Btn>
        <Btn variant="danger" onClick={handleAnular} disabled={!motivo.trim()} loading={cambiar.isPending}>
          <Ban size={14} /> Confirmar anulación
        </Btn>
      </>}>
      <div className="rounded-[10px] px-4 py-3 flex items-start gap-2"
        style={{ background: 'var(--color-gr-danger-bg)', border: '1px solid rgba(181,61,53,0.15)' }}>
        <Ban size={15} className="text-gr-danger shrink-0 mt-0.5" />
        <p className="font-600 text-[13px] text-gr-danger">
          Solo se puede anular una venta pendiente (aún no despachada). El stock de los productos se repone automáticamente.
        </p>
      </div>
      <div className="text-[13.5px]">
        <p className="text-gr-muted">Cliente</p>
        <p className="font-800 text-gr-text">{venta.cliente?.nombre ?? '—'}</p>
        <p className="text-gr-muted mt-1">Total: <strong className="text-gr-text">{formatBs(Number(venta.totalBs))}</strong></p>
      </div>
      <FormField label="Motivo de la anulación" required hint="Obligatorio">
        <Textarea placeholder="Ej. El cliente canceló el pedido, error al registrar la venta..."
          value={motivo} onChange={e => setMotivo(e.target.value)} />
      </FormField>
    </Modal>
  );
}
