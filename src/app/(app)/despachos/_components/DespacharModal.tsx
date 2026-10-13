'use client';
import { useState } from 'react';
import { useCambiarEstadoVenta } from '@/lib/api/ventas';
import { useTransportistas } from '@/lib/api/catalogos';
import { type NotaVenta, EstadoVenta, TipoFlete, TipoPagoCarga } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { formatBs } from '@/lib/utils';
import { Btn, Modal, FormField, Select } from '@/components/ui';
import { NuevoTransportistaModal } from '@/components/NuevoTransportistaModal';
import { Truck, Plus } from 'lucide-react';
import { CargasSection, type CargaDraft } from '@/components/CargasSection';
import { desgloseFleteIncluido } from './helpers';

/** DespacharModal: cargadores múltiples + tarifa por sesión. */
export function DespacharModal({ venta, onClose, onSaved, onError }: {
  venta: NotaVenta;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const cambiar = useCambiarEstadoVenta();
  const transportistasQ = useTransportistas();
  const transportistas = transportistasQ.data ?? [];

  const [tipoPago, setTipoPago] = useState<TipoPagoCarga>(TipoPagoCarga.BOLSA);
  const [tarifaBs, setTarifaBs] = useState(0);
  const [cargas, setCargas]     = useState<CargaDraft[]>([]);
  const [transportistaId, setTransportistaId] = useState('');
  const [showNuevoTransportista, setShowNuevoTransportista] = useState(false);

  const totalUnidades = venta.detalles.reduce((s, d) => s + Number(d.cantidad ?? 0), 0);

  async function handleConfirmar() {
    try {
      await cambiar.mutateAsync({
        id: venta.id,
        estado: EstadoVenta.DESPACHADA,
        transportistaId: !venta.transportista && transportistaId ? transportistaId : undefined,
        cargas: cargas.length > 0
          ? cargas.map(({ _id: _drop, ...c }) => c)
          : undefined,
      });
      onSaved();
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo despachar'));
    }
  }

  return (
    <Modal xl open title={`Despachar NV-${venta.numeroNota}`} onClose={onClose}>
      <div className="rounded-[10px] px-4 py-3 flex items-center justify-between"
        style={{ background: 'var(--color-gr-primary-lite)' }}>
        <div>
          <p className="font-700 text-gr-primary text-[14px]">
            {venta.cliente?.nombre ?? '—'}
            {venta.cliente?.telefono && (
              <span className="font-600 text-[12.5px] text-gr-muted"> · Cel: {venta.cliente.telefono}</span>
            )}
          </p>
          <p className="text-[12px] text-gr-muted">
            {venta.fecha} · {totalUnidades} unid. · {formatBs(Number(venta.totalBs))}
            {venta.cliente?.ciudad && <> · {venta.cliente.ciudad}</>}
          </p>
          {(() => {
            const d = desgloseFleteIncluido(venta);
            if (!d) return null;
            return (
              <>
                <p className="text-[11px] text-gr-muted">{d.texto}</p>
                {!d.coincide && (
                  <p className="text-[11px] font-700 text-gr-danger">⚠ no coincide con el total del sistema</p>
                )}
              </>
            );
          })()}
          {venta.tipoFlete === TipoFlete.GRANO_REY_PAGA && Number(venta.fleteBs) > 0 && (
            <p className="text-[11px] italic mt-0.5" style={{ color: 'var(--color-gr-warning)' }}>
              Flete a cargo de Grano Rey: {formatBs(Number(venta.fleteBs))} (no está en el total de la venta)
            </p>
          )}
          {venta.tipoFlete === TipoFlete.CLIENTE_PAGA_DIRECTO && (
            <p className="text-[11px] italic mt-0.5" style={{ color: 'var(--color-gr-info)' }}>
              El cliente paga el flete directo al transportista
            </p>
          )}
        </div>
      </div>

      {!venta.transportista && (
        <div className="rounded-[10px] px-4 py-3 space-y-2"
          style={{ background: 'var(--color-gr-gold-lite)' }}>
          <p className="text-[12.5px] font-700 text-gr-text">
            Esta venta no tiene transportista asignado — puedes hacerlo ahora o dejarlo en blanco.
          </p>
          <FormField label="Transportista" hint="Opcional">
            <div className="flex gap-2">
              <Select value={transportistaId} onChange={e => setTransportistaId(e.target.value)} className="flex-1">
                <option value="">— Sin asignar —</option>
                {transportistas.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}{t.placa ? ` · ${t.placa}` : ''}{t.marca ? ` · ${t.marca}` : ''}
                  </option>
                ))}
              </Select>
              <Btn type="button" variant="ghost" onClick={() => setShowNuevoTransportista(true)} className="shrink-0">
                <Plus size={14} /> Nuevo
              </Btn>
            </div>
          </FormField>
        </div>
      )}

      <CargasSection
        totalEsperado={totalUnidades}
        unidadTotal="unid."
        tipoPago={tipoPago}
        onTipoPagoChange={setTipoPago}
        tarifaBs={tarifaBs}
        onTarifaChange={setTarifaBs}
        cargas={cargas}
        onCargasChange={setCargas}
      />

      <div className="flex gap-3 justify-end pt-2 border-t border-gr-border-lite">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleConfirmar} loading={cambiar.isPending}>
          <Truck size={14} /> Confirmar despacho
        </Btn>
      </div>

      {showNuevoTransportista && (
        <NuevoTransportistaModal
          onClose={() => setShowNuevoTransportista(false)}
          onCreated={t => setTransportistaId(t.id)}
        />
      )}
    </Modal>
  );
}
