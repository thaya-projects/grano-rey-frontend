'use client';
import { useMemo, useState } from 'react';
import { useMateriasPrimas, useCreateMateriaPrima, useUpdateMateriaPrima } from '@/lib/api/materia-prima';
import { useCategoriasMP, useCreateCategoriaMP, useUnidades } from '@/lib/api/catalogos';
import { apiErrorMessage } from '@/lib/api';
import type { MateriaPrima } from '@/lib/types';
import { Btn, Modal, FormField, Input, Select, Spinner, useToast, Pagination, usePagination } from '@/components/ui';
import { Plus, Pencil } from 'lucide-react';

const STOPWORDS = new Set(['DE','DEL','LA','LAS','LOS','EL','Y','E','A','EN','CON','POR','UN','UNA']);

function sugerirCodigo(nombre: string, existentes: Set<string>): string {
  const palabras = nombre
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '')
    .split(/\s+/)
    .filter(p => p.length > 0 && !STOPWORDS.has(p));

  if (palabras.length === 0) return '';

  let base: string;
  if (palabras.length === 1) {
    // "Maíz" → "MAIZ"
    base = palabras[0].slice(0, 4);
  } else {
    // "Maíz Blanco" → prefijo: M + BL = "MBL", sufijo: "BL" → "MBL-BL"
    // "Maíz Blanco Seco" → prefijo: M + B + S = "MBS", sufijo: "SE" → "MBS-SE"
    const ultima = palabras[palabras.length - 1];
    const prefijo = palabras[0].slice(0, 1)
      + palabras.slice(1).map(p => p.slice(0, 2)).join('');
    const sufijo = ultima.slice(0, 2);
    base = `${prefijo}-${sufijo}`;
  }

  if (!existentes.has(base)) return base;
  for (let i = 2; i <= 99; i++) {
    const c = `${base}-${i}`;
    if (!existentes.has(c)) return c;
  }
  return base;
}

