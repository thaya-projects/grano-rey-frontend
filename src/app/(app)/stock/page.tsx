'use client';
import { useState } from 'react';
import { useProductos } from '@/lib/api/productos';
import { useLotes } from '@/lib/api/produccion';
import { useUnidades } from '@/lib/api/catalogos';
import { type Producto, type LoteProduccion, type UnidadMedida, TipoUnidad } from '@/lib/types';
import { formatNum, formatBs } from '@/lib/utils';
import { StockBar, Badge, Spinner } from '@/components/ui';
import { Info } from 'lucide-react';

// ─── Sub-componente: card de producto con toggle de unidad ─────
function ProductCard({
  p,
  lotesActivos,
  unidadesPeso,
}: {
  p: Producto;
  lotesActivos: LoteProduccion[];
  unidadesPeso: UnidadMedida[];
}) {
  const stockKg = Number(p.stockActual) * (Number(p.unidadProduccion?.factorABase) || 1);
  const minKg   = Number(p.stockMinimo)  * (Number(p.unidadProduccion?.factorABase) || 1);
  const low     = stockKg < minKg;
  const warn    = !low && stockKg < minKg * 2;

  // Agrupar lotes por unidad (factor)
  type Grupo = { factor: number; abrev: string; restanteKg: number; cantidades: number[] };
  const grupos: Grupo[] = [];
  for (const l of lotesActivos) {
    const cant = Number(l.cantidadProducida);
    if (cant <= 0) continue;
    const factor  = Number(l.totalKg) / cant;
    const unidad  = l.unidad ?? unidadesPeso.find(u => Math.abs(Number(u.factorABase) - factor) < 0.5);
    const abrev   = unidad?.abreviatura ?? unidad?.codigo ?? `${Math.round(factor)}kg`;
    const restante = Number(l.stockRestante);
    const restanteKg = restante * factor;
    const existing = grupos.find(g => Math.abs(g.factor - factor) < 0.5);
    if (existing) {
      existing.restanteKg += restanteKg;
      existing.cantidades.push(restante);
    } else {
      grupos.push({ factor, abrev, restanteKg, cantidades: [restante] });
    }
  }

  // Unidades disponibles para el toggle: cada unidad de los lotes + kg siempre
  const unitsDisponibles: { factor: number; abrev: string }[] = [
    ...grupos.map(g => ({ factor: g.factor, abrev: g.abrev })),
  ];
  if (!unitsDisponibles.find(u => Math.abs(u.factor - 1) < 0.1)) {
    unitsDisponibles.push({ factor: 1, abrev: 'kg' });
  }

  const defaultFactor = grupos.length > 0 ? grupos[0].factor : 1;
  const [selFactor, setSelFactor] = useState(defaultFactor);

  const selAbrev   = unitsDisponibles.find(u => Math.abs(u.factor - selFactor) < 0.1)?.abrev ?? 'kg';
  const stockDisplay = selFactor > 0 ? Math.round(stockKg / selFactor) : Math.round(stockKg);
  const minDisplay   = selFactor > 0 ? Math.round(minKg / selFactor) : Math.round(minKg);

  // Desglose por grupo de unidad (solo si hay más de uno o si difiere de la unidad elegida)
  const desglose = grupos.length > 1
    ? grupos.map(g => `${Math.round(g.restanteKg / g.factor)} ${g.abrev}`).join(' + ')
    : null;

  return (
    <div className="card border-t-4 flex flex-col gap-3"
      style={{ borderTopColor: low ? 'var(--color-gr-danger)' : warn ? 'var(--color-gr-warning)' : 'var(--color-gr-success)' }}>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[10.5px] font-700 text-gr-muted uppercase tracking-wide font-mono">{p.codigo}</p>
          <p className="font-800 text-gr-text text-[13.5px] leading-tight mt-0.5">{p.nombre}</p>
        </div>
        <Badge color={low ? 'red' : warn ? 'yellow' : 'green'} className="shrink-0 ml-2">
          {low ? 'Crítico' : warn ? 'Bajo' : 'OK'}
        </Badge>
      </div>

      {/* Número principal + pills de unidad */}
      <div>
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[36px] font-900 text-gr-text leading-none">{formatNum(stockDisplay, 0)}</span>
            <span className="text-[13px] font-600 text-gr-muted">{selAbrev}</span>
          </div>

          {/* Pills */}
          {unitsDisponibles.length > 1 && (
            <div className="flex rounded-[8px] overflow-hidden border border-gr-border shrink-0">
              {unitsDisponibles.map(u => (
                <button key={u.factor} type="button"
                  onClick={() => setSelFactor(u.factor)}
                  className={`px-2.5 py-1 text-[11px] font-700 transition-all ${
                    Math.abs(u.factor - selFactor) < 0.1
                      ? 'bg-gr-primary text-white'
                      : 'bg-white text-gr-muted hover:text-gr-text'
                  }`}>
                  {u.abrev}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desglose por unidad cuando hay mixtas */}
        {desglose && (
          <p className="text-[11.5px] text-gr-muted mt-1">
            {desglose}
            <span className="mx-1 opacity-40">·</span>
            {formatNum(stockKg, 0)} kg total
          </p>
        )}
        {!desglose && (
          <p className="text-[12px] text-gr-muted mt-0.5">
            {formatNum(stockKg, 0)} kg · mín {minDisplay} {selAbrev} · vida útil {p.vidaUtilMeses}m
          </p>
        )}
      </div>

      <StockBar value={stockDisplay} min={minDisplay} />
    </div>
  );
}

// ─── Página principal ──────────────────────────────────────────
export default function StockPage() {
  const productosQ = useProductos();
  const lotesQ     = useLotes();
  const unidadesQ  = useUnidades();

  const productos    = productosQ.data ?? [];
  const lotes        = lotesQ.data ?? [];
  const unidadesPeso = (unidadesQ.data ?? []).filter(u => u.tipo === TipoUnidad.PESO);

  const getLotes = (pid: string) =>
    lotes
      .filter(l => l.producto?.id === pid && Number(l.stockRestante) > 0)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const allActiveLotes = productos.flatMap(p => getLotes(p.id));

  // Unidades únicas de todos los lotes activos (derivadas de totalKg/cantidadProducida)
  const tableUnits: { factor: number; abrev: string }[] = [];
  for (const l of allActiveLotes) {
    const cant = Number(l.cantidadProducida);
    if (cant <= 0) continue;
    const factor = Number(l.totalKg) / cant;
    const already = tableUnits.find(u => Math.abs(u.factor - factor) < 0.5);
    if (!already) {
      const unidad = l.unidad ?? unidadesPeso.find(u => Math.abs(Number(u.factorABase) - factor) < 0.5);
      const abrev  = unidad?.abreviatura ?? unidad?.codigo ?? `${Math.round(factor)}kg`;
      tableUnits.push({ factor, abrev });
    }
  }
  if (!tableUnits.find(u => Math.abs(u.factor - 1) < 0.1)) {
    tableUnits.push({ factor: 1, abrev: 'kg' });
  }

  const defaultTableUnit = tableUnits[0] ?? { factor: 1, abrev: 'kg' };
  const [tableUnit, setTableUnit] = useState<{ factor: number; abrev: string }>(defaultTableUnit);

  if (productosQ.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner size={28} color="var(--color-gr-primary)" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-[22px] font-900 text-gr-text">Stock de Productos</h1>
        <p className="text-gr-muted text-[13.5px] mt-0.5">
          Productos terminados · las ventas descuentan automáticamente
        </p>
      </div>

      <div className="bg-[var(--color-gr-info-bg)] border border-[var(--color-gr-info)]/20 rounded-[12px] px-5 py-3 flex items-center gap-3">
        <Info size={15} className="text-[var(--color-gr-info)] shrink-0" />
        <p className="text-[13px] text-[var(--color-gr-info)] font-500">
          <strong>Las ventas y bajas se registran desde Producción.</strong> Esta vista muestra el inventario actual.
        </p>
      </div>

      {/* Product cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {productos.map(p => (
          <ProductCard
            key={p.id}
            p={p}
            lotesActivos={getLotes(p.id)}
            unidadesPeso={unidadesPeso}
          />
        ))}
      </div>

      {/* Lote table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-700 text-gr-muted uppercase tracking-wide">
            Lotes activos · trazabilidad SENASAG
          </h2>
          {/* Pills de unidad para la tabla */}
          {tableUnits.length > 1 && (
            <div className="flex rounded-[8px] overflow-hidden border border-gr-border shrink-0">
              {tableUnits.map(u => (
                <button key={u.factor} type="button"
                  onClick={() => setTableUnit(u)}
                  className={`px-2.5 py-1 text-[11px] font-700 transition-all ${
                    Math.abs(u.factor - tableUnit.factor) < 0.1
                      ? 'bg-gr-primary text-white'
                      : 'bg-white text-gr-muted hover:text-gr-text'
                  }`}>
                  {u.abrev}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="card-no-pad">
          <div className="overflow-x-auto">
          <div style={{ minWidth: 620 }}>
          <div className="hidden md:grid gap-4 px-5 py-3 text-[11.5px] font-700 text-gr-muted uppercase tracking-wide border-b border-gr-border"
            style={{ gridTemplateColumns: '180px 1fr auto auto auto auto', background: 'var(--color-gr-border-lite)' }}>
            <span>Código Lote</span><span>Producto</span>
            <span className="text-right">Disponible ({tableUnit.abrev})</span>
            <span>Producido ({tableUnit.abrev})</span>
            <span>Vence</span><span>Estado</span>
          </div>

          {productos.flatMap(p => {
            const lotesProd = getLotes(p.id);
            if (lotesProd.length === 0) return [];
            return lotesProd.map((l, i) => {
              const cant       = Number(l.cantidadProducida);
              const restante   = Number(l.stockRestante);
              const totalKg    = Number(l.totalKg);
              const pct        = cant > 0 ? restante / cant : 0;
              const status     = pct < 0.15 ? 'red' : pct < 0.4 ? 'yellow' : 'green';
              const isLast     = i === lotesProd.length - 1;
              // Factor real del lote (kg por unidad)
              const factorLote = cant > 0 ? totalKg / cant : 1;
              const restanteKg = restante * factorLote;
              // Convertir a la unidad seleccionada en la tabla
              const dispRestante  = formatNum(restanteKg / tableUnit.factor, tableUnit.factor === 1 ? 0 : 2);
              const dispProducido = formatNum(totalKg / tableUnit.factor, tableUnit.factor === 1 ? 0 : 2);
              return (
                <div key={l.id}
                  className={`border-b ${isLast ? 'border-b-gr-border' : 'border-b-gr-border-lite'}`}>
                  {/* Mobile */}
                  <div className="flex items-center justify-between px-5 py-3.5 md:hidden">
                    <div>
                      <p className="font-700 text-gr-text text-[13px]">{l.codigoLote}</p>
                      <p className="text-[12px] text-gr-muted">
                        {dispRestante} {tableUnit.abrev} · vence {l.fechaVencimiento}
                      </p>
                    </div>
                    <Badge color={status}>{status === 'red' ? 'Agotando' : status === 'yellow' ? 'Medio' : 'OK'}</Badge>
                  </div>
                  {/* Desktop */}
                  <div className="hidden md:grid gap-4 px-5 py-3.5 items-center"
                    style={{ gridTemplateColumns: '180px 1fr auto auto auto auto' }}>
                    <span className="font-700 font-mono text-[12.5px] text-gr-primary">{l.codigoLote}</span>
                    <div>
                      <p className="font-600 text-gr-text text-[13px]">{p.nombre}</p>
                      <p className="text-[11.5px] text-gr-muted">{p.codigo}{l.registroSanitario ? ` · ${l.registroSanitario}` : ''}</p>
                    </div>
                    <span className="text-right font-800 text-gr-text text-[14px]">
                      {dispRestante}
                      <span className="text-[11px] font-500 text-gr-muted ml-1">{tableUnit.abrev}</span>
                    </span>
                    <span className="text-[13px] text-gr-sub">
                      {dispProducido} {tableUnit.abrev} · {l.fecha}
                    </span>
                    <span className="text-[13px] text-gr-muted">{l.fechaVencimiento}</span>
                    <Badge color={status}>{pct < 0.15 ? 'Agotando' : pct < 0.4 ? 'Medio' : 'Disponible'}</Badge>
                  </div>
                </div>
              );
            });
          })}

          {productos.reduce((s, p) => s + getLotes(p.id).length, 0) === 0 && (
            <div className="py-12 text-center text-gr-muted text-[13.5px]">
              Sin lotes activos. Registrá producción desde la sección Producción.
            </div>
          )}

          <div className="px-5 py-3 flex items-center justify-between text-[12.5px]"
            style={{ background: 'var(--color-gr-border-lite)' }}>
            <span className="text-gr-muted">
              {productos.reduce((s, p) => s + getLotes(p.id).length, 0)} lotes activos
            </span>
            <span className="font-700 text-gr-text">
              Valor inventario: {formatBs(productos.reduce((s, p) => s + Number(p.stockActual) * Number(p.precioUnitarioBs ?? 0), 0))}
            </span>
          </div>
          </div>
          </div>
        </div>
      </div>

    </div>
  );
}
