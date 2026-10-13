'use client';
import { useState } from 'react';
import { useCreateCategoriaMP } from '@/lib/api/catalogos';
import { apiErrorMessage } from '@/lib/api';
import { Btn, Modal, FormField, Input } from '@/components/ui';

export function NuevaCategoriaMPModal({ onClose, onSaved, onError }: {
  onClose: () => void; onSaved: () => void; onError: (msg: string) => void;
}) {
  const create = useCreateCategoriaMP();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDesc] = useState('');
  const [tieneSubtipos, setSubt] = useState(false);

  async function handleSave() {
    if (!nombre) return;
    try {
      await create.mutateAsync({ nombre, descripcion: descripcion || undefined, tieneSubtipos });
      onSaved();
    } catch (err) { onError(apiErrorMessage(err, 'No se pudo crear')); }
  }

  return (
    <Modal open title="Nueva categoría MP" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!nombre} loading={create.isPending}>Crear</Btn>
      </>}>
      <FormField label="Nombre" required><Input value={nombre} onChange={e => setNombre(e.target.value)} /></FormField>
      <FormField label="Descripción"><Input value={descripcion} onChange={e => setDesc(e.target.value)} /></FormField>
      <label className="flex items-center gap-2 text-[13.5px] cursor-pointer">
        <input type="checkbox" checked={tieneSubtipos} onChange={e => setSubt(e.target.checked)} /> Permite subtipos
      </label>
    </Modal>
  );
}
