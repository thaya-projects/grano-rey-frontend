'use client';
import { useState } from 'react';
import { useMateriasPrimas, useCreateMateriaPrima } from '@/lib/api/materia-prima';
import { useCategoriasMP, useCreateCategoriaMP, useUnidades } from '@/lib/api/catalogos';
import { apiErrorMessage } from '@/lib/api';
import { Btn, Modal, FormField, Input, Select, Spinner, useToast } from '@/components/ui';
import { Plus } from 'lucide-react';

function NuevaMPModal({ categorias, unidades, onClose, onSaved, onError }: {
  categorias: { id: string; nombre: string }[];
  unidades: { id: string; codigo: string; nombre: string }[];
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const create = useCreateMateriaPrima();
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDesc] = useState('');
  const [categoriaId, setCatId] = useState('');
  const [unidadMedidaId, setUnidad] = useState('');
  const [stockMinimoKg, setMin] = useState('0');

  const valid = !!codigo && !!nombre && !!categoriaId && !!unidadMedidaId;

  async function handleSave() {
    if (!valid) return;
    try {
      await create.mutateAsync({
        codigo, nombre, descripcion: descripcion || undefined,
        categoriaId, unidadMedidaId,
        stockMinimoKg: parseFloat(stockMinimoKg) || undefined,
      });
      onSaved();
    } catch (err) { onError(apiErrorMessage(err, 'No se pudo crear')); }
  }

  return (
    <Modal open title="Nueva materia prima" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!valid} loading={create.isPending}>Crear</Btn>
      </>}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Código" required><Input value={codigo} onChange={e => setCodigo(e.target.value)} /></FormField>
        <FormField label="Stock mínimo (kg)"><Input type="number" min="0" step="0.1" value={stockMinimoKg} onChange={e => setMin(e.target.value)} /></FormField>
      </div>
      <FormField label="Nombre" required><Input value={nombre} onChange={e => setNombre(e.target.value)} /></FormField>
      <FormField label="Descripción"><Input value={descripcion} onChange={e => setDesc(e.target.value)} /></FormField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Categoría" required>
          <Select value={categoriaId} onChange={e => setCatId(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Select>
        </FormField>
        <FormField label="Unidad" required>
          <Select value={unidadMedidaId} onChange={e => setUnidad(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {unidades.map(u => <option key={u.id} value={u.id}>{u.codigo} · {u.nombre}</option>)}
          </Select>
        </FormField>
      </div>
    </Modal>
  );
}

function NuevaCategoriaMPModal({ onClose, onSaved, onError }: {
  onClose: () => void; onSaved: () => void; onError: (msg: string) => void;
}) {
  const create = useCreateCategoriaMP();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDesc] = useState('');
  const [tieneSubtipos, setSubt] = useState(false);

  async function handleSave() {
    if (!nombre) return;
    try {
      await create.mutateAsync({ nombre, descripcion: descripcion || undefined, tieneSubtipos });
      onSaved();
    } catch (err) { onError(apiErrorMessage(err, 'No se pudo crear')); }
  }

  return (
    <Modal open title="Nueva categoría MP" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!nombre} loading={create.isPending}>Crear</Btn>
      </>}>
      <FormField label="Nombre" required><Input value={nombre} onChange={e => setNombre(e.target.value)} /></FormField>
      <FormField label="Descripción"><Input value={descripcion} onChange={e => setDesc(e.target.value)} /></FormField>
      <label className="flex items-center gap-2 text-[13.5px] cursor-pointer">
        <input type="checkbox" checked={tieneSubtipos} onChange={e => setSubt(e.target.checked)} /> Permite subtipos
      </label>
    </Modal>
  );
}

export function TabMateriaPrima() {
  const toast = useToast(s => s.show);
  const mpQ          = useMateriasPrimas();
  const categoriasQ  = useCategoriasMP();
  const unidadesQ    = useUnidades();
  const mps          = mpQ.data ?? [];
  const categorias   = categoriasQ.data ?? [];
  const unidades     = unidadesQ.data ?? [];

  const [modal, setModal] = useState<'nueva' | 'categoria' | null>(null);

  if (mpQ.isLoading) {
    return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--color-gr-muted)]">{mps.length} materias primas · {categorias.length} categorías</p>
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={() => setModal('categoria')}><Plus size={14} /> Categoría</Btn>
          <Btn onClick={() => setModal('nueva')}><Plus size={14} /> Nueva MP</Btn>
        </div>
      </div>

      <div className="card-no-pad">
        <div className="overflow-x-auto">
        <table className="w-full text-[13px]" style={{ minWidth: 640 }}>
          <thead>
            <tr style={{ background: 'var(--color-gr-primary)' }}>
              {['Código', 'Nombre', 'Categoría', 'Unidad', 'Stock kg', 'Mínimo kg'].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] font-700 text-white uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mps.map((m, i) => (
              <tr key={m.id} style={{ background: i % 2 ? 'var(--color-gr-border-lite)' : '#fff' }}
                className="border-b border-[var(--color-gr-border-lite)]">
                <td className="px-4 py-3 font-mono font-700 text-[12.5px] text-[var(--color-gr-primary)]">{m.codigo}</td>
                <td className="px-4 py-3 font-700">{m.nombre}</td>
                <td className="px-4 py-3 text-[12px]">{m.categoria?.nombre ?? '—'}</td>
                <td className="px-4 py-3 text-[12px] text-[var(--color-gr-muted)]">{m.unidadMedida?.codigo ?? '—'}</td>
                <td className="px-4 py-3">{Number(m.stockActualKg).toFixed(1)}</td>
                <td className="px-4 py-3">{Number(m.stockMinimoKg).toFixed(1)}</td>
              </tr>
            ))}
            {mps.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--color-gr-muted)]">Sin materias primas</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {modal === 'nueva' && (
        <NuevaMPModal
          categorias={categorias}
          unidades={unidades}
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
    </div>
  );
}
