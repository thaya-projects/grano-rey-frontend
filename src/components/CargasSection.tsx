'use client';
import { useEffect, useMemo, useState } from 'react';
import { HardHat, X, Users, Info, UserPlus, Check, Loader2 } from 'lucide-react';
import { Btn, FormField, Input, Select } from '@/components/ui';
import { useCargadores, useCreateCargador } from '@/lib/api/cargadores';
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
  /** Total esperado (unidades) — el usuario puede editarlo. */
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
 * - Usuario elige forma de pago (por unidad/jornal) y tarifa global.
 * - Ingresa total de unidades a repartir.
 * - Agrega cargadores → cada uno recibe una porción igual.
 * - Puede editar la cantidad real que cargó cada uno; el resto se rebalancea.
 * - En modo Jornal, cada cargador cobra 1 día fijo.
 *
 * UX: tipografía grande, campos anchos, alineación estricta en grid,
 * pensada para operador de ~47 años.
 */
export function CargasSection({
  totalEsperado,
  unidadTotal = 'unid.',
  tipoPago,
  onTipoPagoChange,
  tarifaBs,
  onTarifaChange,
  cargas,
  onCargasChange,
}: Props) {
  const cargadoresQ = useCargadores();
  const createCargador = useCreateCargador();
  const cargadores = cargadoresQ.data ?? [];

  // Registro rápido inline
  const MAX_QUICK = 5;
  const [showQuick, setShowQuick] = useState(false);
  const [quickNombre, setQuickNombre] = useState('');
  const [quickCi, setQuickCi] = useState('');
  const [quickRegistrados, setQuickRegistrados] = useState(0);

  async function handleQuickCreate() {
    if (!quickNombre.trim() || quickRegistrados >= MAX_QUICK) return;
    const nuevo = await createCargador.mutateAsync({
      nombre: quickNombre.trim(),
      ci: quickCi.trim() || undefined,
    });
    addCargador(nuevo.id);
    setQuickNombre('');
    setQuickCi('');
    setQuickRegistrados(n => n + 1);
  }

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

  return (
    <div className="rounded-[14px] border-2 border-gr-border overflow-hidden bg-white">
      {/* ─── Header ─── */}
      <div
        className="px-5 py-3.5 flex items-center gap-3 border-b border-gr-border"
        style={{ background: 'var(--color-gr-primary-lite)' }}
      >
        <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
          style={{ background: 'var(--color-gr-primary)' }}>
          <HardHat size={20} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-800 text-[15px] text-gr-text leading-tight">
            Cargadores / estibaje
          </p>
          <p className="text-[12.5px] text-gr-muted leading-tight mt-0.5">
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
                Por unidad
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
            label={esJornal ? 'Tarifa por jornal (Bs)' : 'Tarifa por unidad (Bs)'}
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
          <div className="space-y-3">
            <div
              className="rounded-[12px] border-2 border-dashed border-gr-border px-4 py-5 flex flex-wrap items-center gap-4"
              style={{ background: 'var(--color-gr-border-lite)' }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: '#fff' }}>
                <Users size={18} className="text-gr-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] text-gr-text font-700 leading-tight">
                  {cargadores.length === 0 ? 'No hay cargadores registrados' : 'Elegí un cargador para empezar'}
                </p>
                <p className="text-[12px] text-gr-muted leading-tight mt-0.5">
                  {cargadores.length === 0
                    ? 'Podés registrar hasta 5 directamente aquí'
                    : 'Podés agregar varios — el total se divide entre todos'}
                </p>
              </div>
              {disponibles.length > 0 && (
                <Select
                  value=""
                  onChange={(e) => e.target.value && addCargador(e.target.value)}
                  className="text-[13.5px] h-11 w-60 shrink-0"
                >
                  <option value="">— Seleccionar cargador —</option>
                  {disponibles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}{c.ci ? ` · CI ${c.ci}` : ''}
                    </option>
                  ))}
                </Select>
              )}
              <button
                type="button"
                onClick={() => setShowQuick(v => !v)}
                className="flex items-center gap-1.5 text-[12.5px] font-700 text-gr-primary hover:underline shrink-0"
              >
                <UserPlus size={14} />
                {showQuick ? 'Cancelar' : cargadores.length === 0 ? 'Registrar cargador' : 'Registrar nuevo'}
              </button>
            </div>

            {/* Panel de registro rápido */}
            {showQuick && quickRegistrados < MAX_QUICK && (
              <div className="rounded-[12px] border-2 border-gr-primary/30 p-4 space-y-3"
                style={{ background: 'var(--color-gr-primary-lite)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-700 text-gr-primary uppercase tracking-wide flex items-center gap-1.5">
                    <UserPlus size={13} /> Registro rápido
                  </p>
                  <p className="text-[11px] text-gr-muted">
                    {quickRegistrados}/{MAX_QUICK} registrados
                  </p>
                </div>
                <div className="flex gap-2 items-end">
                  <FormField label="Nombre" required className="flex-1">
                    <Input
                      placeholder="Juan Pérez"
                      value={quickNombre}
                      onChange={e => setQuickNombre(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleQuickCreate()}
                      autoFocus
                    />
                  </FormField>
                  <FormField label="CI (opcional)" className="w-36">
                    <Input
                      placeholder="12345678"
                      value={quickCi}
                      onChange={e => setQuickCi(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleQuickCreate()}
                    />
                  </FormField>
                  <button
                    type="button"
                    disabled={!quickNombre.trim() || createCargador.isPending}
                    onClick={handleQuickCreate}
                    className="h-10 w-10 rounded-md flex items-center justify-center shrink-0 mb-px transition-all disabled:opacity-40"
                    style={{ background: 'var(--color-gr-primary)', color: '#fff' }}
                  >
                    {createCargador.isPending
                      ? <Loader2 size={16} className="animate-spin" />
                      : <Check size={16} />}
                  </button>
                </div>
                <p className="text-[11.5px] text-gr-muted">
                  Presioná Enter o ✓ para registrar y agregar al estibaje. Podés agregar {MAX_QUICK - quickRegistrados} más.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Cabecera */}
            <div className="grid items-center gap-2 px-3 text-[10.5px] font-700 uppercase tracking-wider text-gr-muted"
              style={{ gridTemplateColumns: '1fr 100px 90px 32px' }}>
              <span>Cargador</span>
              <span className="text-center">Cant. {esJornal ? '' : `(${unidadTotal})`}</span>
              <span className="text-right">A pagar</span>
              <span />
            </div>

            {cargas.map((row, idx) => (
              <CargaRow
                key={row._id}
                row={row}
                cargador={cargadores.find((c) => c.id === row.cargadorId)}
                unidadCorta={unidadCorta}
                editable={!esJornal}
                onCantidadChange={(v) => editarCantidad(idx, v)}
                onRemove={() => removeCargador(idx)}
              />
            ))}

            {/* Selector inline para añadir más + botón registrar nuevo */}
            <div className="flex items-center gap-2 mt-1">
              {disponibles.length > 0 && (
                <Select
                  value=""
                  onChange={(e) => e.target.value && addCargador(e.target.value)}
                  className="text-[13px] h-9 flex-1"
                >
                  <option value="">+ Agregar otro cargador…</option>
                  {disponibles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}{c.ci ? ` · CI ${c.ci}` : ''}
                    </option>
                  ))}
                </Select>
              )}
              <button
                type="button"
                onClick={() => setShowQuick(v => !v)}
                className="flex items-center gap-1.5 text-[12.5px] font-700 text-gr-primary hover:underline whitespace-nowrap"
              >
                <UserPlus size={14} />
                {showQuick ? 'Cancelar' : 'Registrar nuevo'}
              </button>
            </div>

            {/* Panel de registro rápido (también visible con cargadores) */}
            {showQuick && quickRegistrados < MAX_QUICK && (
              <div className="rounded-[12px] border-2 border-gr-primary/30 p-4 space-y-3"
                style={{ background: 'var(--color-gr-primary-lite)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-700 text-gr-primary uppercase tracking-wide flex items-center gap-1.5">
                    <UserPlus size={13} /> Registro rápido
                  </p>
                  <p className="text-[11px] text-gr-muted">
                    {quickRegistrados}/{MAX_QUICK} registrados
                  </p>
                </div>
                <div className="flex gap-2 items-end">
                  <FormField label="Nombre" required className="flex-1">
                    <Input
                      placeholder="Juan Pérez"
                      value={quickNombre}
                      onChange={e => setQuickNombre(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleQuickCreate()}
                      autoFocus
                    />
                  </FormField>
                  <FormField label="CI (opcional)" className="w-36">
                    <Input
                      placeholder="12345678"
                      value={quickCi}
                      onChange={e => setQuickCi(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleQuickCreate()}
                    />
                  </FormField>
                  <button
                    type="button"
                    disabled={!quickNombre.trim() || createCargador.isPending}
                    onClick={handleQuickCreate}
                    className="h-10 w-10 rounded-md flex items-center justify-center shrink-0 mb-px transition-all disabled:opacity-40"
                    style={{ background: 'var(--color-gr-primary)', color: '#fff' }}
                  >
                    {createCargador.isPending
                      ? <Loader2 size={16} className="animate-spin" />
                      : <Check size={16} />}
                  </button>
                </div>
                <p className="text-[11.5px] text-gr-muted">
                  Presioná Enter o ✓ para registrar y agregar al estibaje. Podés agregar {MAX_QUICK - quickRegistrados} más.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── Aviso de balance ─── */}
        {!esJornal && cargas.length > 0 && totalLocal > 0 && Math.abs(diff) > 0.01 && (
          <div
            className="rounded-md px-4 py-3 flex items-center gap-2 text-[13px] font-600"
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
      className="rounded-md h-11 px-3 text-[13.5px] font-700 border-2 transition-all"
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
  row, cargador, unidadCorta, editable, onCantidadChange, onRemove,
}: {
  row: CargaDraft;
  cargador?: Cargador;
  unidadCorta: string;
  editable: boolean;
  onCantidadChange: (v: number) => void;
  onRemove: () => void;
}) {
  const monto = useMemo(
    () => Number(row.cantidad || 0) * Number(row.tarifaBs || 0),
    [row.cantidad, row.tarifaBs],
  );
  return (
    <div className="grid items-center gap-2 rounded-lg border border-gr-border-lite px-3 py-2 bg-white"
      style={{ gridTemplateColumns: '1fr 100px 90px 32px' }}>

      {/* Nombre + CI */}
      <div className="min-w-0">
        <p className="font-700 text-[13.5px] text-gr-text leading-tight truncate">
          {cargador?.nombre ?? '—'}
        </p>
        {cargador?.ci && (
          <p className="text-[11px] text-gr-muted leading-none mt-0.5">CI {cargador.ci}</p>
        )}
      </div>

      {/* Cantidad */}
      <div className="flex items-center gap-1 justify-center">
        {editable ? (
          <Input
            type="number" min="0" step="0.01"
            value={row.cantidad || ''}
            onChange={(e) => onCantidadChange(parseFloat(e.target.value) || 0)}
            className="text-center text-[14px] font-800 h-8 px-1"
          />
        ) : (
          <div className="w-full h-8 flex items-center justify-center rounded-lg bg-gr-border-lite text-[14px] font-800 text-gr-text">
            1
          </div>
        )}
        <span className="text-[11px] text-gr-muted shrink-0">{unidadCorta}</span>
      </div>

      {/* A pagar */}
      <p className="font-800 text-[14px] text-gr-primary text-right whitespace-nowrap">
        {formatBs(monto)}
      </p>

      {/* Eliminar */}
      <button type="button" onClick={onRemove}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gr-muted hover:text-gr-danger hover:bg-red-50 transition-colors">
        <X size={15} />
      </button>
    </div>
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
