'use client';
import { useState, useRef } from 'react';
import {
  useAppStore,
  type Producto, type Cliente, type Transportista,
  type RecetaItem, type MateriaPrimaStock,
} from '@/store/useAppStore';
import { formatBs } from '@/lib/utils';
import { Btn, Modal, FormField, Input, Select, Badge, useToast } from '@/components/ui';
import { Package, Users, Truck, Wheat, Plus, Pencil, Trash2, Info, Check } from 'lucide-react';

type Tab = 'productos' | 'mp' | 'clientes' | 'transportistas';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'productos',      label: 'Productos',      icon: <Package size={15} /> },
  { id: 'mp',             label: 'Materia Prima',  icon: <Wheat size={15} /> },
  { id: 'clientes',       label: 'Clientes',       icon: <Users size={15} /> },
  { id: 'transportistas', label: 'Transportistas', icon: <Truck size={15} /> },
];

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<Tab>('productos');

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="text-[22px] font-900 text-[var(--color-gr-text)]">Configuración</h1>
        <p className="text-[var(--color-gr-muted)] text-[13.5px] mt-0.5">
          Gestiona productos, materias primas, clientes y transportistas
        </p>
      </div>

      <div className="flex gap-0 border-b-2 border-[var(--color-gr-border)] overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 font-700 text-[13.5px] border-b-2 -mb-[2px] whitespace-nowrap transition-colors
              ${tab === t.id
                ? 'border-[var(--color-gr-primary)] text-[var(--color-gr-primary)]'
                : 'border-transparent text-[var(--color-gr-muted)] hover:text-[var(--color-gr-text)]'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'productos'      && <TabProductos />}
      {tab === 'mp'             && <TabMateriasPrimas />}
      {tab === 'clientes'       && <TabClientes />}
      {tab === 'transportistas' && <TabTransportistas />}
    </div>
  );
}

// ─── Inline-editable cell ──────────────────────────────────────────────────────
type EditCell = { id: string; field: string; value: string } | null;

function InlineCell({ id, field, displayValue, editCell, setEditCell, onSave, className = '' }: {
  id: string; field: string; displayValue: string;
  editCell: EditCell; setEditCell: (c: EditCell) => void;
  onSave: (id: string, field: string, value: string) => void;
  className?: string;
}) {
  const active = editCell?.id === id && editCell?.field === field;
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { onSave(id, field, editCell!.value); setEditCell(null); }
    if (e.key === 'Escape') { setEditCell(null); }
  }

  if (active) {
    return (
      <input
        ref={inputRef}
        autoFocus
        type="number"
        value={editCell!.value}
        onChange={e => setEditCell({ id, field, value: e.target.value })}
        onBlur={() => { onSave(id, field, editCell!.value); setEditCell(null); }}
        onKeyDown={handleKeyDown}
        className={`w-full bg-white border-2 rounded-[6px] px-2 py-1 text-[13px] font-600 outline-none ${className}`}
        style={{ borderColor: '#378ADD' }}
      />
    );
  }

  return (
    <span
      onDoubleClick={() => setEditCell({ id, field, value: displayValue })}
      className={`cursor-text select-none rounded-[4px] px-1 hover:bg-[var(--color-gr-border-lite)] transition-colors ${className}`}
      title="Doble clic para editar"
    >
      {displayValue}
    </span>
  );
}

