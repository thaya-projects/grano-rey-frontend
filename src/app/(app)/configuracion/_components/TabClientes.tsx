'use client';
import { useState } from 'react';
import { useClientes } from '@/lib/api/catalogos';
import { Btn, Spinner } from '@/components/ui';
import { NuevoClienteModal } from '@/components/NuevoClienteModal';
import { Plus } from 'lucide-react';

export function TabClientes() {
  const q = useClientes();
  const clientes = q.data ?? [];
  const [open, setOpen] = useState(false);

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
      {open && <NuevoClienteModal onClose={() => setOpen(false)} />}
    </div>
  );
}
