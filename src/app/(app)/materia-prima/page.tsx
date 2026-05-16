'use client';
import { useState } from 'react';
import { useAppStore, type MateriaPrimaStock, type EntradaMPDTO } from '@/store/useAppStore';
import { formatNum } from '@/lib/utils';
import { Btn, Modal, FormField, Input, Select, Badge, useToast } from '@/components/ui';
import { Wheat, Plus, ChevronDown, ChevronRight } from 'lucide-react';

const RESPONSABLES = ['Luis Mamani', 'Carlos Rojas', 'Silvana Montaño'];

// ─── Semáforo ────────────────────────────────────────────────────────────────
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
  const materiasPrimas   = useAppStore(s => s.materiasPrimas);
  const categoriasMP     = useAppStore(s => s.categoriasMP);
  const proveedores      = useAppStore(s => s.proveedores);
  const registrarEntrada = useAppStore(s => s.registrarEntradaMP);

  const [entradaModal, setEntradaModal] = useState<MateriaPrimaStock | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  function toggleRow(id: string) {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleEntrada(dto: EntradaMPDTO) {
    registrarEntrada(dto);
    setEntradaModal(null);
    toast('Entrada registrada en inventario', 'success');
  }

  // Group by category
  const grouped = categoriasMP.map(cat => ({
    ...cat,
    items: materiasPrimas.filter(m => m.categoriaId === cat.id),
  })).filter(g => g.items.length > 0);

  const totalGeneral = materiasPrimas.reduce((s, m) => s + m.stockTotal, 0);

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-[22px] font-900 text-[var(--color-gr-text)]">Materia Prima</h1>
        <p className="text-[var(--color-gr-muted)] text-[13.5px] mt-0.5">
          Inventario por categoría · {materiasPrimas.length} ítems
        </p>
      </div>

      {/* Category summary cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {grouped.map(cat => {
          const totalQQ = cat.items.reduce((s, m) => s + m.stockTotal, 0);
          const anyLow  = cat.items.some(m => m.stockMinimo > 0 && m.stockTotal < m.stockMinimo);
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
                  {formatNum(totalQQ, 1)}
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

      {/* ── Tabla desktop / Lista mobile ── */}
      <div>
        <h2 className="text-[13px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide mb-3">
          Detalle por materia prima
        </h2>

        {/* ── DESKTOP TABLE ── */}
        <div className="card-no-pad hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ minWidth: 720 }}>
            <thead>
              <tr style={{ background: 'var(--color-gr-primary)' }}>
                {['Categoría','Código','Nombre','QQ Entero','QQ P.Chico','QQ P.Grande','Total QQ','Mínimo','Estado','Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-[11px] font-700 text-white uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {materiasPrimas.map((mp, i) => {
                const cat   = categoriasMP.find(c => c.id === mp.categoriaId);
                const hasSub = mp.stockEntero !== undefined;
                const isOdd  = i % 2 === 1;
                return (
                  <tr key={mp.id}
                    style={{ background: isOdd ? 'var(--color-gr-border-lite)' : '#fff' }}
                    className="border-b border-[var(--color-gr-border-lite)] hover:bg-[var(--color-gr-primary-lite)] transition-colors">
                    <td className="px-4 py-3 text-[12.5px] text-[var(--color-gr-muted)]">{cat?.nombre ?? '—'}</td>
                    <td className="px-4 py-3 text-[12px] font-700 font-mono text-[var(--color-gr-primary)]">{mp.codigo}</td>
                    <td className="px-4 py-3 font-700 text-[13.5px] text-[var(--color-gr-text)]">{mp.nombre}</td>
                    <td className="px-4 py-3 text-right text-[13px] text-[var(--color-gr-text)]">
                      {hasSub ? formatNum(mp.stockEntero ?? 0, 1) : <span className="text-[var(--color-gr-muted)]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] text-[var(--color-gr-text)]">
                      {hasSub ? formatNum(mp.stockParChico ?? 0, 1) : <span className="text-[var(--color-gr-muted)]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] text-[var(--color-gr-text)]">
                      {hasSub ? formatNum(mp.stockParGrande ?? 0, 1) : <span className="text-[var(--color-gr-muted)]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-900 text-[14px] text-[var(--color-gr-primary)]">
                      {formatNum(mp.stockTotal, 1)}
                    </td>
                    <td className="px-4 py-3 text-right text-[12.5px] text-[var(--color-gr-muted)]">
                      {mp.stockMinimo}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StockDot value={mp.stockTotal} min={mp.stockMinimo} />
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
                <td colSpan={6} className="px-4 py-3 text-[12.5px] font-600 text-[var(--color-gr-muted)]">
                  {materiasPrimas.length} materias primas
                </td>
                <td className="px-4 py-3 text-right font-900 text-[14px] text-[var(--color-gr-primary)]">
                  {formatNum(totalGeneral, 1)}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ── MOBILE LIST (collapsed by default, subtipos expand) ── */}
        <div className="md:hidden card-no-pad">
          {/* Mobile header */}
          <div className="grid px-4 py-2.5 text-[11px] font-700 text-white uppercase tracking-wide border-b border-white/20"
            style={{ gridTemplateColumns: '1fr auto auto auto', background: 'var(--color-gr-primary)' }}>
            <span>Nombre</span>
            <span className="text-right pr-3">Total QQ</span>
            <span>Estado</span>
            <span />
          </div>

          {materiasPrimas.map((mp, i) => {
            const hasSub   = mp.stockEntero !== undefined;
            const expanded = expandedRows.has(mp.id);
            const isLast   = i === materiasPrimas.length - 1;
            return (
              <div key={mp.id}
                className={isLast ? '' : 'border-b border-[var(--color-gr-border-lite)]'}>
                {/* Collapsed row */}
                <div className="grid px-4 py-3.5 items-center"
                  style={{ gridTemplateColumns: '1fr auto auto auto' }}>
                  <div className="min-w-0">
                    <p className="font-700 text-[var(--color-gr-text)] text-[13.5px] truncate">{mp.nombre}</p>
                    <p className="text-[11px] text-[var(--color-gr-muted)] mt-0.5">{mp.codigo}</p>
                  </div>
                  <span className="font-900 text-[15px] text-[var(--color-gr-primary)] pr-3 text-right">
                    {formatNum(mp.stockTotal, 1)}
                    <span className="text-[11px] font-500 text-[var(--color-gr-muted)] ml-1">{mp.unidad}</span>
                  </span>
                  <StockDot value={mp.stockTotal} min={mp.stockMinimo} />
                  <button
                    onClick={() => toggleRow(mp.id)}
                    className="ml-2 p-1.5 rounded-[6px] text-[var(--color-gr-muted)]"
                    style={{ background: 'var(--color-gr-border-lite)' }}
                    title={hasSub ? 'Ver subtipos' : 'Ver detalle'}>
                    {expanded
                      ? <ChevronDown size={14} className="text-[var(--color-gr-primary)]" />
                      : <ChevronRight size={14} />}
                  </button>
                </div>

                {/* Expanded detail */}
                {expanded && (
                  <div className="px-4 pb-4 space-y-3" style={{ background: 'var(--color-gr-primary-lite)' }}>
                    {hasSub ? (
                      <div className="grid grid-cols-3 gap-3 pt-3">
                        {[
                          { label: 'QQ Entero',    value: mp.stockEntero   ?? 0 },
                          { label: 'QQ P. Chico',  value: mp.stockParChico  ?? 0 },
                          { label: 'QQ P. Grande', value: mp.stockParGrande ?? 0 },
                        ].map(s => (
                          <div key={s.label} className="text-center">
                            <p className="text-[10px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">{s.label}</p>
                            <p className="font-800 text-[var(--color-gr-text)] text-[15px]">{formatNum(s.value, 1)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12.5px] text-[var(--color-gr-muted)] pt-3">Sin desglose por subtipo</p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[12px] text-[var(--color-gr-muted)]">Mínimo: {mp.stockMinimo} {mp.unidad}</span>
                      <Btn size="sm" variant="primary" onClick={() => setEntradaModal(mp)}>
                        <Plus size={12} /> Registrar entrada
                      </Btn>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="px-4 py-3 flex items-center justify-between text-[12.5px] border-t border-[var(--color-gr-border)]"
            style={{ background: 'var(--color-gr-border-lite)' }}>
            <span className="text-[var(--color-gr-muted)]">{materiasPrimas.length} materias primas</span>
            <span className="font-700 text-[var(--color-gr-primary)]">
              Total: {formatNum(totalGeneral, 1)} QQ
            </span>
          </div>
        </div>
      </div>

      {entradaModal && (
        <EntradaModal
          mp={entradaModal}
          proveedores={proveedores}
          onClose={() => setEntradaModal(null)}
          onSave={handleEntrada}
        />
      )}
    </div>
  );
}

// ─── Entrada Modal ─────────────────────────────────────────────────────────────
function EntradaModal({ mp, proveedores, onClose, onSave }: {
  mp: MateriaPrimaStock;
  proveedores: { id: string; nombre: string }[];
  onClose: () => void;
  onSave: (dto: EntradaMPDTO) => void;
}) {
  const hasSub = mp.stockEntero !== undefined;
  const [entero,     setEntero]     = useState('');
  const [parChico,   setParChico]   = useState('');
  const [parGrande,  setParGrande]  = useState('');
  const [totalSimple,setTotalSimple]= useState('');
  const [costoBs,    setCostoBs]    = useState('');
  const [proveedorId,setProvId]     = useState('');
  const [lote,       setLote]       = useState('');
  const [responsable,setResp]       = useState('');
  const [fecha,      setFecha]      = useState(new Date().toISOString().slice(0, 10));

  const totalCalc = hasSub
    ? (parseFloat(entero) || 0) + (parseFloat(parChico) || 0) + (parseFloat(parGrande) || 0)
    : parseFloat(totalSimple) || 0;

  function handleSave() {
    if (totalCalc <= 0 || !responsable) return;
    const dto: EntradaMPDTO = {
      mpId: mp.id,
      totalQQ: totalCalc,
      entero:    hasSub ? (parseFloat(entero)    || 0) : undefined,
      parChico:  hasSub ? (parseFloat(parChico)  || 0) : undefined,
      parGrande: hasSub ? (parseFloat(parGrande) || 0) : undefined,
      costoBs: parseFloat(costoBs) || undefined,
      proveedorId: proveedorId || undefined,
      lote: parseInt(lote) || undefined,
      responsable,
      fecha,
    };
    onSave(dto);
  }

  return (
    <Modal open title={`Registrar entrada — ${mp.nombre}`} onClose={onClose}>
      {/* Stock actual */}
      <div className="rounded-[10px] px-4 py-3 text-[13px]" style={{ background: 'var(--color-gr-primary-lite)' }}>
        <p className="font-600 text-[var(--color-gr-primary)]">
          Stock actual: <strong>{formatNum(mp.stockTotal, 1)} {mp.unidad}</strong>
        </p>
        {hasSub && (
          <p className="text-[12px] text-[var(--color-gr-sub)] mt-0.5">
            Entero: {formatNum(mp.stockEntero ?? 0, 1)} · P. Chico: {formatNum(mp.stockParChico ?? 0, 1)} · P. Grande: {formatNum(mp.stockParGrande ?? 0, 1)}
          </p>
        )}
      </div>

      {/* Quantity inputs */}
      {hasSub ? (
        <div className="space-y-3">
          <p className="text-[12.5px] font-600 text-[var(--color-gr-sub)]">
            Cantidad por subtipo ({mp.unidad}) — la suma se calcula automáticamente
          </p>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Entero">
              <Input type="number" min="0" step="0.5" placeholder="0" value={entero} onChange={e => setEntero(e.target.value)} />
            </FormField>
            <FormField label="Partido chico">
              <Input type="number" min="0" step="0.5" placeholder="0" value={parChico} onChange={e => setParChico(e.target.value)} />
            </FormField>
            <FormField label="Partido grande">
              <Input type="number" min="0" step="0.5" placeholder="0" value={parGrande} onChange={e => setParGrande(e.target.value)} />
            </FormField>
          </div>
          <div className="rounded-[10px] px-4 py-3 text-center border border-[var(--color-gr-border)]"
            style={{ background: totalCalc > 0 ? 'var(--color-gr-primary-lite)' : 'var(--color-gr-border-lite)' }}>
            <p className="text-[11px] text-[var(--color-gr-muted)] font-600 uppercase">Total entrada</p>
            <p className="text-[28px] font-900 leading-tight"
              style={{ color: totalCalc > 0 ? 'var(--color-gr-primary)' : 'var(--color-gr-muted)' }}>
              {formatNum(totalCalc, 1)} <span className="text-[14px] font-500">{mp.unidad}</span>
            </p>
            {totalCalc > 0 && (
              <p className="text-[12px] text-[var(--color-gr-sub)] mt-0.5">
                Stock resultante: {formatNum(mp.stockTotal + totalCalc, 1)} {mp.unidad}
              </p>
            )}
          </div>
        </div>
      ) : (
        <FormField label={`Cantidad (${mp.unidad})`} required>
          <Input type="number" min="0" step="1" placeholder="0" value={totalSimple}
            onChange={e => setTotalSimple(e.target.value)} autoFocus />
          {parseFloat(totalSimple) > 0 && (
            <p className="text-[12px] text-[var(--color-gr-sub)] mt-1.5">
              Stock resultante: <strong>{formatNum(mp.stockTotal + parseFloat(totalSimple), 1)} {mp.unidad}</strong>
            </p>
          )}
        </FormField>
      )}

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Costo Bs (opcional)">
          <Input type="number" min="0" placeholder="0.00" value={costoBs} onChange={e => setCostoBs(e.target.value)} />
        </FormField>
        <FormField label="N° de lote">
          <Input type="number" min="1" placeholder="Ej: 3" value={lote} onChange={e => setLote(e.target.value)} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Proveedor">
          <Select value={proveedorId} onChange={e => setProvId(e.target.value)}>
            <option value="">— Sin proveedor —</option>
            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </Select>
        </FormField>
        <FormField label="Responsable" required>
          <Select value={responsable} onChange={e => setResp(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {RESPONSABLES.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
        </FormField>
      </div>

      <FormField label="Fecha" required>
        <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
      </FormField>

      <div className="flex gap-3 justify-end">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={totalCalc <= 0 || !responsable}>
          <Plus size={14} /> Registrar entrada
        </Btn>
      </div>
    </Modal>
  );
}
