'use client';
import { useState } from 'react';
import { useProveedores } from '@/lib/api/catalogos';
import { Btn, Spinner } from '@/components/ui';
import { DataTable } from '@/components/ui/Table';
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
        <p className="text-[13px] text-gr-muted">{items.length} proveedores</p>
        <Btn onClick={() => setOpen(true)}><Plus size={14} /> Nuevo proveedor</Btn>
      </div>
      <DataTable
        data={items}
        keyFn={p => p.id}
        minWidth={480}
        emptyMessage="Sin proveedores registrados"
        columns={[
          { header: 'Nombre', width: '24%', className: 'font-700', render: p => p.nombre },
          { header: 'Contacto', width: '20%', render: p => p.contacto ?? '—' },
          { header: 'Ciudad', width: '18%', render: p => p.ciudad ?? '—' },
          { header: 'Teléfono', width: '18%', render: p => p.telefono ?? '—' },
          { header: 'NIT', width: '12%', className: 'font-mono text-[12px]', render: p => p.nit ?? '—' },
          {
            header: '', align: 'right', width: '8%',
            render: p => (
              <Btn size="sm" variant="ghost" onClick={() => setEditProveedor(p)}>
                <Pencil size={12} />
              </Btn>
            ),
          },
        ]}
      />
      {open && <NuevoProveedorModal onClose={() => setOpen(false)} />}
      {editProveedor && (
        <NuevoProveedorModal proveedor={editProveedor} onClose={() => setEditProveedor(null)} />
      )}
    </div>
  );
}
