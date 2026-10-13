'use client';
import { useState } from 'react';
import { useTransportistas } from '@/lib/api/catalogos';
import { Btn, Spinner } from '@/components/ui';
import { DataTable } from '@/components/ui/Table';
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
        <p className="text-[13px] text-gr-muted">{items.length} transportistas</p>
        <Btn onClick={() => setOpen(true)}><Plus size={14} /> Nuevo transportista</Btn>
      </div>
      <DataTable
        data={items}
        keyFn={t => t.id}
        minWidth={480}
        emptyMessage="Sin transportistas registrados"
        columns={[
          { header: 'Nombre', width: '24%', className: 'font-700', render: t => t.nombre },
          { header: 'Empresa', width: '20%', render: t => t.empresa ?? '—' },
          { header: 'Placa', width: '14%', className: 'font-mono text-[12px]', render: t => t.placa ?? '—' },
          { header: 'Marca', width: '16%', render: t => t.marca ?? '—' },
          { header: 'Teléfono', width: '18%', render: t => t.telefono ?? '—' },
          {
            header: '', align: 'right', width: '8%',
            render: t => (
              <Btn size="sm" variant="ghost" onClick={() => setEditTransportista(t)}>
                <Pencil size={12} />
              </Btn>
            ),
          },
        ]}
      />
      {open && <NuevoTransportistaModal onClose={() => setOpen(false)} />}
      {editTransportista && (
        <NuevoTransportistaModal transportista={editTransportista} onClose={() => setEditTransportista(null)} />
      )}
    </div>
  );
}
