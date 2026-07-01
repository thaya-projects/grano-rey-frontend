'use client';
import { useState } from 'react';
import { useCargadores, useCreateCargador, useUpdateCargador } from '@/lib/api/cargadores';
import { apiErrorMessage } from '@/lib/api';
import type { Cargador } from '@/lib/types';
import { Btn, Modal, FormField, Input, Spinner, useToast } from '@/components/ui';
import { Plus, Pencil } from 'lucide-react';

export function TabCargadores() {
  const toast = useToast(s => s.show);
  const q = useCargadores();
  const create = useCreateCargador();
  const update = useUpdateCargador();
  const items = q.data ?? [];

  const [modal, setModal] = useState<{ mode: 'create' } | { mode: 'edit'; cargador: Cargador } | null>(null);
  const [nombre, setNombre] = useState('');
  const [ci, setCi] = useState('');
  const [telefono, setTel] = useState('');

  function openCreate() {
    setNombre(''); setCi(''); setTel('');
    setModal({ mode: 'create' });
  }

  function openEdit(c: Cargador) {
    setNombre(c.nombre);
    setCi(c.ci ?? '');
    setTel(c.telefono ?? '');
    setModal({ mode: 'edit', cargador: c });
  }

  async function handleSave() {
    if (!nombre.trim()) return;
    try {
      if (modal?.mode === 'create') {
        await create.mutateAsync({
          nombre: nombre.trim(),
          ci: ci.trim() || undefined,
          telefono: telefono.trim() || undefined,
        });
      } else if (modal?.mode === 'edit') {
        await update.mutateAsync({
          id: modal.cargador.id,
          dto: {
            nombre: nombre.trim(),
            ci: ci.trim() || undefined,
            telefono: telefono.trim() || undefined,
          },
        });
      }
      setModal(null);
      toast(modal?.mode === 'create' ? 'Cargador creado' : 'Cargador actualizado', 'success');
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo guardar'), 'error');
    }
  }

  if (q.isLoading) {
    return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--color-gr-muted)]">{items.length} cargadores activos</p>
        <Btn onClick={openCreate}><Plus size={14} /> Nuevo cargador</Btn>
      </div>
      <div className="card-no-pad overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ background: 'var(--color-gr-primary)' }}>
              {['Nombre', 'CI', 'Teléfono', ''].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] font-700 text-white uppercase tracking-wide text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[var(--color-gr-muted)]">
                  Sin cargadores cargados todavía.
                </td>
              </tr>
            )}
            {items.map((c, i) => (
              <tr key={c.id} style={{ background: i % 2 ? 'var(--color-gr-border-lite)' : '#fff' }}
                className="border-b border-[var(--color-gr-border-lite)]">
                <td className="px-4 py-3 font-700">{c.nombre}</td>
                <td className="px-4 py-3 font-mono text-[12px]">{c.ci ?? '—'}</td>
                <td className="px-4 py-3">{c.telefono ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <Btn size="sm" variant="ghost" onClick={() => openEdit(c)}>
                    <Pencil size={12} />
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal
          open
          title={modal.mode === 'create' ? 'Nuevo cargador' : `Editar — ${modal.cargador.nombre}`}
          onClose={() => setModal(null)}>
          <FormField label="Nombre" required>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Juan Pérez" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="CI">
              <Input value={ci} onChange={e => setCi(e.target.value)} placeholder="7472589" />
            </FormField>
            <FormField label="Teléfono">
              <Input value={telefono} onChange={e => setTel(e.target.value)} placeholder="76012345" />
            </FormField>
          </div>
          <div className="flex gap-3 justify-end">
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={handleSave} disabled={!nombre.trim()} loading={create.isPending || update.isPending}>
              {modal.mode === 'create' ? 'Crear' : 'Guardar'}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
