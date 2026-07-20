'use client';
import { useState, useMemo, useRef } from 'react';
import { useGastos, useCreateGasto, useDeleteGasto, useUploadComprobante, useDeleteComprobante } from '@/lib/api/gastos';
import { CategoriaGasto, type Gasto } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { formatBs } from '@/lib/utils';
import {
  Btn, Modal, FormField, Input, Select, Badge, Spinner, useToast,
} from '@/components/ui';
import { Plus, Trash2, Receipt, ImagePlus, Eye, X as XIcon } from 'lucide-react';

const CATEGORIA_LABELS: Record<CategoriaGasto, string> = {
  transporte:        'Transporte',
  servicios_basicos: 'Servicios Básicos',
  mano_de_obra:      'Mano de Obra',
  mantenimiento:     'Mantenimiento',
  materia_prima:     'Materia Prima',
  administrativo:    'Administrativo',
  impuestos:         'Impuestos',
  otros:             'Otros',
};

const CATEGORIA_COLORS: Record<CategoriaGasto, 'blue' | 'yellow' | 'green' | 'red' | 'gray'> = {
  transporte:        'blue',
  servicios_basicos: 'yellow',
  mano_de_obra:      'green',
  mantenimiento:     'yellow',
  materia_prima:     'green',
  administrativo:    'blue',
  impuestos:         'red',
  otros:             'gray',
};

