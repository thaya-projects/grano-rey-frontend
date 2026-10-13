'use client';
import { useMemo, useState } from 'react';
import { useProductos } from '@/lib/api/productos';
import { useUnidades } from '@/lib/api/catalogos';
import type { Producto } from '@/lib/types';
import { Btn, Spinner, useToast } from '@/components/ui';
import { DataTable } from '@/components/ui/Table';
import { Plus, Pencil, ImageIcon } from 'lucide-react';
import { ProductoModal } from './productos/ProductoModal';
import { ImagenesModal } from './productos/ProductoImagenes';

export function TabProductos() {
  const toast = useToast(s => s.show);
  const productosQ = useProductos();
  const unidadesQ  = useUnidades();
  const productos = productosQ.data ?? [];
  const unidades  = unidadesQ.data ?? [];

  const codigosExistentes = useMemo(() => new Set(productos.map(p => p.codigo)), [productos]);

  const [modal, setModal]           = useState<{ mode: 'create' } | { mode: 'edit'; producto: Producto } | null>(null);
  const [imagenModal, setImagenModal] = useState<Producto | null>(null);

  if (productosQ.isLoading) {
    return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gr-muted">{productos.length} productos</p>
        <Btn onClick={() => setModal({ mode: 'create' })}><Plus size={14} /> Nuevo producto</Btn>
      </div>

      <DataTable
        data={productos}
        keyFn={p => p.id}
        minWidth={760}
        emptyMessage="Sin productos cargados"
        columns={[
          { header: 'Código', width: '12%', className: 'font-mono font-700 text-[12.5px] text-gr-primary', render: p => p.codigo },
          { header: 'Nombre', width: '28%', className: 'font-700', render: p => p.nombre },
          { header: 'Unidad', width: '12%', className: 'text-[12px] text-gr-muted', render: p => p.unidadProduccion?.codigo ?? '—' },
          { header: 'Stock', width: '12%', className: 'font-700', render: p => Number(p.stockActual) },
          { header: 'Mínimo', width: '10%', render: p => Number(p.stockMinimo) },
          { header: 'Vida útil', width: '12%', render: p => `${p.vidaUtilMeses}m` },
          {
            header: '', align: 'right', width: '14%',
            render: p => (
              <div className="flex items-center justify-end gap-1">
                <Btn size="sm" variant="ghost" title="Gestionar imágenes" onClick={() => setImagenModal(p)}>
                  <ImageIcon size={12} />
                  {(p.imagenes?.length ?? 0) > 0 && (
                    <span className="ml-0.5 text-[10px] font-700 text-gr-primary">
                      {p.imagenes!.length}
                    </span>
                  )}
                </Btn>
                <Btn size="sm" variant="ghost" onClick={() => setModal({ mode: 'edit', producto: p })}>
                  <Pencil size={12} />
                </Btn>
              </div>
            ),
          },
        ]}
      />

      {modal && (
        <ProductoModal
          mode={modal.mode}
          producto={modal.mode === 'edit' ? modal.producto : undefined}
          unidades={unidades}
          codigosExistentes={codigosExistentes}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); toast('Producto guardado', 'success'); }}
          onError={(msg) => toast(msg, 'error')}
        />
      )}

      {imagenModal && (
        <ImagenesModal producto={imagenModal} onClose={() => setImagenModal(null)} />
      )}
    </div>
  );
}
