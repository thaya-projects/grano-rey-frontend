'use client';
import { useState } from 'react';
import { useTransportistas, useCreateTransportista } from '@/lib/api/catalogos';
import { apiErrorMessage } from '@/lib/api';
import { Btn, Modal, FormField, Input, PhoneInput, Spinner, useToast } from '@/components/ui';
import { Plus } from 'lucide-react';

export function TabTransportistas() {
  const toast = useToast(s => s.show);
  const q = useTransportistas();
  const create = useCreateTransportista();
  const items = q.data ?? [];
  const [open, setOpen] = useState(false);
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
      await create.mutateAsync({
        nombre,
        ci: ci || undefined,
        empresa: empresa || undefined,
        telefono: telefono || undefined,
        placa: placa || undefined,
        marca: marca || undefined,
        color: color || undefined,
        destinoHabitual: destinoHabitual || undefined,
      });
      setOpen(false); setNombre(''); setTel(''); setEmpresa(''); setPlaca(''); setMarca(''); setColor(''); setDestino(''); setCi('');
      toast('Transportista creado', 'success');
    } catch (err) { toast(apiErrorMessage(err, 'No se pudo crear'), 'error'); }
  }

  if (q.isLoading) return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--color-gr-muted)]">{items.length} transportistas</p>
        <Btn onClick={() => setOpen(true)}><Plus size={14} /> Nuevo transportista</Btn>
      </div>
      <div className="card-no-pad">
        <div className="overflow-x-auto">
        <table className="w-full text-[13px]" style={{ minWidth: 480 }}>
          <thead>
            <tr style={{ background: 'var(--color-gr-primary)' }}>
              {['Nombre', 'Empresa', 'Placa', 'Marca', 'Teléfono'].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] font-700 text-white uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((t, i) => (
              <tr key={t.id} style={{ background: i % 2 ? 'var(--color-gr-border-lite)' : '#fff' }}
                className="border-b border-[var(--color-gr-border-lite)]">
                <td className="px-4 py-3 font-700 whitespace-nowrap">{t.nombre}</td>
                <td className="px-4 py-3 whitespace-nowrap">{t.empresa ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-[12px] whitespace-nowrap">{t.placa ?? '—'}</td>
                <td className="px-4 py-3 whitespace-nowrap">{t.marca ?? '—'}</td>
                <td className="px-4 py-3 whitespace-nowrap">{t.telefono ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      {open && (
        <Modal open title="Nuevo transportista" onClose={() => setOpen(false)}
          footer={<>
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancelar</Btn>
            <Btn onClick={handleSave} disabled={!nombre} loading={create.isPending}>Crear</Btn>
          </>}>
          <FormField label="Nombre" required hint="Obligatorio"><Input value={nombre} onChange={e => setNombre(e.target.value)} /></FormField>
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
          <FormField label="Destino habitual" hint="Opcional"><Input value={destinoHabitual} onChange={e => setDestino(e.target.value)} placeholder="Ej. Santa Cruz - Cochabamba" /></FormField>
        </Modal>
      )}
    </div>
  );
}
