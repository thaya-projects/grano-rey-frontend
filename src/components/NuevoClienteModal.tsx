'use client';
import { useState } from 'react';
import { useCreateCliente } from '@/lib/api/catalogos';
import { apiErrorMessage } from '@/lib/api';
import { Btn, Modal, FormField, Input, PhoneInput, useToast } from '@/components/ui';
import type { Cliente } from '@/lib/types';

interface NuevoClienteModalProps {
  onClose: () => void;
  onCreated?: (cliente: Cliente) => void;
}

export function NuevoClienteModal({ onClose, onCreated }: NuevoClienteModalProps) {
  const toast = useToast(s => s.show);
  const create = useCreateCliente();
  const [nombre, setNombre] = useState('');
  const [telefono, setTel] = useState('');
  const [direccion, setDir] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [nit, setNit] = useState('');

  async function handleSave() {
    if (!nombre) return;
    try {
      const cliente = await create.mutateAsync({
        nombre,
        telefono: telefono || undefined,
        direccion: direccion || undefined,
        ciudad: ciudad || undefined,
        nit: nit || undefined,
      });
      toast('Cliente creado', 'success');
      onCreated?.(cliente);
      onClose();
    } catch (err) { toast(apiErrorMessage(err, 'No se pudo crear'), 'error'); }
  }

  return (
    <Modal open title="Nuevo cliente" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!nombre} loading={create.isPending}>Crear</Btn>
      </>}>
      <FormField label="Nombre" required hint="Obligatorio">
        <Input value={nombre} onChange={e => setNombre(e.target.value)} autoFocus />
      </FormField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Teléfono" hint="Opcional"><PhoneInput value={telefono} onChange={setTel} /></FormField>
        <FormField label="Ciudad" hint="Opcional"><Input value={ciudad} onChange={e => setCiudad(e.target.value)} /></FormField>
      </div>
      <FormField label="Dirección" hint="Opcional"><Input value={direccion} onChange={e => setDir(e.target.value)} /></FormField>
      <FormField label="NIT" hint="Opcional"><Input value={nit} onChange={e => setNit(e.target.value)} /></FormField>
    </Modal>
  );
}
