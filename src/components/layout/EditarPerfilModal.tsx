'use client';
import { useState } from 'react';
import { useUpdateUsuario } from '@/lib/api/usuarios';
import { apiErrorMessage } from '@/lib/api';
import type { AuthUser } from '@/lib/auth-store';
import { Modal, Btn, FormField, Input, useToast } from '@/components/ui';
import { Save } from 'lucide-react';

export function EditarPerfilModal({ user, onClose }: { user: AuthUser; onClose: () => void }) {
  const actualizar = useUpdateUsuario();
  const toast = useToast(s => s.show);
  const [nombre, setNombre] = useState(user.nombre);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');

  async function handleGuardar() {
    try {
      await actualizar.mutateAsync({
        id: user.id,
        dto: { nombre: nombre.trim(), email: email.trim(), ...(password.trim() ? { password: password.trim() } : {}) },
      });
      toast('Perfil actualizado', 'success');
      onClose();
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo actualizar el perfil'), 'error');
    }
  }

  return (
    <Modal open title="Editar perfil" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleGuardar} loading={actualizar.isPending} disabled={!nombre.trim() || !email.trim()}>
          <Save size={14} /> Guardar cambios
        </Btn>
      </>}>
      <FormField label="Nombre" required>
        <Input value={nombre} onChange={e => setNombre(e.target.value)} />
      </FormField>
      <FormField label="Email" required>
        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
      </FormField>
      <FormField label="Nueva contraseña" hint="Dejar en blanco para no cambiarla">
        <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
      </FormField>
    </Modal>
  );
}
