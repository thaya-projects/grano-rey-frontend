'use client';
import { useState } from 'react';
import {
  useDeudaCargadores,
  useDeudaCargador,
  useSaldarCargador,
  useTarifaCarga,
} from '@/lib/api/cargadores';
import { apiErrorMessage } from '@/lib/api';
import { formatBs } from '@/lib/utils';
import type { DeudaCargador } from '@/lib/types';
import { Btn, Modal, Spinner, useToast } from '@/components/ui';
import { HardHat, ArrowRight, CheckCircle2, Wallet } from 'lucide-react';

export default function CargadoresPage() {
  const toast = useToast(s => s.show);
  const deudasQ = useDeudaCargadores();
  const tarifaQ = useTarifaCarga();
  const tarifa = Number(tarifaQ.data?.tarifaPorBolsaBs ?? 0);

  const [verDetalle, setVerDetalle] = useState<DeudaCargador | null>(null);

  const deudas = deudasQ.data ?? [];
  const totalDeuda = deudas.reduce((s, d) => s + Number(d.totalBs), 0);
  const totalBolsas = deudas.reduce((s, d) => s + Number(d.totalBolsas), 0);

  if (deudasQ.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner size={28} color="var(--color-gr-primary)" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-900 text-[var(--color-gr-text)]">Pagos a cargadores</h1>
          <p className="text-[var(--color-gr-muted)] text-[13.5px] mt-0.5">
            Deuda acumulada por cargas no pagadas en el momento.
          </p>
        </div>
        {tarifa > 0 && (
          <div className="text-right">
            <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase">Tarifa</p>
            <p className="font-800 text-[var(--color-gr-primary)] text-[16px]">{formatBs(tarifa)}/bolsa</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">Cargadores con deuda</p>
          <p className="text-[28px] font-900 text-[var(--color-gr-text)]">{deudas.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">Bolsas pendientes</p>
          <p className="text-[28px] font-900 text-[var(--color-gr-text)]">{totalBolsas}</p>
        </div>
        <div className="card text-center">
          <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">Total a pagar</p>
          <p className="text-[28px] font-900 text-[var(--color-gr-danger)]">{formatBs(totalDeuda)}</p>
        </div>
      </div>

      {deudas.length === 0 ? (
        <div className="rounded-[14px] px-6 py-10 text-center"
          style={{ background: 'var(--color-gr-success-bg)', border: '1px solid rgba(46,125,82,0.15)' }}>
          <CheckCircle2 size={36} style={{ color: 'var(--color-gr-success)' }} className="mx-auto mb-3" />
          <p className="font-800 text-[var(--color-gr-text)] text-[16px]">Sin deudas pendientes</p>
          <p className="text-[var(--color-gr-muted)] text-[13px] mt-1">
            Todos los cargadores están al día con sus pagos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {deudas.map(d => (
            <div key={d.cargadorId} className="card flex items-center gap-4">
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: 'var(--color-gr-primary-lite)' }}>
                <HardHat size={18} className="text-[var(--color-gr-primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-800 text-[var(--color-gr-text)] text-[15px]">{d.cargadorNombre}</p>
                <p className="text-[12.5px] text-[var(--color-gr-muted)]">
                  {d.cantidadPendientes} {d.cantidadPendientes === 1 ? 'movimiento' : 'movimientos'} ·
                  {' '}{d.totalBolsas} bolsas
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-900 text-[var(--color-gr-danger)] text-[18px]">{formatBs(Number(d.totalBs))}</p>
                <Btn size="sm" variant="primary" onClick={() => setVerDetalle(d)}>
                  Ver y pagar <ArrowRight size={13} />
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {verDetalle && (
        <DetalleDeudaModal
          cargadorId={verDetalle.cargadorId}
          cargadorNombre={verDetalle.cargadorNombre}
          onClose={() => setVerDetalle(null)}
          onSaved={(msg) => { setVerDetalle(null); toast(msg, 'success'); }}
          onError={(msg) => toast(msg, 'error')}
        />
      )}
    </div>
  );
}

function DetalleDeudaModal({ cargadorId, cargadorNombre, onClose, onSaved, onError }: {
  cargadorId: string;
  cargadorNombre: string;
  onClose: () => void;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const deudaQ = useDeudaCargador(cargadorId);
  const saldar = useSaldarCargador();
  const deuda = deudaQ.data;

  async function handleSaldarTodo() {
    try {
      const res = await saldar.mutateAsync({ id: cargadorId, dto: {} });
      onSaved(`Pago de ${formatBs(res.totalBs)} a ${res.cargadorNombre} registrado · ${res.cantidadMovimientos} movs`);
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo registrar el pago'));
    }
  }

  return (
    <Modal open title={`Deuda de ${cargadorNombre}`} onClose={onClose} wide>
      {deudaQ.isLoading || !deuda ? (
        <div className="py-8 flex justify-center"><Spinner size={22} color="var(--color-gr-primary)" /></div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="card text-center">
              <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase">Movimientos</p>
              <p className="text-[22px] font-900 text-[var(--color-gr-text)]">{deuda.cantidadPendientes}</p>
            </div>
            <div className="card text-center">
              <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase">Bolsas</p>
              <p className="text-[22px] font-900 text-[var(--color-gr-text)]">{deuda.totalBolsas}</p>
            </div>
            <div className="card text-center">
              <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase">Total Bs</p>
              <p className="text-[22px] font-900 text-[var(--color-gr-danger)]">{formatBs(Number(deuda.totalBs))}</p>
            </div>
          </div>

          <div className="card-no-pad mt-4">
            <div className="hidden md:grid gap-3 px-4 py-3 text-[11px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide border-b border-[var(--color-gr-border)]"
              style={{ gridTemplateColumns: '80px 1fr 70px 100px', background: 'var(--color-gr-border-lite)' }}>
              <span>Fecha</span>
              <span>Referencia</span>
              <span className="text-right">Bolsas</span>
              <span className="text-right">Monto</span>
            </div>
            {deuda.items.map(i => (
              <div key={`${i.tipo}-${i.id}`}
                className="border-b border-[var(--color-gr-border-lite)] last:border-b-0 px-4 py-3">
                <div className="md:hidden flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-700 text-[var(--color-gr-text)]">{i.referencia}</p>
                    <p className="text-[11.5px] text-[var(--color-gr-muted)]">{i.fecha} · {i.bolsas} bolsas</p>
                  </div>
                  <p className="font-900 text-[var(--color-gr-danger)]">{formatBs(Number(i.montoBs))}</p>
                </div>
                <div className="hidden md:grid gap-3 items-center"
                  style={{ gridTemplateColumns: '80px 1fr 70px 100px' }}>
                  <span className="text-[12px] text-[var(--color-gr-muted)]">{i.fecha}</span>
                  <span className="text-[13px] text-[var(--color-gr-text)]">{i.referencia}</span>
                  <span className="text-right text-[13px] font-700">{i.bolsas}</span>
                  <span className="text-right font-800 text-[var(--color-gr-danger)]">{formatBs(Number(i.montoBs))}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[10px] px-4 py-3 mt-2"
            style={{ background: 'var(--color-gr-info-bg)', color: 'var(--color-gr-info)' }}>
            <p className="text-[12.5px]">
              Al confirmar, todos los movimientos quedan marcados como pagados y se crea un gasto en categoría
              <strong> Mano de obra</strong> por el total.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
            <Btn onClick={handleSaldarTodo} loading={saldar.isPending}>
              <Wallet size={14} /> Saldar todo — {formatBs(Number(deuda.totalBs))}
            </Btn>
          </div>
        </>
      )}
    </Modal>
  );
}
