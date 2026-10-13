'use client';
import { useState } from 'react';
import { useProductos } from '@/lib/api/productos';
import { useLotes } from '@/lib/api/produccion';
import { useUnidades } from '@/lib/api/catalogos';
import { TipoUnidad } from '@/lib/types';
import { formatNum, KG_POR_QQ } from '@/lib/utils';
import { Spinner } from '@/components/ui';
import { Info, LayoutGrid, Table2 } from 'lucide-react';
import { ProductCard } from './_components/ProductCard';
import { LotesTablaView } from './_components/LotesTablaView';

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
      const abrev  = Math.abs(factor - KG_POR_QQ) < 0.5
        ? 'QQ'
        : (unidad?.abreviatura ?? unidad?.codigo ?? `${formatNum(factor, 0)}kg`);
      tableUnits.push({ factor, abrev });
    }
  }
  if (!tableUnits.find(u => Math.abs(u.factor - 1) < 0.1)) {
    tableUnits.push({ factor: 1, abrev: 'kg' });
  }
  if (!tableUnits.find(u => Math.abs(u.factor - KG_POR_QQ) < 0.5)) {
    tableUnits.push({ factor: KG_POR_QQ, abrev: 'QQ' });
  }

  const defaultTableUnit = tableUnits[0] ?? { factor: 1, abrev: 'kg' };
  const [tableUnit, setTableUnit] = useState<{ factor: number; abrev: string }>(defaultTableUnit);
  const [vista, setVista] = useState<'cards' | 'tabla'>('cards');

  if (productosQ.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner size={28} color="var(--color-gr-primary)" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[22px] font-900 text-gr-text">Stock de Productos</h1>
          <p className="text-gr-muted text-[13.5px] mt-0.5">
            Productos terminados · las ventas descuentan automáticamente
          </p>
        </div>
        <div className="flex rounded-[10px] overflow-hidden border border-gr-border shrink-0">
          <button type="button" onClick={() => setVista('cards')}
            className={`flex items-center gap-1.5 px-3 py-2 text-[12.5px] font-700 transition-all ${
              vista === 'cards' ? 'bg-gr-primary text-white' : 'bg-white text-gr-muted hover:text-gr-text'
            }`}>
            <LayoutGrid size={14} /> Tarjetas
          </button>
          <button type="button" onClick={() => setVista('tabla')}
            className={`flex items-center gap-1.5 px-3 py-2 text-[12.5px] font-700 transition-all ${
              vista === 'tabla' ? 'bg-gr-primary text-white' : 'bg-white text-gr-muted hover:text-gr-text'
            }`}>
            <Table2 size={14} /> Tabla
          </button>
        </div>
      </div>

      <div className="bg-gr-info-bg border border-gr-info/20 rounded-[12px] px-5 py-3 flex items-center gap-3">
        <Info size={15} className="text-gr-info shrink-0" />
        <p className="text-[13px] text-gr-info font-500">
          <strong>Las ventas y bajas se registran desde Producción.</strong> Esta vista muestra el inventario actual.
        </p>
      </div>

      {vista === 'cards' && (
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
      )}

      {vista === 'tabla' && (
        <LotesTablaView
          productos={productos}
          getLotes={getLotes}
          tableUnits={tableUnits}
          tableUnit={tableUnit}
          setTableUnit={setTableUnit}
        />
      )}
    </div>
  );
}