// ─── Tab Productos ─────────────────────────────────────────────────────────────
function TabProductos() {
  const toast          = useToast(s => s.show);
  const productos      = useAppStore(s => s.productos);
  const materiasPrimas = useAppStore(s => s.materiasPrimas);
  const updateProducto = useAppStore(s => s.updateProducto);

  const [modalEditar, setModalEditar] = useState<Producto | null>(null);
  const [modalNuevo,  setModalNuevo]  = useState(false);
  const [form,        setForm]        = useState<Partial<Omit<Producto, 'id'>>>({});
  const [editCell,    setEditCell]    = useState<EditCell>(null);

  // ── Edit existing ──
  function openEdit(p: Producto) {
    setModalEditar(p);
    setForm({ codigo: p.codigo, nombre: p.nombre, kgPorBolsa: p.kgPorBolsa, bolsaEsQQ: p.bolsaEsQQ, precioUnitarioBs: p.precioUnitarioBs, stockMinimo: p.stockMinimo, receta: [...p.receta] });
  }

  function addRecetaItem() {
    setForm(f => ({ ...f, receta: [...(f.receta ?? []), { materia_prima_id: '', nombre: '', qq_por_qq_producido: 1 }] }));
  }

  function updateRecetaItem(idx: number, patch: Partial<RecetaItem>) {
    setForm(f => {
      const receta = [...(f.receta ?? [])];
      receta[idx] = { ...receta[idx], ...patch };
      if (patch.materia_prima_id) {
        const mp = materiasPrimas.find(m => m.id === patch.materia_prima_id);
        if (mp) receta[idx].nombre = mp.nombre;
      }
      return { ...f, receta };
    });
  }

  function removeRecetaItem(idx: number) {
    setForm(f => ({ ...f, receta: (f.receta ?? []).filter((_, i) => i !== idx) }));
  }

  function handleSaveEdit() {
    if (!modalEditar) return;
    updateProducto(modalEditar.id, form);
    setModalEditar(null);
    toast('Producto actualizado', 'success');
  }

  // ── Inline cell save ──
  function handleInlineSave(id: string, field: string, value: string) {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      updateProducto(id, { [field]: num });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Btn size="sm" onClick={() => setModalNuevo(true)}>
          <Plus size={13} /> Agregar producto
        </Btn>
      </div>

      <div className="card-no-pad">
        <div className="hidden md:grid gap-4 px-5 py-3 text-[11.5px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide border-b border-[var(--color-gr-border)]"
          style={{ gridTemplateColumns: '90px 1fr 80px auto auto auto auto', background: 'var(--color-gr-border-lite)' }}>
          <span>Código</span><span>Nombre</span><span>Kg/bolsa</span>
          <span className="text-right">Precio</span><span className="text-right">Mín</span>
          <span>Receta</span><span />
        </div>
        {productos.map((p, i) => (
          <div key={p.id}
            className={`grid grid-cols-[auto_1fr] md:grid-cols-[90px_1fr_80px_auto_auto_auto_auto] gap-3 md:gap-4 px-5 py-4 items-center
              ${i < productos.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}>
            <span className="font-700 text-[var(--color-gr-primary)] text-[12px] font-mono">{p.codigo}</span>
            <div>
              <p className="font-600 text-[var(--color-gr-text)] text-[13.5px]">{p.nombre}</p>
              <p className="text-[11.5px] text-[var(--color-gr-muted)]">
                {p.kgPorBolsa} kg/bolsa · mín {p.stockMinimo} · stock {p.stockActual} bol
              </p>
            </div>
            <span className="text-[13px] text-[var(--color-gr-muted)] hidden md:block">{p.kgPorBolsa} kg</span>
            <span className="font-600 text-[var(--color-gr-text)] hidden md:block text-right">
              <InlineCell id={p.id} field="precioUnitarioBs" displayValue={formatBs(p.precioUnitarioBs)}
                editCell={editCell} setEditCell={setEditCell} onSave={handleInlineSave} />
            </span>
            <span className="text-[13px] text-[var(--color-gr-muted)] hidden md:block text-right">
              <InlineCell id={p.id} field="stockMinimo" displayValue={String(p.stockMinimo)}
                editCell={editCell} setEditCell={setEditCell} onSave={handleInlineSave} />
            </span>
            <span className="hidden md:block">
              <Badge color={p.receta.length > 0 ? 'green' : 'gray'}>
                {p.receta.length > 0 ? `${p.receta.length} MP` : 'Sin receta'}
              </Badge>
            </span>
            <button onClick={() => openEdit(p)}
              className="hidden md:flex text-[var(--color-gr-primary)] hover:underline text-[12.5px] font-600 items-center gap-1">
              <Pencil size={12} /> Editar
            </button>
          </div>
        ))}
      </div>

      {editCell && (
        <p className="text-[11.5px] text-[var(--color-gr-muted)] px-1">
          Editando — presiona Enter para guardar o Escape para cancelar
        </p>
      )}

      {/* Modal: Editar producto existente */}
      {modalEditar && (
        <Modal open title={`Editar — ${modalEditar.nombre}`} onClose={() => setModalEditar(null)} wide>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Código">
              <Input value={form.codigo ?? ''} onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))} />
            </FormField>
            <FormField label="Nombre">
              <Input value={form.nombre ?? ''} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </FormField>
            <FormField label="Kg por bolsa">
              <Input type="number" min="0.01" step="0.01" value={form.kgPorBolsa ?? ''}
                disabled={form.bolsaEsQQ}
                onChange={e => setForm(f => ({ ...f, kgPorBolsa: parseFloat(e.target.value) }))} />
            </FormField>
            <FormField label="Precio (Bs)">
              <Input type="number" min="0" value={form.precioUnitarioBs ?? ''}
                onChange={e => setForm(f => ({ ...f, precioUnitarioBs: parseFloat(e.target.value) }))} />
            </FormField>
            <FormField label="Stock mínimo">
              <Input type="number" min="0" value={form.stockMinimo ?? ''}
                onChange={e => setForm(f => ({ ...f, stockMinimo: parseInt(e.target.value) }))} />
            </FormField>
            <FormField label="Bolsa = 1 QQ">
              <Select value={form.bolsaEsQQ ? 'si' : 'no'}
                onChange={e => {
                  const esQQ = e.target.value === 'si';
                  setForm(f => ({ ...f, bolsaEsQQ: esQQ, kgPorBolsa: esQQ ? 46 : f.kgPorBolsa }));
                }}>
                <option value="no">No (se vende en bolsas)</option>
                <option value="si">Sí (bolsa ≈ QQ)</option>
              </Select>
            </FormField>
          </div>

          <RecetaSection
            receta={form.receta ?? []}
            materiasPrimas={materiasPrimas}
            nombreProducto={form.nombre ?? modalEditar.nombre}
            kgPorBolsa={form.kgPorBolsa ?? modalEditar.kgPorBolsa}
            onAdd={addRecetaItem}
            onUpdate={updateRecetaItem}
            onRemove={removeRecetaItem}
          />

          <div className="flex gap-3 justify-end">
            <Btn variant="ghost" onClick={() => setModalEditar(null)}>Cancelar</Btn>
            <Btn onClick={handleSaveEdit}>Guardar cambios</Btn>
          </div>
        </Modal>
      )}

      {/* Modal: Nuevo producto */}
      {modalNuevo && (
        <ModalNuevoProducto onClose={() => setModalNuevo(false)} />
      )}
    </div>
  );
}

// ─── Sección receta (reutilizable en editar y crear) ──────────────────────────
function RecetaSection({ receta, materiasPrimas, nombreProducto, kgPorBolsa, onAdd, onUpdate, onRemove }: {
  receta: RecetaItem[];
  materiasPrimas: MateriaPrimaStock[];
  nombreProducto: string;
  kgPorBolsa: number;
  onAdd: () => void;
  onUpdate: (idx: number, patch: Partial<RecetaItem>) => void;
  onRemove: (idx: number) => void;
}) {
  const [ejBolsas, setEjBolsas] = useState('100');
  const ejBolsasNum = parseFloat(ejBolsas) || 0;
  const ejTotalQQ   = (ejBolsasNum * kgPorBolsa) / 46;

  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-800 text-[14px] text-[var(--color-gr-text)]">Receta de producción</p>
          <p className="text-[12px] text-[var(--color-gr-muted)] mt-0.5">
            Define qué materias primas consume este producto por cada QQ producido
          </p>
        </div>
        <Btn size="sm" variant="ghost" onClick={onAdd}>
          <Plus size={13} /> Agregar MP
        </Btn>
      </div>

      {receta.length === 0 ? (
        <div className="rounded-[10px] px-4 py-4 text-center text-[13px] text-[var(--color-gr-muted)]"
          style={{ background: 'var(--color-gr-border-lite)', border: '1.5px dashed var(--color-gr-border)' }}>
          Sin materias primas configuradas — haz clic en "Agregar MP"
        </div>
      ) : (
        <div className="rounded-[10px] overflow-hidden border border-[var(--color-gr-border)]">
          <div className="grid px-4 py-2 text-[11px] font-700 text-white uppercase tracking-wide"
            style={{ gridTemplateColumns: '1fr 140px auto', background: 'var(--color-gr-primary)' }}>
            <span>Materia prima</span>
            <span className="text-right pr-2">QQ por QQ producido</span>
            <span />
          </div>
          {receta.map((r, idx) => (
            <div key={idx}
              className="grid px-4 py-3 gap-3 items-center border-t border-[var(--color-gr-border-lite)]"
              style={{ gridTemplateColumns: '1fr 140px auto' }}>
              <Select value={r.materia_prima_id}
                onChange={e => onUpdate(idx, { materia_prima_id: e.target.value })}>
                <option value="">— Seleccionar MP —</option>
                {materiasPrimas.map(mp => (
                  <option key={mp.id} value={mp.id}>{mp.nombre} ({mp.codigo})</option>
                ))}
              </Select>
              <Input type="number" min="0.01" step="0.01" placeholder="1.00"
                value={r.qq_por_qq_producido || ''}
                onChange={e => onUpdate(idx, { qq_por_qq_producido: parseFloat(e.target.value) || 0 })} />
              <button onClick={() => onRemove(idx)}
                className="p-2 rounded-[6px] text-[var(--color-gr-danger)] hover:bg-[var(--color-gr-danger-bg)] transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Ejemplo en tiempo real */}
      {receta.some(r => r.materia_prima_id && r.qq_por_qq_producido > 0) && kgPorBolsa > 0 && (
        <div className="rounded-[10px] px-4 py-3 flex items-start gap-2 text-[12.5px]"
          style={{ background: 'var(--color-gr-primary-lite)' }}>
          <Info size={14} className="text-[var(--color-gr-primary)] shrink-0 mt-1" />
          <div className="text-[var(--color-gr-sub)] flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <strong>Ejemplo: producir</strong>
              <input
                type="number" min="1" value={ejBolsas} onChange={e => setEjBolsas(e.target.value)}
                className="w-16 border border-[var(--color-gr-border)] rounded-[6px] px-2 py-0.5 text-[12px] font-mono text-center outline-none focus:border-[var(--color-gr-primary)]"
              />
              <span>bolsas de {nombreProducto || '…'}</span>
              {ejTotalQQ > 0 && <span className="text-[var(--color-gr-muted)]">= {ejTotalQQ.toFixed(2)} QQ</span>}
            </div>
            {ejBolsasNum > 0 && ejTotalQQ > 0 && (
              <div>
                <strong>Necesitarás:</strong>
                {receta.filter(r => r.materia_prima_id && r.qq_por_qq_producido > 0).map((r, i) => (
                  <span key={i} className="block ml-2 mt-0.5">
                    · <strong>{(ejTotalQQ * r.qq_por_qq_producido).toFixed(2)} QQ</strong> de {r.nombre}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal: Nuevo producto ─────────────────────────────────────────────────────
function ModalNuevoProducto({ onClose }: { onClose: () => void }) {
  const toast          = useToast(s => s.show);
  const productos      = useAppStore(s => s.productos);
  const materiasPrimas = useAppStore(s => s.materiasPrimas);
  const addProducto    = useAppStore(s => s.addProducto);

  const [codigo,          setCodigo]    = useState('');
  const [nombre,          setNombre]    = useState('');
  const [kgPorBolsa,      setKgBolsa]   = useState('');
  const [bolsaEsQQ,       setBolsaEsQQ] = useState(false);
  const [precioUnitario,  setPrecio]    = useState('');
  const [stockMinimo,     setStockMin]  = useState('');
  const [stockInicial,    setStockIni]  = useState('0');
  const [receta,          setReceta]    = useState<RecetaItem[]>([]);
  const [errors,          setErrors]    = useState<Record<string, string>>({});

  const kgNum = bolsaEsQQ ? 46 : (parseFloat(kgPorBolsa) || 0);

  function addRecetaItem() {
    setReceta(r => [...r, { materia_prima_id: '', nombre: '', qq_por_qq_producido: 1 }]);
  }

  function updateRecetaItem(idx: number, patch: Partial<RecetaItem>) {
    setReceta(r => {
      const next = [...r];
      next[idx] = { ...next[idx], ...patch };
      if (patch.materia_prima_id) {
        const mp = materiasPrimas.find(m => m.id === patch.materia_prima_id);
        if (mp) next[idx].nombre = mp.nombre;
      }
      return next;
    });
  }

  function removeRecetaItem(idx: number) {
    setReceta(r => r.filter((_, i) => i !== idx));
  }

  function validate() {
    const errs: Record<string, string> = {};
    const codigoUp = codigo.trim().toUpperCase();
    if (!codigoUp)                                          errs.codigo = 'Requerido';
    else if (productos.some(p => p.codigo === codigoUp))   errs.codigo = 'Código ya existe';
    if (!nombre.trim())                                     errs.nombre = 'Requerido';
    if (kgNum <= 0)                                         errs.kgPorBolsa = 'Debe ser mayor a 0';
    if (receta.length > 0 && receta.some(r => !r.materia_prima_id || r.qq_por_qq_producido <= 0))
                                                            errs.receta = 'Completa o elimina todas las filas';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    addProducto({
      codigo:          codigo.trim().toUpperCase(),
      nombre:          nombre.trim(),
      kgPorBolsa:      kgNum,
      bolsaEsQQ,
      precioUnitarioBs: parseFloat(precioUnitario) || 0,
      stockMinimo:     parseInt(stockMinimo) || 0,
      stockActual:     Math.max(0, parseInt(stockInicial) || 0),
      receta,
    });
    toast('Producto agregado correctamente', 'success');
    onClose();
  }

  return (
    <Modal open title="Agregar nuevo producto" onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3">
        {/* Código */}
        <FormField label="Código *" error={errors.codigo}>
          <Input
            value={codigo}
            onChange={e => { setCodigo(e.target.value.toUpperCase()); setErrors(x => ({ ...x, codigo: '' })); }}
            placeholder="Ej: HMAP-06"
            className="font-mono uppercase"
          />
        </FormField>
        {/* Nombre */}
        <FormField label="Nombre *" error={errors.nombre}>
          <Input
            value={nombre}
            onChange={e => { setNombre(e.target.value); setErrors(x => ({ ...x, nombre: '' })); }}
            placeholder="Hojuela de Maíz Amarillo Precocida"
          />
        </FormField>
        {/* Kg por bolsa */}
        <FormField label="Kg por bolsa *" error={errors.kgPorBolsa}>
          <Input
            type="number" min="0.01" step="0.01" placeholder="23"
            value={bolsaEsQQ ? '46' : kgPorBolsa}
            disabled={bolsaEsQQ}
            onChange={e => { setKgBolsa(e.target.value); setErrors(x => ({ ...x, kgPorBolsa: '' })); }}
          />
        </FormField>
        {/* Precio */}
        <FormField label="Precio unitario (Bs)">
          <Input type="number" min="0" step="0.5" placeholder="305"
            value={precioUnitario} onChange={e => setPrecio(e.target.value)} />
        </FormField>
        {/* Stock mínimo */}
        <FormField label="Stock mínimo (bolsas)">
          <Input type="number" min="0" placeholder="20"
            value={stockMinimo} onChange={e => setStockMin(e.target.value)} />
        </FormField>
        {/* Stock inicial */}
        <FormField label="Stock inicial (bolsas)">
          <Input type="number" min="0" placeholder="0"
            value={stockInicial} onChange={e => setStockIni(e.target.value)} />
        </FormField>
      </div>

      {/* ¿1 bolsa = 1 QQ? */}
      <label className="flex items-center gap-3 cursor-pointer select-none px-1">
        <div
          onClick={() => {
            const next = !bolsaEsQQ;
            setBolsaEsQQ(next);
            if (next) setKgBolsa('46');
          }}
          className="w-5 h-5 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-colors"
          style={{
            borderColor: bolsaEsQQ ? 'var(--color-gr-primary)' : 'var(--color-gr-border)',
            background:  bolsaEsQQ ? 'var(--color-gr-primary)' : 'white',
          }}>
          {bolsaEsQQ && <Check size={12} className="text-white" />}
        </div>
        <div>
          <p className="font-600 text-[13.5px] text-[var(--color-gr-text)]">¿1 bolsa = 1 QQ?</p>
          <p className="text-[12px] text-[var(--color-gr-muted)]">
            Activa si la bolsa pesa ~46 kg (ej: hojuelas de 23 kg vendidas por par)
          </p>
        </div>
      </label>

      {/* Receta */}
      {errors.receta && (
        <p className="text-[12px] text-[var(--color-gr-danger)] px-1">{errors.receta}</p>
      )}
      <RecetaSection
        receta={receta}
        materiasPrimas={materiasPrimas}
        nombreProducto={nombre}
        kgPorBolsa={kgNum}
        onAdd={addRecetaItem}
        onUpdate={updateRecetaItem}
        onRemove={removeRecetaItem}
      />

      <div className="flex gap-3 justify-end">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave}>Agregar producto</Btn>
      </div>
    </Modal>
  );
}

// ─── Tab Materias Primas ───────────────────────────────────────────────────────
function TabMateriasPrimas() {
  const materiasPrimas     = useAppStore(s => s.materiasPrimas);
  const categoriasMP       = useAppStore(s => s.categoriasMP);
  const updateMateriaPrima = useAppStore(s => s.updateMateriaPrima);

  const [modalNuevo, setModalNuevo] = useState(false);
  const [editCell,   setEditCell]   = useState<EditCell>(null);

  function handleInlineSave(id: string, field: string, value: string) {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      updateMateriaPrima(id, { [field]: num });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Btn size="sm" onClick={() => setModalNuevo(true)}>
          <Plus size={13} /> Agregar materia prima
        </Btn>
      </div>

      <div className="card-no-pad">
        <div className="hidden md:grid gap-4 px-5 py-3 text-[11.5px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide border-b border-[var(--color-gr-border)]"
          style={{ gridTemplateColumns: '80px 80px 1fr 80px 90px 80px', background: 'var(--color-gr-border-lite)' }}>
          <span>Código</span><span>Categoría</span><span>Nombre</span>
          <span className="text-right">Stock</span><span className="text-right">Mínimo</span><span>Estado</span>
        </div>
        {materiasPrimas.map((mp, i) => {
          const cat = categoriasMP.find(c => c.id === mp.categoriaId);
          const low  = mp.stockMinimo > 0 && mp.stockTotal < mp.stockMinimo;
          const warn = !low && mp.stockMinimo > 0 && mp.stockTotal < mp.stockMinimo * 1.5;
          return (
            <div key={mp.id}
              className={`grid grid-cols-[auto_1fr] md:grid-cols-[80px_80px_1fr_80px_90px_80px] gap-3 md:gap-4 px-5 py-4 items-center
                ${i < materiasPrimas.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}>
              <span className="font-700 text-[var(--color-gr-primary)] text-[12px] font-mono">{mp.codigo}</span>
              <span className="text-[12px] text-[var(--color-gr-muted)] hidden md:block">{cat?.nombre}</span>
              <span className="font-600 text-[var(--color-gr-text)] text-[13.5px]">{mp.nombre}</span>
              <span className="text-right font-800 text-[var(--color-gr-text)] hidden md:block">{mp.stockTotal} {mp.unidad}</span>
              <span className="text-right text-[13px] text-[var(--color-gr-muted)] hidden md:block">
                <InlineCell id={mp.id} field="stockMinimo" displayValue={String(mp.stockMinimo)}
                  editCell={editCell} setEditCell={setEditCell} onSave={handleInlineSave} />
              </span>
              <span className="hidden md:block">
                <Badge color={low ? 'red' : warn ? 'yellow' : 'green'}>
                  {low ? 'Crítico' : warn ? 'Bajo' : 'OK'}
                </Badge>
              </span>
            </div>
          );
        })}
      </div>

      {editCell && (
        <p className="text-[11.5px] text-[var(--color-gr-muted)] px-1">
          Editando — presiona Enter para guardar o Escape para cancelar
        </p>
      )}

      {modalNuevo && (
        <ModalNuevaMP onClose={() => setModalNuevo(false)} />
      )}
    </div>
  );
}

