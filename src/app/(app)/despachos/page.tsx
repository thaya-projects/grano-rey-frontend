'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVentas, useCambiarEstadoVenta } from '@/lib/api/ventas';
import { type NotaVenta, EstadoVenta, TipoFlete, TipoPagoCarga } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { formatBs } from '@/lib/utils';
import { Btn, Modal, EstadoBadge, Badge, Spinner, useToast } from '@/components/ui';
import { Truck, CheckCircle2, Clock, Printer, ArrowRight, Package, Zap, User, Calendar, HardHat, Receipt } from 'lucide-react';
import Image from 'next/image';
import { CargasSection, type CargaDraft } from '@/components/CargasSection';

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
        <h1 className="text-[22px] font-900 text-[var(--color-gr-text)]">Despachos</h1>
        <p className="text-[var(--color-gr-muted)] text-[13.5px] mt-0.5">
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
          <p className="text-[12px] text-[var(--color-gr-sub)]">
            Cada venta genera su remisión con número de guía, fecha y datos del cliente — lista para imprimir.
          </p>
        </div>
      </div>

      {/* Filtros de fecha */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 bg-white border border-[var(--color-gr-border)] rounded-[10px] p-1">
          {FILTROS_FECHA.map(f => (
            <button key={f} onClick={() => setFiltroFecha(f)}
              className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-600 transition-all ${filtroFecha === f ? 'bg-[var(--color-gr-primary)] text-white' : 'text-[var(--color-gr-muted)] hover:text-[var(--color-gr-text)]'}`}>
              {f}
            </button>
          ))}
        </div>
        {filtroFecha === 'Personalizado' && (
          <div className="flex flex-wrap items-end gap-2 bg-[var(--color-gr-border-lite)] rounded-[10px] p-2">
            <input type="date" value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              className="border border-[var(--color-gr-border)] rounded-[8px] px-3 py-1.5 text-[13px] bg-white" />
            <span className="text-[12px] text-[var(--color-gr-muted)]">→</span>
            <input type="date" value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
              className="border border-[var(--color-gr-border)] rounded-[8px] px-3 py-1.5 text-[13px] bg-white" />
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
            <p className="text-[11px] text-[var(--color-gr-muted)] font-500 mt-0.5">
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
            <h2 className="font-800 text-[var(--color-gr-text)] text-[15px]">Por despachar</h2>
            <span className="text-[12px] text-[var(--color-gr-muted)]">— requieren tu acción</span>
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
          <p className="font-800 text-[var(--color-gr-text)] text-[15px]">Todo al día — sin despachos pendientes</p>
          <p className="text-[var(--color-gr-muted)] text-[12.5px] mt-1">
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

// ─── Reporte informativo por estado (solo lectura) ─────────────────────────
function ReporteEstadoModal({
  estado, ventas, onClose,
}: {
  estado: EstadoVenta;
  ventas: NotaVenta[];
  onClose: () => void;
}) {
  const meta: Record<string, { titulo: string; Icon: React.ElementType; color: string; bg: string; subtitulo: string }> = {
    [EstadoVenta.PENDIENTE]: {
      titulo: 'Por despachar',
      Icon: Clock,
      color: 'var(--color-gr-warning)',
      bg: '#fff7e6',
      subtitulo: 'Ventas confirmadas esperando salir del depósito',
    },
    [EstadoVenta.DESPACHADA]: {
      titulo: 'En tránsito',
      Icon: Truck,
      color: 'var(--color-gr-info)',
      bg: 'var(--color-gr-info-bg)',
      subtitulo: 'Despachadas y en camino al cliente',
    },
    [EstadoVenta.ENTREGADA]: {
      titulo: 'Entregadas',
      Icon: CheckCircle2,
      color: 'var(--color-gr-success)',
      bg: 'var(--color-gr-success-bg)',
      subtitulo: 'Historial de entregas confirmadas',
    },
    [EstadoVenta.CANCELADA]: {
      titulo: 'Canceladas',
      Icon: CheckCircle2,
      color: 'var(--color-gr-muted)',
      bg: 'var(--color-gr-border-lite)',
      subtitulo: '—',
    },
  };
  const m = meta[estado];
  const ordenadas = [...ventas].sort((a, b) => (b.fecha > a.fecha ? 1 : -1));
  const totalBs = ordenadas.reduce((s, v) => s + Number(v.totalBs), 0);
  const totalBolsas = ordenadas.reduce((s, v) =>
    s + v.detalles.reduce((ss, d) => ss + Number(d.cantidad ?? 0), 0), 0);

  return (
    <Modal xl open title={`Reporte — ${m.titulo}`} onClose={onClose}>
      {/* Header resumen */}
      <div className="rounded-[12px] px-5 py-4 flex items-center gap-4" style={{ background: m.bg }}>
        <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ background: m.color }}>
          <m.Icon size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-900 text-[16px]" style={{ color: m.color }}>{m.titulo}</p>
          <p className="text-[12.5px] text-[var(--color-gr-muted)]">{m.subtitulo}</p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-[10.5px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide">Ventas</p>
            <p className="font-900 text-[20px] text-[var(--color-gr-text)]">{ordenadas.length}</p>
          </div>
          <div>
            <p className="text-[10.5px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide">Bolsas</p>
            <p className="font-900 text-[20px] text-[var(--color-gr-text)]">{totalBolsas}</p>
          </div>
          <div>
            <p className="text-[10.5px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide">Total</p>
            <p className="font-900 text-[20px]" style={{ color: m.color }}>{formatBs(totalBs)}</p>
          </div>
        </div>
      </div>

      {/* Lista de despachos */}
      {ordenadas.length === 0 ? (
        <div className="py-10 text-center text-[var(--color-gr-muted)] text-[13px]">
          Sin ventas en este estado.
        </div>
      ) : (
        <div className="space-y-2.5">
          {ordenadas.map(v => <ReporteFila key={v.id} venta={v} color={m.color} />)}
        </div>
      )}

      <div className="flex justify-end pt-2 border-t border-[var(--color-gr-border-lite)]">
        <Btn variant="ghost" onClick={onClose}>Cerrar</Btn>
      </div>
    </Modal>
  );
}

/** Fila informativa (read-only) — sin botones de acción. */
function ReporteFila({ venta: v, color }: { venta: NotaVenta; color: string }) {
  const productos = v.detalles.map(d =>
    `${Number(d.cantidad)} ${d.unidad?.abreviatura ?? ''} ${d.producto?.nombre ?? ''}`.trim()
  ).join(' · ');
  const bolsas = v.detalles.reduce((s, d) => s + Number(d.cantidad ?? 0), 0);
  const cargas = v.cargas ?? [];

  return (
    <div className="rounded-[12px] border border-[var(--color-gr-border-lite)] p-4 bg-white">
      {/* Cabecera de la fila */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: color + '15' }}>
          <Receipt size={18} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-900 text-[15px] text-[var(--color-gr-text)]">
              NV-{v.numeroNota}
              {v.numeroGuia ? ` · G-${v.numeroGuia}` : ''}
            </p>
            <EstadoBadge estado={v.estado} />
            {v.tipoFlete === TipoFlete.CLIENTE_PAGA_DIRECTO && (
              <Badge color="blue">Cliente paga flete</Badge>
            )}
          </div>
          <p className="text-[12.5px] text-[var(--color-gr-muted)] mt-0.5">
            {productos || 'Sin productos'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10.5px] font-700 text-[var(--color-gr-muted)] uppercase">Total</p>
          <p className="font-900 text-[18px]" style={{ color }}>{formatBs(Number(v.totalBs))}</p>
        </div>
      </div>

      {/* Recuadros informativos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
        <InfoBox icon={<User size={13} />} label="Cliente" value={v.cliente?.nombre ?? '—'} />
        <InfoBox icon={<Calendar size={13} />} label="Fecha" value={v.fecha} />
        <InfoBox
          icon={<Truck size={13} />}
          label="Transportista"
          value={v.transportista
            ? `${v.transportista.nombre}${v.transportista.placa ? ` · ${v.transportista.placa}` : ''}`
            : 'Sin asignar'}
        />
        <InfoBox icon={<Package size={13} />} label="Bolsas totales" value={String(bolsas)} />
      </div>

      {/* Cargadores del despacho (si hay) */}
      {cargas.length > 0 && (
        <div className="mt-3 rounded-[10px] px-3 py-2.5"
          style={{ background: 'var(--color-gr-primary-lite)' }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <HardHat size={13} style={{ color: 'var(--color-gr-primary)' }} />
            <p className="text-[11px] font-700 uppercase tracking-wide" style={{ color: 'var(--color-gr-primary)' }}>
              Cargadores del despacho
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cargas.map(c => (
              <span key={c.id}
                className="text-[11.5px] font-600 rounded-full px-2.5 py-1"
                style={{ background: '#fff', color: 'var(--color-gr-text)' }}>
                {c.cargador?.nombre ?? '—'} ·{' '}
                {Number(c.cantidad)}{' '}
                {c.tipoPago === TipoPagoCarga.BOLSA ? 'bolsas' : 'jornal'} ·{' '}
                {formatBs(Number(c.montoBs))}
                {c.pagado
                  ? <span style={{ color: 'var(--color-gr-success)' }}> ✓</span>
                  : <span style={{ color: 'var(--color-gr-warning)' }}> ⏳</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[var(--color-gr-border-lite)] px-3 py-2 bg-white">
      <div className="flex items-center gap-1.5 text-[var(--color-gr-muted)] mb-0.5">
        {icon}
        <p className="text-[10px] font-700 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-[13px] font-700 text-[var(--color-gr-text)] truncate">{value}</p>
    </div>
  );
}

// ─── RemisionCard ──────────────────────────────────────────────────────────
function RemisionCard({ venta: v, onVerRemision, onDespachar }: {
  venta: NotaVenta; onVerRemision: () => void; onDespachar: () => void;
}) {
  const transp = v.transportista;
  return (
    <div className="card border-l-4 space-y-3"
      style={{ borderLeftColor: 'var(--color-gr-warning)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-800 text-[var(--color-gr-text)] text-[15px]">NV-{v.numeroNota}</p>
            {v.numeroGuia && <Badge color="gray">G-{v.numeroGuia}</Badge>}
            <EstadoBadge estado={v.estado} />
            {v.tipoFlete === TipoFlete.CLIENTE_PAGA_DIRECTO && (
              <span className="inline-flex items-center gap-1 text-[11px] font-600 px-2 py-0.5 rounded-full"
                style={{ background: 'var(--color-gr-info-bg)', color: 'var(--color-gr-info)' }}>
                <Truck size={10} /> Cliente paga flete
              </span>
            )}
          </div>
          <p className="font-600 text-gr-text text-[13.5px] truncate">{v.cliente?.nombre ?? '—'}</p>
          <p className="text-[12px] text-gr-muted">{v.fecha}</p>
        </div>
        <p className="font-900 text-[var(--color-gr-primary)] text-[18px] whitespace-nowrap shrink-0">{formatBs(Number(v.totalBs))}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {v.detalles.map((d, i) => (
          <div key={d.id ?? i} className="flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12px]"
            style={{ background: 'var(--color-gr-border-lite)' }}>
            <Package size={12} className="text-[var(--color-gr-primary)]" />
            <span className="font-600">{Number(d.cantidad)} {d.unidad?.abreviatura ?? ''}</span>
            <span className="text-[var(--color-gr-muted)]">{(d.producto?.nombre ?? '').split(' ').slice(0, 3).join(' ')}</span>
            {d.lote && <span className="text-[var(--color-gr-muted)]">· {d.lote.codigoLote}</span>}
          </div>
        ))}
      </div>

      {transp && (
        <p className="text-[12.5px] text-[var(--color-gr-muted)]">
          <Truck size={12} className="inline mr-1" />
          {transp.nombre}
          {transp.placa ? ` · ${transp.placa}` : ''}
          {transp.marca ? ` · ${transp.marca}` : ''}
        </p>
      )}

      <div className="flex gap-2">
        <Btn variant="ghost" size="sm" onClick={onVerRemision}><Printer size={13} /> Ver remisión</Btn>
        <Btn variant="primary" size="sm" onClick={onDespachar}>
          <Truck size={13} /> Marcar despachado <ArrowRight size={13} />
        </Btn>
      </div>
    </div>
  );
}

// ─── RemisionModal ─────────────────────────────────────────────────────────
function RemisionModal({ venta: v, onClose, onDespachar }: {
  venta: NotaVenta; onClose: () => void; onDespachar: (id: string) => void;
}) {
  const transp = v.transportista;
  const cliente = v.cliente;
  return (
    <Modal open title={`Remisión — NV-${v.numeroNota}`} onClose={onClose} wide>
      <div className="flex items-center gap-2 rounded-[10px] px-4 py-2.5 mb-2"
        style={{ background: 'var(--color-gr-success-bg)' }}>
        <Zap size={14} style={{ color: 'var(--color-gr-success)' }} />
        <p className="text-[12.5px] font-600" style={{ color: 'var(--color-gr-success)' }}>
          Remisión generada automáticamente ✓
        </p>
        <span className="ml-auto"><EstadoBadge estado={v.estado} /></span>
      </div>

      {v.tipoFlete === TipoFlete.CLIENTE_PAGA_DIRECTO && (
        <div className="flex items-center gap-2 rounded-[10px] px-4 py-2.5 mb-2"
          style={{ background: 'var(--color-gr-info-bg)' }}>
          <Truck size={14} style={{ color: 'var(--color-gr-info)' }} />
          <p className="text-[12.5px] font-600" style={{ color: 'var(--color-gr-info)' }}>
            Cliente paga flete directamente al transportista
          </p>
        </div>
      )}

      <div className="border border-[var(--color-gr-border)] rounded-[12px] overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between"
          style={{ background: 'var(--color-gr-primary)' }}>
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-[10px] p-1.5">
              <div className="relative w-[100px] h-[46px]">
                <Image src="/logo-grano-rey.webp" alt="Grano Rey" fill className="object-contain" />
              </div>
            </div>
            <p className="text-white/60 text-[10px] uppercase tracking-widest">Remisión de Entrega</p>
          </div>
          <div className="text-right">
            <p className="text-[var(--color-gr-gold)] font-700 text-[12px]">N° GUÍA</p>
            <p className="text-white font-900 text-[28px]">{v.numeroGuia ? `G-${v.numeroGuia}` : '—'}</p>
            <p className="text-white/60 text-[12px]">{v.fecha}</p>
          </div>
        </div>

        <div className="bg-white px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1.5">Cliente / Destinatario</p>
              <p className="font-800 text-[var(--color-gr-text)] text-[15px]">{cliente?.nombre ?? '—'}</p>
              <p className="text-[12.5px] text-[var(--color-gr-muted)]">{cliente?.ciudad ?? ''}</p>
            </div>
            <div>
              <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1.5">Transportista</p>
              {transp ? (
                <>
                  <p className="font-800 text-[var(--color-gr-text)]">{transp.nombre}</p>
                  <p className="text-[12.5px] text-[var(--color-gr-muted)]">
                    {transp.marca ?? ''}{transp.placa ? ` · Placa: ` : ''}{transp.placa && <strong>{transp.placa}</strong>}
                  </p>
                </>
              ) : <p className="text-[var(--color-gr-muted)] text-[13px]">Sin asignar</p>}
            </div>
          </div>

          <div className="border border-[var(--color-gr-border)] rounded-[10px] overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] px-4 py-2.5 gap-3 text-[11px] font-700 text-white/80 uppercase"
              style={{ background: 'var(--color-gr-primary)' }}>
              <span>Producto</span><span>Lote</span><span>Cantidad</span><span>Total Bs</span>
            </div>
            {v.detalles.map((d, i) => (
              <div key={d.id ?? i} className={`grid grid-cols-[1fr_auto_auto_auto] px-4 py-3 gap-3 text-[13px] ${i < v.detalles.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}>
                <span className="font-600">{d.producto?.nombre ?? '—'}</span>
                <span className="text-[var(--color-gr-muted)]">{d.lote?.codigoLote ?? '—'}</span>
                <span className="font-700">{Number(d.cantidad)} {d.unidad?.abreviatura ?? ''}</span>
                <span className="font-800 text-[var(--color-gr-primary)]">{formatBs(Number(d.valorTotalBs))}</span>
              </div>
            ))}
          </div>

          {v.tipoFlete === TipoFlete.INCLUIDO_EN_VENTA && Number(v.fleteBs) > 0 && (
            <div className="flex justify-between text-[13px] text-[var(--color-gr-info)]">
              <span>Flete incluido</span><span>+{formatBs(Number(v.fleteBs))}</span>
            </div>
          )}

          <div className="flex justify-between font-900 text-[18px] text-[var(--color-gr-primary)] border-t border-[var(--color-gr-border)] pt-3">
            <span>TOTAL</span><span>{formatBs(Number(v.totalBs))}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="border border-[var(--color-gr-border)] rounded-[10px] px-4 py-8 text-center">
              <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase">Firma Responsable Producción</p>
            </div>
            <div className="border border-[var(--color-gr-border)] rounded-[10px] px-4 py-8 text-center">
              <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase">Firma Transportista / Receptor</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[var(--color-gr-border-lite)]">
            <EstadoBadge estado={v.estado} />
            <div className="flex items-center gap-2 opacity-70">
              <span className="text-[10px] text-[var(--color-gr-muted)] uppercase tracking-wide">Producto</span>
              <div className="relative w-[80px] h-[36px]">
                <Image src="/logo-reynales.webp" alt="Reynales" fill className="object-contain" />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[var(--color-gr-muted)] text-center italic">
            Próximamente: el cliente recibirá confirmación por WhatsApp al despachar
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-end">
        <Btn variant="ghost" onClick={onClose}>Cerrar</Btn>
        <Link href={`/ventas/${v.id}/imprimir?modo=proforma`}
          className="inline-flex items-center gap-2 bg-[var(--color-gr-gold-lite)] hover:bg-[var(--color-gr-gold)] text-[var(--color-gr-gold-dark)] font-700 px-3 py-2 rounded-[10px] text-[13px]">
          <Printer size={14} /> Proforma
        </Link>
        <Link href={`/ventas/${v.id}/imprimir?modo=nota`}
          className="inline-flex items-center gap-2 bg-[var(--color-gr-border-lite)] hover:bg-[var(--color-gr-border)] text-[var(--color-gr-text)] font-700 px-3 py-2 rounded-[10px] text-[13px]">
          <Printer size={14} /> Nota
        </Link>
        <Link href={`/ventas/${v.id}/imprimir?modo=combinada`}
          className="inline-flex items-center gap-2 bg-[var(--color-gr-primary)] hover:bg-[var(--color-gr-primary-mid)] text-white font-700 px-3 py-2 rounded-[10px] text-[13px]">
          <Printer size={14} /> Combinada
        </Link>
        {v.estado === EstadoVenta.PENDIENTE && (
          <Btn onClick={() => onDespachar(v.id)}>
            <Truck size={14} /> Marcar despachado
          </Btn>
        )}
        {v.estado === EstadoVenta.DESPACHADA && (
          <Btn variant="primary" onClick={() => { onDespachar(v.id); onClose(); }}>
            <CheckCircle2 size={14} /> Confirmar entregado
          </Btn>
        )}
      </div>
    </Modal>
  );
}

