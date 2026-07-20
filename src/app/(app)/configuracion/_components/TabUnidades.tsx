'use client';
import { useState } from 'react';
import { useUnidades, useCreateUnidad, useUpdateUnidad, useDeleteUnidad } from '@/lib/api/catalogos';
import { TipoUnidad, type UnidadMedida } from '@/lib/types';
import { kgToQQ } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';
import { Btn, Modal, FormField, Input, Select, Spinner, useToast } from '@/components/ui';
import { Plus, Pencil, Trash2, Scale } from 'lucide-react';

const TIPO_LABELS: Record<string, string> = {
  [TipoUnidad.PESO]:    'Peso',
  [TipoUnidad.VOLUMEN]: 'Volumen',
  [TipoUnidad.UNIDAD]:  'Unidad',
};

const TIPO_COLORS: Record<string, string> = {
  [TipoUnidad.PESO]:    '#2E7D52',
  [TipoUnidad.VOLUMEN]: '#1565C0',
  [TipoUnidad.UNIDAD]:  '#6A3D8F',
};

// ─── Modal nueva unidad ───────────────────────────────────────
function NuevaUnidadModal({ onClose, onSaved, onError }: {
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const create = useCreateUnidad();
  const [codigo, setCodigo]           = useState('');
  const [nombre, setNombre]           = useState('');
  const [abreviatura, setAbrev]       = useState('');
  const [tipo, setTipo]               = useState<string>(TipoUnidad.PESO);
  const [factorABase, setFactor]      = useState('1');

  const valid = !!codigo.trim() && !!nombre.trim() && parseFloat(factorABase) > 0;

  async function handleSave() {
    if (!valid) return;
    try {
      await create.mutateAsync({
        codigo: codigo.trim().toUpperCase(),
        nombre: nombre.trim(),
        abreviatura: abreviatura.trim() || undefined,
        tipo,
        factorABase: parseFloat(factorABase),
      });
      onSaved();
    } catch (err) { onError(apiErrorMessage(err, 'No se pudo crear')); }
  }

  return (
    <Modal open title="Nueva unidad de medida" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!valid} loading={create.isPending}>Crear</Btn>
      </>}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Código" required hint="Ej: QQ46, KG, BOL">
          <Input autoFocus value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())} placeholder="QQ46" />
        </FormField>
        <FormField label="Abreviatura" hint="Ej: qq, kg, u">
          <Input value={abreviatura} onChange={e => setAbrev(e.target.value)} placeholder="qq" />
        </FormField>
      </div>
      <FormField label="Nombre" required>
        <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Quintal 46 kg" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Tipo" required>
          <Select value={tipo} onChange={e => setTipo(e.target.value)}>
            {Object.entries(TIPO_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Factor a base (kg)" required hint="kg equivalentes de esta unidad">
          <Input type="number" min="0.001" step="0.001" value={factorABase}
            onChange={e => setFactor(e.target.value)} placeholder="46" />
        </FormField>
      </div>
      {parseFloat(factorABase) > 0 && (
        <p className="text-[12px] text-gr-muted bg-gr-border-lite rounded-lg px-3 py-2">
          1 <strong>{codigo || '…'}</strong> = <strong>{factorABase} kg</strong>
          {tipo === TipoUnidad.PESO && parseFloat(factorABase) !== 1 && (
            <> · {kgToQQ(parseFloat(factorABase)).toFixed(3)} qq (46 kg)</>
          )}
        </p>
      )}
    </Modal>
  );
}

