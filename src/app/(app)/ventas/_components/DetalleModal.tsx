import Link from 'next/link';
import { EstadoVenta, EstadoPagoVenta, type NotaVenta } from '@/lib/types';
import { Modal, Btn } from '@/components/ui';
import { DocumentoVenta } from '@/components/print/DocumentoVenta';
import { BotonImprimir } from '@/components/print/BotonImprimir';
import { Ban, Banknote, ShoppingCart, Printer } from 'lucide-react';

export function DetalleModal({ venta: v, onClose, onCambiarEstado, onCobrar, onAnular }: {
  venta: NotaVenta;
  onClose: () => void;
  onCambiarEstado: (id: string) => void;
  onCobrar: (v: NotaVenta) => void;
  onAnular: (v: NotaVenta) => void;
}) {
  return (
    <Modal open title={`Nota de Venta NV-${v.numeroNota}`} onClose={onClose} xl>
      <DocumentoVenta venta={v} modo="nota" />

      <div className="flex gap-3 justify-end flex-wrap">
        <Btn variant="ghost" onClick={onClose}>Cerrar</Btn>
        {v.estado === EstadoVenta.PENDIENTE && (
          <Btn variant="danger" onClick={() => onAnular(v)}>
            <Ban size={14} /> Anular venta
          </Btn>
        )}
        {v.estadoPago === EstadoPagoVenta.PENDIENTE && (
          <Btn variant="green" onClick={() => onCobrar(v)}>
            <Banknote size={14} /> Cobrar
          </Btn>
        )}
        <Btn variant="secondary" onClick={() => { onCambiarEstado(v.id); onClose(); }}>
          <ShoppingCart size={14} /> Cambiar estado
        </Btn>
        <BotonImprimir ventaId={v.id} tipo="nota"
          className="inline-flex items-center gap-2 bg-gr-border-lite hover:bg-gr-border text-gr-text font-700 px-3 py-2 rounded-[10px] text-[13px]" />
        <BotonImprimir ventaId={v.id} tipo="proforma"
          className="inline-flex items-center gap-2 bg-gr-gold-lite hover:bg-gr-gold text-gr-gold-dark font-700 px-3 py-2 rounded-[10px] text-[13px]" />
        <Link href={`/ventas/${v.id}/imprimir?modo=combinada`}
          className="inline-flex items-center gap-2 bg-gr-primary hover:bg-gr-primary-mid text-white font-700 px-3 py-2 rounded-[10px] text-[13px]">
          <Printer size={14} /> Combinada (Grano Rey)
        </Link>
      </div>
    </Modal>
  );
}
