'use client';
import { useState } from 'react';
import { usePagarCargasBulk } from '@/lib/api/cargadores';
import { apiErrorMessage } from '@/lib/api';
import { formatBs } from '@/lib/utils';
import { RolUsuario } from '@/lib/types';
import { useAuth } from '@/lib/auth-store';
import { Btn, ConfirmModal } from '@/components/ui';
import { Wallet, Wheat, Truck, ChevronDown, ChevronUp } from 'lucide-react';
import { type GrupoMovimiento } from './helpers';
import { FilaCarga } from './FilaCarga';

/** Card por movimiento/lote. */
export function GrupoCard({
  grupo, defaultOpen, onSuccess, onError,
}: {
  grupo: GrupoMovimiento;
  defaultOpen: boolean;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const pagarBulk = usePagarCargasBulk();
  const [confirmarLote, setConfirmarLote] = useState(false);
  const [open, setOpen] = useState(defaultOpen);
  const { user } = useAuth();
  const canEdit = user?.rol !== RolUsuario.PRODUCCION;

  const esVenta = grupo.origen === 'venta';
  const Icon    = esVenta ? Truck : Wheat;
  const iconBg  = esVenta ? 'var(--color-gr-info-bg)' : 'var(--color-gr-primary-lite)';
  const iconCol = esVenta ? 'var(--color-gr-info)'    : 'var(--color-gr-primary)';

  const titulo = esVenta
    ? `Despacho NV-${grupo.numeroReferencia ?? '?'}`
    : `Entrada MP · ${grupo.materiaPrimaNombre ?? '—'}`;
  const subtitulo = esVenta
    ? (grupo.clienteNombre ?? 'Sin cliente')
    : (grupo.numeroReferencia ? `Lote ${grupo.numeroReferencia}` : 'Sin lote');

  const idsPendientes = grupo.items.filter(i => !i.pagado).map(i => i.id);
  const totalPendiente = grupo.items.filter(i => !i.pagado).reduce((s, i) => s + Number(i.montoBs), 0);

  async function ejecutarPagoLote() {
    setConfirmarLote(false);
    try {
      const res = await pagarBulk.mutateAsync({ ids: idsPendientes });
      onSuccess(`Pago total de ${formatBs(res.totalBs)} — ${res.cantidadPagada} cargadores`);
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo pagar el lote'));
    }
  }

  return (
    <>
      <div className="card-no-pad overflow-hidden">
        {/* Header del lote (clickable para colapsar) */}
        <button
          onClick={() => setOpen(!open)}
          className="w-full px-5 py-3.5 border-b border-gr-border-lite flex items-center gap-4 text-left hover:brightness-98 transition"
          style={{ background: iconBg, borderBottomWidth: open ? '1px' : '0' }}
        >
          <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: iconCol }}>
            <Icon size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-900 text-[16px] text-gr-text leading-tight">{titulo}</p>
            <p className="text-[12.5px] text-gr-muted leading-tight mt-0.5">
              {subtitulo} · {grupo.fecha} · {grupo.items.length} cargador{grupo.items.length !== 1 ? 'es' : ''}
              {grupo.pagado && ' · pagado'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10.5px] font-700 text-gr-muted uppercase tracking-wider">
              Total lote
            </p>
            <p className="font-900 text-[20px] leading-tight"
              style={{ color: grupo.pagado ? 'var(--color-gr-success)' : 'var(--color-gr-danger)' }}>
              {formatBs(grupo.totalBs)}
            </p>
          </div>
          <div className="shrink-0 ml-1">
            {open
              ? <ChevronUp size={20} className="text-gr-muted" />
              : <ChevronDown size={20} className="text-gr-muted" />}
          </div>
        </button>

        {open && (
          <>
            {/* Cabecera de filas */}
            <div className="hidden md:grid grid-cols-[minmax(180px,1fr)_140px_140px_150px_120px_44px] items-center gap-3 px-5 py-2.5 text-[11px] font-700 uppercase tracking-wider text-gr-muted border-b border-gr-border-lite"
              style={{ background: 'var(--color-gr-border-lite)' }}>
              <span>Cargador</span>
              <span className="text-center">Cantidad</span>
              <span className="text-right">Tarifa</span>
              <span className="text-right">Total</span>
              <span />
              <span />
            </div>

            {/* Filas */}
            {grupo.items.map(item => (
              <FilaCarga key={item.id} item={item} onSuccess={onSuccess} onError={onError} />
            ))}

            {/* Footer con pagar todo el lote — solo si quedan pendientes y tiene permisos */}
            {canEdit && idsPendientes.length > 1 && (
              <div className="px-5 py-3.5 flex items-center justify-end gap-3 border-t border-gr-border-lite"
                style={{ background: 'var(--color-gr-border-lite)' }}>
                <p className="text-[12.5px] text-gr-muted">
                  Pagar todo el lote a la vez:
                </p>
                <Btn onClick={() => setConfirmarLote(true)} loading={pagarBulk.isPending}>
                  <Wallet size={14} /> Pagar lote · {formatBs(totalPendiente)}
                </Btn>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        open={confirmarLote}
        onClose={() => setConfirmarLote(false)}
        onConfirm={ejecutarPagoLote}
        title={`Pagar ${idsPendientes.length} cargadores del lote`}
        message={`Se registrará un pago de ${formatBs(totalPendiente)} y quedará como gasto en categoría Mano de obra. ¿Confirmar?`}
      />
    </>
  );
}
