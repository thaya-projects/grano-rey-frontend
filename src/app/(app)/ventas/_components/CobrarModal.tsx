'use client';
import { useState } from 'react';
import { useCobrarVenta } from '@/lib/api/ventas';
import { apiErrorMessage } from '@/lib/api';
import { MetodoPago, TipoFlete, type NotaVenta } from '@/lib/types';
import { formatBs } from '@/lib/utils';
import { Modal, Btn, FormField, Select, Input, useToast } from '@/components/ui';
import { CheckCircle } from 'lucide-react';

export function CobrarModal({ venta, onClose, onCobrada }: {
  venta: NotaVenta;
  onClose: () => void;
  onCobrada: () => void;
}) {
  const cobrar = useCobrarVenta();
  const toast  = useToast(s => s.show);
  const [metodo, setMetodo] = useState<MetodoPago>(MetodoPago.EFECTIVO);
  const [fecha, setFecha]   = useState(new Date().toISOString().slice(0, 10));

  async function handleCobrar() {
    try {
      await cobrar.mutateAsync({ id: venta.id, metodoPago: metodo, fechaCobro: fecha });
      onCobrada();
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo registrar el cobro'), 'error');
    }
  }

  return (
    <Modal open title={`Registrar cobro — NV-${venta.numeroNota}`} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleCobrar} loading={cobrar.isPending} variant="green">
          <CheckCircle size={14} /> Confirmar cobro
        </Btn>
      </>}>
      <div className="rounded-[10px] px-4 py-3 text-[13.5px]" style={{ background: 'var(--color-gr-primary-lite)' }}>
        <p className="text-gr-muted">Cliente</p>
        <p className="font-800 text-gr-text">{venta.cliente?.nombre}</p>
        {venta.cliente?.telefono && (
          <p className="text-[12px] text-gr-muted">Cel: {venta.cliente.telefono}</p>
        )}
        <p className="text-[22px] font-900 text-gr-primary mt-1">{formatBs(Number(venta.totalBs))}</p>
        {venta.tipoFlete === TipoFlete.INCLUIDO_EN_VENTA && Number(venta.fleteBs) > 0
          && Math.abs(Number(venta.subtotalBs) + Number(venta.fleteBs) - (Number(venta.descuentoBs) || 0) - Number(venta.totalBs)) >= 0.01 && (
          <p className="text-[11px] font-700 mt-0.5" style={{ color: 'var(--color-gr-danger)' }}>
            ⚠ Este total no incluye el flete de {formatBs(Number(venta.fleteBs))} — debería ser {formatBs(Number(venta.subtotalBs) + Number(venta.fleteBs) - (Number(venta.descuentoBs) || 0))}. Revisa con el backend antes de cobrar.
          </p>
        )}
        {venta.tipoFlete === TipoFlete.GRANO_REY_PAGA && Number(venta.fleteBs) > 0 && (
          <p className="text-[11px] italic mt-0.5" style={{ color: 'var(--color-gr-warning)' }}>
            No incluye el flete ({formatBs(Number(venta.fleteBs))}) — lo asume Grano Rey aparte
          </p>
        )}
        {venta.tipoFlete === TipoFlete.CLIENTE_PAGA_DIRECTO && (
          <p className="text-[11px] italic mt-0.5" style={{ color: 'var(--color-gr-info)' }}>
            No incluye flete — el cliente lo paga directo al transportista
          </p>
        )}
      </div>
      <FormField label="Método de pago" required>
        <Select value={metodo} onChange={e => setMetodo(e.target.value as MetodoPago)}>
          <option value={MetodoPago.EFECTIVO}>Efectivo</option>
          <option value={MetodoPago.QR}>QR</option>
          <option value={MetodoPago.TRANSFERENCIA}>Transferencia bancaria</option>
        </Select>
      </FormField>
      <FormField label="Fecha de cobro" required>
        <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
      </FormField>
    </Modal>
  );
}