// ─── Modal editar unidad ──────────────────────────────────────
function EditarUnidadModal({ unidad, onClose, onSaved, onError }: {
  unidad: UnidadMedida;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const update = useUpdateUnidad();
  const [codigo, setCodigo]       = useState(unidad.codigo);
  const [nombre, setNombre]       = useState(unidad.nombre);
  const [abreviatura, setAbrev]   = useState(unidad.abreviatura ?? '');
  const [tipo, setTipo]           = useState<string>(unidad.tipo);
  const [factorABase, setFactor]  = useState(String(unidad.factorABase));

  const valid = !!codigo.trim() && !!nombre.trim() && parseFloat(factorABase) > 0;

  async function handleSave() {
    if (!valid) return;
    try {
      await update.mutateAsync({
        id: unidad.id,
        dto: {
          codigo: codigo.trim().toUpperCase(),
          nombre: nombre.trim(),
          abreviatura: abreviatura.trim() || undefined,
          tipo,
          factorABase: parseFloat(factorABase),
        },
      });
      onSaved();
    } catch (err) { onError(apiErrorMessage(err, 'No se pudo actualizar')); }
  }

  return (
    <Modal open title={`Editar — ${unidad.codigo}`} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!valid} loading={update.isPending}>Guardar</Btn>
      </>}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Código" required>
          <Input value={codigo} onChange={e => setCodigo(e.target.value)} className="uppercase" />
        </FormField>
        <FormField label="Abreviatura">
          <Input value={abreviatura} onChange={e => setAbrev(e.target.value)} />
        </FormField>
      </div>
      <FormField label="Nombre" required>
        <Input value={nombre} onChange={e => setNombre(e.target.value)} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Tipo" required>
          <Select value={tipo} onChange={e => setTipo(e.target.value)}>
            {Object.entries(TIPO_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Factor a base (kg)" required>
          <Input type="number" min="0.001" step="0.001" value={factorABase}
            onChange={e => setFactor(e.target.value)} />
        </FormField>
      </div>
    </Modal>
  );
}

// ─── Tab principal ────────────────────────────────────────────
export function TabUnidades() {
  const toast       = useToast(s => s.show);
  const unidadesQ   = useUnidades();
  const deleteUnit  = useDeleteUnidad();
  const unidades    = unidadesQ.data ?? [];

  const [showNueva, setShowNueva]               = useState(false);
  const [editando, setEditando]                 = useState<UnidadMedida | null>(null);
  const [confirmDelete, setConfirmDelete]       = useState<UnidadMedida | null>(null);

  async function handleDelete(u: UnidadMedida) {
    try {
      await deleteUnit.mutateAsync(u.id);
      toast(`"${u.nombre}" eliminada`, 'success');
      setConfirmDelete(null);
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo eliminar — puede estar en uso'), 'error');
      setConfirmDelete(null);
    }
  }

  if (unidadesQ.isLoading) {
    return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;
  }

  const porTipo = Object.entries(TIPO_LABELS).map(([tipo, label]) => ({
    tipo, label,
    items: unidades.filter(u => u.tipo === tipo),
  })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gr-muted">{unidades.length} unidades configuradas</p>
        <Btn onClick={() => setShowNueva(true)}><Plus size={14} /> Nueva unidad</Btn>
      </div>

      {/* Agrupadas por tipo */}
      {porTipo.map(({ tipo, label, items }) => (
        <div key={tipo}>
          <div className="flex items-center gap-2 mb-2">
            <Scale size={13} style={{ color: TIPO_COLORS[tipo] }} />
            <p className="text-[11.5px] font-700 uppercase tracking-wide" style={{ color: TIPO_COLORS[tipo] }}>
              {label}
            </p>
            <span className="text-[11px] text-gr-muted">({items.length})</span>
          </div>

          <div className="card-no-pad">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ background: 'var(--color-gr-border-lite)' }}>
                  {['Código', 'Nombre', 'Abrev.', 'Factor (kg)', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-700 text-gr-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((u, i) => (
                  <tr key={u.id}
                    className={`border-t border-gr-border-lite ${i % 2 === 1 ? 'bg-gr-border-lite/40' : 'bg-white'}`}>
                    <td className="px-4 py-3 font-mono font-700 text-[12.5px] text-gr-primary">{u.codigo}</td>
                    <td className="px-4 py-3 font-600 text-gr-text">{u.nombre}</td>
                    <td className="px-4 py-3 text-gr-muted font-mono text-[12px]">{u.abreviatura ?? '—'}</td>
                    <td className="px-4 py-3 text-gr-text">
                      {u.factorABase}
                      {u.tipo === TipoUnidad.PESO && u.factorABase !== 1 && (
                        <span className="text-gr-muted text-[11.5px] ml-1">
                          ({kgToQQ(u.factorABase).toFixed(3)} qq)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Btn size="sm" variant="ghost" onClick={() => setEditando(u)}>
                          <Pencil size={12} />
                        </Btn>
                        <Btn size="sm" variant="ghost" onClick={() => setConfirmDelete(u)}
                          className="text-gr-danger hover:bg-red-50">
                          <Trash2 size={12} />
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {unidades.length === 0 && (
        <div className="py-12 text-center text-gr-muted text-[14px]">
          <Scale size={36} className="mx-auto mb-3 opacity-20" />
          <p>No hay unidades configuradas</p>
        </div>
      )}

      {/* Modal nueva */}
      {showNueva && (
        <NuevaUnidadModal
          onClose={() => setShowNueva(false)}
          onSaved={() => { setShowNueva(false); toast('Unidad creada', 'success'); }}
          onError={msg => toast(msg, 'error')}
        />
      )}

      {/* Modal editar */}
      {editando && (
        <EditarUnidadModal
          unidad={editando}
          onClose={() => setEditando(null)}
          onSaved={() => { setEditando(null); toast('Unidad actualizada', 'success'); }}
          onError={msg => toast(msg, 'error')}
        />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <Modal open title="Eliminar unidad" onClose={() => setConfirmDelete(null)}
          footer={<>
            <Btn variant="ghost" onClick={() => setConfirmDelete(null)}>Cancelar</Btn>
            <Btn variant="danger" onClick={() => handleDelete(confirmDelete)} loading={deleteUnit.isPending}>
              <Trash2 size={13} /> Eliminar
            </Btn>
          </>}>
          <p className="text-[14px] text-gr-text">
            ¿Eliminar <strong>{confirmDelete.nombre}</strong> ({confirmDelete.codigo})?
          </p>
          <p className="text-[12.5px] text-gr-warning mt-1">
            Si está en uso en materia prima o productos, el servidor lo rechazará.
          </p>
        </Modal>
      )}
    </div>
  );
}
