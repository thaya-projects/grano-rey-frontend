'use client';
import { useEffect, useState } from 'react';
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
import { useEmpresa, useActualizarConfiguracion, useActualizarEmpresa } from '@/lib/api/empresa';
import { apiErrorMessage } from '@/lib/api';
import { formatBs } from '@/lib/utils';
import type { Producto } from '@/lib/types';
import { Btn, Modal, FormField, Input, PhoneInput, normalizePhone, Select, Spinner, useToast } from '@/components/ui';
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

      {/* Mobile: grid 3×2 sin scroll · Desktop: flex con underline */}
      <div className="grid grid-cols-3 gap-1 md:flex md:gap-0 md:border-b-2 md:border-[var(--color-gr-border)]">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-[10px] font-700 text-[11px] leading-tight text-center transition-colors
              md:flex-row md:gap-2 md:px-5 md:py-3 md:rounded-none md:text-[13.5px] md:leading-normal md:border-b-2 md:-mb-[2px] md:whitespace-nowrap
              ${tab === t.id
                ? 'bg-[var(--color-gr-primary-lite)] text-[var(--color-gr-primary)] md:bg-transparent md:border-[var(--color-gr-primary)]'
                : 'text-[var(--color-gr-muted)] hover:text-[var(--color-gr-text)] md:border-transparent'}`}>
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

// ─── Tab Empresa (datos + SENASAG) ─────────────────────────────────────────
function TabEmpresa() {
  const toast = useToast(s => s.show);
  const empresaQ = useEmpresa();
  const actualizarConfig = useActualizarConfiguracion();
  const actualizarDatos  = useActualizarEmpresa();

  // Datos básicos
  const [nombre, setNombre]       = useState('');
  const [nit, setNit]             = useState('');
  const [rubro, setRubro]         = useState('');
  const [telefono, setTelefono]   = useState('');
  const [email, setEmail]         = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad]       = useState('');
  const [logoUrl, setLogoUrl]     = useState('');

  // SENASAG
  const [registroSanitario, setRS] = useState('');

  const empresa = empresaQ.data;

  // Inicializar el form al cargar
  useEffect(() => {
    if (!empresa) return;
    setNombre(empresa.nombre ?? '');
    setNit(empresa.nit ?? '');
    setRubro(empresa.rubro ?? '');
    setTelefono(normalizePhone(empresa.telefono ?? ''));
    setEmail(empresa.email ?? '');
    setDireccion(empresa.direccion ?? '');
    setCiudad(empresa.ciudad ?? '');
    setLogoUrl(empresa.logoUrl ?? '');
  }, [empresa]);

  if (empresaQ.isLoading) {
    return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;
  }

  const rsActual = empresa?.configuracion?.registroSanitario ?? '';

  const hayCambiosDatos =
    nombre    !== (empresa?.nombre    ?? '') ||
    nit       !== (empresa?.nit       ?? '') ||
    rubro     !== (empresa?.rubro     ?? '') ||
    telefono  !== normalizePhone(empresa?.telefono  ?? '') ||
    email     !== (empresa?.email     ?? '') ||
    direccion !== (empresa?.direccion ?? '') ||
    ciudad    !== (empresa?.ciudad    ?? '') ||
    logoUrl   !== (empresa?.logoUrl   ?? '');

  async function handleGuardarDatos() {
    try {
      await actualizarDatos.mutateAsync({
        nombre:    nombre    || undefined,
        nit:       nit       || undefined,
        rubro:     rubro     || undefined,
        telefono:  telefono  || undefined,
        email:     email     || undefined,
        direccion: direccion || undefined,
        ciudad:    ciudad    || undefined,
        logoUrl:   logoUrl   || undefined,
      });
      toast('Datos de la empresa actualizados', 'success');
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo actualizar'), 'error');
    }
  }

  async function handleGuardarRS() {
    try {
      await actualizarConfig.mutateAsync({ registroSanitario });
      toast('Registro sanitario actualizado', 'success');
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

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Razón social" required>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Grano Rey SRL" />
          </FormField>
          <FormField label="NIT">
            <Input value={nit} onChange={e => setNit(e.target.value)} placeholder="1234567890" />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Rubro">
            <Input value={rubro} onChange={e => setRubro(e.target.value)} placeholder="Alimentos precocidos" />
          </FormField>
          <FormField label="Plan (solo lectura)">
            <Input value={empresa?.plan ?? ''} disabled />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Teléfono">
            <PhoneInput value={telefono} onChange={setTelefono} />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contacto@empresa.bo" />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Ciudad">
            <Input value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="Santa Cruz" />
          </FormField>
          <FormField label="Dirección">
            <Input value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Av. Cristo Redentor #1234" />
          </FormField>
        </div>

        <FormField label="URL del logo">
          <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." />
        </FormField>

        <div className="flex justify-end">
          <Btn
            onClick={handleGuardarDatos}
            disabled={!hayCambiosDatos || !nombre.trim()}
            loading={actualizarDatos.isPending}>
            <Building2 size={14} /> Guardar datos
          </Btn>
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
          <Btn onClick={handleGuardarRS} disabled={!registroSanitario.trim()} loading={actualizarConfig.isPending}>
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
  const [activo, setActivo]     = useState(producto?.activo ?? true);

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
          activo,
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
            activo,
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
        <FormField label="Código" required hint="Obligatorio">
          <Input value={codigo} onChange={e => setCodigo(e.target.value)} disabled={mode === 'edit'} placeholder="HMAP-06" />
        </FormField>
        <FormField label="Unidad de venta" required hint="Obligatorio">
          <Select value={unidadId} onChange={e => setUnidadId(e.target.value)} disabled={mode === 'edit'}>
            <option value="">— Seleccionar —</option>
            {unidades.map(u => <option key={u.id} value={u.id}>{u.codigo} · {u.nombre}</option>)}
          </Select>
        </FormField>
      </div>

      <FormField label="Nombre" required hint="Obligatorio">
        <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Harina de Maíz Amarillo" />
      </FormField>

      <FormField label="Descripción" hint="Opcional">
        <Input value={descripcion ?? ''} onChange={e => setDesc(e.target.value)} />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Kg por unidad" required hint="Obligatorio">
          <Input type="number" min="0.001" step="0.01" value={pesoKg} onChange={e => setPesoKg(e.target.value)} />
        </FormField>
        <FormField label="Precio (Bs)" required hint="Obligatorio">
          <Input type="number" min="0" step="0.5" value={precio} onChange={e => setPrecio(e.target.value)} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Stock mínimo" hint="Opcional">
          <Input type="number" min="0" step="1" value={stockMinimo} onChange={e => setStockMin(e.target.value)} />
        </FormField>
        <FormField label="Vida útil (meses)" hint="Opcional">
          <Input type="number" min="1" step="1" value={vidaUtil} onChange={e => setVidaUtil(e.target.value)} />
        </FormField>
      </div>

      <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActivo(v => !v)}>
        <div className={`relative shrink-0 w-10 h-6 rounded-full transition-colors duration-200 ${activo ? 'bg-gr-primary' : 'bg-gr-border'}`}>
          <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${activo ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
        <span className="text-[13.5px] font-semibold text-[var(--color-gr-text)]">
          Activo
          <span className="ml-1 text-[12px] font-normal text-[var(--color-gr-muted)]">(Opcional · por defecto activo)</span>
        </span>
      </div>

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
  const [activo, setActivo] = useState(true);

  async function handleSave() {
    if (!nombre) return;
    try {
      await create.mutateAsync({
        nombre,
        telefono: telefono || undefined,
        direccion: direccion || undefined,
        ciudad: ciudad || undefined,
        nit: nit || undefined,
        activo,
      });
      setOpen(false); setNombre(''); setTel(''); setDir(''); setCiudad(''); setNit(''); setActivo(true);
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
          <FormField label="Nombre" required hint="Obligatorio"><Input value={nombre} onChange={e => setNombre(e.target.value)} /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Teléfono" hint="Opcional"><PhoneInput value={telefono} onChange={setTel} /></FormField>
            <FormField label="Ciudad" hint="Opcional"><Input value={ciudad} onChange={e => setCiudad(e.target.value)} /></FormField>
          </div>
          <FormField label="Dirección" hint="Opcional"><Input value={direccion} onChange={e => setDir(e.target.value)} /></FormField>
          <FormField label="NIT" hint="Opcional"><Input value={nit} onChange={e => setNit(e.target.value)} /></FormField>
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActivo(v => !v)}>
            <div className={`relative shrink-0 w-10 h-6 rounded-full transition-colors duration-200 ${activo ? 'bg-gr-primary' : 'bg-gr-border'}`}>
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${activo ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-[13.5px] font-semibold text-gr-text">
              Activo
              <span className="ml-1 text-[12px] font-normal text-gr-muted">(Opcional · por defecto activo)</span>
            </span>
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
  const [color, setColor] = useState('');
  const [destinoHabitual, setDestino] = useState('');
  const [activo, setActivo] = useState(true);
  const [ci, setCi] = useState('');

  async function handleSave() {
    if (!nombre) return;
    try {
      await create.mutateAsync({
        nombre,
        ci: ci || undefined,
        empresa: empresa || undefined,
        telefono: telefono || undefined,
        placa: placa || undefined,
        marca: marca || undefined,
        color: color || undefined,
        destinoHabitual: destinoHabitual || undefined,
        activo,
      });
      setOpen(false); setNombre(''); setTel(''); setEmpresa(''); setPlaca(''); setMarca(''); setColor(''); setDestino(''); setActivo(true); setCi('');
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
          <FormField label="Nombre" required hint="Obligatorio"><Input value={nombre} onChange={e => setNombre(e.target.value)} /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="CI" hint="Opcional"><Input value={ci} onChange={e => setCi(e.target.value)} /></FormField>
            <FormField label="Teléfono" hint="Opcional"><PhoneInput value={telefono} onChange={setTel} /></FormField>
          </div>
          <FormField label="Empresa" hint="Opcional"><Input value={empresa} onChange={e => setEmpresa(e.target.value)} /></FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Placa" hint="Opcional"><Input value={placa} onChange={e => setPlaca(e.target.value)} /></FormField>
            <FormField label="Marca" hint="Opcional"><Input value={marca} onChange={e => setMarca(e.target.value)} /></FormField>
            <FormField label="Color" hint="Opcional"><Input value={color} onChange={e => setColor(e.target.value)} placeholder="Blanco" /></FormField>
          </div>
          <FormField label="Destino habitual" hint="Opcional"><Input value={destinoHabitual} onChange={e => setDestino(e.target.value)} placeholder="Ej. Santa Cruz - Cochabamba" /></FormField>
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActivo(v => !v)}>
            <div className={`relative shrink-0 w-10 h-6 rounded-full transition-colors duration-200 ${activo ? 'bg-gr-primary' : 'bg-gr-border'}`}>
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${activo ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-[13.5px] font-semibold text-gr-text">
              Activo
              <span className="ml-1 text-[12px] font-normal text-gr-muted">(Opcional · por defecto activo)</span>
            </span>
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
  const [activo, setActivo] = useState(true);

  async function handleSave() {
    if (!nombre) return;
    try {
      await create.mutateAsync({
        nombre,
        contacto: contacto || undefined,
        telefono: telefono || undefined,
        ciudad: ciudad || undefined,
        nit: nit || undefined,
        activo,
      });
      setOpen(false); setNombre(''); setTel(''); setCiudad(''); setContacto(''); setNit(''); setActivo(true);
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
          <FormField label="Nombre" required hint="Obligatorio"><Input value={nombre} onChange={e => setNombre(e.target.value)} /></FormField>
          <FormField label="Contacto" hint="Opcional"><Input value={contacto} onChange={e => setContacto(e.target.value)} /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Ciudad" hint="Opcional"><Input value={ciudad} onChange={e => setCiudad(e.target.value)} /></FormField>
            <FormField label="Teléfono" hint="Opcional"><PhoneInput value={telefono} onChange={setTel} /></FormField>
          </div>
          <FormField label="NIT" hint="Opcional"><Input value={nit} onChange={e => setNit(e.target.value)} /></FormField>
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActivo(v => !v)}>
            <div className={`relative shrink-0 w-10 h-6 rounded-full transition-colors duration-200 ${activo ? 'bg-gr-primary' : 'bg-gr-border'}`}>
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${activo ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-[13.5px] font-semibold text-gr-text">
              Activo
              <span className="ml-1 text-[12px] font-normal text-gr-muted">(Opcional · por defecto activo)</span>
            </span>
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
