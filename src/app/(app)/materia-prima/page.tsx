'use client';
import { useMemo, useState } from 'react';
import { useMateriasPrimas, useKardexMP, useKardexMPPendientesPago } from '@/lib/api/materia-prima';
import { useProveedores, useUnidades } from '@/lib/api/catalogos';
import { useLotes } from '@/lib/api/produccion';
import { TipoMovimientoMP, type MateriaPrima } from '@/lib/types';
import { formatNum, formatBs, kgToQQ } from '@/lib/utils';
import { Spinner, useToast } from '@/components/ui';
import { MPRow } from './_components/MPRow';
import { EntradaModal } from './_components/EntradaModal';
import { MovimientoMPModal } from './_components/MovimientoMPModal';

export default function MateriaPrimaPage() {
  const toast = useToast(s => s.show);
  const mpQ             = useMateriasPrimas();
  const proveedoresQ    = useProveedores();
  const unidadesQ       = useUnidades();
  const pendientesPagoQ = useKardexMPPendientesPago();
  const allKardexQ      = useKardexMP();

  const materiasPrimas = mpQ.data ?? [];
  const proveedores    = proveedoresQ.data ?? [];
  const unidades       = unidadesQ.data ?? [];
  const pendientesPago = pendientesPagoQ.data ?? [];
  const allKardex      = allKardexQ.data ?? [];

  const [entradaModal, setEntradaModal]     = useState<MateriaPrima | null>(null);
  const [movimientoModal, setMovimientoModal] = useState<MateriaPrima | null>(null);
  const lotesQ = useLotes();

  // Resumen — todos los useMemo antes del early return
  const totalKg = useMemo(
    () => materiasPrimas.reduce((s, m) => s + Number(m.stockActualKg), 0),
    [materiasPrimas],
  );

  const totalIngresadoKg = useMemo(
    () => allKardex
      .filter(k => k.tipoMovimiento === TipoMovimientoMP.INGRESO)
      .reduce((s, k) => s + Number(k.cantidadKg), 0),
    [allKardex],
  );

  const totalConsumidoKg = Math.max(0, totalIngresadoKg - totalKg);
  const stockBajoCount = useMemo(
    () => materiasPrimas.filter(
      m => Number(m.stockMinimoKg) > 0 && Number(m.stockActualKg) < Number(m.stockMinimoKg)
    ).length,
    [materiasPrimas],
  );
  const pendBs = useMemo(
    () => pendientesPago.reduce((s, k) => s + Number(k.costoUnitarioBs ?? 0) * Number(k.cantidad), 0),
    [pendientesPago],
  );
  const mpsSorted = useMemo(() => [...materiasPrimas].sort((a, b) => {
    const minA = Number(a.stockMinimoKg);
    const minB = Number(b.stockMinimoKg);
    if (minA === 0 && minB === 0) return a.nombre.localeCompare(b.nombre);
    if (minA === 0) return 1;
    if (minB === 0) return -1;
    return (Number(a.stockActualKg) / minA) - (Number(b.stockActualKg) / minB);
  }), [materiasPrimas]);

  if (mpQ.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-75">
        <Spinner size={28} color="var(--color-gr-primary)" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-900 text-gr-text">Materia Prima</h1>
        <p className="text-gr-muted text-[13.5px] mt-0.5">
          {materiasPrimas.length} ítems · {formatNum(kgToQQ(totalKg), 2)} QQ en stock
        </p>
      </div>

      {/* 4 tarjetas resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {/* Ingresado total */}
        <div className="card">
          <p className="text-[10px] sm:text-[11.5px] font-700 text-gr-muted uppercase tracking-wide mb-1">Ingresado</p>
          <p className="text-[20px] sm:text-[28px] font-900 text-gr-text leading-none">
            {allKardexQ.isLoading ? '…' : formatNum(kgToQQ(totalIngresadoKg), 2)}
          </p>
          <p className="text-[10px] sm:text-[12px] text-gr-muted mt-1">QQ total</p>
          <p className="text-[10px] sm:text-[11px] text-gr-muted hidden sm:block">{formatNum(totalIngresadoKg, 0)} kg</p>
        </div>

        {/* Utilizado */}
        <div className="card border-t-2" style={{ borderTopColor: totalConsumidoKg > 0 ? '#A05C0A' : '#9CA3AF' }}>
          <p className="text-[10px] sm:text-[11.5px] font-700 text-gr-muted uppercase tracking-wide mb-1">Utilizado</p>
          <p className="text-[20px] sm:text-[28px] font-900 leading-none"
            style={{ color: totalConsumidoKg > 0 ? '#A05C0A' : '#9CA3AF' }}>
            {allKardexQ.isLoading ? '…' : formatNum(kgToQQ(totalConsumidoKg), 2)}
          </p>
          <p className="text-[10px] sm:text-[12px] text-gr-muted mt-1">QQ en producción</p>
          <p className="text-[10px] sm:text-[11px] text-gr-muted hidden sm:block">{formatNum(totalConsumidoKg, 0)} kg</p>
        </div>

        {/* Disponible */}
        <div className="card border-t-2" style={{ borderTopColor: 'var(--color-gr-primary)' }}>
          <p className="text-[10px] sm:text-[11.5px] font-700 text-gr-muted uppercase tracking-wide mb-1">Disponible</p>
          <p className="text-[20px] sm:text-[28px] font-900 text-gr-primary leading-none">{formatNum(kgToQQ(totalKg), 2)}</p>
          <p className="text-[10px] sm:text-[12px] text-gr-muted mt-1">QQ en stock</p>
          <p className="text-[10px] sm:text-[11px] text-gr-muted hidden sm:block">{formatNum(totalKg, 0)} kg</p>
        </div>

        {/* Por pagar / Stock bajo */}
        <div className="card border-t-2"
          style={{ borderTopColor: stockBajoCount > 0 ? 'var(--color-gr-danger)' : pendientesPago.length > 0 ? '#e67e00' : '#2E7D52' }}>
          <p className="text-[10px] sm:text-[11.5px] font-700 text-gr-muted uppercase tracking-wide mb-1">
            {stockBajoCount > 0 ? 'Stock bajo' : 'Por pagar'}
          </p>
          {stockBajoCount > 0 ? (
            <>
              <p className="text-[20px] sm:text-[28px] font-900 leading-none" style={{ color: 'var(--color-gr-danger)' }}>
                {stockBajoCount}
              </p>
              <p className="text-[10px] sm:text-[12px] text-gr-muted mt-1">materia{stockBajoCount !== 1 ? 's' : ''}</p>
            </>
          ) : pendientesPago.length > 0 ? (
            <>
              <p className="text-[20px] sm:text-[28px] font-900 leading-none" style={{ color: '#e67e00' }}>
                {pendientesPago.length}
              </p>
              <p className="text-[10px] sm:text-[12px] text-gr-muted mt-1">compra{pendientesPago.length !== 1 ? 's' : ''}</p>
              <p className="text-[10px] sm:text-[11px] font-700 hidden sm:block" style={{ color: '#e67e00' }}>{formatBs(pendBs)}</p>
            </>
          ) : (
            <>
              <p className="text-[20px] sm:text-[28px] font-900 leading-none" style={{ color: '#2E7D52' }}>✓</p>
              <p className="text-[10px] sm:text-[12px] text-gr-muted mt-1">Sin alertas</p>
            </>
          )}
        </div>
      </div>

      {/* Lista de MP con acordeón */}
      <div>
        <p className="text-[11.5px] font-700 text-gr-muted uppercase tracking-wide mb-2">
          Materias primas · tocá una para ver sus lotes
        </p>
        <div className="card-no-pad">
          {mpsSorted.map(mp => {
            const mpKardex = allKardex.filter(k => k.materiaPrima.id === mp.id);
            return (
              <MPRow key={mp.id} mp={mp}
                kardex={mpKardex} kardexLoading={allKardexQ.isLoading}
                onEntrada={() => setEntradaModal(mp)}
                onMovimiento={() => setMovimientoModal(mp)} />
            );
          })}
          {materiasPrimas.length === 0 && (
            <p className="px-4 py-10 text-center text-gr-muted text-[14px]">Sin materias primas registradas</p>
          )}
        </div>
      </div>


      {entradaModal && (
        <EntradaModal
          mp={entradaModal}
          proveedores={proveedores}
          unidades={unidades}
          allKardex={allKardex}
          onClose={() => setEntradaModal(null)}
          onSaved={() => {
            setEntradaModal(null);
            toast('Entrada registrada en inventario', 'success');
          }}
          onError={(msg) => toast(msg, 'error')}
        />
      )}
      {movimientoModal && (
        <MovimientoMPModal
          mp={movimientoModal}
          kardex={allKardex.filter(k => k.materiaPrima.id === movimientoModal.id)}
          unidades={unidades}
          lotes={lotesQ.data ?? []}
          onClose={() => setMovimientoModal(null)}
          onSaved={(tipo) => {
            setMovimientoModal(null);
            const msg =
              tipo === TipoMovimientoMP.AJUSTE ? 'Ajuste registrado' :
              tipo === TipoMovimientoMP.DESECHO ? 'Desecho registrado' : 'Merma registrada';
            toast(msg, tipo === TipoMovimientoMP.AJUSTE ? 'success' : 'warning');
          }}
          onError={(msg) => toast(msg, 'error')}
        />
      )}
    </div>
  );
}
