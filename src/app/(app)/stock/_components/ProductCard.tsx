import { useState } from 'react';
import { type Producto, type LoteProduccion, type UnidadMedida } from '@/lib/types';
import { formatNum, KG_POR_QQ } from '@/lib/utils';
import { StockBar, Badge } from '@/components/ui';

/** Card de producto con toggle de unidad (kg / QQ / unidad propia del lote). */
export function ProductCard({
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
    // Cualquier unidad con factor ≈46kg es un quintal — se muestra siempre "QQ",
    // sin importar cómo esté nombrada en el catálogo (evita etiquetas feas tipo "qq46").
    const abrev   = Math.abs(factor - KG_POR_QQ) < 0.5
      ? 'QQ'
      : (unidad?.abreviatura ?? unidad?.codigo ?? `${formatNum(factor, 0)}kg`);
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

  // Unidades disponibles para el toggle: cada unidad de los lotes + kg y QQ siempre
  const unitsDisponibles: { factor: number; abrev: string }[] = [
    ...grupos.map(g => ({ factor: g.factor, abrev: g.abrev })),
  ];
  if (!unitsDisponibles.find(u => Math.abs(u.factor - 1) < 0.1)) {
    unitsDisponibles.push({ factor: 1, abrev: 'kg' });
  }
  if (!unitsDisponibles.find(u => Math.abs(u.factor - KG_POR_QQ) < 0.5)) {
    unitsDisponibles.push({ factor: KG_POR_QQ, abrev: 'QQ' });
  }

  const defaultFactor = grupos.length > 0 ? grupos[0].factor : 1;
  const [selFactor, setSelFactor] = useState(defaultFactor);

  const selAbrev   = unitsDisponibles.find(u => Math.abs(u.factor - selFactor) < 0.1)?.abrev ?? 'kg';
  // Solo kg (factor 1) muestra entero; cualquier otra unidad convertida (QQ, bolsas de otro peso, etc.)
  // muestra 2 decimales para no perder precisión en la conversión.
  const displayDecimals = Math.abs(selFactor - 1) < 0.1 ? 0 : 2;
  const stockDisplay = selFactor > 0 ? stockKg / selFactor : stockKg;
  const minDisplay   = selFactor > 0 ? minKg / selFactor : minKg;

  // Desglose por grupo de unidad (solo si hay más de uno o si difiere de la unidad elegida)
  const desglose = grupos.length > 1
    ? grupos.map(g => `${formatNum(g.restanteKg / g.factor, Math.abs(g.factor - 1) < 0.1 ? 0 : 2)} ${g.abrev}`).join(' + ')
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
            <span className="text-[36px] font-900 text-gr-text leading-none">{formatNum(stockDisplay, displayDecimals)}</span>
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
            {formatNum(stockKg, 0)} kg · mín {formatNum(minDisplay, displayDecimals)} {selAbrev} · vida útil {p.vidaUtilMeses}m
          </p>
        )}
      </div>

      <StockBar value={stockDisplay} min={minDisplay} />
    </div>
  );
}
