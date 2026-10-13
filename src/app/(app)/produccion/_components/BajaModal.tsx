'use client';
import { useState } from 'react';
import { useAjusteStock } from '@/lib/api/productos';
import { type Producto } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { formatNum } from '@/lib/utils';
import { Btn, Modal, FormField, Input, Select, Textarea } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';

const MOTIVOS_BAJA = ['Pérdida', 'Daño en almacén', 'Vencimiento', 'Otro'];

export function BajaModal({ productos, onClose, onSaved, onError }: {
  productos: Producto[];
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const ajusteStock = useAjusteStock();
  const [productoId, setProductoId] = useState(productos[0]?.id ?? '');
  const [motivo, setMotivo]         = useState('');
  const [cantidad, setCantidad]     = useState('');
  const [desc, setDesc]             = useState('');

  const producto = productos.find(p => p.id === productoId) ?? null;
  const cantNum  = parseFloat(cantidad) || 0;
  const valid    = !!productoId && !!motivo && cantNum > 0
    && cantNum <= Number(producto?.stockActual ?? 0);

  async function handleSave() {
    if (!valid || !producto) return;
    try {
      await ajusteStock.mutateAsync({
        id: producto.id,
        cantidad: -cantNum, // negativo = baja de stock
        motivo: `${motivo}${desc ? ` — ${desc}` : ''}`,
      });
      onSaved();
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo registrar la baja'));
    }
  }

  return (
    <Modal open title="Registrar baja de producto" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="danger" onClick={handleSave} disabled={!valid} loading={ajusteStock.isPending}>
          Confirmar baja
        </Btn>
      </>}>

      <div className="rounded-md px-4 py-3 flex items-start gap-2"
        style={{ background: 'var(--color-gr-danger-bg)', border: '1px solid rgba(181,61,53,0.15)' }}>
        <AlertTriangle size={15} className="text-gr-danger shrink-0 mt-0.5" />
        <p className="font-600 text-[13px] text-gr-danger">
          Solo para pérdidas, daños o vencimiento. Las ventas descuentan automáticamente.
        </p>
      </div>

      <FormField label="Producto" required>
        <Select value={productoId} onChange={e => { setProductoId(e.target.value); setCantidad(''); }}>
          <option value="">— Seleccionar producto —</option>
          {productos.map(p => (
            <option key={p.id} value={p.id}>
              {p.nombre} — {formatNum(Number(p.stockActual), 0)} {p.unidadProduccion?.abreviatura ?? 'u'} disponibles
            </option>
          ))}
        </Select>
      </FormField>

      {producto && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Motivo" required>
              <Select value={motivo} onChange={e => setMotivo(e.target.value)}>
                <option value="">— Seleccionar —</option>
                {MOTIVOS_BAJA.map(m => <option key={m} value={m}>{m}</option>)}
              </Select>
            </FormField>
            <FormField label={`Cantidad (${producto.unidadProduccion?.abreviatura ?? 'u'})`} required>
              <Input type="number" min="1" max={Number(producto.stockActual)} placeholder="0"
                value={cantidad} onChange={e => setCantidad(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Descripción">
            <Textarea placeholder="Describir qué ocurrió..." value={desc}
              onChange={e => setDesc(e.target.value)} />
          </FormField>
        </>
      )}
    </Modal>
  );
}
