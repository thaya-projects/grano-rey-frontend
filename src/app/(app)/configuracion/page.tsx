'use client';
import { useState } from 'react';
import {
  useClientes,
  useCreateCliente,
  useProveedores,
  useCreateProveedor,
  useTransportistas,
  useCreateTransportista,
  useUnidades,
  useCategoriasMP,
  useCreateCategoriaMP,
} from '@/lib/api/catalogos';
import { useProductos, useCreateProducto, useUpdateProducto } from '@/lib/api/productos';
import { useMateriasPrimas, useCreateMateriaPrima } from '@/lib/api/materia-prima';
import { useEmpresa, useActualizarConfiguracion } from '@/lib/api/empresa';
import { apiErrorMessage } from '@/lib/api';
import { formatBs } from '@/lib/utils';
import type { Producto } from '@/lib/types';
import { Btn, Modal, FormField, Input, Select, Spinner, useToast } from '@/components/ui';
import { Package, Users, Truck, Wheat, Plus, Pencil, Building2, ShieldCheck, Tag } from 'lucide-react';

type Tab = 'empresa' | 'productos' | 'mp' | 'clientes' | 'transportistas' | 'proveedores';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'empresa',        label: 'Empresa',         icon: <Building2 size={15} /> },
  { id: 'productos',      label: 'Productos',       icon: <Package size={15} /> },
  { id: 'mp',             label: 'Materia Prima',   icon: <Wheat size={15} /> },
  { id: 'clientes',       label: 'Clientes',        icon: <Users size={15} /> },
  { id: 'transportistas', label: 'Transportistas',  icon: <Truck size={15} /> },
  { id: 'proveedores',    label: 'Proveedores',     icon: <Tag size={15} /> },
];

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<Tab>('empresa');

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="text-[22px] font-900 text-[var(--color-gr-text)]">Configuración</h1>
        <p className="text-[var(--color-gr-muted)] text-[13.5px] mt-0.5">
          Datos de la empresa y catálogos maestros
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

      {tab === 'empresa'        && <TabEmpresa />}
      {tab === 'productos'      && <TabProductos />}
      {tab === 'mp'             && <TabMateriasPrimas />}
      {tab === 'clientes'       && <TabClientes />}
      {tab === 'transportistas' && <TabTransportistas />}
      {tab === 'proveedores'    && <TabProveedores />}
    </div>
  );
}

