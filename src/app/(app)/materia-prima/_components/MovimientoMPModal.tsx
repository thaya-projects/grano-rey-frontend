'use client';
import { useMemo, useState } from 'react';
import { useCreateKardexMP } from '@/lib/api/materia-prima';
import { TipoMovimientoMP, type MateriaPrima, type KardexMP, type LoteProduccion, type UnidadMedida } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { formatBs } from '@/lib/utils';
import { Btn, Modal, FormField, Input, Select, Textarea } from '@/components/ui';

const TIPO_CONFIG: Record<string, { label: string; color: string; hint: string }> = {
  [TipoMovimientoMP.MERMA]:   { label: 'Merma',   color: '#A05C0A', hint: 'Pérdida natural del proceso (polvo, derrame, humedad). Reduce el stock.' },
  [TipoMovimientoMP.DESECHO]: { label: 'Desecho',  color: '#B53D35', hint: 'MP dañada o vencida que se descarta completamente. Reduce el stock.' },
  [TipoMovimientoMP.AJUSTE]:  { label: 'Ajuste',   color: '#2E7D52', hint: 'Corrección positiva por conteo físico. Suma al stock.' },
};

/** Movimiento MP (merma / desecho / ajuste). */
export function MovimientoMPModal({ mp, kardex, unidades, lotes, onClose, onSaved, onError }: {
  mp: MateriaPrima;
  kardex: KardexMP[];
  unidades: UnidadMedida[];
  lotes: LoteProduccion[];
  onClose: () => void;
  onSaved: (tipo: TipoMovimientoMP) => void;
  onError: (msg: string) => void;
}) {
  const createKardex = useCreateKardexMP();
  const [tipo, setTipo]         = useState<TipoMovimientoMP>(TipoMovimientoMP.MERMA);
  const [cantidad, setCantidad] = useState('');
  const [unidadId, setUnidadId] = useState(mp.unidadMedida?.id ?? '');
  const [loteId, setLoteId]     = useState('');
  const [valorBs, setValorBs]   = useState('');
  const [obs, setObs]           = useState('');
  const [fecha, setFecha]       = useState(new Date().toISOString().slice(0, 10));

  // Costo promedio ponderado por KG desde todos los ingresos con precio registrado
  const costoPorKg = useMemo(() => {
    const ingresos = kardex.filter(
      k => k.tipoMovimiento === TipoMovimientoMP.INGRESO && k.costoUnitarioBs != null
    );
    const totalCost = ingresos.reduce((s, k) => s + Number(k.costoUnitarioBs!) * Number(k.cantidad), 0);
    const totalKg   = ingresos.reduce((s, k) => s + Number(k.cantidadKg), 0);
    return totalKg > 0 ? totalCost / totalKg : 0;
  }, [kardex]);

  const cantNum         = parseFloat(cantidad) || 0;
  const config          = TIPO_CONFIG[tipo];
  const esMerma         = tipo === TipoMovimientoMP.MERMA;
  const esDesecho       = tipo === TipoMovimientoMP.DESECHO;
  const esAjuste        = tipo === TipoMovimientoMP.AJUSTE;
  const mostrarValor    = esMerma || esDesecho;
  const valid           = cantNum > 0 && !!unidadId;

  // Valor auto-calculado: cantidad convertida a KG × costo promedio
  const selectedUnidad  = unidades.find(u => u.id === unidadId);
  const factorABase     = selectedUnidad?.factorABase ?? 1;
  const cantKg          = cantNum * factorABase;
  const valorAuto       = costoPorKg > 0 && cantKg > 0
    ? parseFloat((costoPorKg * cantKg).toFixed(2))
    : 0;

  // Si el usuario no escribió nada, usamos el calculado
  const valorEfectivo   = valorBs ? parseFloat(valorBs) : valorAuto;

  async function handleSave() {
    if (!valid) return;
    const costoUnitarioBs = mostrarValor && valorEfectivo > 0 && cantNum > 0
      ? valorEfectivo / cantNum
      : undefined;
    try {
      await createKardex.mutateAsync({
        fecha,
        tipoMovimiento: tipo,
        cantidad: cantNum,
        materiaPrimaId: mp.id,
        unidadId,
        loteProduccionId: esMerma && loteId ? loteId : undefined,
        costoUnitarioBs,
        observaciones: obs.trim() || undefined,
      });
      onSaved(tipo);
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo registrar el movimiento'));
    }
  }

  return (
    <Modal open title={`Movimiento de MP — ${mp.nombre}`} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn
          onClick={handleSave}
          disabled={!valid}
          loading={createKardex.isPending}
          variant={esAjuste ? 'primary' : 'danger'}
        >
          Confirmar {config.label.toLowerCase()}
        </Btn>
      </>}>

      {/* Selector de tipo */}
      <div className="grid grid-cols-3 gap-2">
        {([TipoMovimientoMP.MERMA, TipoMovimientoMP.DESECHO, TipoMovimientoMP.AJUSTE] as TipoMovimientoMP[]).map(t => {
          const c = TIPO_CONFIG[t];
          const active = tipo === t;
          return (
            <button key={t} type="button" onClick={() => setTipo(t)}
              className="rounded-[10px] border-2 px-3 py-2.5 text-[12.5px] font-700 transition-all text-left"
              style={{
                borderColor: active ? c.color : 'var(--color-gr-border)',
                background: active ? `${c.color}14` : 'transparent',
                color: active ? c.color : 'var(--color-gr-muted)',
              }}>
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Hint del tipo seleccionado */}
      <p className="text-[12px] px-1" style={{ color: config.color }}>{config.hint}</p>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Cantidad" required>
          <Input type="number" min="0.001" step="0.001" placeholder="0"
            value={cantidad} onChange={e => setCantidad(e.target.value)} autoFocus />
        </FormField>
        <FormField label="Unidad" required>
          <Select value={unidadId} onChange={e => setUnidadId(e.target.value)}>
            <option value="">— Unidad —</option>
            {unidades.map(u => (
              <option key={u.id} value={u.id}>{u.codigo} — {u.nombre}</option>
            ))}
          </Select>
        </FormField>
      </div>

      {mostrarValor && (
        <FormField
          label={`Pérdida estimada (Bs)`}
          hint={
            costoPorKg > 0
              ? `Calculado desde precio de compra promedio (${formatBs(costoPorKg)}/kg). Podés ajustarlo si es necesario.`
              : 'Sin precio de compra registrado — ingresá el valor manualmente si lo conocés.'
          }>
          <Input
            type="number" min="0" step="0.01"
            placeholder={valorAuto > 0 ? String(valorAuto) : '0.00'}
            value={valorBs}
            onChange={e => setValorBs(e.target.value)}
          />
          {valorAuto > 0 && !valorBs && (
            <p className="text-[11.5px] mt-1" style={{ color: config.color }}>
              Se registrará {formatBs(valorAuto)} como pérdida
            </p>
          )}
          {valorBs && parseFloat(valorBs) !== valorAuto && valorAuto > 0 && (
            <button type="button"
              className="text-[11.5px] mt-1 underline"
              style={{ color: 'var(--color-gr-primary)' }}
              onClick={() => setValorBs('')}>
              Volver al calculado ({formatBs(valorAuto)})
            </button>
          )}
        </FormField>
      )}

      <FormField label="Fecha" required>
        <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
      </FormField>

      {/* Lote de producción — solo en merma */}
      {esMerma && lotes.length > 0 && (
        <FormField label="Lote de producción (opcional)"
          hint="Vincula esta merma a un lote específico para trazabilidad">
          <Select value={loteId} onChange={e => setLoteId(e.target.value)}>
            <option value="">— Sin vincular —</option>
            {lotes
              .filter(l => Number(l.stockRestante) > 0)
              .sort((a, b) => b.fecha.localeCompare(a.fecha))
              .slice(0, 20)
              .map(l => (
                <option key={l.id} value={l.id}>
                  {l.codigoLote} · {l.producto?.nombre} · {l.fecha}
                </option>
              ))}
          </Select>
        </FormField>
      )}

      <FormField label="Observaciones">
        <Textarea placeholder={
          esMerma   ? 'Causa de la merma (tamizado, derrame, humedad…)' :
          esAjuste  ? 'Motivo del ajuste (conteo físico, corrección…)' :
                      'Motivo del desecho (daño, vencimiento…)'
        } value={obs} onChange={e => setObs(e.target.value)} rows={2} />
      </FormField>
    </Modal>
  );
}
