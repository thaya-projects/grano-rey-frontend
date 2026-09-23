'use client';
import { useState } from 'react';
import { useCreateTransportista } from '@/lib/api/catalogos';
import { apiErrorMessage } from '@/lib/api';
import { Btn, Modal, FormField, Input, PhoneInput, useToast } from '@/components/ui';
import type { Transportista } from '@/lib/types';

interface NuevoTransportistaModalProps {
  onClose: () => void;
  onCreated?: (transportista: Transportista) => void;
}

export function NuevoTransportistaModal({ onClose, onCreated }: NuevoTransportistaModalProps) {
  const toast = useToast(s => s.show);
  const create = useCreateTransportista();
  const [nombre, setNombre] = useState('');
  const [telefono, setTel] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [color, setColor] = useState('');
  const [destinoHabitual, setDestino] = useState('');
  const [ci, setCi] = useState('');

  async function handleSave() {
    if (!nombre) return;
    try {
      const transportista = await create.mutateAsync({
        nombre,
        ci: ci || undefined,
        empresa: empresa || undefined,
        telefono: telefono || undefined,
        placa: placa || undefined,
        marca: marca || undefined,
        color: color || undefined,
        destinoHabitual: destinoHabitual || undefined,
      });
      toast('Transportista creado', 'success');
      onCreated?.(transportista);
      onClose();
    } catch (err) { toast(apiErrorMessage(err, 'No se pudo crear'), 'error'); }
  }

  return (
    <Modal open title="Nuevo transportista" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!nombre} loading={create.isPending}>Crear</Btn>
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
