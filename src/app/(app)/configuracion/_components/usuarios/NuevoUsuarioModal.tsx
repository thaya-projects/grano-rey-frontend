'use client';
import { useState } from 'react';
import { useCreateUsuario } from '@/lib/api/usuarios';
import { RolUsuario } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { generarPassword } from '@/lib/utils';
import { Btn, Modal, FormField, Input, Select } from '@/components/ui';
import { Plus, Wand2, Eye, EyeOff } from 'lucide-react';
import { ROL_LABELS } from './constants';

export function NuevoUsuarioModal({ onClose, onSaved, onError }: {
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const create = useCreateUsuario();
  const [nombre, setNombre]     = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [rol, setRol]           = useState<RolUsuario>(RolUsuario.VENDEDOR);
  const [telefono, setTelefono] = useState('');

  const valid = !!nombre.trim() && !!email.trim() && password.length >= 6;

  function handleGenerar() {
    setPassword(generarPassword());
    setVerPassword(true);
  }

  async function handleSave() {
    if (!valid) return;
    try {
      await create.mutateAsync({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        password,
        rol,
        telefono: telefono.trim() || undefined,
      });
      onSaved();
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo crear el usuario'));
    }
  }

  return (
    <Modal open title="Crear usuario" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!valid} loading={create.isPending}>
          <Plus size={14} /> Crear usuario
        </Btn>
      </>}>
      <FormField label="Nombre completo" required>
        <Input autoFocus value={nombre} onChange={e => setNombre(e.target.value)}
          placeholder="Carlos Mamani" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Email" required>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="carlos@granorey.bo" />
        </FormField>
        <FormField label="Contraseña" required hint="Mínimo 6 caracteres">
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Input type={verPassword ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••" className="pr-9" />
              <button type="button" onClick={() => setVerPassword(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gr-muted hover:text-gr-text">
                {verPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <Btn type="button" size="sm" variant="ghost" onClick={handleGenerar} title="Generar contraseña">
              <Wand2 size={14} />
            </Btn>
          </div>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Rol" required>
          <Select value={rol} onChange={e => setRol(e.target.value as RolUsuario)}>
            {Object.entries(ROL_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Teléfono" hint="Opcional">
          <Input value={telefono} onChange={e => setTelefono(e.target.value)}
            placeholder="76012345" />
        </FormField>
      </div>
    </Modal>
  );
}
