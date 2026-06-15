'use client';
import { useState } from 'react';
import { useClientes, useCreateCliente } from '@/lib/api/catalogos';
import { apiErrorMessage } from '@/lib/api';
import { Btn, Modal, FormField, Input, PhoneInput, Spinner, useToast } from '@/components/ui';
import { Plus } from 'lucide-react';

export function TabClientes() {
  const toast = useToast(s => s.show);
  const q = useClientes();
  const create = useCreateCliente();
  const clientes = q.data ?? [];
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTel] = useState('');
  const [direccion, setDir] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [nit, setNit] = useState('');

  async function handleSave() {
    if (!nombre) return;
    try {
      await create.mutateAsync({
        nombre,
        telefono: telefono || undefined,
        direccion: direccion || undefined,
        ciudad: ciudad || undefined,
        nit: nit || undefined,
      });
      setOpen(false); setNombre(''); setTel(''); setDir(''); setCiudad(''); setNit('');
      toast('Cliente creado', 'success');
    } catch (err) { toast(apiErrorMessage(err, 'No se pudo crear'), 'error'); }
  }

  if (q.isLoading) return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--color-gr-muted)]">{clientes.length} clientes</p>
        <Btn onClick={() => setOpen(true)}><Plus size={14} /> Nuevo cliente</Btn>
      </div>
      <div className="card-no-pad">
        <div className="overflow-x-auto">
        <table className="w-full text-[13px]" style={{ minWidth: 400 }}>
          <thead>
            <tr style={{ background: 'var(--color-gr-primary)' }}>
              {['Nombre', 'Ciudad', 'Teléfono', 'NIT'].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] font-700 text-white uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientes.map((c, i) => (
              <tr key={c.id} style={{ background: i % 2 ? 'var(--color-gr-border-lite)' : '#fff' }}
                className="border-b border-[var(--color-gr-border-lite)]">
                <td className="px-4 py-3 font-700 whitespace-nowrap">{c.nombre}</td>
                <td className="px-4 py-3 whitespace-nowrap">{c.ciudad ?? '—'}</td>
                <td className="px-4 py-3 whitespace-nowrap">{c.telefono ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-[12px] whitespace-nowrap">{c.nit ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      {open && (
        <Modal open title="Nuevo cliente" onClose={() => setOpen(false)}
          footer={<>
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancelar</Btn>
            <Btn onClick={handleSave} disabled={!nombre} loading={create.isPending}>Crear</Btn>
          </>}>
          <FormField label="Nombre" required hint="Obligatorio"><Input value={nombre} onChange={e => setNombre(e.target.value)} /></FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Teléfono" hint="Opcional"><PhoneInput value={telefono} onChange={setTel} /></FormField>
            <FormField label="Ciudad" hint="Opcional"><Input value={ciudad} onChange={e => setCiudad(e.target.value)} /></FormField>
          </div>
          <FormField label="Dirección" hint="Opcional"><Input value={direccion} onChange={e => setDir(e.target.value)} /></FormField>
          <FormField label="NIT" hint="Opcional"><Input value={nit} onChange={e => setNit(e.target.value)} /></FormField>
        </Modal>
      )}
    </div>
  );
}
