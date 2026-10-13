'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  useProducto,
  useUploadProductoImagenes, useSetPrincipalImagen, useDeleteProductoImagen,
} from '@/lib/api/productos';
import type { Producto, ProductoImagen } from '@/lib/types';
import { Btn, Modal, Spinner } from '@/components/ui';
import { Star, Trash2, ImageIcon, Upload, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
export function ImagenesModal({ producto, onClose }: { producto: Producto; onClose: () => void }) {
  return (
    <Modal open title={`Imágenes — ${producto.nombre}`} onClose={onClose}>
      <ImagenesProducto productoId={producto.id} />
    </Modal>
  );
}

/* ─── Strip de miniaturas (solo lectura, dentro del edit modal) */
export function ImagenesStrip({ producto }: { producto: Producto }) {
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