// ─── Modal: Nueva Materia Prima ────────────────────────────────────────────────
function ModalNuevaMP({ onClose }: { onClose: () => void }) {
  const toast           = useToast(s => s.show);
  const materiasPrimas  = useAppStore(s => s.materiasPrimas);
  const categoriasMP    = useAppStore(s => s.categoriasMP);
  const addMateriaPrima = useAppStore(s => s.addMateriaPrima);
  const addCategoriaMP  = useAppStore(s => s.addCategoriaMP);

  const [categoriaId,    setCategoriaId] = useState('');
  const [codigo,         setCodigo]      = useState('');
  const [nombre,         setNombre]      = useState('');
  const [tieneSubtipos,  setSubtipos]    = useState(false);
  const [stockMinimo,    setStockMin]    = useState('');
  const [stockInicial,   setStockIni]    = useState('0');
  const [errors,         setErrors]      = useState<Record<string, string>>({});

  // Nueva categoría inline
  const [showNuevaCat,     setShowNuevaCat]     = useState(false);
  const [nuevaCatNombre,   setNuevaCatNombre]   = useState('');
  const [nuevaCatSubtipos, setNuevaCatSubtipos] = useState(false);
  const [catError,         setCatError]         = useState('');

  // Auto-fill subtipos from selected category
  function handleCategoriaChange(id: string) {
    setCategoriaId(id);
    const cat = categoriasMP.find(c => c.id === id);
    if (cat) setSubtipos(cat.tieneSubtipos);
    setErrors(x => ({ ...x, categoria: '' }));
  }

  function handleCrearCategoria() {
    if (!nuevaCatNombre.trim()) { setCatError('Nombre requerido'); return; }
    const nueva = addCategoriaMP({ nombre: nuevaCatNombre.trim(), tieneSubtipos: nuevaCatSubtipos });
    setCategoriaId(nueva.id);
    setSubtipos(nuevaCatSubtipos);
    setShowNuevaCat(false);
    setNuevaCatNombre('');
    setCatError('');
    setErrors(x => ({ ...x, categoria: '' }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!categoriaId)                                               errs.categoria = 'Selecciona una categoría';
    const codigoUp = codigo.trim().toUpperCase();
    if (!codigoUp)                                                  errs.codigo = 'Requerido';
    else if (materiasPrimas.some(m => m.codigo === codigoUp))      errs.codigo = 'Código ya existe';
    if (!nombre.trim())                                             errs.nombre = 'Requerido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const stockIni = Math.max(0, parseFloat(stockInicial) || 0);
    const mp: Omit<MateriaPrimaStock, 'id'> = {
      categoriaId,
      codigo:     codigo.trim().toUpperCase(),
      nombre:     nombre.trim(),
      unidad:     'QQ',
      stockTotal: stockIni,
      stockMinimo: parseFloat(stockMinimo) || 0,
    };
    if (tieneSubtipos) {
      mp.stockEntero    = stockIni;
      mp.stockParChico  = 0;
      mp.stockParGrande = 0;
    }
    addMateriaPrima(mp);
    toast('Materia prima agregada correctamente', 'success');
    onClose();
  }

  return (
    <Modal open title="Agregar materia prima" onClose={onClose} wide>
      {/* Categoría */}
      <FormField label="Categoría *" error={errors.categoria}>
        <div className="space-y-2">
          <Select value={categoriaId} onChange={e => handleCategoriaChange(e.target.value)}>
            <option value="">— Seleccionar categoría —</option>
            {categoriasMP.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}{c.tieneSubtipos ? ' (con subtipos)' : ''}</option>
            ))}
          </Select>
          {!showNuevaCat ? (
            <button onClick={() => setShowNuevaCat(true)}
              className="flex items-center gap-1 text-[12.5px] font-600 text-[var(--color-gr-primary)] hover:underline">
              <Plus size={12} /> Nueva categoría
            </button>
          ) : (
            <div className="rounded-[10px] border border-[var(--color-gr-primary)]/40 p-3 space-y-3"
              style={{ background: 'var(--color-gr-primary-lite)' }}>
              <p className="text-[12.5px] font-700 text-[var(--color-gr-primary)]">Nueva categoría</p>
              <FormField label="Nombre de categoría *" error={catError}>
                <Input
                  value={nuevaCatNombre}
                  onChange={e => { setNuevaCatNombre(e.target.value); setCatError(''); }}
                  placeholder="Ej: Granos"
                  autoFocus
                />
              </FormField>
              <div className="flex items-center gap-4 text-[13px]">
                <p className="font-600 text-[var(--color-gr-sub)]">¿Tiene subtipos?</p>
                {[{ val: true, label: 'Sí (Entero, Partido Chico, Grande)' }, { val: false, label: 'No (solo cantidad total)' }].map(opt => (
                  <label key={String(opt.val)} className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setNuevaCatSubtipos(opt.val)}
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors"
                      style={{
                        borderColor: nuevaCatSubtipos === opt.val ? 'var(--color-gr-primary)' : 'var(--color-gr-border)',
                        background:  nuevaCatSubtipos === opt.val ? 'var(--color-gr-primary)' : 'white',
                      }}>
                      {nuevaCatSubtipos === opt.val && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <span className="text-[var(--color-gr-sub)]">{opt.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <Btn size="sm" onClick={handleCrearCategoria}>Crear categoría</Btn>
                <Btn size="sm" variant="ghost" onClick={() => { setShowNuevaCat(false); setCatError(''); }}>Cancelar</Btn>
              </div>
            </div>
          )}
        </div>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        {/* Código */}
        <FormField label="Código *" error={errors.codigo}>
          <Input
            value={codigo}
            onChange={e => { setCodigo(e.target.value.toUpperCase()); setErrors(x => ({ ...x, codigo: '' })); }}
            placeholder="Ej: FRA-AM"
            className="font-mono uppercase"
          />
        </FormField>
        {/* Nombre */}
        <FormField label="Nombre *" error={errors.nombre}>
          <Input
            value={nombre}
            onChange={e => { setNombre(e.target.value); setErrors(x => ({ ...x, nombre: '' })); }}
            placeholder="Frangollo Amarillo"
          />
        </FormField>
        {/* Stock mínimo */}
        <FormField label="Stock mínimo (QQ)">
          <Input type="number" min="0" step="0.5" placeholder="15"
            value={stockMinimo} onChange={e => setStockMin(e.target.value)} />
        </FormField>
        {/* Stock inicial */}
        <FormField label="Stock inicial (QQ)">
          <Input type="number" min="0" step="0.5" placeholder="0"
            value={stockInicial} onChange={e => setStockIni(e.target.value)} />
        </FormField>
      </div>

      {/* Subtipos */}
      <div className="rounded-[10px] px-4 py-3 space-y-2"
        style={{ background: 'var(--color-gr-border-lite)', border: '1px solid var(--color-gr-border)' }}>
        <p className="font-600 text-[13.5px] text-[var(--color-gr-text)]">¿Tiene subtipos?</p>
        <p className="text-[12px] text-[var(--color-gr-muted)]">
          Si activas subtipos, al registrar entradas se pedirá QQ entero, partido chico y partido grande por separado.
        </p>
        <div className="flex gap-6">
          {[{ val: true, label: 'Sí — con subtipos (Entero, Par Chico, Par Grande)' }, { val: false, label: 'No — solo cantidad total' }].map(opt => (
            <label key={String(opt.val)} className="flex items-center gap-2 cursor-pointer text-[13px]">
              <div
                onClick={() => setSubtipos(opt.val)}
                className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors shrink-0"
                style={{
                  borderColor: tieneSubtipos === opt.val ? 'var(--color-gr-primary)' : 'var(--color-gr-border)',
                  background:  tieneSubtipos === opt.val ? 'var(--color-gr-primary)' : 'white',
                }}>
                {tieneSubtipos === opt.val && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <span className="text-[var(--color-gr-sub)]">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave}>Agregar materia prima</Btn>
      </div>
    </Modal>
  );
}

// ─── Tab Clientes ──────────────────────────────────────────────────────────────
function TabClientes() {
  const toast      = useToast(s => s.show);
  const clientes   = useAppStore(s => s.clientes);
  const addCliente = useAppStore(s => s.addCliente);
  const [form, setForm]   = useState<Partial<Omit<Cliente, 'id'>>>({});
  const [modal, setModal] = useState(false);

  function handleSave() {
    if (!form.nombre) return;
    addCliente({ nombre: form.nombre, telefono: form.telefono, ciudad: form.ciudad, nit: form.nit });
    setModal(false); setForm({});
    toast('Cliente agregado', 'success');
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Btn size="sm" onClick={() => setModal(true)}><Plus size={13} /> Nuevo cliente</Btn>
      </div>
      <div className="card-no-pad">
        {clientes.map((c, i) => (
          <div key={c.id}
            className={`flex items-center gap-4 px-5 py-4 ${i < clientes.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-[var(--color-gr-primary-lite)] flex items-center justify-center text-[13px] font-800 text-[var(--color-gr-primary)] shrink-0">
              {c.nombre.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-700 text-[var(--color-gr-text)] text-[13.5px]">{c.nombre}</p>
              <p className="text-[12px] text-[var(--color-gr-muted)]">
                {c.ciudad}{c.telefono ? ` · ${c.telefono}` : ''}{c.nit ? ` · NIT ${c.nit}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <Modal open title="Nuevo cliente" onClose={() => setModal(false)}>
          <FormField label="Nombre" required>
            <Input value={form.nombre ?? ''} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} autoFocus />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Ciudad"><Input value={form.ciudad ?? ''} onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))} /></FormField>
            <FormField label="Teléfono"><Input value={form.telefono ?? ''} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} /></FormField>
          </div>
          <FormField label="NIT"><Input value={form.nit ?? ''} onChange={e => setForm(f => ({ ...f, nit: e.target.value }))} /></FormField>
          <div className="flex gap-3 justify-end">
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
            <Btn onClick={handleSave} disabled={!form.nombre}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Tab Transportistas ────────────────────────────────────────────────────────
function TabTransportistas() {
  const toast            = useToast(s => s.show);
  const transportistas   = useAppStore(s => s.transportistas);
  const addTransportista = useAppStore(s => s.addTransportista);
  const [form, setForm]   = useState<Partial<Omit<Transportista, 'id'>>>({});
  const [modal, setModal] = useState(false);

  function handleSave() {
    if (!form.nombre || !form.placa) return;
    addTransportista({ nombre: form.nombre, placa: form.placa, marca: form.marca ?? '', empresa: form.empresa, telefono: form.telefono });
    setModal(false); setForm({});
    toast('Transportista agregado', 'success');
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Btn size="sm" onClick={() => setModal(true)}><Plus size={13} /> Nuevo transportista</Btn>
      </div>
      <div className="card-no-pad">
        {transportistas.map((t, i) => (
          <div key={t.id}
            className={`flex items-center gap-4 px-5 py-4 ${i < transportistas.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-[var(--color-gr-gold-lite)] flex items-center justify-center text-[13px] font-800 text-[var(--color-gr-gold-dark)] shrink-0">
              {t.nombre.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-700 text-[var(--color-gr-text)] text-[13.5px]">{t.nombre}</p>
              <p className="text-[12px] text-[var(--color-gr-muted)]">
                {t.marca} · <strong>{t.placa}</strong>{t.empresa ? ` · ${t.empresa}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <Modal open title="Nuevo transportista" onClose={() => setModal(false)}>
          <FormField label="Nombre" required>
            <Input value={form.nombre ?? ''} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} autoFocus />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Placa" required><Input value={form.placa ?? ''} onChange={e => setForm(f => ({ ...f, placa: e.target.value }))} /></FormField>
            <FormField label="Marca/Modelo" required><Input value={form.marca ?? ''} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Empresa"><Input value={form.empresa ?? ''} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} /></FormField>
            <FormField label="Teléfono"><Input value={form.telefono ?? ''} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} /></FormField>
          </div>
          <div className="flex gap-3 justify-end">
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
            <Btn onClick={handleSave} disabled={!form.nombre || !form.placa}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
