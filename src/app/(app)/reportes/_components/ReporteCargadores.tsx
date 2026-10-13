'use client';
import { useState } from 'react';
import { useReporteCargadores } from '@/lib/api/cargadores';
import { formatBs } from '@/lib/utils';
import { Spinner, Pagination, usePagination, KpiCard } from '@/components/ui';

function OrigenBox({
  label, hint, cantidad, pagadoBs, pendienteBs, color,
}: {
  label: string; hint: string; cantidad: number;
  pagadoBs: number; pendienteBs: number; color: string;
}) {
  return (
    <div className="px-5 py-4 space-y-2">
      <div>
        <p className="font-800 text-[13.5px]" style={{ color }}>{label}</p>
        <p className="text-[11.5px] text-gr-muted">{hint}</p>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10.5px] font-700 text-gr-muted uppercase tracking-wide">
            Pagado
          </p>
          <p className="font-900 text-[18px]" style={{ color: 'var(--color-gr-success)' }}>
            {formatBs(pagadoBs)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10.5px] font-700 text-gr-muted uppercase tracking-wide">
            Pendiente
          </p>
          <p className="font-800 text-[14.5px]"
            style={{ color: pendienteBs > 0 ? 'var(--color-gr-danger)' : 'var(--color-gr-muted)' }}>
            {formatBs(pendienteBs)}
          </p>
        </div>
      </div>
      <p className="text-[11px] text-gr-muted">
        {cantidad} movimiento{cantidad !== 1 ? 's' : ''} de carga
      </p>
    </div>
  );
}