// ─── DespacharModal: cargadores múltiples + tarifa por sesión ───────────────
function DespacharModal({ venta, onClose, onSaved, onError }: {
  venta: NotaVenta;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const cambiar = useCambiarEstadoVenta();

  const [tipoPago, setTipoPago] = useState<TipoPagoCarga>(TipoPagoCarga.BOLSA);
  const [tarifaBs, setTarifaBs] = useState(0);
  const [cargas, setCargas]     = useState<CargaDraft[]>([]);

  const totalUnidades = venta.detalles.reduce((s, d) => s + Number(d.cantidad ?? 0), 0);

  async function handleConfirmar() {
    try {
      await cambiar.mutateAsync({
        id: venta.id,
        estado: EstadoVenta.DESPACHADA,
        cargas: cargas.length > 0
          ? cargas.map(({ _id: _drop, ...c }) => c)
          : undefined,
      });
      onSaved();
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo despachar'));
    }
  }

  return (
    <Modal xl open title={`Despachar NV-${venta.numeroNota}`} onClose={onClose}>
      <div className="rounded-[10px] px-4 py-3 flex items-center justify-between"
        style={{ background: 'var(--color-gr-primary-lite)' }}>
        <div>
          <p className="font-700 text-[var(--color-gr-primary)] text-[14px]">
            {venta.cliente?.nombre ?? '—'}
          </p>
          <p className="text-[12px] text-[var(--color-gr-muted)]">
            {venta.fecha} · {totalUnidades} unid. · {formatBs(Number(venta.totalBs))}
          </p>
        </div>
      </div>

      <CargasSection
        totalEsperado={totalUnidades}
        unidadTotal="unid."
        tipoPago={tipoPago}
        onTipoPagoChange={setTipoPago}
        tarifaBs={tarifaBs}
        onTarifaChange={setTarifaBs}
        cargas={cargas}
        onCargasChange={setCargas}
      />

      <div className="flex gap-3 justify-end pt-2 border-t border-[var(--color-gr-border-lite)]">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleConfirmar} loading={cambiar.isPending}>
          <Truck size={14} /> Confirmar despacho
        </Btn>
      </div>
    </Modal>
  );
}
