'use client';
import { useEffect, useMemo, useState } from 'react';
import { HardHat, X, Users, Info } from 'lucide-react';
import { Btn, FormField, Input, Select } from '@/components/ui';
import { useCargadores } from '@/lib/api/cargadores';
import {
  TipoPagoCarga,
  type Cargador,
  type CreateCargaTrabajoRequest,
} from '@/lib/types';
import { formatBs, formatNum } from '@/lib/utils';

export interface CargaDraft extends CreateCargaTrabajoRequest {
  _id: string;
}

interface Props {
  /** Total esperado (bolsas) — el usuario puede editarlo. */
  totalEsperado?: number;
  unidadTotal?: string;
  tipoPago: TipoPagoCarga;
  onTipoPagoChange: (t: TipoPagoCarga) => void;
  tarifaBs: number;
  onTarifaChange: (v: number) => void;
  cargas: CargaDraft[];
  onCargasChange: (rows: CargaDraft[]) => void;
}

/**
 * Panel reutilizable para registrar cargas de estibaje.
 *
 * Flujo:
 * - Usuario elige forma de pago (bolsa/jornal) y tarifa global.
 * - Ingresa total de bolsas a repartir.
 * - Agrega cargadores → cada uno recibe una porción igual.
 * - Puede editar la cantidad real que cargó cada uno; el resto se rebalancea.
 * - En modo Jornal, cada cargador cobra 1 día fijo.
 *
 * UX: tipografía grande, campos anchos, alineación estricta en grid,
 * pensada para operador de ~47 años.
 */
