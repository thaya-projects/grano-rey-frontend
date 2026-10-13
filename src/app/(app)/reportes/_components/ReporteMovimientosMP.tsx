'use client';
import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useKardexMP } from '@/lib/api/materia-prima';
import { TipoMovimientoMP } from '@/lib/types';
import { formatBs, formatNum, kgToQQ } from '@/lib/utils';
import { Badge, Spinner, Pagination, usePagination } from '@/components/ui';

const MovimientosMPPDFLink = dynamic(
  () => import('@/components/pdf/MovimientosMPPDF').then(m => m.MovimientosMPPDFLink),
  { ssr: false, loading: () => <span className="text-[12px] text-gr-muted">…</span> },
);

export function ReporteMovimientosMP() {
  const kardexQ = useKardexMP();
  const movs = kardexQ.data ?? [];
  const [filterMP, setFilterMP] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const mpNames = useMemo(() => [...new Set(movs.map(m => m.materiaPrima?.nombre ?? '—'))].sort(), [movs]);

  const filtered = useMemo(() => movs.filter(m => {
    if (filterMP   && (m.materiaPrima?.nombre ?? '') !== filterMP) return false;
    if (filterTipo && m.tipoMovimiento !== filterTipo) return false;
    if (fechaDesde && m.fecha < fechaDesde) return false;
    if (fechaHasta && m.fecha > fechaHasta) return false;
    return true;
  }), [movs, filterMP, filterTipo, fechaDesde, fechaHasta]);

  const movsLegacy = filtered.map(m => ({
    id: m.id,
    fecha: m.fecha,
    mpNombre: m.materiaPrima?.nombre ?? '—',
    tipo: m.tipoMovimiento,
    totalQQ: kgToQQ(Number(m.cantidadKg)),
    costoBs: m.costoUnitarioBs != null ? Number(m.costoUnitarioBs) * Number(m.cantidad) : null,
    lote: m.numeroLotePropio ?? null,
    responsable: m.responsable?.nombre ?? '—',
  }));

  const totalQQMovs = filtered.reduce((s, m) => s + kgToQQ(Number(m.cantidadKg)), 0);
  const totalBsMovs = filtered.reduce((s, m) =>
    m.costoUnitarioBs != null ? s + Number(m.costoUnitarioBs) * Number(m.cantidad) : s, 0);

  // Balance por tipo de movimiento
  const balance = useMemo(() => {
    // Costo promedio ponderado por KG desde todos los ingresos con precio
    const ingresosConPrecio = filtered.filter(
      m => m.tipoMovimiento === TipoMovimientoMP.INGRESO && m.costoUnitarioBs != null
    );
    const totalCostIngresos = ingresosConPrecio.reduce(
      (s, m) => s + Number(m.costoUnitarioBs!) * Number(m.cantidad), 0
    );
    const totalKgIngresos = ingresosConPrecio.reduce((s, m) => s + Number(m.cantidadKg), 0);
    const avgCostPerKg = totalKgIngresos > 0 ? totalCostIngresos / totalKgIngresos : 0;

    let comprasQQ = 0, comprasBs = 0;
    let produccionQQ = 0, produccionBs = 0;
    let mermaProcesoQQ = 0, mermaProcesoBs = 0;
    let mermaExternaQQ = 0, mermaExternaBs = 0;
    let desechoQQ = 0, desechoBs = 0;
    let ajusteQQ = 0;
    let devolucionQQ = 0, devolucionBs = 0;

    filtered.forEach(m => {
      const qq  = kgToQQ(Number(m.cantidadKg));
      const kg  = Number(m.cantidadKg);
      // Precio propio si existe, sino estimado por costo promedio de compra
      const bs  = m.costoUnitarioBs != null
        ? Number(m.costoUnitarioBs) * Number(m.cantidad)
        : avgCostPerKg * kg;

      switch (m.tipoMovimiento) {
        case TipoMovimientoMP.INGRESO:
          comprasQQ += qq; comprasBs += (m.costoUnitarioBs != null ? Number(m.costoUnitarioBs) * Number(m.cantidad) : 0); break;
        case TipoMovimientoMP.SALIDA:
          produccionQQ += qq; produccionBs += bs; break;
        case TipoMovimientoMP.MERMA:
          if (m.loteProduccion) { mermaProcesoQQ += qq; mermaProcesoBs += bs; }
          else                  { mermaExternaQQ += qq; mermaExternaBs += bs; }
          break;
        case TipoMovimientoMP.DESECHO:
          desechoQQ += qq; desechoBs += bs; break;
        case TipoMovimientoMP.AJUSTE:
          ajusteQQ += qq; break;
        case TipoMovimientoMP.DEVOLUCION:
          devolucionQQ += qq; devolucionBs += bs; break;
      }
    });

    const perdidasQQ = mermaProcesoQQ + mermaExternaQQ + desechoQQ;
    const perdidasBs = mermaProcesoBs + mermaExternaBs + desechoBs;
    const netoQQ     = comprasQQ + devolucionQQ + ajusteQQ - produccionQQ - perdidasQQ;
    const pctPerdida = comprasBs > 0 ? (perdidasBs / comprasBs) * 100 : 0;
    const usaEstimado = avgCostPerKg > 0 && (produccionQQ > 0 || mermaProcesoQQ > 0);

    return {
      comprasQQ, comprasBs,
      produccionQQ, produccionBs,
      mermaProcesoQQ, mermaProcesoBs,
      mermaExternaQQ, mermaExternaBs,
      desechoQQ, desechoBs,
      ajusteQQ,
      devolucionQQ, devolucionBs,
      perdidasQQ, perdidasBs,
      netoQQ, pctPerdida,
      avgCostPerKg, usaEstimado,
    };
  }, [filtered]);

  const COLS_MOVS = '120px 1fr 80px 110px 80px 90px 130px';

  const movsPag = usePagination(filtered);
  useEffect(() => { movsPag.setPage(1); }, [filterMP, filterTipo, fechaDesde, fechaHasta]);

  if (kardexQ.isLoading) {
    return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-900 text-[16px] text-gr-text">Movimientos de Materia Prima</h2>
          <p className="text-[12.5px] text-gr-muted">
            {filtered.length} registros · <strong>{formatNum(totalQQMovs, 2)} QQ</strong>
            {totalBsMovs > 0 && <> · {formatBs(totalBsMovs)}</>}
          </p>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <MovimientosMPPDFLink data={{ movimientos: movsLegacy as any }} />
      </div>

      {/* Balance — 4 tarjetas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Comprado */}
        <div className="card border-t-2" style={{ borderTopColor: 'var(--color-gr-success)' }}>
          <p className="text-[11px] font-700 text-gr-muted uppercase tracking-wide mb-2">Comprado</p>
          <p className="text-[19px] font-900 leading-none" style={{ color: 'var(--color-gr-success)' }}>
            {formatNum(balance.comprasQQ, 2)} QQ
          </p>
          <p className="text-[12px] text-gr-muted mt-1">
            {balance.comprasBs > 0 ? formatBs(balance.comprasBs) : '—'}
          </p>
        </div>

        {/* Usado en producción */}
        <div className="card border-t-2" style={{ borderTopColor: 'var(--color-gr-primary)' }}>
          <p className="text-[11px] font-700 text-gr-muted uppercase tracking-wide mb-2">A producción</p>
          <p className="text-[19px] font-900 leading-none" style={{ color: 'var(--color-gr-primary)' }}>
            {formatNum(balance.produccionQQ, 2)} QQ
          </p>
          <p className="text-[12px] text-gr-muted mt-1">
            {balance.produccionBs > 0 ? `${formatBs(balance.produccionBs)}${balance.usaEstimado ? ' *' : ''}` : '—'}
          </p>
        </div>

        {/* Pérdidas totales */}
        <div className="card border-t-2" style={{ borderTopColor: 'var(--color-gr-danger)' }}>
          <p className="text-[11px] font-700 text-gr-muted uppercase tracking-wide mb-2">
            Pérdidas
            {balance.pctPerdida > 0 && (
              <span className="ml-1 font-600 normal-case" style={{
                color: balance.pctPerdida > 5 ? 'var(--color-gr-danger)'
                  : balance.pctPerdida > 2 ? 'var(--color-gr-warning)'
                  : 'var(--color-gr-success)',
              }}>
                ({balance.pctPerdida.toFixed(1)}%)
              </span>
            )}
          </p>
          <p className="text-[19px] font-900 leading-none" style={{ color: 'var(--color-gr-danger)' }}>
            {formatNum(balance.perdidasQQ, 2)} QQ
          </p>
          <p className="text-[12px] text-gr-muted mt-1">
            {balance.perdidasBs > 0 ? formatBs(balance.perdidasBs) : '—'}
          </p>
        </div>

        {/* Ajustes */}
        <div className="card border-t-2" style={{ borderTopColor: 'var(--color-gr-muted)' }}>
          <p className="text-[11px] font-700 text-gr-muted uppercase tracking-wide mb-2">Ajustes</p>
          <p className="text-[19px] font-900 leading-none text-gr-muted">
            {balance.ajusteQQ !== 0
              ? `${balance.ajusteQQ > 0 ? '+' : ''}${formatNum(balance.ajusteQQ, 2)} QQ`
              : '—'}
          </p>
          <p className="text-[12px] text-gr-muted mt-1">
            {balance.ajusteQQ === 0 ? 'Sin ajustes' : 'corrección de inventario'}
          </p>
        </div>
      </div>
      {balance.usaEstimado && (
        <p className="text-[11.5px] text-gr-muted px-1">
          * Bs estimados al precio promedio de compra — {formatBs(balance.avgCostPerKg)}/kg
        </p>
      )}

      {/* Filtros */}
      <div className="card flex flex-wrap gap-3 py-3">
        <select value={filterMP} onChange={e => setFilterMP(e.target.value)}
          className="border border-gr-border rounded-lg px-3 py-2 text-[13px] bg-white flex-1 min-w-45 text-gr-text">
          <option value="">Todas las materias primas</option>
          {mpNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}
          className="border border-gr-border rounded-lg px-3 py-2 text-[13px] bg-white text-gr-text">
          <option value="">Todos los tipos</option>
          <option value={TipoMovimientoMP.INGRESO}>Ingreso</option>
          <option value={TipoMovimientoMP.SALIDA}>Salida</option>
          <option value={TipoMovimientoMP.MERMA}>Merma</option>
          <option value={TipoMovimientoMP.DESECHO}>Desecho</option>
          <option value={TipoMovimientoMP.AJUSTE}>Ajuste</option>
          <option value={TipoMovimientoMP.DEVOLUCION}>Devolución</option>
        </select>
        <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
          aria-label="Desde"
          className="border border-gr-border rounded-lg px-3 py-2 text-[13px] bg-white" />
        <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
          aria-label="Hasta"
          className="border border-gr-border rounded-lg px-3 py-2 text-[13px] bg-white" />
        {(fechaDesde || fechaHasta) && (
          <button onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
            className="text-[12px] font-600 text-gr-primary underline">
            Limpiar fechas
          </button>
        )}
      </div>

      <div className="card-no-pad overflow-x-auto">
        <div style={{ minWidth: 700 }}>
          {/* Header */}
          <div className="grid gap-x-3 px-4 py-3 text-[11px] font-700 text-gr-muted uppercase tracking-wide border-b border-gr-border"
            style={{ gridTemplateColumns: COLS_MOVS, background: 'var(--color-gr-border-lite)' }}>
            <span>Tipo</span>
            <span>Materia Prima</span>
            <span className="text-right">QQ</span>
            <span className="text-right">Costo Bs</span>
            <span className="text-right">Lote</span>
            <span>Fecha</span>
            <span>Responsable</span>
          </div>
          {/* Rows */}
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-gr-muted">Sin movimientos para los filtros seleccionados</p>
          ) : movsPag.pageItems.map((m, i) => {
            const t = m.tipoMovimiento;
            const [color, label] =
              t === TipoMovimientoMP.INGRESO    ? ['green',  '↑ Ingreso']    :
              t === TipoMovimientoMP.AJUSTE     ? ['green',  '↑ Ajuste']     :
              t === TipoMovimientoMP.SALIDA     ? ['red',    '↓ Salida']     :
              t === TipoMovimientoMP.MERMA      ? ['yellow', '↓ Merma']      :
              t === TipoMovimientoMP.DESECHO    ? ['yellow', '↓ Desecho']    :
              t === TipoMovimientoMP.DEVOLUCION ? ['gray',   '↩ Devolución'] :
              ['gray', t];
            return (
              <div key={m.id}
                className="grid gap-x-3 px-4 py-3 items-center border-b border-gr-border-lite last:border-b-0 text-[13px]"
                style={{
                  gridTemplateColumns: COLS_MOVS,
                  background: i % 2 ? 'var(--color-gr-border-lite)' : '#fff',
                }}>
                <span className="whitespace-nowrap">
                  <Badge color={color as 'green' | 'red' | 'yellow' | 'gray'}>{label}</Badge>
                </span>
                <span className="font-700 truncate">{m.materiaPrima?.nombre ?? '—'}</span>
                <span className="text-right font-700">{formatNum(kgToQQ(Number(m.cantidadKg)), 2)}</span>
                <span className="text-right whitespace-nowrap">
                  {m.costoUnitarioBs != null ? formatBs(Number(m.costoUnitarioBs) * Number(m.cantidad)) : '—'}
                </span>
                <span className="text-right text-gr-muted">{m.numeroLotePropio ?? '—'}</span>
                <span className="whitespace-nowrap text-gr-muted">{m.fecha}</span>
                <span className="whitespace-nowrap truncate">{m.responsable?.nombre ?? '—'}</span>
              </div>
            );
          })}
          {/* Footer */}
          <div className="px-4 py-3 border-t border-gr-border text-[12.5px] text-gr-muted"
            style={{ background: 'var(--color-gr-border-lite)' }}>
            {filtered.length} movimientos
          </div>
          <Pagination page={movsPag.page} totalPages={movsPag.totalPages} onChange={movsPag.setPage}
            pageSize={movsPag.pageSize} onPageSizeChange={movsPag.setPageSize} total={movsPag.total} />
        </div>
      </div>
    </div>
  );
}