function NuevaMPModal({ categorias, unidades, codigosExistentes, onClose, onSaved, onError }: {
  categorias: { id: string; nombre: string }[];
  unidades: { id: string; codigo: string; nombre: string }[];
  codigosExistentes: Set<string>;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const create = useCreateMateriaPrima();
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [codigoEditado, setCodigoEditado] = useState(false);
  const [descripcion, setDesc] = useState('');
  const [categoriaId, setCatId] = useState('');
  const [unidadMedidaId, setUnidad] = useState('');
  const [stockMinimoKg, setMin] = useState('0');

  function handleNombreChange(val: string) {
    setNombre(val);
    if (!codigoEditado) {
      setCodigo(sugerirCodigo(val, codigosExistentes));
    }
  }

  const codigoConflicto = !!codigo && codigosExistentes.has(codigo);
  const valid = !!codigo && !!nombre && !!categoriaId && !!unidadMedidaId && !codigoConflicto;

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
      <FormField label="Nombre" required>
        <Input autoFocus value={nombre} onChange={e => handleNombreChange(e.target.value)} placeholder="Maíz Amarillo" />
      </FormField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Código" required hint={codigoConflicto ? '⚠ Ya existe — cambialo' : codigoEditado ? 'Editado' : 'Sugerido · editable'}>
          <Input value={codigo} onChange={e => { setCodigo(e.target.value.toUpperCase()); setCodigoEditado(true); }}
            placeholder="MAZ-AM"
            className={codigoConflicto ? 'border-red-400 focus:ring-red-300' : ''} />
        </FormField>
        <FormField label="Stock mínimo (kg)">
          <Input type="number" min="0" step="0.1" value={stockMinimoKg} onChange={e => setMin(e.target.value)} />
        </FormField>
      </div>
      <FormField label="Descripción">
        <Input value={descripcion} onChange={e => setDesc(e.target.value)} />
      </FormField>
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

function EditarMPModal({ mp, unidades, onClose, onSaved, onError }: {
  mp: MateriaPrima;
  unidades: { id: string; codigo: string; nombre: string }[];
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const update = useUpdateMateriaPrima();
  const [nombre, setNombre] = useState(mp.nombre);
  const [descripcion, setDesc] = useState(mp.descripcion ?? '');
  const [stockMinimoKg, setMin] = useState(String(mp.stockMinimoKg ?? '0'));
  const [unidadMedidaId, setUnidad] = useState(mp.unidadMedida?.id ?? '');

  const valid = !!nombre;

  async function handleSave() {
    if (!valid) return;
    try {
      await update.mutateAsync({
        id: mp.id,
        dto: {
          nombre,
          descripcion: descripcion || undefined,
          stockMinimoKg: parseFloat(stockMinimoKg) || undefined,
          unidadMedidaId: unidadMedidaId || undefined,
        },
      });
      onSaved();
    } catch (err) { onError(apiErrorMessage(err, 'No se pudo actualizar')); }
  }

  return (
    <Modal open title={`Editar — ${mp.nombre}`} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!valid} loading={update.isPending}>Guardar</Btn>
      </>}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Código" hint="No editable">
          <Input value={mp.codigo} disabled />
        </FormField>
        <FormField label="Stock mínimo (kg)">
          <Input type="number" min="0" step="0.1" value={stockMinimoKg} onChange={e => setMin(e.target.value)} />
        </FormField>
      </div>
      <FormField label="Nombre" required>
        <Input value={nombre} onChange={e => setNombre(e.target.value)} />
      </FormField>
      <FormField label="Descripción">
        <Input value={descripcion} onChange={e => setDesc(e.target.value)} />
      </FormField>
      <FormField label="Unidad">
        <Select value={unidadMedidaId} onChange={e => setUnidad(e.target.value)}>
          <option value="">— Sin cambio —</option>
          {unidades.map(u => <option key={u.id} value={u.id}>{u.codigo} · {u.nombre}</option>)}
        </Select>
      </FormField>
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
  const codigosExistentes = useMemo(() => new Set(mps.map(m => m.codigo)), [mps]);

  const [modal, setModal]     = useState<'nueva' | 'categoria' | null>(null);
  const [editMP, setEditMP]   = useState<MateriaPrima | null>(null);
  const { page, setPage, totalPages, pageItems, pageSize, setPageSize, total } = usePagination(mps);

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

      <div className="card-no-pad">
        <div className="overflow-x-auto">
        <table className="w-full text-[13px]" style={{ minWidth: 680 }}>
          <thead>
            <tr style={{ background: 'var(--color-gr-primary)' }}>
              {['Código', 'Nombre', 'Categoría', 'Unidad', 'Stock kg', 'Mínimo kg', ''].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] font-700 text-white uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageItems.map((m, i) => (
              <tr key={m.id} style={{ background: i % 2 ? 'var(--color-gr-border-lite)' : '#fff' }}
                className="border-b border-gr-border-lite">
                <td className="px-4 py-3 font-mono font-700 text-[12.5px] text-gr-primary">{m.codigo}</td>
                <td className="px-4 py-3 font-700">
                  {m.nombre}
                  {m.stockBajo && (
                    <span className="ml-2 text-[10.5px] font-700 px-1.5 py-0.5 rounded-full"
                      style={{ background: 'var(--color-gr-danger)', color: '#fff' }}>
                      Stock bajo
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-[12px]">{m.categoria?.nombre ?? '—'}</td>
                <td className="px-4 py-3 text-[12px] text-gr-muted">{m.unidadMedida?.codigo ?? '—'}</td>
                <td className="px-4 py-3">{Number(m.stockActualKg).toFixed(1)}</td>
                <td className="px-4 py-3">{Number(m.stockMinimoKg).toFixed(1)}</td>
                <td className="px-4 py-3 text-right">
                  <Btn size="sm" variant="ghost" onClick={() => setEditMP(m)}>
                    <Pencil size={12} />
                  </Btn>
                </td>
              </tr>
            ))}
            {mps.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gr-muted">Sin materias primas</td></tr>
            )}
          </tbody>
        </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} total={total} />
      </div>

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
