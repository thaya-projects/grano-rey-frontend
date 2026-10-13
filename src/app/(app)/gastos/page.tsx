'use client';
import { useState, useMemo, useRef } from 'react';
import { useGastos, useDeleteGasto, useUploadComprobante, useDeleteComprobante } from '@/lib/api/gastos';
import { CategoriaGasto, type Gasto } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { formatBs } from '@/lib/utils';
import { Btn, Modal, Spinner, useToast } from '@/components/ui';
import { Plus, Trash2, Receipt } from 'lucide-react';
import { NuevoGastoModal } from './_components/NuevoGastoModal';
import { ComprobantePreviewModal } from './_components/ComprobantePreviewModal';
import { GastoRow } from './_components/GastoRow';
import { CATEGORIA_LABELS, FILTROS } from './_components/constants';

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
          filtrados.map((g, i) => (
            <GastoRow key={g.id} gasto={g} isLast={i === filtrados.length - 1}
              uploading={uploadingId === g.id}
              onVerImagen={() => setViendoImagen(g)}
              onSubirImagen={() => { setUploadingId(g.id); fileInputRef.current?.click(); }}
              onEliminar={() => setConfirmDel(g)}
            />
          ))
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
        <ComprobantePreviewModal
          gasto={viendoImagen}
          onClose={() => setViendoImagen(null)}
          onEliminar={() => handleDeleteComprobante(viendoImagen)}
          eliminando={deleteComprobante.isPending}
        />
      )}
    </div>
  );
}
