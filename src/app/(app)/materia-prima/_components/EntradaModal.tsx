'use client';
import { useMemo, useState } from 'react';
import { useCreateKardexMP } from '@/lib/api/materia-prima';
import { useSubtiposMP } from '@/lib/api/catalogos';
import { TipoMovimientoMP, TipoPagoCarga, EstadoPagoMP, type MateriaPrima, type KardexMP } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { formatNum, kgToQQ } from '@/lib/utils';
import { Btn, Modal, FormField, Input, Select } from '@/components/ui';
import { Plus } from 'lucide-react';
import { CargasSection, type CargaDraft } from '@/components/CargasSection';

export function EntradaModal({ mp, proveedores, unidades, allKardex, onClose, onSaved, onError }: {
  mp: MateriaPrima;
  proveedores: { id: string; nombre: string }[];
  unidades: { id: string; codigo: string; nombre: string; abreviatura?: string | null }[];
  allKardex: KardexMP[];
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const createKardex = useCreateKardexMP();
  const subtiposQ = useSubtiposMP(mp.categoria?.tieneSubtipos ? mp.categoria.id : undefined);
  const subtipos = subtiposQ.data ?? [];

  // Número de lote propio sugerido: MP-XXXX secuencial, sin colisión con los existentes
  const sugeridoLotePropio = useMemo(() => {
    const existentes = new Set(
      allKardex.map(k => k.numeroLotePropio).filter(Boolean)
    );
    const nums = [...existentes]
      .map(n => { const m = /^MP-0*(\d+)$/i.exec(n!); return m ? parseInt(m[1]) : 0; })
      .filter(n => n > 0);
    let siguiente = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
    while (existentes.has(`MP-${String(siguiente).padStart(4, '0')}`)) siguiente++;
    return `MP-${String(siguiente).padStart(4, '0')}`;
  }, [allKardex]);

  const [cantidad, setCantidad]       = useState('');
  const [unidadId, setUnidadId]       = useState(mp.unidadMedida?.id ?? '');
  const [subtipoId, setSubtipoId]     = useState('');
  const [costoBs, setCostoBs]         = useState('');
  const [proveedorId, setProvId]      = useState('');
  const [numeroLotePropio, setNumeroLotePropio] = useState(sugeridoLotePropio);
  const [observaciones, setObs]       = useState('');
  const [fecha, setFecha]             = useState(new Date().toISOString().slice(0, 10));
  const [estadoPago, setEstadoPago]   = useState<'pendiente' | 'pagado'>('pendiente');
  const [fechaPago, setFechaPago]     = useState('');

  // Cargas
  const [tipoPago, setTipoPago]       = useState<TipoPagoCarga>(TipoPagoCarga.BOLSA);
  const [tarifaBs, setTarifaBs]       = useState(0);
  const [cargas, setCargas]           = useState<CargaDraft[]>([]);

  const cantNum = parseFloat(cantidad) || 0;

  const totalUnidades = cantNum;

  // Obligatorios: cantidad, unidad, proveedor. N° de lote se autogenera pero editable.
  const valid = cantNum > 0 && !!unidadId && !!proveedorId;

  async function handleSave() {
    if (!valid) return;
    try {
      await createKardex.mutateAsync({
        fecha,
        tipoMovimiento: TipoMovimientoMP.INGRESO,
        cantidad: cantNum,
        materiaPrimaId: mp.id,
        unidadId,
        subtipoId: subtipoId || undefined,
        proveedorId,
        numeroLotePropio: numeroLotePropio.trim() || undefined,
        costoUnitarioBs: costoBs ? parseFloat(costoBs) : undefined,
        observaciones: observaciones || undefined,
        estadoPago: estadoPago as EstadoPagoMP,
        fechaPago: estadoPago === 'pagado' && fechaPago ? fechaPago : undefined,
        cargas: cargas.length > 0
          ? cargas.map(({ _id: _drop, ...c }) => c)
          : undefined,
      });
      onSaved();
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo registrar la entrada'));
    }
  }

  return (
    <Modal xl open title={`Registrar entrada — ${mp.nombre}`} onClose={onClose}>
      <div className="rounded-md px-4 py-3 text-[13px]" style={{ background: 'var(--color-gr-primary-lite)' }}>
        <p className="font-600 text-gr-primary">
          Stock actual: <strong>{formatNum(Number(mp.stockActualKg), 1)} kg</strong> ({formatNum(kgToQQ(Number(mp.stockActualKg)), 2)} QQ)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Columna izquierda ── datos de la entrada ── */}
        <div className="space-y-3">
          <p className="text-[11.5px] font-700 text-gr-muted uppercase tracking-wide">
            Datos de la entrada
          </p>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Cantidad" required>
              <Input type="number" min="0" step="0.01" placeholder="0" value={cantidad}
                onChange={e => setCantidad(e.target.value)} autoFocus className="text-[16px] font-700" />
            </FormField>
            <FormField label="Unidad" required>
              <Select value={unidadId} onChange={e => setUnidadId(e.target.value)}>
                <option value="">— Seleccionar —</option>
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>{u.codigo} · {u.nombre}</option>
                ))}
              </Select>
            </FormField>
          </div>

          {mp.categoria?.tieneSubtipos && subtipos.length > 0 && (
            <FormField label="Subtipo">
              <Select value={subtipoId} onChange={e => setSubtipoId(e.target.value)}>
                <option value="">— Sin subtipo —</option>
                {subtipos.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </Select>
            </FormField>
          )}

          <FormField label="N° lote" hint="Sugerido · editable">
            <Input placeholder="MP-0001" value={numeroLotePropio}
              onChange={e => setNumeroLotePropio(e.target.value)} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Proveedor" required>
              <Select value={proveedorId} onChange={e => setProvId(e.target.value)}>
                <option value="">— Seleccionar —</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </Select>
            </FormField>
            <FormField label="Costo unitario (Bs)">
              <Input type="number" min="0" step="0.01" placeholder="0" value={costoBs}
                onChange={e => setCostoBs(e.target.value)} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Estado de pago">
              <Select value={estadoPago} onChange={e => setEstadoPago(e.target.value as 'pendiente' | 'pagado')}>
                <option value="pendiente">Pendiente</option>
                <option value="pagado">Pagado</option>
              </Select>
            </FormField>
            {estadoPago === 'pagado' ? (
              <FormField label="Fecha de pago">
                <Input type="date" value={fechaPago} onChange={e => setFechaPago(e.target.value)} />
              </FormField>
            ) : (
              <FormField label="Fecha de entrada" required>
                <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
              </FormField>
            )}
          </div>

          {estadoPago === 'pagado' && (
            <FormField label="Fecha de entrada" required>
              <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </FormField>
          )}

          <FormField label="Observaciones">
            <Input placeholder="Notas..." value={observaciones} onChange={e => setObs(e.target.value)} />
          </FormField>
        </div>

        {/* ── Columna derecha ── cargadores ── */}
        <div className="space-y-3">
          <p className="text-[11.5px] font-700 text-gr-muted uppercase tracking-wide">
            Estibaje (opcional)
          </p>
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
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-gr-border-lite">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!valid} loading={createKardex.isPending}>
          <Plus size={14} /> Registrar entrada
        </Btn>
      </div>
    </Modal>
  );
}
