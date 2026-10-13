'use client';
import { useMemo, useState } from 'react';
import { useTodasCargas } from '@/lib/api/cargadores';
import { formatBs } from '@/lib/utils';
import { Spinner, useToast, KpiCard } from '@/components/ui';
import { CheckCircle2, Calendar } from 'lucide-react';
import { GrupoCard } from './_components/GrupoCard';
import { type Tab, type FiltroFecha, type GrupoMovimiento, FILTROS_FECHA, rangoFiltro } from './_components/helpers';

export default function CargadoresPage() {
  const toast = useToast(s => s.show);
  const [tab, setTab] = useState<Tab>('pendientes');

  // Default: pendientes → Todos (querés ver toda la deuda). Pagados → Este mes.
  const [filtroPend, setFiltroPend] = useState<FiltroFecha>('Todos');
  const [filtroPag,  setFiltroPag]  = useState<FiltroFecha>('Este mes');
  const [customPend, setCustomPend] = useState({ desde: '', hasta: '' });
  const [customPag,  setCustomPag]  = useState({ desde: '', hasta: '' });

  const filtroActivo = tab === 'pendientes' ? filtroPend : filtroPag;
  const customActivo = tab === 'pendientes' ? customPend : customPag;
  const setFiltro    = tab === 'pendientes' ? setFiltroPend : setFiltroPag;
  const setCustom    = tab === 'pendientes' ? setCustomPend : setCustomPag;

  const { desde, hasta } = rangoFiltro(filtroActivo, customActivo);
  const pagado = tab === 'pagados';
  // En "Personalizado" esperamos a que el usuario complete ambas fechas
  // antes de disparar la query — evita fetches con rango vacío.
  const rangoIncompleto = filtroActivo === 'Personalizado' && (!desde || !hasta);
  const cargasQ = useTodasCargas(pagado, desde, hasta, { enabled: !rangoIncompleto });
  const cargas  = cargasQ.data ?? [];

  const grupos = useMemo<GrupoMovimiento[]>(() => {
    const map = new Map<string, GrupoMovimiento>();
    for (const item of cargas) {
      const key = `${item.origen}::${item.origenId}`;
      const g = map.get(key);
      if (g) {
        g.items.push(item);
        g.totalBs += Number(item.montoBs);
      } else {
        map.set(key, {
          key,
          origen: item.origen,
          origenId: item.origenId,
          referencia: item.referencia,
          numeroReferencia: item.numeroReferencia,
          clienteNombre: item.clienteNombre,
          materiaPrimaNombre: item.materiaPrimaNombre,
          fecha: item.fecha,
          items: [item],
          totalBs: Number(item.montoBs),
          pagado,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => (b.fecha > a.fecha ? 1 : -1));
  }, [cargas, pagado]);

  const totalPeriodo = grupos.reduce((s, g) => s + g.totalBs, 0);
  const totalCargadores = new Set(cargas.map(i => i.cargadorId).filter(Boolean)).size;

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-[22px] font-900 text-gr-text">Pagos a cargadores</h1>
        <p className="text-gr-muted text-[13.5px] mt-0.5">
          Cada lote/despacho muestra quiénes descargaron y cuánto se les pagó.
        </p>
      </div>

      {/* Tabs Pendientes / Pagados */}
      <div className="flex gap-1 bg-white border border-gr-border rounded-[12px] p-1 w-fit">
        {(['pendientes', 'pagados'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2 rounded-[10px] text-[13.5px] font-700 transition-all"
            style={tab === t
              ? { background: 'var(--color-gr-primary)', color: '#fff' }
              : { color: 'var(--color-gr-muted)' }}
          >
            {t === 'pendientes' ? 'Pendientes de pago' : 'Ya pagados'}
          </button>
        ))}
      </div>

      {/* Filtros de fecha */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 bg-white border border-gr-border rounded-[10px] p-1">
          {FILTROS_FECHA.map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className="px-3 py-1.5 rounded-[8px] text-[12.5px] font-600 transition-all"
              style={filtroActivo === f
                ? { background: 'var(--color-gr-primary)', color: '#fff' }
                : { color: 'var(--color-gr-muted)' }}>
              {f}
            </button>
          ))}
        </div>
        {filtroActivo === 'Personalizado' && (
          <div className="flex flex-wrap items-center gap-2 bg-gr-border-lite rounded-[10px] p-2">
            <input type="date" value={customActivo.desde}
              onChange={e => setCustom({ ...customActivo, desde: e.target.value })}
              className="border border-gr-border rounded-[8px] px-3 py-1.5 text-[13px] bg-white" />
            <span className="text-[12px] text-gr-muted">→</span>
            <input type="date" value={customActivo.hasta}
              onChange={e => setCustom({ ...customActivo, hasta: e.target.value })}
              className="border border-gr-border rounded-[8px] px-3 py-1.5 text-[13px] bg-white" />
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Lotes" value={String(grupos.length)} />
        <KpiCard label="Cargadores" value={String(totalCargadores)} />
        <KpiCard
          label={tab === 'pendientes' ? 'Total a pagar' : 'Total pagado en el período'}
          value={formatBs(totalPeriodo)}
          color={tab === 'pendientes' ? 'danger' : 'success'}
        />
      </div>

      {rangoIncompleto ? (
        <div className="rounded-[14px] px-6 py-10 text-center"
          style={{ background: 'var(--color-gr-primary-lite)', border: '1px solid rgba(0,0,0,0.05)' }}>
          <Calendar size={32} style={{ color: 'var(--color-gr-primary)' }} className="mx-auto mb-3" />
          <p className="font-800 text-gr-text text-[15px]">
            Elegí ambas fechas para ver los resultados
          </p>
          <p className="text-gr-muted text-[13px] mt-1">
            La consulta se hará automáticamente cuando completes el rango.
          </p>
        </div>
      ) : cargasQ.isLoading ? (
        <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>
      ) : grupos.length === 0 ? (
        <div className="rounded-[14px] px-6 py-10 text-center"
          style={{ background: 'var(--color-gr-success-bg)', border: '1px solid rgba(46,125,82,0.15)' }}>
          <CheckCircle2 size={36} style={{ color: 'var(--color-gr-success)' }} className="mx-auto mb-3" />
          <p className="font-800 text-gr-text text-[16px]">
            {tab === 'pendientes' ? 'Sin deudas en el período' : 'Sin pagos en el período'}
          </p>
          <p className="text-gr-muted text-[13px] mt-1">
            Cambiá el filtro de fecha para ver otros registros.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {grupos.map(g => (
            <GrupoCard
              key={g.key}
              grupo={g}
              defaultOpen={tab === 'pendientes'}
              onSuccess={(msg) => toast(msg, 'success')}
              onError={(msg) => toast(msg, 'error')}
            />
          ))}
        </div>
      )}
    </div>
  );
}
