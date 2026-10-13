'use client';
import { useMemo, useState } from 'react';
import { useMateriasPrimas } from '@/lib/api/materia-prima';
import { useCategoriasMP, useUnidades } from '@/lib/api/catalogos';
import type { MateriaPrima } from '@/lib/types';
import { Btn, Spinner, useToast } from '@/components/ui';
import { DataTable } from '@/components/ui/Table';
import { Plus, Pencil } from 'lucide-react';
import { NuevaMPModal } from './materia-prima/NuevaMPModal';
import { EditarMPModal } from './materia-prima/EditarMPModal';
import { NuevaCategoriaMPModal } from './materia-prima/NuevaCategoriaMPModal';

export function TabMateriaPrima() {
  const toast = useToast(s => s.show);
  const mpQ          = useMateriasPrimas();
  const categoriasQ  = useCategoriasMP();
  const unidadesQ    = useUnidades();
  const mps          = mpQ.data ?? [];
  const categorias   = categoriasQ.data ?? [];
  const unidades     = unidadesQ.data ?? [];
  const codigosExistentes = useMemo(() => new Set(mps.map(m => m.codigo)), [mps]);

  const [modal, setModal]     = useState<'nueva' | 'categoria' | null>(null);
  const [editMP, setEditMP]   = useState<MateriaPrima | null>(null);

  if (mpQ.isLoading) {
    return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gr-muted">{mps.length} materias primas · {categorias.length} categorías</p>
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={() => setModal('categoria')}><Plus size={14} /> Categoría</Btn>
          <Btn onClick={() => setModal('nueva')}><Plus size={14} /> Nueva MP</Btn>
        </div>
      </div>

      <DataTable
        data={mps}
        keyFn={m => m.id}
        emptyMessage="Sin materias primas"
        columns={[
          { header: 'Código', width: '12%', className: 'font-mono font-700 text-[12.5px] text-gr-primary', render: m => m.codigo },
          {
            header: 'Nombre', width: '28%', className: 'font-700',
            render: m => (
              <>
                {m.nombre}
                {m.stockBajo && (
                  <span className="ml-2 text-[10.5px] font-700 px-1.5 py-0.5 rounded-full"
                    style={{ background: 'var(--color-gr-danger)', color: '#fff' }}>
                    Stock bajo
                  </span>
                )}
              </>
            ),
          },
          { header: 'Categoría', width: '18%', className: 'text-[12px]', render: m => m.categoria?.nombre ?? '—' },
          { header: 'Unidad', width: '12%', className: 'text-[12px] text-gr-muted', render: m => m.unidadMedida?.codigo ?? '—' },
          { header: 'Stock kg', width: '12%', render: m => Number(m.stockActualKg).toFixed(1) },
          { header: 'Mínimo kg', width: '10%', render: m => Number(m.stockMinimoKg).toFixed(1) },
          {
            header: '', align: 'right', width: '8%',
            render: m => (
              <Btn size="sm" variant="ghost" onClick={() => setEditMP(m)}>
                <Pencil size={12} />
              </Btn>
            ),
          },
        ]}
      />

      {modal === 'nueva' && (
        <NuevaMPModal
          categorias={categorias}
          unidades={unidades}
          codigosExistentes={codigosExistentes}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); toast('Materia prima creada', 'success'); }}
          onError={(msg) => toast(msg, 'error')}
        />
      )}
      {modal === 'categoria' && (
        <NuevaCategoriaMPModal
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); toast('Categoría creada', 'success'); }}
          onError={(msg) => toast(msg, 'error')}
        />
      )}
      {editMP && (
        <EditarMPModal
          mp={editMP}
          unidades={unidades}
          onClose={() => setEditMP(null)}
          onSaved={() => { setEditMP(null); toast('Materia prima actualizada', 'success'); }}
          onError={(msg) => toast(msg, 'error')}
        />
      )}
    </div>
  );
}
