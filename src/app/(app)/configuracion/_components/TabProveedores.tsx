'use client';
import { useState } from 'react';
import { useProveedores } from '@/lib/api/catalogos';
import { Btn, Spinner } from '@/components/ui';
import { NuevoProveedorModal } from '@/components/NuevoProveedorModal';
import { Plus, Pencil } from 'lucide-react';
import type { Proveedor } from '@/lib/types';

export function TabProveedores() {
  const q = useProveedores();
  const items = q.data ?? [];
  const [open, setOpen] = useState(false);
  const [editProveedor, setEditProveedor] = useState<Proveedor | null>(null);

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
              {['Nombre', 'Contacto', 'Ciudad', 'Teléfono', 'NIT', ''].map(h => (
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
                <td className="px-4 py-3 text-right">
                  <Btn size="sm" variant="ghost" onClick={() => setEditProveedor(p)}>
                    <Pencil size={12} />
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      {open && <NuevoProveedorModal onClose={() => setOpen(false)} />}
      {editProveedor && (
        <NuevoProveedorModal proveedor={editProveedor} onClose={() => setEditProveedor(null)} />
      )}
    </div>
  );
}
