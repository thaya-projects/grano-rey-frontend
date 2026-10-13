'use client';
import { useState } from 'react';
import { useVentas, useCambiarEstadoVenta } from '@/lib/api/ventas';
import { type NotaVenta, EstadoVenta } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { Spinner, useToast } from '@/components/ui';
import { Truck, CheckCircle2, Clock, Zap } from 'lucide-react';
import { RemisionCard } from './_components/RemisionCard';
import { RemisionModal } from './_components/RemisionModal';
import { DespacharModal } from './_components/DespacharModal';
import { ReporteEstadoModal } from './_components/ReporteEstadoModal';

const FILTROS_FECHA = ['Hoy', 'Esta semana', 'Este mes', 'Personalizado', 'Todos'] as const;

export default function DespachosPage() {
  const toast              = useToast(s => s.show);
  const ventasQ            = useVentas();
  const cambiarEstadoMut   = useCambiarEstadoVenta();
  const ventas             = ventasQ.data ?? [];
  const [remisionModal, setRemisionModal] = useState<NotaVenta | null>(null);
  const [despacharVenta, setDespacharVenta] = useState<NotaVenta | null>(null);
  const [reporteEstado, setReporteEstado] = useState<EstadoVenta | null>(null);
  const [filtroFecha, setFiltroFecha] = useState<typeof FILTROS_FECHA[number]>('Todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const ahora = new Date();
  const hoy = ahora.toISOString().slice(0, 10);
  const lunes = new Date(ahora); lunes.setDate(ahora.getDate() - ahora.getDay() + 1);
  const primerMes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

  function pasaFiltroFecha(v: NotaVenta) {
    if (filtroFecha === 'Todos') return true;
    if (filtroFecha === 'Hoy') return v.fecha === hoy;
    if (filtroFecha === 'Esta semana') return new Date(v.fecha) >= lunes;
    if (filtroFecha === 'Este mes') return v.fecha.startsWith(primerMes);
    if (filtroFecha === 'Personalizado') {
      if (fechaDesde && v.fecha < fechaDesde) return false;
      if (fechaHasta && v.fecha > fechaHasta) return false;
    }
    return true;
  }

  const ventasFiltradas = ventas.filter(pasaFiltroFecha);
  const pendientes  = ventasFiltradas.filter(v => v.estado === EstadoVenta.PENDIENTE);
  const despachadas = ventasFiltradas.filter(v => v.estado === EstadoVenta.DESPACHADA);
  const entregadas  = ventasFiltradas.filter(v => v.estado === EstadoVenta.ENTREGADA);

  async function marcarEstado(id: string, estado: EstadoVenta, msg: string) {
    try {
      await cambiarEstadoMut.mutateAsync({ id, estado });
      toast(msg, 'success');
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo cambiar el estado'), 'error');
    }
  }

  function marcarDespachado(id: string) {
    const venta = ventas.find(v => v.id === id);
    if (venta) setDespacharVenta(venta);
    setRemisionModal(null);
  }

  function marcarEntregado(id: string) {
    marcarEstado(id, EstadoVenta.ENTREGADA, 'Venta marcada como entregada');
  }

  if (ventasQ.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner size={28} color="var(--color-gr-primary)" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-[22px] font-900 text-gr-text">Despachos</h1>
        <p className="text-gr-muted text-[13.5px] mt-0.5">
          Remisiones generadas automáticamente — revisa y despacha
        </p>
      </div>

      <div className="rounded-[12px] px-5 py-3.5 flex items-center gap-3"
        style={{ background: 'var(--color-gr-success-bg)', border: '1px solid rgba(46,125,82,0.2)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--color-gr-success)' }}>
          <Zap size={14} className="text-white" />
        </div>
        <div>
          <p className="font-700 text-[13.5px]" style={{ color: 'var(--color-gr-success)' }}>
            Remisión generada automáticamente ✓
          </p>
          <p className="text-[12px] text-gr-sub">
            Cada venta genera su remisión con número de guía, fecha y datos del cliente — lista para imprimir.
          </p>
        </div>
      </div>

      {/* Filtros de fecha */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 bg-white border border-gr-border rounded-[10px] p-1">
          {FILTROS_FECHA.map(f => (
            <button key={f} onClick={() => setFiltroFecha(f)}
              className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-600 transition-all ${filtroFecha === f ? 'bg-gr-primary text-white' : 'text-gr-muted hover:text-gr-text'}`}>
              {f}
            </button>
          ))}
        </div>
        {filtroFecha === 'Personalizado' && (
          <div className="flex flex-wrap items-end gap-2 bg-gr-border-lite rounded-[10px] p-2">
            <input type="date" value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              className="border border-gr-border rounded-[8px] px-3 py-1.5 text-[13px] bg-white" />
            <span className="text-[12px] text-gr-muted">→</span>
            <input type="date" value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
              className="border border-gr-border rounded-[8px] px-3 py-1.5 text-[13px] bg-white" />
          </div>
        )}
      </div>

      {/* Stats (clickeables → abren reporte informativo del estado) */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Por despachar', value: pendientes.length,  color: 'var(--color-gr-warning)', estado: EstadoVenta.PENDIENTE,  Icon: Clock },
          { label: 'En tránsito',   value: despachadas.length, color: 'var(--color-gr-info)',    estado: EstadoVenta.DESPACHADA, Icon: Truck },
          { label: 'Entregadas',    value: entregadas.length,  color: 'var(--color-gr-success)', estado: EstadoVenta.ENTREGADA,  Icon: CheckCircle2 },
        ].map(s => (
          <button
            key={s.label}
            onClick={() => setReporteEstado(s.estado)}
            className="card border-t-4 text-center transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
            style={{ borderTopColor: s.color }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <s.Icon size={14} style={{ color: s.color }} />
              <p className="text-[11.5px] font-700 uppercase tracking-wider" style={{ color: s.color }}>
                {s.label}
              </p>
            </div>
            <p className="text-[32px] font-900 leading-tight" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] text-gr-muted font-500 mt-0.5">
              Toca para ver el reporte
            </p>
          </button>
        ))}
      </div>

      {/* Sección accionable: Por despachar (única que requiere acción operativa) */}
      {pendientes.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} style={{ color: 'var(--color-gr-warning)' }} />
            <h2 className="font-800 text-gr-text text-[15px]">Por despachar</h2>
            <span className="text-[12px] text-gr-muted">— requieren tu acción</span>
          </div>
          <div className="space-y-3">
            {pendientes.map(v => (
              <RemisionCard key={v.id} venta={v}
                onVerRemision={() => setRemisionModal(v)}
                onDespachar={() => marcarDespachado(v.id)} />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-[14px] px-6 py-8 text-center"
          style={{ background: 'var(--color-gr-success-bg)', border: '1px solid rgba(46,125,82,0.15)' }}>
          <CheckCircle2 size={32} style={{ color: 'var(--color-gr-success)' }} className="mx-auto mb-2" />
          <p className="font-800 text-gr-text text-[15px]">Todo al día — sin despachos pendientes</p>
          <p className="text-gr-muted text-[12.5px] mt-1">
            Los despachos en tránsito y entregas los podés consultar en las tarjetas de arriba.
          </p>
        </div>
      )}

      {remisionModal && (
        <RemisionModal
          venta={remisionModal}
          onClose={() => setRemisionModal(null)}
          onDespachar={(id) => {
            if (remisionModal.estado === EstadoVenta.PENDIENTE) marcarDespachado(id);
            else marcarEntregado(id);
          }}
        />
      )}

      {despacharVenta && (
        <DespacharModal
          venta={despacharVenta}
          onClose={() => setDespacharVenta(null)}
          onSaved={() => {
            setDespacharVenta(null);
            toast('Venta marcada como despachada', 'success');
          }}
          onError={(msg) => toast(msg, 'error')}
        />
      )}

      {reporteEstado !== null && (
        <ReporteEstadoModal
          estado={reporteEstado}
          ventas={
            reporteEstado === EstadoVenta.PENDIENTE  ? pendientes  :
            reporteEstado === EstadoVenta.DESPACHADA ? despachadas :
            entregadas
          }
          onClose={() => setReporteEstado(null)}
        />
      )}
    </div>
  );
}
