'use client';
import { useState } from 'react';
import { useUnidades, useCreateUnidad, useUpdateUnidad, useDeleteUnidad } from '@/lib/api/catalogos';
import { TipoUnidad, type UnidadMedida } from '@/lib/types';
import { kgToQQ, formatNum } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';
import { Btn, Modal, FormField, Input, Select, Spinner, useToast } from '@/components/ui';
import { DataTable } from '@/components/ui/Table';
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
            <> · {formatNum(kgToQQ(parseFloat(factorABase)), 2)} qq (46 kg)</>
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
  const unidadesQ   = useUnidades();
  const unidades    = unidadesQ.data ?? [];

  if (unidadesQ.isLoading) {
    return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;
  }

  return <TabUnidadesBody unidades={unidades} />;
}

function TabUnidadesBody({ unidades }: { unidades: UnidadMedida[] }) {
  const toast       = useToast(s => s.show);
  const deleteUnit  = useDeleteUnidad();

  const [showNueva, setShowNueva]         = useState(false);
  const [editando, setEditando]           = useState<UnidadMedida | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UnidadMedida | null>(null);

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

  const tiposConItems = Object.entries(TIPO_LABELS)
    .map(([tipo, label]) => ({ tipo, label, count: unidades.filter(u => u.tipo === tipo).length }))
    .filter(g => g.count > 0);

  const [filtroTipo, setFiltroTipo] = useState<string>(tiposConItems[0]?.tipo ?? TipoUnidad.PESO);
  const itemsFiltrados = unidades.filter(u => u.tipo === filtroTipo);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-[13px] text-gr-muted">{unidades.length} unidades configuradas</p>
        <Btn onClick={() => setShowNueva(true)}><Plus size={14} /> Nueva unidad</Btn>
      </div>

      {/* Switch por tipo: Peso / Volumen / Unidad */}
      {tiposConItems.length > 0 && (
        <div className="flex rounded-[10px] overflow-hidden border border-gr-border w-fit">
          {tiposConItems.map(({ tipo, label, count }) => (
            <button key={tipo} type="button" onClick={() => setFiltroTipo(tipo)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-700 transition-all ${
                filtroTipo === tipo ? 'text-white' : 'bg-white text-gr-muted hover:text-gr-text'
              }`}
              style={filtroTipo === tipo ? { background: TIPO_COLORS[tipo] } : undefined}>
              <Scale size={13} /> {label} <span className="opacity-70">({count})</span>
            </button>
          ))}
        </div>
      )}

      <DataTable
        data={itemsFiltrados}
        keyFn={u => u.id}
        minWidth={520}
        emptyMessage="No hay unidades configuradas"
        columns={[
          { header: 'Código', width: '18%', className: 'font-mono font-700 text-[12.5px] text-gr-primary', render: u => u.codigo },
          { header: 'Nombre', width: '30%', className: 'font-600 text-gr-text', render: u => u.nombre },
          { header: 'Abrev.', width: '14%', className: 'text-gr-muted font-mono text-[12px]', render: u => u.abreviatura ?? '—' },
          {
            header: 'Factor (kg)', width: '20%', className: 'text-gr-text',
            render: u => (
              <>
                {u.factorABase}
                {u.tipo === TipoUnidad.PESO && u.factorABase !== 1 && (
                  <span className="text-gr-muted text-[11.5px] ml-1">
                    ({formatNum(kgToQQ(u.factorABase), 2)} qq)
                  </span>
                )}
              </>
            ),
          },
          {
            header: '', align: 'right', width: '18%',
            render: u => (
              <div className="flex items-center justify-end gap-1">
                <Btn size="sm" variant="ghost" onClick={() => setEditando(u)}>
                  <Pencil size={12} />
                </Btn>
                <Btn size="sm" variant="ghost" onClick={() => setConfirmDelete(u)}
                  className="text-gr-danger hover:bg-red-50">
                  <Trash2 size={12} />
                </Btn>
              </div>
            ),
          },
        ]}
      />

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
