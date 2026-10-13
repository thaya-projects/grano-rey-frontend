import { type Gasto } from '@/lib/types';
import { formatBs } from '@/lib/utils';
import { Btn, Modal } from '@/components/ui';
import { Trash2 } from 'lucide-react';

export function ComprobantePreviewModal({ gasto, onClose, onEliminar, eliminando }: {
  gasto: Gasto;
  onClose: () => void;
  onEliminar: () => void;
  eliminando: boolean;
}) {
  return (
    <Modal open wide title={gasto.descripcion} onClose={onClose}
      footer={
        <Btn variant="danger" size="sm" onClick={onEliminar} loading={eliminando}>
          <Trash2 size={12} /> Eliminar imagen
        </Btn>
      }>
      <p className="text-[12px] text-gr-muted -mt-2">{gasto.fecha} · {formatBs(Number(gasto.montoBs))}</p>
      <div className="flex items-center justify-center p-2 min-h-50">
        {gasto.comprobanteImagenUrl ? (
          gasto.comprobanteImagenUrl.toLowerCase().includes('.pdf') ? (
            <iframe src={gasto.comprobanteImagenUrl} className="w-full h-[60vh] rounded-lg border border-gr-border" title="Comprobante PDF" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={gasto.comprobanteImagenUrl} alt="Comprobante"
              className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md" />
          )
        ) : (
          <p className="text-gr-muted text-[13px]">Imagen no disponible (el enlace puede haber expirado)</p>
        )}
      </div>
    </Modal>
  );
}
