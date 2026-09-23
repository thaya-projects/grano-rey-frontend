'use client';
import { useState } from 'react';
import { useTransportistas } from '@/lib/api/catalogos';
import { Btn, Spinner } from '@/components/ui';
import { NuevoTransportistaModal } from '@/components/NuevoTransportistaModal';
import { Plus, Pencil } from 'lucide-react';
import type { Transportista } from '@/lib/types';

export function TabTransportistas() {
  const q = useTransportistas();
  const items = q.data ?? [];
  const [open, setOpen] = useState(false);
  const [editTransportista, setEditTransportista] = useState<Transportista | null>(null);

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
              {['Nombre', 'Empresa', 'Placa', 'Marca', 'Teléfono', ''].map(h => (
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
                <td className="px-4 py-3 text-right">
                  <Btn size="sm" variant="ghost" onClick={() => setEditTransportista(t)}>
                    <Pencil size={12} />
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      {open && <NuevoTransportistaModal onClose={() => setOpen(false)} />}
      {editTransportista && (
        <NuevoTransportistaModal transportista={editTransportista} onClose={() => setEditTransportista(null)} />
      )}
    </div>
  );
}
