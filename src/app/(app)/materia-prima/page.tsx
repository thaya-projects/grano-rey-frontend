'use client';
import { useState } from 'react';
import { useMateriasPrimas, useCreateKardexMP, useKardexMPPendientesPago, usePagarKardexMP } from '@/lib/api/materia-prima';
import { useProveedores, useUnidades, useCategoriasMP, useSubtiposMP } from '@/lib/api/catalogos';
import { TipoMovimientoMP, EstadoPagoMP, type MateriaPrima } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { formatNum, formatBs } from '@/lib/utils';
import { Btn, Modal, FormField, Input, Select, Spinner, useToast } from '@/components/ui';
import { Wheat, Plus, CheckCircle } from 'lucide-react';

function StockDot({ value, min }: { value: number; min: number }) {
  const low  = min > 0 && value < min;
  const warn = !low && min > 0 && value < min * 1.5;
  const color = low ? '#B53D35' : warn ? '#A05C0A' : '#2E7D52';
  const label = low ? 'Crítico' : warn ? 'Bajo' : 'OK';
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-600" style={{ color }}>
      <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: color }} />
      {label}
    </span>
  );
}

export default function MateriaPrimaPage() {
  const toast = useToast(s => s.show);
  const mpQ              = useMateriasPrimas();
  const categoriasQ      = useCategoriasMP();
  const proveedoresQ     = useProveedores();
  const unidadesQ        = useUnidades();
  const pendientesPagoQ  = useKardexMPPendientesPago();
  const pagarMut         = usePagarKardexMP();

  const materiasPrimas   = mpQ.data ?? [];
  const categorias       = categoriasQ.data ?? [];
  const proveedores      = proveedoresQ.data ?? [];
  const unidades         = unidadesQ.data ?? [];
  const pendientesPago   = pendientesPagoQ.data ?? [];

  const [entradaModal, setEntradaModal] = useState<MateriaPrima | null>(null);

  async function handlePagar(id: string) {
    try {
      await pagarMut.mutateAsync(id);
      toast('Compra marcada como pagada', 'success');
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo registrar el pago'), 'error');
    }
  }

  if (mpQ.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner size={28} color="var(--color-gr-primary)" />
      </div>
    );
  }

  // Group by category
  const grouped = categorias.map(cat => ({
    ...cat,
    items: materiasPrimas.filter(m => m.categoria?.id === cat.id),
  })).filter(g => g.items.length > 0);

  const sinCategoria = materiasPrimas.filter(m => !m.categoria);
  if (sinCategoria.length > 0) {
    grouped.push({
      id: 'none', nombre: 'Sin categoría', descripcion: null, tieneSubtipos: false,
      createdAt: '', updatedAt: '', items: sinCategoria,
    });
  }

  const totalGeneralKg = materiasPrimas.reduce((s, m) => s + Number(m.stockActualKg), 0);
  const totalGeneralQQ = totalGeneralKg / 46;

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-[22px] font-900 text-[var(--color-gr-text)]">Materia Prima</h1>
        <p className="text-[var(--color-gr-muted)] text-[13.5px] mt-0.5">
          Inventario por categoría · {materiasPrimas.length} ítems
        </p>
      </div>

      {/* Compras pendientes de pago */}
      {pendientesPago.length > 0 && (
        <div className="card border-l-4" style={{ borderLeftColor: '#e67e00' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-800 text-[var(--color-gr-text)] text-[14px]">Compras por pagar</p>
              <p className="text-[12px] text-gr-muted mt-0.5">
                {pendientesPago.length} compra{pendientesPago.length !== 1 ? 's' : ''} pendientes de pago ·{' '}
                <span className="font-700" style={{ color: '#e67e00' }}>
                  {formatBs(pendientesPago.reduce((s, k) => s + Number(k.costoTotalBs ?? 0), 0))} total
                </span>
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {pendientesPago.map(k => (
              <div key={k.id} className="flex items-center gap-3 py-2.5 px-3 rounded-md"
                style={{ background: 'var(--color-gr-border-lite)' }}>
                <div className="flex-1 min-w-0">
                  <p className="font-700 text-[13.5px] text-gr-text truncate">{k.materiaPrima?.nombre ?? '—'}</p>
                  <p className="text-[12px] text-[var(--color-gr-muted)]">
                    {k.fecha} · {k.cantidad} {k.unidad?.codigo ?? ''}
                    {k.proveedor && ` · ${k.proveedor.nombre}`}
                  </p>
                </div>
                <p className="font-800 text-[14px] shrink-0" style={{ color: '#e67e00' }}>
                  {k.costoTotalBs ? formatBs(Number(k.costoTotalBs)) : '—'}
                </p>
                <Btn size="sm" variant="green" onClick={() => handlePagar(k.id)} loading={pagarMut.isPending}>
                  <CheckCircle size={12} /> Pagar
                </Btn>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category summary cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {grouped.map(cat => {
          const totalKg = cat.items.reduce((s, m) => s + Number(m.stockActualKg), 0);
          const anyLow  = cat.items.some(m => Number(m.stockMinimoKg) > 0 && Number(m.stockActualKg) < Number(m.stockMinimoKg));
          return (
            <div key={cat.id} className="card border-t-4 text-center"
              style={{ borderTopColor: anyLow ? 'var(--color-gr-danger)' : 'var(--color-gr-success)' }}>
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mx-auto mb-3"
                style={{ background: 'var(--color-gr-primary-lite)' }}>
                <Wheat size={18} className="text-[var(--color-gr-primary)]" />
              </div>
              <p className="font-800 text-[var(--color-gr-text)] text-[15px]">{cat.nombre}</p>
              <div className="flex items-baseline gap-1 justify-center mt-2">
                <span className="text-[32px] font-900 text-[var(--color-gr-primary)] leading-none">
                  {formatNum(totalKg / 46, 1)}
                </span>
                <span className="text-[13px] text-[var(--color-gr-muted)] font-500">QQ total</span>
              </div>
              <p className="text-[11.5px] text-[var(--color-gr-muted)] mt-1">
                {cat.items.length} materia{cat.items.length !== 1 ? 's' : ''}
              </p>
              {anyLow && (
                <p className="text-[11px] font-600 mt-2" style={{ color: 'var(--color-gr-danger)' }}>
                  ⚠ Stock bajo
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Tabla ── */}
      <div>
        <h2 className="text-[13px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide mb-3">
          Detalle por materia prima
        </h2>

        <div className="card-no-pad">
          <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ minWidth: 720 }}>
            <thead>
              <tr style={{ background: 'var(--color-gr-primary)' }}>
                {['Categoría', 'Código', 'Nombre', 'Stock (kg)', 'Stock (QQ)', 'Mínimo (kg)', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-[11px] font-700 text-white uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {materiasPrimas.map((mp, i) => {
                const isOdd  = i % 2 === 1;
                const stockKg = Number(mp.stockActualKg);
                return (
                  <tr key={mp.id}
                    style={{ background: isOdd ? 'var(--color-gr-border-lite)' : '#fff' }}
                    className="border-b border-[var(--color-gr-border-lite)] hover:bg-[var(--color-gr-primary-lite)] transition-colors">
                    <td className="px-4 py-3 text-[12.5px] text-[var(--color-gr-muted)]">{mp.categoria?.nombre ?? '—'}</td>
                    <td className="px-4 py-3 text-[12px] font-700 font-mono text-[var(--color-gr-primary)]">{mp.codigo}</td>
                    <td className="px-4 py-3 font-700 text-[13.5px] text-[var(--color-gr-text)]">{mp.nombre}</td>
                    <td className="px-4 py-3 text-right font-900 text-[14px] text-[var(--color-gr-text)]">
                      {formatNum(stockKg, 1)}
                    </td>
                    <td className="px-4 py-3 text-right font-900 text-[14px] text-[var(--color-gr-primary)]">
                      {formatNum(stockKg / 46, 2)}
                    </td>
                    <td className="px-4 py-3 text-right text-[12.5px] text-[var(--color-gr-muted)]">
                      {formatNum(Number(mp.stockMinimoKg), 1)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StockDot value={stockKg} min={Number(mp.stockMinimoKg)} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Btn size="sm" variant="primary" onClick={() => setEntradaModal(mp)}>
                        <Plus size={12} /> Entrada
                      </Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--color-gr-border-lite)', borderTop: '2px solid var(--color-gr-border)' }}>
                <td colSpan={3} className="px-4 py-3 text-[12.5px] font-600 text-[var(--color-gr-muted)]">
                  {materiasPrimas.length} materias primas
                </td>
                <td className="px-4 py-3 text-right font-900 text-[14px] text-[var(--color-gr-text)]">
                  {formatNum(totalGeneralKg, 1)} kg
                </td>
                <td className="px-4 py-3 text-right font-900 text-[14px] text-[var(--color-gr-primary)]">
                  {formatNum(totalGeneralQQ, 1)} QQ
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
          </div>
        </div>
      </div>

      {entradaModal && (
        <EntradaModal
          mp={entradaModal}
          proveedores={proveedores}
          unidades={unidades}
          onClose={() => setEntradaModal(null)}
          onSaved={() => {
            setEntradaModal(null);
            toast('Entrada registrada en inventario', 'success');
          }}
          onError={(msg) => toast(msg, 'error')}
        />
      )}
    </div>
  );
}

// ─── Entrada Modal ─────────────────────────────────────────────────────────
function EntradaModal({ mp, proveedores, unidades, onClose, onSaved, onError }: {
  mp: MateriaPrima;
  proveedores: { id: string; nombre: string }[];
  unidades: { id: string; codigo: string; nombre: string; abreviatura?: string | null }[];
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const createKardex = useCreateKardexMP();
  const subtiposQ = useSubtiposMP(mp.categoria?.tieneSubtipos ? mp.categoria.id : undefined);
  const subtipos = subtiposQ.data ?? [];

  const [cantidad, setCantidad]       = useState('');
  const [unidadId, setUnidadId]       = useState(mp.unidadMedida?.id ?? '');
  const [subtipoId, setSubtipoId]     = useState('');
  const [costoBs, setCostoBs]         = useState('');
  const [proveedorId, setProvId]      = useState('');
  const [numeroLote, setNumeroLote]   = useState('');
  const [observaciones, setObs]       = useState('');
  const [fecha, setFecha]             = useState(new Date().toISOString().slice(0, 10));
  const [estadoPago, setEstadoPago]   = useState<'pendiente' | 'pagado'>('pendiente');
  const [fechaPago, setFechaPago]     = useState('');

  const cantNum = parseFloat(cantidad) || 0;
  const valid   = cantNum > 0 && !!unidadId;

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
        proveedorId: proveedorId || undefined,
        numeroLote: numeroLote ? parseInt(numeroLote) : undefined,
        costoUnitarioBs: costoBs ? parseFloat(costoBs) : undefined,
        observaciones: observaciones || undefined,
        estadoPago: estadoPago as EstadoPagoMP,
        fechaPago: estadoPago === 'pagado' && fechaPago ? fechaPago : undefined,
      });
      onSaved();
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo registrar la entrada'));
    }
  }

  return (
    <Modal open title={`Registrar entrada — ${mp.nombre}`} onClose={onClose}>
      <div className="rounded-[10px] px-4 py-3 text-[13px]" style={{ background: 'var(--color-gr-primary-lite)' }}>
        <p className="font-600 text-[var(--color-gr-primary)]">
          Stock actual: <strong>{formatNum(Number(mp.stockActualKg), 1)} kg</strong> ({formatNum(Number(mp.stockActualKg) / 46, 2)} QQ)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Cantidad" required>
          <Input type="number" min="0" step="0.01" placeholder="0" value={cantidad}
            onChange={e => setCantidad(e.target.value)} autoFocus />
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

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Costo unitario (Bs)">
          <Input type="number" min="0" step="0.01" placeholder="0" value={costoBs}
            onChange={e => setCostoBs(e.target.value)} />
        </FormField>
        <FormField label="N° de lote">
          <Input type="number" min="1" placeholder="Opcional" value={numeroLote}
            onChange={e => setNumeroLote(e.target.value)} />
        </FormField>
      </div>

      <FormField label="Proveedor">
        <Select value={proveedorId} onChange={e => setProvId(e.target.value)}>
          <option value="">— Sin proveedor —</option>
          {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </Select>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Estado de pago">
          <Select value={estadoPago} onChange={e => setEstadoPago(e.target.value as 'pendiente' | 'pagado')}>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
          </Select>
        </FormField>
        {estadoPago === 'pagado' && (
          <FormField label="Fecha de pago">
            <Input type="date" value={fechaPago} onChange={e => setFechaPago(e.target.value)} />
          </FormField>
        )}
      </div>

      <FormField label="Fecha de entrada" required>
        <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
      </FormField>

      <FormField label="Observaciones">
        <Input placeholder="Notas..." value={observaciones} onChange={e => setObs(e.target.value)} />
      </FormField>

      <div className="flex gap-3 justify-end">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!valid} loading={createKardex.isPending}>
          <Plus size={14} /> Registrar entrada
        </Btn>
      </div>
    </Modal>
  );
}
