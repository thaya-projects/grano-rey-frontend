'use client';
import { useState } from 'react';
import { useCreateMateriaPrima } from '@/lib/api/materia-prima';
import { apiErrorMessage } from '@/lib/api';
import { sugerirCodigo } from '@/lib/utils';
import { Btn, Modal, FormField, Input, Select } from '@/components/ui';

export function NuevaMPModal({ categorias, unidades, codigosExistentes, onClose, onSaved, onError }: {
  categorias: { id: string; nombre: string }[];
  unidades: { id: string; codigo: string; nombre: string }[];
  codigosExistentes: Set<string>;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const create = useCreateMateriaPrima();
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [codigoEditado, setCodigoEditado] = useState(false);
  const [descripcion, setDesc] = useState('');
  const [categoriaId, setCatId] = useState('');
  const [unidadMedidaId, setUnidad] = useState('');
  const [stockMinimoKg, setMin] = useState('0');

  function handleNombreChange(val: string) {
    setNombre(val);
    if (!codigoEditado) {
      setCodigo(sugerirCodigo(val, codigosExistentes));
    }
  }

  const codigoConflicto = !!codigo && codigosExistentes.has(codigo);
  const valid = !!codigo && !!nombre && !!categoriaId && !!unidadMedidaId && !codigoConflicto;

  async function handleSave() {
    if (!valid) return;
    try {
      await create.mutateAsync({
        codigo, nombre, descripcion: descripcion || undefined,
        categoriaId, unidadMedidaId,
        stockMinimoKg: parseFloat(stockMinimoKg) || undefined,
      });
      onSaved();
    } catch (err) { onError(apiErrorMessage(err, 'No se pudo crear')); }
  }

  return (
    <Modal open title="Nueva materia prima" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!valid} loading={create.isPending}>Crear</Btn>
      </>}>
      <FormField label="Nombre" required>
        <Input autoFocus value={nombre} onChange={e => handleNombreChange(e.target.value)} placeholder="Maíz Amarillo" />
      </FormField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Código" required hint={codigoConflicto ? '⚠ Ya existe — cambialo' : codigoEditado ? 'Editado' : 'Sugerido · editable'}>
          <Input value={codigo} onChange={e => { setCodigo(e.target.value.toUpperCase()); setCodigoEditado(true); }}
            placeholder="MAZ-AM"
            className={codigoConflicto ? 'border-red-400 focus:ring-red-300' : ''} />
        </FormField>
        <FormField label="Stock mínimo (kg)">
          <Input type="number" min="0" step="0.1" value={stockMinimoKg} onChange={e => setMin(e.target.value)} />
        </FormField>
      </div>
      <FormField label="Descripción">
        <Input value={descripcion} onChange={e => setDesc(e.target.value)} />
      </FormField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Categoría" required>
          <Select value={categoriaId} onChange={e => setCatId(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Select>
        </FormField>
        <FormField label="Unidad" required>
          <Select value={unidadMedidaId} onChange={e => setUnidad(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {unidades.map(u => <option key={u.id} value={u.id}>{u.codigo} · {u.nombre}</option>)}
          </Select>
        </FormField>
      </div>
    </Modal>
  );
}
