'use client';
import { useState } from 'react';
import { useCreateTransportista, useUpdateTransportista } from '@/lib/api/catalogos';
import { apiErrorMessage } from '@/lib/api';
import { Btn, Modal, FormField, Input, PhoneInput, useToast } from '@/components/ui';
import type { Transportista } from '@/lib/types';

interface NuevoTransportistaModalProps {
  /** Si se pasa, el modal edita este transportista en vez de crear uno nuevo. */
  transportista?: Transportista;
  onClose: () => void;
  onCreated?: (transportista: Transportista) => void;
}

export function NuevoTransportistaModal({ transportista, onClose, onCreated }: NuevoTransportistaModalProps) {
  const editando = !!transportista;
  const toast = useToast(s => s.show);
  const create = useCreateTransportista();
  const update = useUpdateTransportista();
  const [nombre, setNombre] = useState(transportista?.nombre ?? '');
  const [telefono, setTel] = useState(transportista?.telefono ?? '');
  const [empresa, setEmpresa] = useState(transportista?.empresa ?? '');
  const [placa, setPlaca] = useState(transportista?.placa ?? '');
  const [marca, setMarca] = useState(transportista?.marca ?? '');
  const [color, setColor] = useState(transportista?.color ?? '');
  const [destinoHabitual, setDestino] = useState(transportista?.destinoHabitual ?? '');
  const [ci, setCi] = useState(transportista?.ci ?? '');

  const pending = create.isPending || update.isPending;

  async function handleSave() {
    if (!nombre) return;
    const dto = {
      nombre,
      ci: ci || undefined,
      empresa: empresa || undefined,
      telefono: telefono || undefined,
      placa: placa || undefined,
      marca: marca || undefined,
      color: color || undefined,
      destinoHabitual: destinoHabitual || undefined,
    };
    try {
      const resultado = editando
        ? await update.mutateAsync({ id: transportista.id, dto })
        : await create.mutateAsync(dto);
      toast(editando ? 'Transportista actualizado' : 'Transportista creado', 'success');
      onCreated?.(resultado);
      onClose();
    } catch (err) { toast(apiErrorMessage(err, 'No se pudo guardar'), 'error'); }
  }

  return (
    <Modal open title={editando ? 'Editar transportista' : 'Nuevo transportista'} onClose={onClose}
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
        <FormField label="CI" hint="Opcional"><Input value={ci} onChange={e => setCi(e.target.value)} /></FormField>
        <FormField label="Teléfono" hint="Opcional"><PhoneInput value={telefono} onChange={setTel} /></FormField>
      </div>
      <FormField label="Empresa" hint="Opcional"><Input value={empresa} onChange={e => setEmpresa(e.target.value)} /></FormField>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField label="Placa" hint="Opcional"><Input value={placa} onChange={e => setPlaca(e.target.value)} /></FormField>
        <FormField label="Marca" hint="Opcional"><Input value={marca} onChange={e => setMarca(e.target.value)} /></FormField>
        <FormField label="Color" hint="Opcional"><Input value={color} onChange={e => setColor(e.target.value)} placeholder="Blanco" /></FormField>
      </div>
      <FormField label="Destino habitual" hint="Opcional">
        <Input value={destinoHabitual} onChange={e => setDestino(e.target.value)} placeholder="Ej. Santa Cruz - Cochabamba" />
      </FormField>
    </Modal>
  );
}