// ─── Tab Empresa (SENASAG) ─────────────────────────────────────────────────
function TabEmpresa() {
  const toast = useToast(s => s.show);
  const empresaQ = useEmpresa();
  const actualizar = useActualizarConfiguracion();
  const [registroSanitario, setRS] = useState('');

  if (empresaQ.isLoading) {
    return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;
  }
  const empresa = empresaQ.data;
  const rsActual = empresa?.configuracion?.registroSanitario ?? '';

  async function handleGuardar() {
    try {
      await actualizar.mutateAsync({ registroSanitario });
      toast('Configuración actualizada', 'success');
      setRS('');
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo actualizar'), 'error');
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-[var(--color-gr-primary)]" />
          <h2 className="font-800 text-[15px] text-[var(--color-gr-text)]">Datos de la empresa</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 text-[13.5px]">
          <div>
            <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">Razón social</p>
            <p className="font-700">{empresa?.nombre ?? '—'}</p>
          </div>
          <div>
            <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">NIT</p>
            <p className="font-700">{empresa?.nit ?? '—'}</p>
          </div>
          <div>
            <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">Plan</p>
            <p className="font-700 capitalize">{empresa?.plan ?? '—'}</p>
          </div>
          <div>
            <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">Ciudad</p>
            <p className="font-700">{empresa?.ciudad ?? '—'}</p>
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-[var(--color-gr-primary)]" />
          <h2 className="font-800 text-[15px] text-[var(--color-gr-text)]">Registro sanitario SENASAG</h2>
        </div>
        <p className="text-[12.5px] text-[var(--color-gr-muted)] -mt-2">
          Conforme a Norma Boliviana NB 314001 y SENASAG R.A. 042/2023. Se imprime automáticamente en cada lote producido.
        </p>

        <div className="rounded-[10px] px-4 py-3" style={{ background: 'var(--color-gr-primary-lite)' }}>
          <p className="text-[12px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">Registro actual</p>
          <p className="font-800 text-[15px] text-[var(--color-gr-primary)] font-mono">
            {rsActual || <span className="text-[var(--color-gr-muted)] font-normal italic">Sin configurar</span>}
          </p>
        </div>

        <FormField label="Nuevo número de registro sanitario">
          <Input placeholder={rsActual || 'RS-BO-2024-001234'} value={registroSanitario}
            onChange={e => setRS(e.target.value)} />
        </FormField>

        <div className="flex justify-end">
          <Btn onClick={handleGuardar} disabled={!registroSanitario.trim()} loading={actualizar.isPending}>
            <ShieldCheck size={14} /> Guardar registro
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Tab Productos ─────────────────────────────────────────────────────────
function TabProductos() {
  const toast = useToast(s => s.show);
  const productosQ = useProductos();
  const unidadesQ  = useUnidades();
  const productos = productosQ.data ?? [];
  const unidades  = unidadesQ.data ?? [];

  const [modal, setModal] = useState<{ mode: 'create' } | { mode: 'edit'; producto: Producto } | null>(null);

  if (productosQ.isLoading) {
    return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--color-gr-muted)]">{productos.length} productos</p>
        <Btn onClick={() => setModal({ mode: 'create' })}><Plus size={14} /> Nuevo producto</Btn>
      </div>

      <div className="card-no-pad overflow-x-auto">
        <table className="w-full text-[13px]" style={{ minWidth: 720 }}>
          <thead>
            <tr style={{ background: 'var(--color-gr-primary)' }}>
              {['Código', 'Nombre', 'Unidad', 'Kg/Unidad', 'Precio', 'Stock', 'Mínimo', 'Vida útil', ''].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] font-700 text-white uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {productos.map((p, i) => (
              <tr key={p.id} style={{ background: i % 2 ? 'var(--color-gr-border-lite)' : '#fff' }}
                className="border-b border-[var(--color-gr-border-lite)]">
                <td className="px-4 py-3 font-mono font-700 text-[12.5px] text-[var(--color-gr-primary)]">{p.codigo}</td>
                <td className="px-4 py-3 font-700">{p.nombre}</td>
                <td className="px-4 py-3 text-[12px] text-[var(--color-gr-muted)]">{p.unidadVenta?.codigo ?? '—'}</td>
                <td className="px-4 py-3">{Number(p.pesoKgPorUnidad).toFixed(2)}</td>
                <td className="px-4 py-3">{formatBs(Number(p.precioUnitarioBs))}</td>
                <td className="px-4 py-3 font-700">{Number(p.stockActual)}</td>
                <td className="px-4 py-3">{Number(p.stockMinimo)}</td>
                <td className="px-4 py-3">{p.vidaUtilMeses}m</td>
                <td className="px-4 py-3 text-right">
                  <Btn size="sm" variant="ghost" onClick={() => setModal({ mode: 'edit', producto: p })}>
                    <Pencil size={12} />
                  </Btn>
                </td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-[var(--color-gr-muted)]">Sin productos cargados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <ProductoModal
          mode={modal.mode}
          producto={modal.mode === 'edit' ? modal.producto : undefined}
          unidades={unidades}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); toast('Producto guardado', 'success'); }}
          onError={(msg) => toast(msg, 'error')}
        />
      )}
    </div>
  );
}

