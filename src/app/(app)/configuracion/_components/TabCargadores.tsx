'use client';
import { useState } from 'react';
import { useCargadores, useCreateCargador, useUpdateCargador } from '@/lib/api/cargadores';
import { apiErrorMessage } from '@/lib/api';
import type { Cargador } from '@/lib/types';
import { Btn, Modal, FormField, Input, Spinner, useToast } from '@/components/ui';
import { DataTable } from '@/components/ui/Table';
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
        <p className="text-[13px] text-gr-muted">{items.length} cargadores activos</p>
        <Btn onClick={openCreate}><Plus size={14} /> Nuevo cargador</Btn>
      </div>
      <DataTable
        data={items}
        keyFn={c => c.id}
        emptyMessage="Sin cargadores cargados todavía."
        columns={[
          { header: 'Nombre', width: '40%', className: 'font-700', render: c => c.nombre },
          { header: 'CI', width: '25%', className: 'font-mono text-[12px]', render: c => c.ci ?? '—' },
          { header: 'Teléfono', width: '25%', render: c => c.telefono ?? '—' },
          {
            header: '', align: 'right', width: '10%',
            render: c => (
              <Btn size="sm" variant="ghost" onClick={() => openEdit(c)}>
                <Pencil size={12} />
              </Btn>
            ),
          },
        ]}
      />

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
