'use client';
import { useState } from 'react';
import { useAnularKardexMP } from '@/lib/api/materia-prima';
import { type KardexMP } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { formatNum } from '@/lib/utils';
import { Btn, Modal, FormField, Textarea, useToast } from '@/components/ui';
import { Ban } from 'lucide-react';

export function AnularCompraModal({ kardex, onClose, onAnulada }: {
  kardex: KardexMP;
  onClose: () => void;
  onAnulada: () => void;
}) {
  const anular = useAnularKardexMP();
  const toast  = useToast(s => s.show);
  const [motivo, setMotivo] = useState('');

  async function handleAnular() {
    if (!motivo.trim()) return;
    try {
      await anular.mutateAsync({ id: kardex.id, motivo: motivo.trim() });
      onAnulada();
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo anular la compra'), 'error');
    }
  }

  return (
    <Modal open title={`Anular compra — ${kardex.numeroLotePropio ?? kardex.materiaPrima?.nombre}`} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cerrar</Btn>
        <Btn variant="danger" onClick={handleAnular} disabled={!motivo.trim()} loading={anular.isPending}>
          <Ban size={14} /> Confirmar anulación
        </Btn>
      </>}>
      <div className="rounded-[10px] px-4 py-3 flex items-start gap-2"
        style={{ background: 'var(--color-gr-danger-bg)', border: '1px solid rgba(181,61,53,0.15)' }}>
        <Ban size={15} className="text-gr-danger shrink-0 mt-0.5" />
        <p className="font-600 text-[13px] text-gr-danger">
          Solo se puede anular una compra que aún no se pagó. El stock que sumó esta entrada se resta automáticamente.
        </p>
      </div>
      <div className="text-[13.5px]">
        <p className="text-gr-muted">Materia prima</p>
        <p className="font-800 text-gr-text">{kardex.materiaPrima?.nombre ?? '—'}</p>
        <p className="text-gr-muted mt-1">
          Cantidad: <strong className="text-gr-text">{formatNum(kardex.cantidad, 1)} {kardex.unidad?.codigo ?? ''}</strong>
          {kardex.proveedor && <> · Proveedor: <strong className="text-gr-text">{kardex.proveedor.nombre}</strong></>}
        </p>
      </div>
      <FormField label="Motivo de la anulación" required hint="Obligatorio">
        <Textarea placeholder="Ej. El proveedor no entregó, error al registrar la compra..."
          value={motivo} onChange={e => setMotivo(e.target.value)} />
      </FormField>
    </Modal>
  );
}
