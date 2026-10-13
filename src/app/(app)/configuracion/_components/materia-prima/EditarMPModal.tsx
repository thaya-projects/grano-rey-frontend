'use client';
import { useState } from 'react';
import { useUpdateMateriaPrima } from '@/lib/api/materia-prima';
import { apiErrorMessage } from '@/lib/api';
import type { MateriaPrima } from '@/lib/types';
import { Btn, Modal, FormField, Input, Select } from '@/components/ui';

export function EditarMPModal({ mp, unidades, onClose, onSaved, onError }: {
  mp: MateriaPrima;
  unidades: { id: string; codigo: string; nombre: string }[];
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const update = useUpdateMateriaPrima();
  const [nombre, setNombre] = useState(mp.nombre);
  const [descripcion, setDesc] = useState(mp.descripcion ?? '');
  const [stockMinimoKg, setMin] = useState(String(mp.stockMinimoKg ?? '0'));
  const [unidadMedidaId, setUnidad] = useState(mp.unidadMedida?.id ?? '');

  const valid = !!nombre;

  async function handleSave() {
    if (!valid) return;
    try {
      await update.mutateAsync({
        id: mp.id,
        dto: {
          nombre,
          descripcion: descripcion || undefined,
          stockMinimoKg: parseFloat(stockMinimoKg) || undefined,
          unidadMedidaId: unidadMedidaId || undefined,
        },
      });
      onSaved();
    } catch (err) { onError(apiErrorMessage(err, 'No se pudo actualizar')); }
  }

  return (
    <Modal open title={`Editar — ${mp.nombre}`} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!valid} loading={update.isPending}>Guardar</Btn>
      </>}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Código" hint="No editable">
          <Input value={mp.codigo} disabled />
        </FormField>
        <FormField label="Stock mínimo (kg)">
          <Input type="number" min="0" step="0.1" value={stockMinimoKg} onChange={e => setMin(e.target.value)} />
        </FormField>
      </div>
      <FormField label="Nombre" required>
        <Input value={nombre} onChange={e => setNombre(e.target.value)} />
      </FormField>
      <FormField label="Descripción">
        <Input value={descripcion} onChange={e => setDesc(e.target.value)} />
      </FormField>
      <FormField label="Unidad">
        <Select value={unidadMedidaId} onChange={e => setUnidad(e.target.value)}>
          <option value="">— Sin cambio —</option>
          {unidades.map(u => <option key={u.id} value={u.id}>{u.codigo} · {u.nombre}</option>)}
        </Select>
      </FormField>
    </Modal>
  );
}
