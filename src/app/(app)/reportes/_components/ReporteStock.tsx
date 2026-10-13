'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useProductos } from '@/lib/api/productos';
import { useMateriasPrimas } from '@/lib/api/materia-prima';
import { formatBs, formatNum, kgToQQ, equivPT, equivLabel } from '@/lib/utils';
import { Badge, Spinner, Pagination, usePagination } from '@/components/ui';
import { type StockTab } from './helpers';

const StockActualPDFLink = dynamic(
  () => import('@/components/pdf/StockActualPDF').then(m => m.StockActualPDFLink),
  { ssr: false, loading: () => <span className="text-[12px] text-gr-muted">…</span> },
);

export function ReporteStock() {
  const productosQ = useProductos();
  const mpQ        = useMateriasPrimas();
  const productos = productosQ.data ?? [];
  const materiaPrima = mpQ.data ?? [];
  const [tab, setTab] = useState<StockTab>('productos');
  const productosPag = usePagination(productos);
  const mpPag = usePagination(materiaPrima);

  if (productosQ.isLoading || mpQ.isLoading) {
    return <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>;
  }

  const productosLegacy = productos.map(p => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    factorABase: Number(p.unidadProduccion?.factorABase ?? 0),
    tipo: p.unidadProduccion?.tipo ?? null,
    precioUnitarioBs: Number(p.precioUnitarioBs ?? 0),
    stockActual: Number(p.stockActual),
    stockMinimo: Number(p.stockMinimo),
  }));

  const mpLegacy = materiaPrima.map(m => ({
    id: m.id,
    nombre: m.nombre,
    unidad: m.unidadMedida?.codigo ?? 'KG',
    stockEntero: undefined,
    stockParChico: undefined,
    stockParGrande: undefined,
    stockTotal: kgToQQ(Number(m.stockActualKg)),
    stockMinimo: kgToQQ(Number(m.stockMinimoKg)),
  }));

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-900 text-[16px] text-gr-text">Stock Actual</h2>
          <p className="text-[12.5px] text-gr-muted">
            Inventario al {new Date().toLocaleDateString('es-BO')}
          </p>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <StockActualPDFLink data={{ productos: productosLegacy as any, materiaPrima: mpLegacy as any }} />
      </div>

      <div className="flex gap-1 rounded-md p-1 border border-gr-border w-fit"
        style={{ background: 'var(--color-gr-border-lite)' }}>
        {(['productos', 'mp'] as StockTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-[8px] text-[12.5px] font-600 transition-colors"
            style={tab === t ? { background: 'var(--color-gr-primary)', color: '#fff' }
              : { color: 'var(--color-gr-muted)' }}>
            {t === 'productos' ? 'Productos' : 'Materia Prima'}
          </button>
        ))}
      </div>

      {tab === 'productos' && (
        <div className="card-no-pad">
          <div className="overflow-x-auto">
          <div style={{ minWidth: 540 }}>
          <div className="hidden md:grid gap-3 px-5 py-3 text-[11px] font-700 text-gr-muted uppercase tracking-wide border-b border-gr-border"
            style={{ gridTemplateColumns: '80px 1fr 90px 80px 80px 70px', background: 'var(--color-gr-border-lite)' }}>
            <span>Código</span><span>Producto</span><span className="text-right">Stock</span><span className="text-right">Equiv.</span><span className="text-right">Precio/u</span><span>Estado</span>
          </div>
          {productosPag.pageItems.map((p, i) => {
            const stock = Number(p.stockActual);
            const min   = Number(p.stockMinimo);
            const qq    = equivPT(stock, p.unidadProduccion?.factorABase, p.unidadProduccion?.tipo);
            const qlbl  = equivLabel(p.unidadProduccion?.tipo);
            const low   = stock < min;
            const warn  = !low && stock < min * 2;
            return (
              <div key={p.id}
                className={`px-5 py-3.5 ${i < productosPag.pageItems.length - 1 ? 'border-b border-gr-border-lite' : ''}`}>
                <div className="md:hidden flex items-center justify-between gap-2">
                  <div>
                    <p className="font-700 text-gr-text text-[13.5px]">{p.nombre}</p>
                    <p className="text-[12px] text-gr-muted">
                      {p.codigo} · {formatNum(stock, 0)} · {formatNum(qq, 2)} {qlbl}
                    </p>
                  </div>
                  <Badge color={low ? 'red' : warn ? 'yellow' : 'green'}>
                    {low ? 'Bajo' : warn ? 'Alerta' : 'OK'}
                  </Badge>
                </div>
                <div className="hidden md:grid gap-3 items-center"
                  style={{ gridTemplateColumns: '80px 1fr 90px 80px 80px 70px' }}>
                  <span className="text-[12px] font-600 text-gr-muted">{p.codigo}</span>
                  <span className="font-700 text-gr-text text-[13.5px]">{p.nombre}</span>
                  <span className="text-right font-900 text-[14px] text-gr-primary">
                    {formatNum(stock, 0)}
                  </span>
                  <span className="text-right font-700 text-gr-text text-[13px]">{formatNum(qq, 2)}</span>
                  <span className="text-right text-[13px] text-gr-text">{p.precioUnitarioBs ? formatBs(Number(p.precioUnitarioBs)) : '—'}</span>
                  <Badge color={low ? 'red' : warn ? 'yellow' : 'green'}>
                    {low ? 'Bajo' : warn ? 'Alerta' : 'OK'}
                  </Badge>
                </div>
              </div>
            );
          })}
          <div className="px-5 py-3 flex items-center justify-between border-t border-gr-border"
            style={{ background: 'var(--color-gr-border-lite)' }}>
            <span className="text-[13px] text-gr-muted">{productos.length} productos</span>
            <span className="font-900 text-[14px] text-gr-primary">
              {formatNum(productos.reduce((s, p) => s + Number(p.stockActual), 0), 0)} unidades totales
            </span>
          </div>
          <Pagination page={productosPag.page} totalPages={productosPag.totalPages} onChange={productosPag.setPage}
            pageSize={productosPag.pageSize} onPageSizeChange={productosPag.setPageSize} total={productosPag.total} />
          </div>
          </div>
        </div>
      )}

      {tab === 'mp' && (
        <div className="card-no-pad">
          <div className="overflow-x-auto">
          <div style={{ minWidth: 490 }}>
          <div className="hidden md:grid gap-3 px-5 py-3 text-[11px] font-700 text-gr-muted uppercase tracking-wide border-b border-gr-border"
            style={{ gridTemplateColumns: '1fr 110px 110px 90px 80px', background: 'var(--color-gr-border-lite)' }}>
            <span>Materia Prima</span><span className="text-right">Stock (kg)</span><span className="text-right">Stock (QQ)</span><span className="text-right">Mínimo</span><span>Estado</span>
          </div>
          {mpPag.pageItems.map((mp, i) => {
            const stockKg = Number(mp.stockActualKg);
            const minKg   = Number(mp.stockMinimoKg);
            const low     = minKg > 0 && stockKg < minKg;
            const warn    = !low && minKg > 0 && stockKg < minKg * 2;
            return (
              <div key={mp.id}
                className={`px-5 py-3.5 ${i < mpPag.pageItems.length - 1 ? 'border-b border-gr-border-lite' : ''}`}>
                <div className="md:hidden flex items-center justify-between gap-2">
                  <div>
                    <p className="font-700 text-gr-text text-[13.5px]">{mp.nombre}</p>
                    <p className="text-[12px] text-gr-muted">{formatNum(stockKg, 1)} kg · {formatNum(kgToQQ(stockKg), 2)} QQ</p>
                  </div>
                  <Badge color={low ? 'red' : warn ? 'yellow' : 'green'}>
                    {low ? 'Bajo' : warn ? 'Alerta' : 'OK'}
                  </Badge>
                </div>
                <div className="hidden md:grid gap-3 items-center"
                  style={{ gridTemplateColumns: '1fr 110px 110px 90px 80px' }}>
                  <span className="font-700 text-gr-text text-[13.5px]">{mp.nombre}</span>
                  <span className="text-right font-900 text-[14px] text-gr-text">
                    {formatNum(stockKg, 1)}
                  </span>
                  <span className="text-right font-900 text-[14px] text-gr-primary">
                    {formatNum(kgToQQ(stockKg), 2)}
                  </span>
                  <span className="text-right text-[12.5px] text-gr-muted">{formatNum(minKg, 1)}</span>
                  <Badge color={low ? 'red' : warn ? 'yellow' : 'green'}>
                    {low ? 'Bajo' : warn ? 'Alerta' : 'OK'}
                  </Badge>
                </div>
              </div>
            );
          })}
          <div className="px-5 py-3 flex items-center justify-between border-t border-gr-border"
            style={{ background: 'var(--color-gr-border-lite)' }}>
            <span className="text-[13px] text-gr-muted">{materiaPrima.length} materias primas</span>
            <span className="font-900 text-[14px] text-gr-primary">
              {formatNum(materiaPrima.reduce((s, m) => s + Number(m.stockActualKg), 0), 1)} kg totales
            </span>
          </div>
          <Pagination page={mpPag.page} totalPages={mpPag.totalPages} onChange={mpPag.setPage}
            pageSize={mpPag.pageSize} onPageSizeChange={mpPag.setPageSize} total={mpPag.total} />
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