export function ReporteCargadores() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const reporteQ = useReporteCargadores(desde || undefined, hasta || undefined);
  const r = reporteQ.data;
  const porCargadorPag = usePagination(r?.porCargador ?? []);

  if (reporteQ.isLoading) {
    return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-900 text-[16px] text-gr-text">Gastos en cargadores</h2>
          <p className="text-[12.5px] text-gr-muted">
            {desde || hasta
              ? `Período ${desde || '…'} → ${hasta || '…'}`
              : 'Todo el histórico'}
          </p>
        </div>
      </div>

      {/* Filtros de fecha */}
      <div className="card flex flex-wrap gap-3 items-end py-3">
        <div>
          <label className="block text-[11px] font-700 text-gr-muted uppercase mb-1">Desde</label>
          <input type="date" value={desde}
            onChange={e => setDesde(e.target.value)}
            className="border border-gr-border rounded-[8px] px-3 py-2 text-[13px] bg-white" />
        </div>
        <div>
          <label className="block text-[11px] font-700 text-gr-muted uppercase mb-1">Hasta</label>
          <input type="date" value={hasta}
            onChange={e => setHasta(e.target.value)}
            className="border border-gr-border rounded-[8px] px-3 py-2 text-[13px] bg-white" />
        </div>
        {(desde || hasta) && (
          <button onClick={() => { setDesde(''); setHasta(''); }}
            className="text-[12px] font-600 text-gr-primary underline pb-2">
            Limpiar
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Total pagado" value={formatBs(r?.totalPagadoBs ?? 0)} color="success" />
        <KpiCard label="Pendiente" value={formatBs(r?.totalPendienteBs ?? 0)} color="danger" />
        <KpiCard label="Cargadores activos" value={String(r?.cantidadCargadores ?? 0)} color="primary" />
      </div>

      {/* Desglose por origen del trabajo */}
      {r?.porOrigen && (r.porOrigen.materiaPrima.cantidad + r.porOrigen.despacho.cantidad > 0) && (
        <div className="card-no-pad">
          <div className="px-5 py-3.5 border-b border-gr-border">
            <p className="font-800 text-[14px] text-gr-text">Desglose por tipo de trabajo</p>
            <p className="text-[12px] text-gr-muted mt-0.5">
              De dónde vienen los pagos a cargadores en el período
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-gr-border-lite">
            <OrigenBox
              label="Descarga de Materia Prima"
              hint="Recepción y descarga de compras de MP"
              cantidad={r.porOrigen.materiaPrima.cantidad}
              pagadoBs={r.porOrigen.materiaPrima.totalPagadoBs}
              pendienteBs={r.porOrigen.materiaPrima.pendienteBs}
              color="var(--color-gr-primary)"
            />
            <OrigenBox
              label="Despachos a clientes"
              hint="Carga a camión para llevar al cliente"
              cantidad={r.porOrigen.despacho.cantidad}
              pagadoBs={r.porOrigen.despacho.totalPagadoBs}
              pendienteBs={r.porOrigen.despacho.pendienteBs}
              color="var(--color-gr-info)"
            />
          </div>
        </div>
      )}

      {/* Desglose por cargador */}
      <div className="card-no-pad">
        <div className="px-5 py-3.5 border-b border-gr-border">
          <p className="font-800 text-[14px] text-gr-text">Desglose por cargador</p>
        </div>

        {!r || r.porCargador.length === 0 ? (
          <p className="px-5 py-6 text-[13px] text-gr-muted text-center">
            Sin movimientos en el período
          </p>
        ) : (
          <>
            <div
              className="hidden md:grid gap-3 px-5 py-3 text-[11px] font-700 text-gr-muted uppercase tracking-wide border-b border-gr-border"
              style={{ gridTemplateColumns: '1fr 90px 130px 130px', background: 'var(--color-gr-border-lite)' }}
            >
              <span>Cargador</span>
              <span className="text-right">Pagos</span>
              <span className="text-right">Total pagado</span>
              <span className="text-right">Pendiente</span>
            </div>
            {porCargadorPag.pageItems.map(c => (
              <div key={c.cargadorId}
                className="px-5 py-3 border-b border-gr-border-lite last:border-b-0"
              >
                <div className="hidden md:grid gap-3 items-center"
                  style={{ gridTemplateColumns: '1fr 90px 130px 130px' }}>
                  <span className="font-700 text-[13.5px] text-gr-text">{c.cargadorNombre}</span>
                  <span className="text-right text-[13px]">{c.cantidadPagos}</span>
                  <span className="text-right font-800 text-[13.5px]" style={{ color: 'var(--color-gr-success)' }}>
                    {formatBs(c.totalPagadoBs)}
                  </span>
                  <span className="text-right font-800 text-[13.5px]" style={{ color: c.pendienteBs > 0 ? 'var(--color-gr-danger)' : 'var(--color-gr-muted)' }}>
                    {formatBs(c.pendienteBs)}
                  </span>
                </div>
                <div className="md:hidden">
                  <p className="font-700 text-[13.5px] text-gr-text">{c.cargadorNombre}</p>
                  <p className="text-[12px] text-gr-muted">
                    {c.cantidadPagos} pagos ·{' '}
                    <span style={{ color: 'var(--color-gr-success)' }}>{formatBs(c.totalPagadoBs)}</span>
                    {c.pendienteBs > 0 && (
                      <> · pendiente <span style={{ color: 'var(--color-gr-danger)' }}>{formatBs(c.pendienteBs)}</span></>
                    )}
                  </p>
                </div>
              </div>
            ))}
            <div
              className="px-5 py-3 flex items-center justify-between border-t border-gr-border"
              style={{ background: 'var(--color-gr-border-lite)' }}
            >
              <span className="text-[13px] font-700 text-gr-text">Total</span>
              <span className="font-900 text-[14px] text-gr-primary">
                {formatBs(r.totalPagadoBs)} pagado + {formatBs(r.totalPendienteBs)} pendiente
              </span>
            </div>
            <Pagination page={porCargadorPag.page} totalPages={porCargadorPag.totalPages} onChange={porCargadorPag.setPage}
              pageSize={porCargadorPag.pageSize} onPageSizeChange={porCargadorPag.setPageSize} total={porCargadorPag.total} />
          </>
        )}
      </div>
    </div>
  );
}
