'use client';
import { useState } from 'react';
import { useProveedores, useCreateProveedor } from '@/lib/api/catalogos';
import { apiErrorMessage } from '@/lib/api';
import { Btn, Modal, FormField, Input, PhoneInput, Spinner, useToast } from '@/components/ui';
import { Plus } from 'lucide-react';

export function TabProveedores() {
  const toast = useToast(s => s.show);
  const q = useProveedores();
  const create = useCreateProveedor();
  const items = q.data ?? [];
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTel] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [contacto, setContacto] = useState('');
  const [nit, setNit] = useState('');

  async function handleSave() {
    if (!nombre) return;
    try {
      await create.mutateAsync({
        nombre,
        contacto: contacto || undefined,
        telefono: telefono || undefined,
        ciudad: ciudad || undefined,
        nit: nit || undefined,
      });
      setOpen(false); setNombre(''); setTel(''); setCiudad(''); setContacto(''); setNit('');
      toast('Proveedor creado', 'success');
    } catch (err) { toast(apiErrorMessage(err, 'No se pudo crear'), 'error'); }
  }

  if (q.isLoading) return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--color-gr-muted)]">{items.length} proveedores</p>
        <Btn onClick={() => setOpen(true)}><Plus size={14} /> Nuevo proveedor</Btn>
      </div>
      <div className="card-no-pad">
        <div className="overflow-x-auto">
        <table className="w-full text-[13px]" style={{ minWidth: 480 }}>
          <thead>
            <tr style={{ background: 'var(--color-gr-primary)' }}>
              {['Nombre', 'Contacto', 'Ciudad', 'Teléfono', 'NIT'].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] font-700 text-white uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((p, i) => (
              <tr key={p.id} style={{ background: i % 2 ? 'var(--color-gr-border-lite)' : '#fff' }}
                className="border-b border-[var(--color-gr-border-lite)]">
                <td className="px-4 py-3 font-700 whitespace-nowrap">{p.nombre}</td>
                <td className="px-4 py-3 whitespace-nowrap">{p.contacto ?? '—'}</td>
                <td className="px-4 py-3 whitespace-nowrap">{p.ciudad ?? '—'}</td>
                <td className="px-4 py-3 whitespace-nowrap">{p.telefono ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-[12px] whitespace-nowrap">{p.nit ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      {open && (
        <Modal open title="Nuevo proveedor" onClose={() => setOpen(false)}
          footer={<>
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancelar</Btn>
            <Btn onClick={handleSave} disabled={!nombre} loading={create.isPending}>Crear</Btn>
          </>}>
          <FormField label="Nombre" required hint="Obligatorio"><Input value={nombre} onChange={e => setNombre(e.target.value)} /></FormField>
          <FormField label="Contacto" hint="Opcional"><Input value={contacto} onChange={e => setContacto(e.target.value)} /></FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Ciudad" hint="Opcional"><Input value={ciudad} onChange={e => setCiudad(e.target.value)} /></FormField>
            <FormField label="Teléfono" hint="Opcional"><PhoneInput value={telefono} onChange={setTel} /></FormField>
          </div>
          <FormField label="NIT" hint="Opcional"><Input value={nit} onChange={e => setNit(e.target.value)} /></FormField>
        </Modal>
      )}
    </div>
  );
}