// ─── Modal registrar gasto ─────────────────────────────────────
function NuevoGastoModal({ onClose, onSaved, onError }: {
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const create = useCreateGasto();
  const [fecha, setFecha]           = useState(new Date().toISOString().slice(0, 10));
  const [categoria, setCategoria]   = useState<CategoriaGasto>(CategoriaGasto.OTROS);
  const [descripcion, setDesc]      = useState('');
  const [montoBs, setMonto]         = useState('');
  const [comprobante, setComprobante] = useState('');

  const valid = !!descripcion.trim() && parseFloat(montoBs) > 0;

  async function handleSave() {
    if (!valid) return;
    try {
      await create.mutateAsync({
        fecha,
        categoria,
        descripcion: descripcion.trim(),
        montoBs: parseFloat(montoBs),
        comprobante: comprobante.trim() || undefined,
      });
      onSaved();
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo registrar el gasto'));
    }
  }

  return (
    <Modal open title="Registrar gasto" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!valid} loading={create.isPending}>
          <Receipt size={14} /> Registrar
        </Btn>
      </>}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Fecha" required>
          <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
        </FormField>
        <FormField label="Categoría" required>
          <Select value={categoria} onChange={e => setCategoria(e.target.value as CategoriaGasto)}>
            {Object.entries(CATEGORIA_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </FormField>
      </div>
      <FormField label="Descripción" required hint="Ej: Factura ELFEC julio 2026">
        <Input autoFocus value={descripcion} onChange={e => setDesc(e.target.value)}
          placeholder="Descripción del gasto" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Monto (Bs)" required>
          <Input type="number" min="0" step="0.01" placeholder="0.00"
            value={montoBs} onChange={e => setMonto(e.target.value)} />
        </FormField>
        <FormField label="Comprobante" hint="N° de factura o recibo (opcional)">
          <Input value={comprobante} onChange={e => setComprobante(e.target.value)}
            placeholder="FACT-00234" />
        </FormField>
      </div>
    </Modal>
  );
}

// ─── Página principal ──────────────────────────────────────────
const FILTROS = ['Este mes', 'Mes anterior', 'Todos'] as const;

export default function GastosPage() {
  const toast             = useToast(s => s.show);
  const gastosQ           = useGastos();
  const deleteGasto       = useDeleteGasto();
  const uploadComprobante = useUploadComprobante();
  const deleteComprobante = useDeleteComprobante();
  const gastos: Gasto[]   = gastosQ.data ?? [];

  const [showModal, setShowModal]         = useState(false);
  const [filtro, setFiltro]               = useState<typeof FILTROS[number]>('Este mes');
  const [filtroCategoria, setFiltroCateg] = useState<CategoriaGasto | ''>('');
  const [confirmDel, setConfirmDel]       = useState<Gasto | null>(null);
  const [viendoImagen, setViendoImagen]   = useState<Gasto | null>(null);
  const fileInputRef                      = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId]     = useState<string | null>(null);

  async function handleUpload(g: Gasto, file: File) {
    if (file.size > 10 * 1024 * 1024) {
      toast('El archivo supera los 10 MB', 'error');
      return;
    }
    setUploadingId(g.id);
    try {
      await uploadComprobante.mutateAsync({ id: g.id, file });
      toast('Comprobante subido', 'success');
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo subir el comprobante'), 'error');
    } finally {
      setUploadingId(null);
    }
  }

  async function handleDeleteComprobante(g: Gasto) {
    try {
      await deleteComprobante.mutateAsync(g.id);
      toast('Comprobante eliminado', 'warning');
      if (viendoImagen?.id === g.id) setViendoImagen(null);
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo eliminar el comprobante'), 'error');
    }
  }

  const ahora   = new Date();
  const mesMes  = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
  const mesAnterior = (() => {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  const filtrados = useMemo(() => {
    return gastos.filter(g => {
      const okFiltro = filtro === 'Este mes'      ? g.fecha.startsWith(mesMes)
                     : filtro === 'Mes anterior'  ? g.fecha.startsWith(mesAnterior)
                     : true;
      const okCateg  = !filtroCategoria || g.categoria === filtroCategoria;
      return okFiltro && okCateg;
    }).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [gastos, filtro, filtroCategoria, mesMes, mesAnterior]);

  const totalFiltrado = filtrados.reduce((s, g) => s + Number(g.montoBs), 0);

  // Totales por categoría (en el filtro activo)
  const porCategoria = useMemo(() => {
    const map: Partial<Record<CategoriaGasto, number>> = {};
    for (const g of filtrados) {
      map[g.categoria] = (map[g.categoria] ?? 0) + Number(g.montoBs);
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a) as [CategoriaGasto, number][];
  }, [filtrados]);

  async function handleDelete(g: Gasto) {
    try {
      await deleteGasto.mutateAsync(g.id);
      toast('Gasto eliminado', 'warning');
      setConfirmDel(null);
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo eliminar'), 'error');
      setConfirmDel(null);
    }
  }

  if (gastosQ.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner size={28} color="var(--color-gr-primary)" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-900 text-gr-text">Gastos</h1>
          <p className="text-gr-muted text-[13.5px] mt-0.5">
            Registro de gastos operativos y administrativos
          </p>
        </div>
        <Btn variant="gold" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Registrar gasto
        </Btn>
      </div>

      {/* Resumen por categoría */}
      {porCategoria.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {porCategoria.map(([cat, total]) => (
            <button key={cat} type="button"
              onClick={() => setFiltroCateg(filtroCategoria === cat ? '' : cat)}
              className={`flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12px] font-700 border transition-all ${
                filtroCategoria === cat
                  ? 'bg-gr-primary text-white border-gr-primary'
                  : 'bg-white text-gr-text border-gr-border hover:border-gr-primary'
              }`}>
              {CATEGORIA_LABELS[cat]}
              <span className={filtroCategoria === cat ? 'text-white/80' : 'text-gr-muted'}>
                {formatBs(total)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-[8px] overflow-hidden border border-gr-border">
          {FILTROS.map(f => (
            <button key={f} type="button" onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 text-[12px] font-700 transition-all ${
                filtro === f ? 'bg-gr-primary text-white' : 'bg-white text-gr-muted hover:text-gr-text'
              }`}>
              {f}
            </button>
          ))}
        </div>
        {filtroCategoria && (
          <button onClick={() => setFiltroCateg('')}
            className="text-[12px] font-600 text-gr-primary underline">
            Quitar filtro categoría
          </button>
        )}
        <span className="ml-auto text-[13px] font-700 text-gr-text">
          Total: {formatBs(totalFiltrado)}
        </span>
      </div>

      {/* Input oculto para subir imagen */}
      <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          const g    = gastos.find(x => x.id === uploadingId);
          if (file && g) handleUpload(g, file);
          e.target.value = '';
        }} />

      {/* Tabla */}
      <div className="card-no-pad">
        <div className="hidden md:grid gap-3 px-5 py-3 text-[11px] font-700 text-gr-muted uppercase tracking-wide border-b border-gr-border"
          style={{ gridTemplateColumns: '100px 130px 1fr 120px 36px 36px 36px', background: 'var(--color-gr-border-lite)' }}>
          <span>Fecha</span><span>Categoría</span><span>Descripción</span>
          <span className="text-right">Monto</span><span /><span /><span />
        </div>

        {filtrados.length === 0 ? (
          <div className="py-16 text-center text-gr-muted text-[14px]">
            <Receipt size={36} className="mx-auto mb-3 opacity-20" />
            <p>Sin gastos registrados para este período</p>
          </div>
        ) : (
          filtrados.map((g, i) => {
            const hasImg    = !!g.comprobanteImagenUrl;
            const uploading = uploadingId === g.id;
            return (
              <div key={g.id}
                className={`px-5 py-3.5 ${i < filtrados.length - 1 ? 'border-b border-gr-border-lite' : ''}`}>
                {/* Mobile */}
                <div className="flex items-start justify-between gap-2 md:hidden">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge color={CATEGORIA_COLORS[g.categoria]} className="text-[10px]">
                        {CATEGORIA_LABELS[g.categoria]}
                      </Badge>
                      <span className="text-[11px] text-gr-muted">{g.fecha}</span>
                    </div>
                    <p className="text-[13px] font-600 text-gr-text">{g.descripcion}</p>
                    {g.comprobante && (
                      <p className="text-[11px] text-gr-muted font-mono">{g.comprobante}</p>
                    )}
                    <p className="text-[15px] font-800 text-gr-primary mt-1">{formatBs(Number(g.montoBs))}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {hasImg ? (
                      <button type="button" onClick={() => setViendoImagen(g)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gr-primary hover:bg-gr-primary/10 transition-colors">
                        <Eye size={14} />
                      </button>
                    ) : (
                      <button type="button" disabled={uploading}
                        onClick={() => { setUploadingId(g.id); fileInputRef.current?.click(); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gr-muted hover:text-gr-primary hover:bg-gr-primary/10 transition-colors disabled:opacity-40">
                        {uploading ? <Spinner size={12} /> : <ImagePlus size={14} />}
                      </button>
                    )}
                    <button type="button" onClick={() => setConfirmDel(g)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gr-muted hover:text-gr-danger hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Desktop */}
                <div className="hidden md:grid gap-3 items-center"
                  style={{ gridTemplateColumns: '100px 130px 1fr 120px 36px 36px 36px' }}>
                  <span className="text-[12.5px] text-gr-muted font-mono">{g.fecha}</span>
                  <Badge color={CATEGORIA_COLORS[g.categoria]}>
                    {CATEGORIA_LABELS[g.categoria]}
                  </Badge>
                  <div>
                    <p className="font-600 text-[13px] text-gr-text">{g.descripcion}</p>
                    {g.comprobante && (
                      <p className="text-[11px] text-gr-muted font-mono">{g.comprobante}</p>
                    )}
                  </div>
                  <span className="text-right font-800 text-[14px] text-gr-primary">
                    {formatBs(Number(g.montoBs))}
                  </span>
                  {/* Ver imagen */}
                  <button type="button"
                    onClick={() => hasImg ? setViendoImagen(g) : undefined}
                    disabled={!hasImg}
                    title={hasImg ? 'Ver comprobante' : 'Sin imagen'}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                      hasImg ? 'text-gr-primary hover:bg-gr-primary/10' : 'text-gr-border cursor-default'
                    }`}>
                    <Eye size={14} />
                  </button>
                  {/* Subir imagen */}
                  <button type="button" disabled={uploading}
                    title="Subir comprobante"
                    onClick={() => { setUploadingId(g.id); fileInputRef.current?.click(); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gr-muted hover:text-gr-primary hover:bg-gr-primary/10 transition-colors disabled:opacity-40">
                    {uploading ? <Spinner size={12} /> : <ImagePlus size={14} />}
                  </button>
                  {/* Eliminar gasto */}
                  <button type="button" onClick={() => setConfirmDel(g)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gr-muted hover:text-gr-danger hover:bg-red-50 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}

        {filtrados.length > 0 && (
          <div className="px-5 py-3 flex justify-between items-center text-[12.5px] border-t border-gr-border"
            style={{ background: 'var(--color-gr-border-lite)' }}>
            <span className="text-gr-muted">{filtrados.length} registros</span>
            <span className="font-800 text-gr-text">{formatBs(totalFiltrado)}</span>
          </div>
        )}
      </div>

      {/* Modal registrar */}
      {showModal && (
        <NuevoGastoModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); toast('Gasto registrado', 'success'); }}
          onError={msg => toast(msg, 'error')}
        />
      )}

      {/* Confirm eliminar */}
      {confirmDel && (
        <Modal open title="Eliminar gasto" onClose={() => setConfirmDel(null)}
          footer={<>
            <Btn variant="ghost" onClick={() => setConfirmDel(null)}>Cancelar</Btn>
            <Btn variant="danger" onClick={() => handleDelete(confirmDel)} loading={deleteGasto.isPending}>
              <Trash2 size={13} /> Eliminar
            </Btn>
          </>}>
          <p className="text-[14px] text-gr-text">
            ¿Eliminar <strong>{confirmDel.descripcion}</strong>?
          </p>
          <p className="text-[13px] text-gr-muted mt-1">{formatBs(Number(confirmDel.montoBs))} · {confirmDel.fecha}</p>
        </Modal>
      )}

      {/* Preview comprobante */}
      {viendoImagen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setViendoImagen(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[3px]" />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gr-border shrink-0">
              <div>
                <p className="font-700 text-[14px] text-gr-text">{viendoImagen.descripcion}</p>
                <p className="text-[12px] text-gr-muted">{viendoImagen.fecha} · {formatBs(Number(viendoImagen.montoBs))}</p>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant="danger" size="sm"
                  onClick={() => handleDeleteComprobante(viendoImagen)}
                  loading={deleteComprobante.isPending}>
                  <Trash2 size={12} /> Eliminar imagen
                </Btn>
                <button type="button" onClick={() => setViendoImagen(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gr-muted hover:text-gr-text hover:bg-gr-border-lite transition-colors">
                  <XIcon size={16} />
                </button>
              </div>
            </div>
            {/* Imagen */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-50">
              {viendoImagen.comprobanteImagenUrl ? (
                viendoImagen.comprobanteImagenUrl.toLowerCase().includes('.pdf') ? (
                  <iframe src={viendoImagen.comprobanteImagenUrl} className="w-full h-[60vh] rounded-lg border border-gr-border" title="Comprobante PDF" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={viendoImagen.comprobanteImagenUrl} alt="Comprobante"
                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md" />
                )
              ) : (
                <p className="text-gr-muted text-[13px]">Imagen no disponible (el enlace puede haber expirado)</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
