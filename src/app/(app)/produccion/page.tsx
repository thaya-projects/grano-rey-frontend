'use client';
import { useState, useMemo } from 'react';
import { useProductos } from '@/lib/api/productos';
import { useLotes } from '@/lib/api/produccion';
import { type LoteProduccion } from '@/lib/types';
import { formatNum, formatBs } from '@/lib/utils';
import { Btn, Spinner, SearchBox, useToast } from '@/components/ui';
import { ProduccionModal } from './_components/ProduccionModal';
import { BajaModal } from './_components/BajaModal';
import { ResiduoAMPModal } from './_components/ResiduoAMPModal';
import { LoteRow } from './_components/LoteRow';
import {
  Plus, AlertTriangle, ArrowDownCircle,
} from 'lucide-react';

const FILTROS = ['Hoy', 'Esta semana', 'Este mes', 'Personalizado', 'Todos'] as const;

export default function ProduccionPage() {
  const toast = useToast(s => s.show);
  const productosQ = useProductos();
  const lotesQ = useLotes();
  const productos = productosQ.data ?? [];
  const lotes = lotesQ.data ?? [];

  const [showModal, setShowModal] = useState(false);
  const [productoIdInicial, setProductoIdInicial] = useState<string>('');
  const [showBajaModal, setShowBajaModal] = useState(false);
  const [residuoLote, setResiduoLote] = useState<LoteProduccion | null>(null);
  const [filtro, setFiltro] = useState<typeof FILTROS[number]>('Este mes');
  const [search, setSearch] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  function abrirRegistrar(productoId?: string) {
    setProductoIdInicial(productoId ?? '');
    setShowModal(true);
  }

  const ahora = new Date();
  const hoy = ahora.toISOString().slice(0, 10);
  const lunes = new Date(ahora); lunes.setDate(ahora.getDate() - ahora.getDay() + 1);
  const primerMes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

  const filtrados = useMemo(() => {
    return lotes.filter(l => {
      let okFiltro = true;
      if (filtro === 'Hoy') okFiltro = l.fecha === hoy;
      else if (filtro === 'Esta semana') okFiltro = new Date(l.fecha) >= lunes;
      else if (filtro === 'Este mes') okFiltro = l.fecha.startsWith(primerMes);
      else if (filtro === 'Personalizado') {
        if (fechaDesde && l.fecha < fechaDesde) okFiltro = false;
        if (fechaHasta && l.fecha > fechaHasta) okFiltro = false;
      }

      const q = search.toLowerCase();
      const okSearch = !search
        || (l.codigoLote ?? '').toLowerCase().includes(q)
        || (l.numeroLotePropio ?? '').toLowerCase().includes(q)
        || (l.producto?.nombre ?? '').toLowerCase().includes(q)
        || (l.producto?.codigo ?? '').toLowerCase().includes(q);
      return okFiltro && okSearch;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotes, filtro, search, fechaDesde, fechaHasta]);

  const totalProducido = filtrados.reduce((s, l) => s + Number(l.cantidadProducida), 0);
  const totalMerma = filtrados.reduce((s, l) => s + Number(l.mermaUnidades || 0), 0);
  const totalMermaMp = filtrados.reduce((s, l) => s + Number(l.mermaMpKg || 0), 0);
  const totalCosto = filtrados.reduce((s, l) => s + Number(l.costoMpBs), 0);

  const en30 = new Date();
  en30.setDate(en30.getDate() + 30);
  const en30Str = en30.toISOString().slice(0, 10);
  const proximosVencimientos = lotes
    .filter(l => l.fechaVencimiento && l.fechaVencimiento <= en30Str && Number(l.stockRestante) > 0)
    .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento));

  if (productosQ.isLoading || lotesQ.isLoading) {
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
          <h1 className="text-[22px] font-900 text-gr-text">Producción</h1>
          <p className="text-gr-muted text-[13.5px] mt-0.5">
            Registro de lotes producidos con código SENASAG, merma y trazabilidad.
          </p>
        </div>
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={() => setShowBajaModal(true)}>
            <ArrowDownCircle size={14} /> Registrar baja
          </Btn>
          <Btn variant="gold" onClick={() => abrirRegistrar()}>
            <Plus size={14} /> Registrar producción
          </Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card">
          <p className="text-[11px] font-700 text-gr-muted uppercase mb-1">Lotes en el período</p>
          <p className="text-[28px] font-900 text-gr-text">{filtrados.length}</p>
        </div>
        <div className="card">
          <p className="text-[11px] font-700 text-gr-muted uppercase mb-1">Total producido</p>
          <p className="text-[28px] font-900 text-gr-primary">{formatNum(totalProducido, 0)}</p>
        </div>
        <div className="card">
          <p className="text-[11px] font-700 text-gr-muted uppercase mb-1">Merma del período</p>
          <p className="text-[28px] font-900 text-gr-warning">
            {formatNum(totalMerma, 0)}
            <span className="text-[12px] font-500 text-gr-muted ml-2">
              · {formatNum(totalMermaMp, 1)} kg MP
            </span>
          </p>
        </div>
        <div className="card">
          <p className="text-[11px] font-700 text-gr-muted uppercase mb-1">Costo MP del período</p>
          <p className="text-[28px] font-900 text-gr-text">{formatBs(totalCosto)}</p>
        </div>
      </div>

      {proximosVencimientos.length > 0 && (
        <div className="rounded-[12px] p-4 flex gap-3 items-start"
          style={{ background: 'var(--color-gr-warning-bg)', border: '1px solid rgba(160,92,10,0.2)' }}>
          <AlertTriangle size={18} className="text-gr-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-700 text-[13.5px] text-gr-warning">
              {proximosVencimientos.length} {proximosVencimientos.length === 1 ? 'lote vence' : 'lotes vencen'} en los próximos 30 días
            </p>
            <ul className="mt-2 space-y-1 text-[12.5px] text-gr-text">
              {proximosVencimientos.slice(0, 4).map(l => (
                <li key={l.id}>
                  <span className="font-mono font-700">{l.codigoLote}</span> ·
                  {' '}{l.producto?.nombre} · vence <strong>{l.fechaVencimiento}</strong>
                </li>
              ))}
              {proximosVencimientos.length > 4 && (
                <li className="text-gr-muted">
                  +{proximosVencimientos.length - 4} más...
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 bg-white border border-gr-border rounded-md p-1">
          {FILTROS.map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-600 transition-all ${filtro === f ? 'bg-gr-primary text-white' : 'text-gr-muted hover:text-gr-text'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px]">
          <SearchBox value={search} onChange={setSearch}
            placeholder="Buscar por código de lote, número propio o producto..." />
        </div>
      </div>

      {filtro === 'Personalizado' && (
        <div className="flex flex-wrap items-end gap-3 bg-gr-border-lite rounded-md p-3">
          <div>
            <label className="block text-[11px] font-700 text-gr-muted uppercase mb-1">Desde</label>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
              className="border border-gr-border rounded-[8px] px-3 py-1.5 text-[13px] bg-white" />
          </div>
          <div>
            <label className="block text-[11px] font-700 text-gr-muted uppercase mb-1">Hasta</label>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
              className="border border-gr-border rounded-[8px] px-3 py-1.5 text-[13px] bg-white" />
          </div>
          {(fechaDesde || fechaHasta) && (
            <button onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
              className="text-[12px] font-600 text-gr-primary underline">
              Limpiar
            </button>
          )}
        </div>
      )}

      <div className="card-no-pad">
        <div className="hidden md:grid gap-3 px-5 py-3 text-[11px] font-700 text-gr-muted uppercase tracking-wide border-b border-gr-border"
          style={{ gridTemplateColumns: '160px 90px 1fr 90px 90px 100px 90px 90px', background: 'var(--color-gr-border-lite)' }}>
          <span>Código Lote</span>
          <span>N° Propio</span>
          <span>Producto</span>
          <span className="text-right">Producido</span>
          <span className="text-right">Restante</span>
          <span className="text-right">Merma</span>
          <span>Fecha</span>
          <span>Vence</span>
        </div>

        {filtrados.length === 0 ? (
          <div className="py-16 text-center text-gr-muted text-[14px]">
            Sin lotes para los filtros seleccionados
          </div>
        ) : (
          filtrados.map((l, i) => (
            <LoteRow key={l.id} lote={l} isLast={i === filtrados.length - 1} onRegistrarResiduo={setResiduoLote} />
          ))
        )}
      </div>

      {showModal && (
        <ProduccionModal
          productos={productos}
          productoIdInicial={productoIdInicial}
          onClose={() => setShowModal(false)}
          onSaved={(codigoLote) => {
            setShowModal(false);
            toast(`Lote ${codigoLote} registrado correctamente`, 'success');
          }}
          onError={(msg) => toast(msg, 'error')}
        />
      )}
      {showBajaModal && (
        <BajaModal
          productos={productos}
          onClose={() => setShowBajaModal(false)}
          onSaved={() => {
            setShowBajaModal(false);
            toast('Baja registrada', 'warning');
          }}
          onError={(msg) => toast(msg, 'error')}
        />
      )}
      {residuoLote && (
        <ResiduoAMPModal
          lote={residuoLote}
          onClose={() => setResiduoLote(null)}
          onSaved={() => {
            setResiduoLote(null);
            toast('Residuo registrado como materia prima', 'success');
          }}
          onError={(msg) => toast(msg, 'error')}
        />
      )}
    </div>
  );
}
