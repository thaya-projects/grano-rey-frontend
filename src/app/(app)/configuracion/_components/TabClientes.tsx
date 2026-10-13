'use client';
import { useState } from 'react';
import { useClientes } from '@/lib/api/catalogos';
import { Btn, Spinner } from '@/components/ui';
import { DataTable } from '@/components/ui/Table';
import { NuevoClienteModal } from '@/components/NuevoClienteModal';
import { Plus, Pencil } from 'lucide-react';
import type { Cliente } from '@/lib/types';

export function TabClientes() {
  const q = useClientes();
  const clientes = q.data ?? [];
  const [open, setOpen] = useState(false);
  const [editCliente, setEditCliente] = useState<Cliente | null>(null);

  if (q.isLoading) return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gr-muted">{clientes.length} clientes</p>
        <Btn onClick={() => setOpen(true)}><Plus size={14} /> Nuevo cliente</Btn>
      </div>
      <DataTable
        data={clientes}
        keyFn={c => c.id}
        minWidth={400}
        emptyMessage="Sin clientes registrados"
        columns={[
          { header: 'Nombre', width: '28%', className: 'font-700', render: c => c.nombre },
          { header: 'Ciudad', width: '22%', render: c => c.ciudad ?? '—' },
          { header: 'Teléfono', width: '20%', render: c => c.telefono ?? '—' },
          { header: 'NIT', width: '20%', className: 'font-mono text-[12px]', render: c => c.nit ?? '—' },
          {
            header: '', align: 'right', width: '10%',
            render: c => (
              <Btn size="sm" variant="ghost" onClick={() => setEditCliente(c)}>
                <Pencil size={12} />
              </Btn>
            ),
          },
        ]}
      />
      {open && <NuevoClienteModal onClose={() => setOpen(false)} />}
      {editCliente && (
        <NuevoClienteModal cliente={editCliente} onClose={() => setEditCliente(null)} />
      )}
    </div>
  );
}
