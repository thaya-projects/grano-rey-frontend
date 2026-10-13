'use client';
import { useState } from 'react';
import { usePagarCarga, useUpdateCargaTrabajo } from '@/lib/api/cargadores';
import { apiErrorMessage } from '@/lib/api';
import { formatBs, formatNum } from '@/lib/utils';
import { TipoPagoCarga, RolUsuario, type DeudaItem } from '@/lib/types';
import { useAuth } from '@/lib/auth-store';
import { Btn, Input, ConfirmModal } from '@/components/ui';
import { CheckCircle2, Wallet, Pencil, Check, X, Calendar } from 'lucide-react';

/** Fila editable de un cargador dentro de un lote. */
export function FilaCarga({
  item, onSuccess, onError,
}: {
  item: DeudaItem;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const update   = useUpdateCargaTrabajo();
  const pagarUna = usePagarCarga();
  const [editing, setEditing]   = useState(false);
  const [cantidad, setCantidad] = useState(Number(item.cantidad));
  const [tarifa, setTarifa]     = useState(Number(item.tarifaBs));
  const [confirmarPago, setConfirmarPago] = useState(false);
  const { user } = useAuth();
  const canEdit = user?.rol !== RolUsuario.PRODUCCION;

  const totalActual = Number(item.cantidad) * Number(item.tarifaBs);
  const totalEdit   = cantidad * tarifa;
  const esBolsa     = item.tipoPago === TipoPagoCarga.BOLSA;
  const unidad      = esBolsa ? 'unid.' : 'día';

  async function guardar() {
    try {
      await update.mutateAsync({
        id: item.id,
        dto: { cantidad, tarifaBs: tarifa },
      });
      setEditing(false);
      onSuccess('Carga actualizada');
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo editar'));
    }
  }

  async function ejecutarPago() {
    setConfirmarPago(false);
    try {
      const res = await pagarUna.mutateAsync({ id: item.id });
      onSuccess(`Pago de ${formatBs(res.totalBs)} a ${item.cargadorNombre ?? 'cargador'} registrado`);
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo pagar'));
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(180px,1fr)_140px_140px_150px_120px_44px] items-center gap-3 px-5 py-3 text-[13.5px] border-b border-gr-border-lite last:border-b-0">
        <div className="min-w-0">
          <p className="font-800 text-[14.5px] text-gr-text truncate">
            {item.cargadorNombre ?? '—'}
          </p>
          <p className="text-[11.5px] text-gr-muted">
            {unidad}
            {item.pagado && item.fechaPago && (
              <> · <Calendar size={10} className="inline mr-0.5" />pagado {item.fechaPago}</>
            )}
          </p>
        </div>

        {editing && canEdit ? (
          <>
            <Input type="number" min="0" step="0.01" value={cantidad}
              onChange={e => setCantidad(parseFloat(e.target.value) || 0)}
              className="text-center h-10 font-800 text-[15px]" />
            <Input type="number" min="0" step="0.01" value={tarifa}
              onChange={e => setTarifa(parseFloat(e.target.value) || 0)}
              className="text-right h-10 font-800 text-[15px]" />
            <p className="text-right font-900 text-[16px] text-gr-primary">
              {formatBs(totalEdit)}
            </p>
            <div className="flex gap-1.5 justify-end">
              <button onClick={guardar}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:opacity-90"
                style={{ background: 'var(--color-gr-success)' }}>
                <Check size={15} />
              </button>
              <button onClick={() => { setEditing(false); setCantidad(Number(item.cantidad)); setTarifa(Number(item.tarifaBs)); }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:opacity-90"
                style={{ background: 'var(--color-gr-muted)' }}>
                <X size={15} />
              </button>
            </div>
            <span />
          </>
        ) : (
          <>
            <p className="text-center font-800 text-[15px]">{formatNum(Number(item.cantidad), 2)}</p>
            <p className="text-right font-700 text-[14px]">{formatBs(Number(item.tarifaBs))}</p>
            <p className="text-right font-900 text-[16px]"
              style={{ color: item.pagado ? 'var(--color-gr-success)' : 'var(--color-gr-danger)' }}>
              {formatBs(totalActual)}
            </p>
            {item.pagado ? (
              <span className="inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-700"
                style={{ background: 'var(--color-gr-success-bg)', color: 'var(--color-gr-success)' }}>
                <CheckCircle2 size={12} /> Pagado
              </span>
            ) : canEdit ? (
              <Btn size="sm" variant="green" onClick={() => setConfirmarPago(true)} loading={pagarUna.isPending}>
                <Wallet size={12} /> Pagar
              </Btn>
            ) : <span />}
            <div className="flex justify-center">
              {canEdit && !item.pagado && (
                <button onClick={() => setEditing(true)}
                  title="Editar cantidad/tarifa"
                  className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-gr-border hover:bg-gr-border-lite">
                  <Pencil size={13} />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        open={confirmarPago}
        onClose={() => setConfirmarPago(false)}
        onConfirm={ejecutarPago}
        title={`Pagar a ${item.cargadorNombre ?? 'cargador'}`}
        message={`Se registrará un pago de ${formatBs(totalActual)} y quedará como gasto en categoría Mano de obra. ¿Confirmar?`}
      />
    </>
  );
}