function ProductoModal({ mode, producto, unidades, onClose, onSaved, onError }: {
  mode: 'create' | 'edit';
  producto?: Producto;
  unidades: { id: string; codigo: string; nombre: string }[];
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const create = useCreateProducto();
  const update = useUpdateProducto();

  const [codigo, setCodigo]     = useState(producto?.codigo ?? '');
  const [nombre, setNombre]     = useState(producto?.nombre ?? '');
  const [descripcion, setDesc]  = useState(producto?.descripcion ?? '');
  const [pesoKg, setPesoKg]     = useState(String(producto?.pesoKgPorUnidad ?? ''));
  const [precio, setPrecio]     = useState(String(producto?.precioUnitarioBs ?? ''));
  const [stockMinimo, setStockMin] = useState(String(producto?.stockMinimo ?? '0'));
  const [vidaUtil, setVidaUtil] = useState(String(producto?.vidaUtilMeses ?? '12'));
  const [unidadId, setUnidadId] = useState(producto?.unidadVenta?.id ?? '');

  const pesoNum   = parseFloat(pesoKg) || 0;
  const precioNum = parseFloat(precio) || 0;
  const stockMin  = parseFloat(stockMinimo) || 0;
  const vidaNum   = parseInt(vidaUtil) || 0;
  const valid     = !!nombre && pesoNum > 0 && precioNum >= 0 && vidaNum >= 1 && (mode === 'edit' || (!!codigo && !!unidadId));

  async function handleSave() {
    if (!valid) return;
    try {
      if (mode === 'create') {
        await create.mutateAsync({
          codigo,
          nombre,
          descripcion: descripcion || undefined,
          pesoKgPorUnidad: pesoNum,
          precioUnitarioBs: precioNum,
          stockMinimo: stockMin || undefined,
          unidadVentaId: unidadId,
          vidaUtilMeses: vidaNum,
        });
      } else if (producto) {
        await update.mutateAsync({
          id: producto.id,
          dto: {
            nombre,
            descripcion: descripcion || undefined,
            precioUnitarioBs: precioNum,
            stockMinimo: stockMin || undefined,
            vidaUtilMeses: vidaNum,
          },
        });
      }
      onSaved();
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo guardar el producto'));
    }
  }

  return (
    <Modal open title={mode === 'create' ? 'Nuevo producto' : `Editar — ${producto?.nombre}`} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Código" required>
          <Input value={codigo} onChange={e => setCodigo(e.target.value)} disabled={mode === 'edit'} placeholder="HMAP-06" />
        </FormField>
        <FormField label="Unidad de venta" required>
          <Select value={unidadId} onChange={e => setUnidadId(e.target.value)} disabled={mode === 'edit'}>
            <option value="">— Seleccionar —</option>
            {unidades.map(u => <option key={u.id} value={u.id}>{u.codigo} · {u.nombre}</option>)}
          </Select>
        </FormField>
      </div>

      <FormField label="Nombre" required>
        <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Harina de Maíz Amarillo" />
      </FormField>

      <FormField label="Descripción">
        <Input value={descripcion ?? ''} onChange={e => setDesc(e.target.value)} />
      </FormField>

      <div className="grid grid-cols-3 gap-3">
        <FormField label="Kg por unidad" required>
          <Input type="number" min="0.001" step="0.01" value={pesoKg} onChange={e => setPesoKg(e.target.value)} />
        </FormField>
        <FormField label="Precio (Bs)" required>
          <Input type="number" min="0" step="0.5" value={precio} onChange={e => setPrecio(e.target.value)} />
        </FormField>
        <FormField label="Stock mínimo">
          <Input type="number" min="0" step="1" value={stockMinimo} onChange={e => setStockMin(e.target.value)} />
        </FormField>
      </div>

      <FormField label="Vida útil (meses)" required>
        <Input type="number" min="1" step="1" value={vidaUtil} onChange={e => setVidaUtil(e.target.value)} />
      </FormField>

      <div className="flex gap-3 justify-end">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!valid} loading={create.isPending || update.isPending}>
          {mode === 'create' ? 'Crear' : 'Guardar'}
        </Btn>
      </div>
    </Modal>
  );
}

// ─── Tab Materias Primas ───────────────────────────────────────────────────
function TabMateriasPrimas() {
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

      <div className="card-no-pad overflow-x-auto">
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
    <Modal open title="Nueva materia prima" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Código" required><Input value={codigo} onChange={e => setCodigo(e.target.value)} /></FormField>
        <FormField label="Stock mínimo (kg)"><Input type="number" min="0" step="0.1" value={stockMinimoKg} onChange={e => setMin(e.target.value)} /></FormField>
      </div>
      <FormField label="Nombre" required><Input value={nombre} onChange={e => setNombre(e.target.value)} /></FormField>
      <FormField label="Descripción"><Input value={descripcion} onChange={e => setDesc(e.target.value)} /></FormField>
      <div className="grid grid-cols-2 gap-3">
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
      <div className="flex gap-3 justify-end">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!valid} loading={create.isPending}>Crear</Btn>
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
    <Modal open title="Nueva categoría MP" onClose={onClose}>
      <FormField label="Nombre" required><Input value={nombre} onChange={e => setNombre(e.target.value)} /></FormField>
      <FormField label="Descripción"><Input value={descripcion} onChange={e => setDesc(e.target.value)} /></FormField>
      <label className="flex items-center gap-2 text-[13.5px] cursor-pointer">
        <input type="checkbox" checked={tieneSubtipos} onChange={e => setSubt(e.target.checked)} /> Permite subtipos
      </label>
      <div className="flex gap-3 justify-end">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!nombre} loading={create.isPending}>Crear</Btn>
      </div>
    </Modal>
  );
}

