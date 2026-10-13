'use client';
import { useState } from 'react';
import { useUpdateUsuario } from '@/lib/api/usuarios';
import { RolUsuario, type Usuario } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { generarPassword } from '@/lib/utils';
import { Btn, Modal, FormField, Input, Select } from '@/components/ui';
import { Pencil, Wand2, Eye, EyeOff } from 'lucide-react';
import { ROL_LABELS } from './constants';

export function EditarUsuarioModal({ usuario, onClose, onSaved, onError }: {
  usuario: Usuario;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const update = useUpdateUsuario();
  const [nombre, setNombre]     = useState(usuario.nombre);
  const [email, setEmail]       = useState(usuario.email);
  const [rol, setRol]           = useState<RolUsuario>(usuario.rol);
  const [telefono, setTelefono] = useState(usuario.telefono ?? '');
  const [activo, setActivo]     = useState(usuario.activo);
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);

  const valid = !!nombre.trim() && !!email.trim() && (password === '' || password.length >= 6);

  function handleGenerar() {
    setPassword(generarPassword());
    setVerPassword(true);
  }

  async function handleSave() {
    if (!valid) return;
    try {
      await update.mutateAsync({
        id: usuario.id,
        dto: {
          nombre: nombre.trim(),
          email: email.trim().toLowerCase(),
          rol,
          telefono: telefono.trim() || undefined,
          activo,
          password: password || undefined,
        },
      });
      onSaved();
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo actualizar el usuario'));
    }
  }

  return (
    <Modal open title={`Editar — ${usuario.nombre}`} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!valid} loading={update.isPending}>
          <Pencil size={14} /> Guardar cambios
        </Btn>
      </>}>
      <FormField label="Nombre completo" required>
        <Input autoFocus value={nombre} onChange={e => setNombre(e.target.value)} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Email" required>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </FormField>
        <FormField label="Teléfono">
          <Input value={telefono} onChange={e => setTelefono(e.target.value)}
            placeholder="76012345" />
        </FormField>
      </div>
      <FormField label="Nueva contraseña" hint={password && password.length < 6 ? 'Mínimo 6 caracteres' : 'Dejar en blanco para no cambiarla'}
        error={password && password.length < 6 ? 'Mínimo 6 caracteres' : undefined}>
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
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Rol" required>
          <Select value={rol} onChange={e => setRol(e.target.value as RolUsuario)}>
            {Object.entries(ROL_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Estado">
          <Select value={activo ? 'true' : 'false'} onChange={e => setActivo(e.target.value === 'true')}>
            <option value="true">Activo</option>
            <option value="false">Inhabilitado</option>
          </Select>
        </FormField>
      </div>
      {!activo && (
        <p className="text-[12px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Un usuario inhabilitado no puede iniciar sesión, pero su historial se conserva.
        </p>
      )}
    </Modal>
  );
}