export function CargasSection({
  totalEsperado,
  unidadTotal = 'bolsas',
  tipoPago,
  onTipoPagoChange,
  tarifaBs,
  onTarifaChange,
  cargas,
  onCargasChange,
}: Props) {
  const cargadoresQ = useCargadores();
  const cargadores = cargadoresQ.data ?? [];

  // Total local que el usuario puede editar en el panel.
  const [totalLocal, setTotalLocal] = useState<number>(totalEsperado ?? 0);
  useEffect(() => {
    setTotalLocal(totalEsperado ?? 0);
  }, [totalEsperado]);

  const disponibles = cargadores.filter(
    (c) => !cargas.some((row) => row.cargadorId === c.id),
  );

  const totalCargado = cargas.reduce((s, c) => s + Number(c.cantidad || 0), 0);
  const totalBs = cargas.reduce(
    (s, c) => s + Number(c.cantidad || 0) * Number(c.tarifaBs || 0),
    0,
  );
  const esJornal = tipoPago === TipoPagoCarga.JORNAL;
  const diff = round2((totalLocal || 0) - totalCargado);

  // Redistribuir equitativamente cuando cambia el total y todos están parejos
  useEffect(() => {
    if (esJornal) return;
    if (cargas.length === 0) return;
    const parejos = cargas.every((c) => c.cantidad === cargas[0].cantidad);
    if (!parejos) return;
    const parte = totalLocal > 0 ? round2(totalLocal / cargas.length) : 0;
    if (Math.abs(parte - cargas[0].cantidad) < 0.001) return;
    onCargasChange(cargas.map((c) => ({ ...c, cantidad: parte })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalLocal, cargas.length, esJornal]);

  function addCargador(cargadorId: string) {
    const siguienteCount = cargas.length + 1;
    let cantidad = 0;
    if (esJornal) cantidad = 1;
    else if (totalLocal > 0) cantidad = round2(totalLocal / siguienteCount);
    const nueva: CargaDraft = {
      _id: crypto.randomUUID(),
      cargadorId,
      tipoPago,
      cantidad,
      tarifaBs,
    };
    let siguientes = [...cargas, nueva];
    if (!esJornal && totalLocal > 0 && cargas.every((c) => c.cantidad === cargas[0]?.cantidad)) {
      const parte = round2(totalLocal / siguienteCount);
      siguientes = siguientes.map((c) => ({ ...c, cantidad: parte }));
    }
    onCargasChange(siguientes);
  }

  function removeCargador(idx: number) {
    const siguientes = cargas.filter((_, i) => i !== idx);
    if (!esJornal && totalLocal > 0 && siguientes.length > 0 &&
        cargas.every((c) => c.cantidad === cargas[0].cantidad)) {
      const parte = round2(totalLocal / siguientes.length);
      onCargasChange(siguientes.map((c) => ({ ...c, cantidad: parte })));
    } else {
      onCargasChange(siguientes);
    }
  }

  function editarCantidad(idx: number, valor: number) {
    if (esJornal) return;
    if (totalLocal > 0 && cargas.length > 1) {
      // Rebalancear: lo que queda se reparte entre los demás
      const resto = Math.max(0, round2(totalLocal - valor));
      const otros = cargas.length - 1;
      const parte = otros > 0 ? round2(resto / otros) : 0;
      onCargasChange(
        cargas.map((c, i) => (i === idx
          ? { ...c, cantidad: valor }
          : { ...c, cantidad: parte })),
      );
    } else {
      onCargasChange(cargas.map((c, i) => (i === idx ? { ...c, cantidad: valor } : c)));
    }
  }

  function handleTarifaChange(v: number) {
    onTarifaChange(v);
    onCargasChange(cargas.map((c) => ({ ...c, tarifaBs: v })));
  }

  function handleTipoChange(t: TipoPagoCarga) {
    onTipoPagoChange(t);
    onCargasChange(
      cargas.map((c) => ({
        ...c,
        tipoPago: t,
        cantidad: t === TipoPagoCarga.JORNAL ? 1 : c.cantidad,
      })),
    );
  }

  const unidadCorta = esJornal ? 'día' : unidadTotal;
  // Grid: nombre (flex) · cantidad 180px · pagar 170px · borrar 44px
  const gridColsClass = 'md:grid-cols-[minmax(200px,1fr)_180px_170px_44px]';

  return (
    <div className="rounded-[14px] border-2 border-[var(--color-gr-border)] overflow-hidden bg-white">
      {/* ─── Header ─── */}
      <div
        className="px-5 py-3.5 flex items-center gap-3 border-b border-[var(--color-gr-border)]"
        style={{ background: 'var(--color-gr-primary-lite)' }}
      >
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: 'var(--color-gr-primary)' }}>
          <HardHat size={20} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-800 text-[15px] text-[var(--color-gr-text)] leading-tight">
            Cargadores / estibaje
          </p>
          <p className="text-[12.5px] text-[var(--color-gr-muted)] leading-tight mt-0.5">
            Quién bajó la carga y cuánto se le paga (opcional)
          </p>
        </div>
        {cargas.length > 0 && (
          <span
            className="ml-auto text-[12.5px] font-800 px-3 py-1 rounded-full whitespace-nowrap"
            style={{ background: 'var(--color-gr-primary)', color: '#fff' }}
          >
            {cargas.length} cargador{cargas.length !== 1 ? 'es' : ''}
          </span>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* ─── Fila de config: forma de pago / tarifa / total ─── */}
        <div className="grid grid-cols-12 gap-4">
          <FormField
            label="Forma de pago"
            hint="Aplica a todos"
            className="col-span-12 md:col-span-5"
          >
            <div className="grid grid-cols-2 gap-2">
              <TipoPagoBtn
                active={tipoPago === TipoPagoCarga.BOLSA}
                onClick={() => handleTipoChange(TipoPagoCarga.BOLSA)}
              >
                Por bolsa
              </TipoPagoBtn>
              <TipoPagoBtn
                active={tipoPago === TipoPagoCarga.JORNAL}
                onClick={() => handleTipoChange(TipoPagoCarga.JORNAL)}
              >
                Por jornal
              </TipoPagoBtn>
            </div>
          </FormField>

          <FormField
            label={esJornal ? 'Tarifa por jornal (Bs)' : 'Tarifa por bolsa (Bs)'}
            hint={cargas.length > 1 ? 'Misma para todos' : undefined}
            className="col-span-6 md:col-span-4"
          >
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={tarifaBs || ''}
              onChange={(e) => handleTarifaChange(parseFloat(e.target.value) || 0)}
              className="text-[17px] font-800 h-11"
            />
          </FormField>

          {!esJornal && (
            <FormField
              label={`Total de ${unidadTotal}`}
              hint="Se divide entre los cargadores"
              className="col-span-6 md:col-span-3"
            >
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={totalLocal || ''}
                onChange={(e) => setTotalLocal(parseFloat(e.target.value) || 0)}
                className="text-[17px] font-800 h-11 text-center"
              />
            </FormField>
          )}
        </div>

        {/* ─── Filas de cargadores ─── */}
        {cargas.length === 0 ? (
          <div
            className="rounded-[12px] border-2 border-dashed border-[var(--color-gr-border)] px-4 py-5 flex items-center gap-4"
            style={{ background: 'var(--color-gr-border-lite)' }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: '#fff' }}>
              <Users size={18} className="text-[var(--color-gr-muted)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] text-[var(--color-gr-text)] font-700 leading-tight">
                Elegí un cargador para empezar
              </p>
              <p className="text-[12px] text-[var(--color-gr-muted)] leading-tight mt-0.5">
                Podés agregar varios — el total se divide entre todos
              </p>
            </div>
            {disponibles.length > 0 && (
              <Select
                value=""
                onChange={(e) => e.target.value && addCargador(e.target.value)}
                className="text-[13.5px] h-11 w-[240px] shrink-0"
              >
                <option value="">— Seleccionar cargador —</option>
                {disponibles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}{c.ci ? ` · CI ${c.ci}` : ''}
                  </option>
                ))}
              </Select>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Cabecera de la grilla */}
            <div className={`hidden md:grid ${gridColsClass} items-center gap-3 px-4 text-[11px] font-700 uppercase tracking-wider text-[var(--color-gr-muted)]`}>
              <span>Cargador</span>
              <span className="text-center">Cantidad {esJornal ? '' : `(${unidadTotal})`}</span>
              <span className="text-right">A pagar (Bs)</span>
              <span />
            </div>
            {cargas.map((row, idx) => (
              <CargaRow
                key={row._id}
                row={row}
                cargador={cargadores.find((c) => c.id === row.cargadorId)}
                unidadCorta={unidadCorta}
                editable={!esJornal}
                gridColsClass={gridColsClass}
                onCantidadChange={(v) => editarCantidad(idx, v)}
                onRemove={() => removeCargador(idx)}
              />
            ))}

            {/* Selector inline para añadir más */}
            {disponibles.length > 0 && (
              <Select
                value=""
                onChange={(e) => e.target.value && addCargador(e.target.value)}
                className="text-[13.5px] h-11"
              >
                <option value="">+ Agregar otro cargador…</option>
                {disponibles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}{c.ci ? ` · CI ${c.ci}` : ''}
                  </option>
                ))}
              </Select>
            )}
          </div>
        )}

        {/* ─── Aviso de balance ─── */}
        {!esJornal && cargas.length > 0 && totalLocal > 0 && Math.abs(diff) > 0.01 && (
          <div
            className="rounded-[10px] px-4 py-3 flex items-center gap-2 text-[13px] font-600"
            style={{ background: '#fff7e6', color: '#a05c0a' }}
          >
            <Info size={16} />
            <span>
              Total: <strong>{formatNum(totalLocal, 2)}</strong> {unidadTotal} ·
              Repartido: <strong>{formatNum(totalCargado, 2)}</strong> ·
              Diferencia: <strong>{formatNum(diff, 2)}</strong>
            </span>
          </div>
        )}

        {/* ─── Footer con total en Bs ─── */}
        {cargas.length > 0 && (
          <div
            className="rounded-[12px] px-5 py-4 flex items-center justify-between"
            style={{ background: 'var(--color-gr-primary)' }}
          >
            <div>
              <p className="text-[11.5px] font-700 uppercase tracking-widest text-white/80">
                Total estibaje
              </p>
              <p className="text-[12px] text-white/70 mt-0.5">
                {esJornal
                  ? `${cargas.length} cargador${cargas.length !== 1 ? 'es' : ''} × ${formatBs(tarifaBs)} / jornal`
                  : `${formatNum(totalCargado, 2)} ${unidadTotal} × ${formatBs(tarifaBs)}`}
              </p>
            </div>
            <p className="font-900 text-white text-[26px] leading-none tracking-tight">
              {formatBs(totalBs)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TipoPagoBtn({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[10px] h-11 px-3 text-[13.5px] font-700 border-2 transition-all"
      style={{
        background: active ? 'var(--color-gr-primary)' : '#fff',
        color: active ? '#fff' : 'var(--color-gr-text)',
        borderColor: active ? 'var(--color-gr-primary)' : 'var(--color-gr-border)',
      }}
    >
      {children}
    </button>
  );
}

function CargaRow({
  row, cargador, unidadCorta, editable, gridColsClass, onCantidadChange, onRemove,
}: {
  row: CargaDraft;
  cargador?: Cargador;
  unidadCorta: string;
  editable: boolean;
  gridColsClass: string;
  onCantidadChange: (v: number) => void;
  onRemove: () => void;
}) {
  const monto = useMemo(
    () => Number(row.cantidad || 0) * Number(row.tarifaBs || 0),
    [row.cantidad, row.tarifaBs],
  );
  return (
    <div className={`grid grid-cols-1 ${gridColsClass} items-center gap-3 rounded-[12px] border-2 border-[var(--color-gr-border-lite)] px-4 py-3.5 bg-white`}>
      {/* Cargador */}
      <div className="min-w-0">
        <p className="font-800 text-[15px] text-[var(--color-gr-text)] leading-tight truncate">
          {cargador?.nombre ?? '—'}
        </p>
        {cargador?.ci && (
          <p className="text-[12px] text-[var(--color-gr-muted)] leading-tight mt-0.5">
            CI {cargador.ci}
          </p>
        )}
      </div>

      {/* Cantidad */}
      <div className="flex items-center gap-2 justify-center">
        {editable ? (
          <Input
            type="number"
            min="0"
            step="0.01"
            value={row.cantidad || ''}
            onChange={(e) => onCantidadChange(parseFloat(e.target.value) || 0)}
            className="text-center text-[17px] font-800 h-11"
          />
        ) : (
          <div className="w-full h-11 flex items-center justify-center rounded-[10px] border-2 border-[var(--color-gr-border-lite)] bg-[var(--color-gr-border-lite)] text-[17px] font-800 text-[var(--color-gr-text)]">
            1
          </div>
        )}
        <span className="text-[12px] text-[var(--color-gr-muted)] whitespace-nowrap">
          {unidadCorta}
        </span>
      </div>

      {/* A pagar */}
      <div className="text-right">
        <p className="text-[10px] md:hidden font-700 text-[var(--color-gr-muted)] uppercase">A pagar</p>
        <p className="font-900 text-[19px] text-[var(--color-gr-primary)] leading-tight">
          {formatBs(monto)}
        </p>
      </div>

      {/* Eliminar */}
      <div className="flex md:justify-center">
        <Btn variant="ghost" size="sm" onClick={onRemove}>
          <X size={16} />
        </Btn>
      </div>
    </div>
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