// ─── Tab Clientes ──────────────────────────────────────────────────────────
function TabClientes() {
  const toast = useToast(s => s.show);
  const q = useClientes();
  const create = useCreateCliente();
  const clientes = q.data ?? [];
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTel] = useState('');
  const [direccion, setDir] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [nit, setNit] = useState('');

  async function handleSave() {
    if (!nombre) return;
    try {
      await create.mutateAsync({
        nombre, telefono: telefono || undefined, direccion: direccion || undefined,
        ciudad: ciudad || undefined, nit: nit || undefined,
      });
      setOpen(false); setNombre(''); setTel(''); setDir(''); setCiudad(''); setNit('');
      toast('Cliente creado', 'success');
    } catch (err) { toast(apiErrorMessage(err, 'No se pudo crear'), 'error'); }
  }

  if (q.isLoading) return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--color-gr-muted)]">{clientes.length} clientes</p>
        <Btn onClick={() => setOpen(true)}><Plus size={14} /> Nuevo cliente</Btn>
      </div>
      <div className="card-no-pad overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ background: 'var(--color-gr-primary)' }}>
              {['Nombre', 'Ciudad', 'Teléfono', 'NIT'].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] font-700 text-white uppercase tracking-wide text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientes.map((c, i) => (
              <tr key={c.id} style={{ background: i % 2 ? 'var(--color-gr-border-lite)' : '#fff' }}
                className="border-b border-[var(--color-gr-border-lite)]">
                <td className="px-4 py-3 font-700">{c.nombre}</td>
                <td className="px-4 py-3">{c.ciudad ?? '—'}</td>
                <td className="px-4 py-3">{c.telefono ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-[12px]">{c.nit ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <Modal open title="Nuevo cliente" onClose={() => setOpen(false)}>
          <FormField label="Nombre" required><Input value={nombre} onChange={e => setNombre(e.target.value)} /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Teléfono"><Input value={telefono} onChange={e => setTel(e.target.value)} /></FormField>
            <FormField label="Ciudad"><Input value={ciudad} onChange={e => setCiudad(e.target.value)} /></FormField>
          </div>
          <FormField label="Dirección"><Input value={direccion} onChange={e => setDir(e.target.value)} /></FormField>
          <FormField label="NIT"><Input value={nit} onChange={e => setNit(e.target.value)} /></FormField>
          <div className="flex gap-3 justify-end">
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancelar</Btn>
            <Btn onClick={handleSave} disabled={!nombre} loading={create.isPending}>Crear</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Tab Transportistas ────────────────────────────────────────────────────
function TabTransportistas() {
  const toast = useToast(s => s.show);
  const q = useTransportistas();
  const create = useCreateTransportista();
  const items = q.data ?? [];
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTel] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [ci, setCi] = useState('');

  async function handleSave() {
    if (!nombre) return;
    try {
      await create.mutateAsync({
        nombre, telefono: telefono || undefined, empresa: empresa || undefined,
        placa: placa || undefined, marca: marca || undefined, ci: ci || undefined,
      });
      setOpen(false); setNombre(''); setTel(''); setEmpresa(''); setPlaca(''); setMarca(''); setCi('');
      toast('Transportista creado', 'success');
    } catch (err) { toast(apiErrorMessage(err, 'No se pudo crear'), 'error'); }
  }

  if (q.isLoading) return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--color-gr-muted)]">{items.length} transportistas</p>
        <Btn onClick={() => setOpen(true)}><Plus size={14} /> Nuevo transportista</Btn>
      </div>
      <div className="card-no-pad overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ background: 'var(--color-gr-primary)' }}>
              {['Nombre', 'Empresa', 'Placa', 'Marca', 'Teléfono'].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] font-700 text-white uppercase tracking-wide text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((t, i) => (
              <tr key={t.id} style={{ background: i % 2 ? 'var(--color-gr-border-lite)' : '#fff' }}
                className="border-b border-[var(--color-gr-border-lite)]">
                <td className="px-4 py-3 font-700">{t.nombre}</td>
                <td className="px-4 py-3">{t.empresa ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-[12px]">{t.placa ?? '—'}</td>
                <td className="px-4 py-3">{t.marca ?? '—'}</td>
                <td className="px-4 py-3">{t.telefono ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <Modal open title="Nuevo transportista" onClose={() => setOpen(false)}>
          <FormField label="Nombre" required><Input value={nombre} onChange={e => setNombre(e.target.value)} /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="CI"><Input value={ci} onChange={e => setCi(e.target.value)} /></FormField>
            <FormField label="Teléfono"><Input value={telefono} onChange={e => setTel(e.target.value)} /></FormField>
          </div>
          <FormField label="Empresa"><Input value={empresa} onChange={e => setEmpresa(e.target.value)} /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Placa"><Input value={placa} onChange={e => setPlaca(e.target.value)} /></FormField>
            <FormField label="Marca"><Input value={marca} onChange={e => setMarca(e.target.value)} /></FormField>
          </div>
          <div className="flex gap-3 justify-end">
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancelar</Btn>
            <Btn onClick={handleSave} disabled={!nombre} loading={create.isPending}>Crear</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Tab Proveedores ───────────────────────────────────────────────────────
function TabProveedores() {
  const toast = useToast(s => s.show);
  const q = useProveedores();
  const create = useCreateProveedor();
  const items = q.data ?? [];
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTel] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [contacto, setContacto] = useState('');
  const [nit, setNit] = useState('');

  async function handleSave() {
    if (!nombre) return;
    try {
      await create.mutateAsync({
        nombre, telefono: telefono || undefined, ciudad: ciudad || undefined,
        contacto: contacto || undefined, nit: nit || undefined,
      });
      setOpen(false); setNombre(''); setTel(''); setCiudad(''); setContacto(''); setNit('');
      toast('Proveedor creado', 'success');
    } catch (err) { toast(apiErrorMessage(err, 'No se pudo crear'), 'error'); }
  }

  if (q.isLoading) return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--color-gr-muted)]">{items.length} proveedores</p>
        <Btn onClick={() => setOpen(true)}><Plus size={14} /> Nuevo proveedor</Btn>
      </div>
      <div className="card-no-pad overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ background: 'var(--color-gr-primary)' }}>
              {['Nombre', 'Contacto', 'Ciudad', 'Teléfono', 'NIT'].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] font-700 text-white uppercase tracking-wide text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((p, i) => (
              <tr key={p.id} style={{ background: i % 2 ? 'var(--color-gr-border-lite)' : '#fff' }}
                className="border-b border-[var(--color-gr-border-lite)]">
                <td className="px-4 py-3 font-700">{p.nombre}</td>
                <td className="px-4 py-3">{p.contacto ?? '—'}</td>
                <td className="px-4 py-3">{p.ciudad ?? '—'}</td>
                <td className="px-4 py-3">{p.telefono ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-[12px]">{p.nit ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <Modal open title="Nuevo proveedor" onClose={() => setOpen(false)}>
          <FormField label="Nombre" required><Input value={nombre} onChange={e => setNombre(e.target.value)} /></FormField>
          <FormField label="Contacto"><Input value={contacto} onChange={e => setContacto(e.target.value)} /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Ciudad"><Input value={ciudad} onChange={e => setCiudad(e.target.value)} /></FormField>
            <FormField label="Teléfono"><Input value={telefono} onChange={e => setTel(e.target.value)} /></FormField>
          </div>
          <FormField label="NIT"><Input value={nit} onChange={e => setNit(e.target.value)} /></FormField>
          <div className="flex gap-3 justify-end">
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancelar</Btn>
            <Btn onClick={handleSave} disabled={!nombre} loading={create.isPending}>Crear</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
