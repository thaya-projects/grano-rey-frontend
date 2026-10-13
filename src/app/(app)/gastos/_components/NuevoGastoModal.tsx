'use client';
import { useState } from 'react';
import { useCreateGasto } from '@/lib/api/gastos';
import { CategoriaGasto } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { Btn, Modal, FormField, Input, Select } from '@/components/ui';
import { Receipt } from 'lucide-react';
import { CATEGORIA_LABELS } from './constants';

export function NuevoGastoModal({ onClose, onSaved, onError }: {
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const create = useCreateGasto();
  const [fecha, setFecha]           = useState(new Date().toISOString().slice(0, 10));
  const [categoria, setCategoria]   = useState<CategoriaGasto>(CategoriaGasto.OTROS);
  const [descripcion, setDesc]      = useState('');
  const [montoBs, setMonto]         = useState('');
  const [comprobante, setComprobante] = useState('');

  const valid = !!descripcion.trim() && parseFloat(montoBs) > 0;

  async function handleSave() {
    if (!valid) return;
    try {
      await create.mutateAsync({
        fecha,
        categoria,
        descripcion: descripcion.trim(),
        montoBs: parseFloat(montoBs),
        comprobante: comprobante.trim() || undefined,
      });
      onSaved();
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo registrar el gasto'));
    }
  }

  return (
    <Modal open title="Registrar gasto" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!valid} loading={create.isPending}>
          <Receipt size={14} /> Registrar
        </Btn>
      </>}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Fecha" required>
          <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
        </FormField>
        <FormField label="Categoría" required>
          <Select value={categoria} onChange={e => setCategoria(e.target.value as CategoriaGasto)}>
            {Object.entries(CATEGORIA_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </FormField>
      </div>
      <FormField label="Descripción" required hint="Ej: Factura ELFEC julio 2026">
        <Input autoFocus value={descripcion} onChange={e => setDesc(e.target.value)}
          placeholder="Descripción del gasto" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Monto (Bs)" required>
          <Input type="number" min="0" step="0.01" placeholder="0.00"
            value={montoBs} onChange={e => setMonto(e.target.value)} />
        </FormField>
        <FormField label="Comprobante" hint="N° de factura o recibo (opcional)">
          <Input value={comprobante} onChange={e => setComprobante(e.target.value)}
            placeholder="FACT-00234" />
        </FormField>
      </div>
    </Modal>
  );
}
