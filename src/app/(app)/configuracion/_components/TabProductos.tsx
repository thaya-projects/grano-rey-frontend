'use client';
import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  useProductos, useProducto,
  useCreateProducto, useUpdateProducto,
  useUploadProductoImagenes, useSetPrincipalImagen, useDeleteProductoImagen,
} from '@/lib/api/productos';
import { useUnidades } from '@/lib/api/catalogos';
import { apiErrorMessage } from '@/lib/api';
import type { Producto, ProductoImagen } from '@/lib/types';
import { Btn, Modal, FormField, Input, Select, Spinner, useToast } from '@/components/ui';
import { Plus, Pencil, Star, Trash2, ImageIcon, Upload, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
    base = palabras[0].slice(0, 4);
  } else {
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

const MAX_SIZE_MB  = 5;
const MAX_IMAGENES = 10;

type FilePreview = { file: File; objectUrl: string };

/* ─── Lightbox ──────────────────────────────────────────────── */
function Lightbox({ images, startIndex, onClose }: {
  images: ProductoImagen[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const img = images[idx];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowRight')  setIdx(i => Math.min(i + 1, images.length - 1));
      if (e.key === 'ArrowLeft')   setIdx(i => Math.max(i - 1, 0));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-300 flex items-center justify-center bg-black/88"
      onClick={onClose}>
      <div className="relative flex items-center justify-center" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-center rounded-xl overflow-hidden shadow-2xl bg-black/30"
          style={{ width: 'min(80vw, 720px)', height: 'min(78vh, 560px)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt=""
            className="w-full h-full object-contain"
          />
        </div>

        {img.esPrincipal && (
          <span className="absolute top-3 left-3 bg-gr-gold text-[#1a0e00] rounded-full px-2 py-0.5 text-[11px] font-700 flex items-center gap-1">
            <Star size={9} fill="currentColor" /> Principal
          </span>
        )}

        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors">
          <X size={16} />
        </button>

        {idx > 0 && (
          <button
            onClick={() => setIdx(i => i - 1)}
            className="absolute -left-13 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/15 hover:bg-white/35 rounded-full flex items-center justify-center text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
        )}
        {idx < images.length - 1 && (
          <button
            onClick={() => setIdx(i => i + 1)}
            className="absolute -right-13 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/15 hover:bg-white/35 rounded-full flex items-center justify-center text-white transition-colors">
            <ChevronRight size={20} />
          </button>
        )}

        {images.length > 1 && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/35 hover:bg-white/60'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Galería + subida de imágenes ─────────────────────────── */
function ImagenesProducto({ productoId }: { productoId: string }) {
  const productoQ    = useProducto(productoId);
  const uploadImg    = useUploadProductoImagenes();
  const setPrincipal = useSetPrincipalImagen();
  const deleteImg    = useDeleteProductoImagen();
  const inputRef     = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews]     = useState<FilePreview[]>([]);
  const [errors, setErrors]         = useState<string[]>([]);

  const imagenes    = productoQ.data?.imagenes ?? [];
  const slotsLibres = MAX_IMAGENES - imagenes.length;
  const [lightbox, setLightbox] = useState<number | null>(null);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const files = Array.from(incoming);
    const errs: string[] = [];
    const valid: FilePreview[] = [];

    files.forEach(f => {
      if (!f.type.startsWith('image/'))                   { errs.push(`${f.name}: no es una imagen`); return; }
      if (f.size > MAX_SIZE_MB * 1024 * 1024)             { errs.push(`${f.name}: supera ${MAX_SIZE_MB} MB`); return; }
      if (previews.length + valid.length >= slotsLibres)  { errs.push(`Máximo ${MAX_IMAGENES} imágenes por producto`); return; }
      valid.push({ file: f, objectUrl: URL.createObjectURL(f) });
    });

    setErrors(errs);
    if (valid.length) setPreviews(prev => [...prev, ...valid]);
  }, [previews.length, slotsLibres]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function removePreview(idx: number) {
    setPreviews(prev => {
      URL.revokeObjectURL(prev[idx].objectUrl);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function handleUpload() {
    if (!previews.length) return;
    await uploadImg.mutateAsync({ productoId, files: previews.map(p => p.file) });
    previews.forEach(p => URL.revokeObjectURL(p.objectUrl));
    setPreviews([]);
    setErrors([]);
  }

  return (
    <div className="space-y-3 pt-1">
      <p className="text-[12px] font-700 text-gr-muted uppercase tracking-wide">
        Imágenes del producto
        <span className="ml-2 font-500 normal-case">{imagenes.length}/{MAX_IMAGENES}</span>
      </p>

      {/* Imágenes ya guardadas */}
      {productoQ.isLoading ? (
        <div className="flex justify-center py-4"><Spinner size={18} color="var(--color-gr-primary)" /></div>
      ) : imagenes.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {imagenes.map((img, imgIdx) => (
            <div key={img.id} className="relative group w-20 h-20 rounded-md overflow-hidden border border-gr-border shrink-0 cursor-zoom-in"
              onClick={() => setLightbox(imgIdx)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              {img.esPrincipal && (
                <span className="absolute top-1 left-1 bg-gr-gold text-[#1a0e00] rounded-full p-0.5">
                  <Star size={10} fill="currentColor" />
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                {!img.esPrincipal && (
                  <button onClick={e => { e.stopPropagation(); setPrincipal.mutate({ productoId, imagenId: img.id }); }}
                    className="w-7 h-7 bg-white/20 hover:bg-gr-gold rounded-full flex items-center justify-center text-white transition-colors"
                    title="Marcar como principal">
                    <Star size={12} />
                  </button>
                )}
                <button onClick={e => { e.stopPropagation(); deleteImg.mutate({ productoId, imagenId: img.id }); }}
                  className="w-7 h-7 bg-white/20 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors"
                  title="Eliminar">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Previews pendientes de subir */}
      {previews.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11.5px] text-gr-muted font-600">
            {previews.length} {previews.length === 1 ? 'imagen lista' : 'imágenes listas'} para subir
          </p>
          <div className="flex flex-wrap gap-2">
            {previews.map((p, i) => (
              <div key={i} className="relative group w-16 h-16 rounded-[8px] overflow-hidden border border-gr-border shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.objectUrl} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removePreview(i)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Btn size="sm" onClick={handleUpload} loading={uploadImg.isPending}>
              <Upload size={13} /> Subir {previews.length === 1 ? 'imagen' : `${previews.length} imágenes`}
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => { previews.forEach(p => URL.revokeObjectURL(p.objectUrl)); setPreviews([]); setErrors([]); }}>
              Cancelar
            </Btn>
          </div>
        </div>
      )}

      {/* Zona drag-and-drop (solo si hay slots disponibles) */}
      {slotsLibres > 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-1.5 py-5 rounded-md border-2 border-dashed cursor-pointer transition-colors"
          style={{
            borderColor: isDragging ? 'var(--color-gr-primary)' : 'var(--color-gr-border)',
            background:  isDragging ? 'var(--color-gr-primary-lite)' : undefined,
          }}>
          <Upload size={20} color={isDragging ? 'var(--color-gr-primary)' : 'var(--color-gr-muted)'} />
          <span className="text-[13px] font-600 text-gr-muted">
            {isDragging ? 'Soltá para agregar' : 'Arrastrá imágenes o hacé clic'}
          </span>
          <span className="text-[11.5px] text-gr-muted">
            JPG · PNG · WEBP · máx {MAX_SIZE_MB} MB · hasta {slotsLibres} {slotsLibres === 1 ? 'imagen más' : 'imágenes más'}
          </span>
        </div>
      )}

      {errors.map((e, i) => (
        <p key={i} className="text-[12px] text-gr-danger">{e}</p>
      ))}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
        multiple className="hidden" onChange={handleFileChange} />

      {lightbox !== null && imagenes.length > 0 && (
        <Lightbox images={imagenes} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

/* ─── Modal independiente para gestionar imágenes ──────────── */
function ImagenesModal({ producto, onClose }: { producto: Producto; onClose: () => void }) {
  return (
    <Modal open title={`Imágenes — ${producto.nombre}`} onClose={onClose}>
      <ImagenesProducto productoId={producto.id} />
    </Modal>
  );
}

/* ─── Strip de miniaturas (solo lectura, dentro del edit modal) */
function ImagenesStrip({ producto }: { producto: Producto }) {
  const imgs = producto.imagenes ?? [];
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <>
      <hr className="border-gr-border" />
      <div className="space-y-2">
        <p className="text-[12px] font-700 text-gr-muted uppercase tracking-wide flex items-center gap-1.5">
          <ImageIcon size={12} />
          Imágenes
          <span className="font-500 normal-case">{imgs.length}/{MAX_IMAGENES}</span>
        </p>
        {imgs.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {imgs.map((img, i) => (
              <div key={img.id}
                className="relative w-14 h-14 rounded-[8px] overflow-hidden border border-gr-border shrink-0 cursor-zoom-in hover:border-gr-primary transition-colors"
                onClick={() => setLightbox(i)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                {img.esPrincipal && (
                  <span className="absolute top-0.5 left-0.5 bg-gr-gold text-[#1a0e00] rounded-full p-0.5">
                    <Star size={8} fill="currentColor" />
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12.5px] text-gr-muted">
            Sin imágenes · usá el botón <ImageIcon size={11} className="inline" /> en la tabla para agregar
          </p>
        )}
      </div>

      {lightbox !== null && imgs.length > 0 && (
        <Lightbox images={imgs} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}
    </>
  );
}

/* ─── Modal crear / editar producto ────────────────────────── */
function ProductoModal({ mode, producto, unidades, codigosExistentes, onClose, onSaved, onError }: {
  mode: 'create' | 'edit';
  producto?: Producto;
  unidades: { id: string; codigo: string; nombre: string }[];
  codigosExistentes: Set<string>;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const create = useCreateProducto();
  const update = useUpdateProducto();

  const [nombre, setNombre]        = useState(producto?.nombre ?? '');
  const [codigo, setCodigo]        = useState(producto?.codigo ?? '');
  const [codigoEditado, setCodEd]  = useState(false);
  const [unidadId, setUnidadId]    = useState(producto?.unidadProduccion?.id ?? '');
  const [descripcion, setDesc]     = useState(producto?.descripcion ?? '');
  const [stockMinimo, setStockMin] = useState(String(producto?.stockMinimo ?? '0'));
  const [vidaUtil, setVidaUtil]    = useState(String(producto?.vidaUtilMeses ?? '12'));
  const [activo, setActivo]        = useState(producto?.activo ?? true);

  function handleNombreChange(val: string) {
    setNombre(val);
    if (mode === 'create' && !codigoEditado) {
      setCodigo(sugerirCodigo(val, codigosExistentes));
    }
  }

  const codigoConflicto = mode === 'create' && !!codigo && codigosExistentes.has(codigo);
  const stockMin = parseFloat(stockMinimo) || 0;
  const vidaNum  = parseInt(vidaUtil) || 0;
  const valid    = !!nombre && vidaNum >= 1 && !!unidadId
    && (mode === 'create' ? !!codigo && !codigoConflicto : true);

  async function handleSave() {
    if (!valid) return;
    try {
      if (mode === 'create') {
        await create.mutateAsync({
          codigo,
          nombre,
          descripcion: descripcion || undefined,
          stockMinimo: stockMin || undefined,
          unidadProduccionId: unidadId,
          vidaUtilMeses: vidaNum,
        });
      } else if (producto) {
        await update.mutateAsync({
          id: producto.id,
          dto: {
            nombre,
            descripcion: descripcion || undefined,
            stockMinimo: stockMin || undefined,
            vidaUtilMeses: vidaNum,
            activo,
            unidadProduccionId: unidadId || undefined,
          },
        });
      }
      onSaved();
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo guardar el producto'));
    }
  }

  return (
    <Modal open title={mode === 'create' ? 'Nuevo producto' : `Editar — ${producto?.nombre}`} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!valid} loading={create.isPending || update.isPending}>
          {mode === 'create' ? 'Crear' : 'Guardar'}
        </Btn>
      </>}>

      <FormField label="Nombre" required hint="Obligatorio">
        <Input autoFocus value={nombre} onChange={e => handleNombreChange(e.target.value)}
          placeholder="Harina de Maíz Amarillo" />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Código" required={mode === 'create'}
          hint={mode === 'edit' ? 'No editable' : codigoConflicto ? '⚠ Ya existe — cambialo' : codigoEditado ? 'Editado' : 'Sugerido · editable'}>
          <Input value={codigo}
            onChange={e => { setCodigo(e.target.value.toUpperCase()); setCodEd(true); }}
            disabled={mode === 'edit'}
            placeholder="HAMA-AM"
            className={codigoConflicto ? 'border-red-400 focus:ring-red-300' : ''} />
        </FormField>
        <FormField label="Unidad de producción" required hint="Obligatorio">
          <Select value={unidadId} onChange={e => setUnidadId(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {unidades.map(u => <option key={u.id} value={u.id}>{u.codigo} · {u.nombre}</option>)}
          </Select>
        </FormField>
      </div>

      <FormField label="Descripción" hint="Opcional">
        <Input value={descripcion ?? ''} onChange={e => setDesc(e.target.value)}
          placeholder="Descripción del producto" />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Stock mínimo" hint="Opcional">
          <Input type="number" min="0" step="1" value={stockMinimo}
            onChange={e => setStockMin(e.target.value)} />
        </FormField>
        <FormField label="Vida útil (meses)" hint="Obligatorio">
          <Input type="number" min="1" step="1" value={vidaUtil}
            onChange={e => setVidaUtil(e.target.value)} />
        </FormField>
      </div>

      {mode === 'edit' && (
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActivo(v => !v)}>
          <div className={`relative shrink-0 w-10 h-6 rounded-full transition-colors duration-200 ${activo ? 'bg-gr-primary' : 'bg-gr-border'}`}>
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${activo ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          <span className="text-[13.5px] font-semibold text-gr-text">
            Activo
          </span>
        </div>
      )}

      {mode === 'edit' && producto && <ImagenesStrip producto={producto} />}
    </Modal>
  );
}

/* ─── Tab principal ─────────────────────────────────────────── */
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

      <div className="card-no-pad">
        <div className="overflow-x-auto">
        <table className="w-full text-[13px]" style={{ minWidth: 760 }}>
          <thead>
            <tr style={{ background: 'var(--color-gr-primary)' }}>
              {['Código', 'Nombre', 'Unidad', 'Stock', 'Mínimo', 'Vida útil', ''].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] font-700 text-white uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {productos.map((p, i) => (
              <tr key={p.id} style={{ background: i % 2 ? 'var(--color-gr-border-lite)' : '#fff' }}
                className="border-b border-gr-border-lite">
                <td className="px-4 py-3 font-mono font-700 text-[12.5px] text-gr-primary">{p.codigo}</td>
                <td className="px-4 py-3 font-700">{p.nombre}</td>
                <td className="px-4 py-3 text-[12px] text-gr-muted">{p.unidadProduccion?.codigo ?? '—'}</td>
                <td className="px-4 py-3 font-700">{Number(p.stockActual)}</td>
                <td className="px-4 py-3">{Number(p.stockMinimo)}</td>
                <td className="px-4 py-3">{p.vidaUtilMeses}m</td>
                <td className="px-4 py-3 text-right">
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
                </td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gr-muted">Sin productos cargados</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

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
