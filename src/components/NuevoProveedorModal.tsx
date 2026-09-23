'use client';
import { useState } from 'react';
import { useCreateProveedor, useUpdateProveedor } from '@/lib/api/catalogos';
import { apiErrorMessage } from '@/lib/api';
import { Btn, Modal, FormField, Input, PhoneInput, useToast } from '@/components/ui';
import type { Proveedor } from '@/lib/types';

interface NuevoProveedorModalProps {
  /** Si se pasa, el modal edita este proveedor en vez de crear uno nuevo. */
  proveedor?: Proveedor;
  onClose: () => void;
  onCreated?: (proveedor: Proveedor) => void;
}

export function NuevoProveedorModal({ proveedor, onClose, onCreated }: NuevoProveedorModalProps) {
  const editando = !!proveedor;
  const toast = useToast(s => s.show);
  const create = useCreateProveedor();
  const update = useUpdateProveedor();
  const [nombre, setNombre] = useState(proveedor?.nombre ?? '');
  const [contacto, setContacto] = useState(proveedor?.contacto ?? '');
  const [telefono, setTel] = useState(proveedor?.telefono ?? '');
  const [ciudad, setCiudad] = useState(proveedor?.ciudad ?? '');
  const [nit, setNit] = useState(proveedor?.nit ?? '');

  const pending = create.isPending || update.isPending;

  async function handleSave() {
    if (!nombre) return;
    const dto = {
      nombre,
      contacto: contacto || undefined,
      telefono: telefono || undefined,
      ciudad: ciudad || undefined,
      nit: nit || undefined,
    };
    try {
      const resultado = editando
        ? await update.mutateAsync({ id: proveedor.id, dto })
        : await create.mutateAsync(dto);
      toast(editando ? 'Proveedor actualizado' : 'Proveedor creado', 'success');
      onCreated?.(resultado);
      onClose();
    } catch (err) { toast(apiErrorMessage(err, 'No se pudo guardar'), 'error'); }
  }

  return (
    <Modal open title={editando ? 'Editar proveedor' : 'Nuevo proveedor'} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!nombre} loading={pending}>
          {editando ? 'Guardar cambios' : 'Crear'}
        </Btn>
      </>}>
      <FormField label="Nombre" required hint="Obligatorio">
        <Input value={nombre} onChange={e => setNombre(e.target.value)} autoFocus />
      </FormField>
      <FormField label="Contacto" hint="Opcional"><Input value={contacto} onChange={e => setContacto(e.target.value)} /></FormField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Ciudad" hint="Opcional"><Input value={ciudad} onChange={e => setCiudad(e.target.value)} /></FormField>
        <FormField label="Teléfono" hint="Opcional"><PhoneInput value={telefono} onChange={setTel} /></FormField>
      </div>
      <FormField label="NIT" hint="Opcional"><Input value={nit} onChange={e => setNit(e.target.value)} /></FormField>
    </Modal>
  );
}
