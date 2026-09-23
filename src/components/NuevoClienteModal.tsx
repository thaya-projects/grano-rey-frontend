'use client';
import { useState } from 'react';
import { useCreateCliente, useUpdateCliente } from '@/lib/api/catalogos';
import { apiErrorMessage } from '@/lib/api';
import { Btn, Modal, FormField, Input, PhoneInput, useToast } from '@/components/ui';
import type { Cliente } from '@/lib/types';

interface NuevoClienteModalProps {
  /** Si se pasa, el modal edita este cliente en vez de crear uno nuevo. */
  cliente?: Cliente;
  onClose: () => void;
  onCreated?: (cliente: Cliente) => void;
}

export function NuevoClienteModal({ cliente, onClose, onCreated }: NuevoClienteModalProps) {
  const editando = !!cliente;
  const toast = useToast(s => s.show);
  const create = useCreateCliente();
  const update = useUpdateCliente();
  const [nombre, setNombre] = useState(cliente?.nombre ?? '');
  const [telefono, setTel] = useState(cliente?.telefono ?? '');
  const [direccion, setDir] = useState(cliente?.direccion ?? '');
  const [ciudad, setCiudad] = useState(cliente?.ciudad ?? '');
  const [nit, setNit] = useState(cliente?.nit ?? '');

  const pending = create.isPending || update.isPending;

  async function handleSave() {
    if (!nombre) return;
    const dto = {
      nombre,
      telefono: telefono || undefined,
      direccion: direccion || undefined,
      ciudad: ciudad || undefined,
      nit: nit || undefined,
    };
    try {
      const resultado = editando
        ? await update.mutateAsync({ id: cliente.id, dto })
        : await create.mutateAsync(dto);
      toast(editando ? 'Cliente actualizado' : 'Cliente creado', 'success');
      onCreated?.(resultado);
      onClose();
    } catch (err) { toast(apiErrorMessage(err, 'No se pudo guardar'), 'error'); }
  }

  return (
    <Modal open title={editando ? 'Editar cliente' : 'Nuevo cliente'} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!nombre} loading={pending}>
          {editando ? 'Guardar cambios' : 'Crear'}
        </Btn>
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
