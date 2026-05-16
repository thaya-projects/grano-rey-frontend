'use client';
import { useState } from 'react';
import { useAppStore, type Producto, type ProduccionDTO } from '@/store/useAppStore';
import { formatNum, formatBs } from '@/lib/utils';
import { Btn, Modal, FormField, Input, Select, Textarea, StockBar, Badge, useToast } from '@/components/ui';
import { Package, Plus, ArrowDownCircle, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';

const RESPONSABLES = ['Luis Mamani', 'Carlos Rojas', 'Silvana Montaño', 'Ana García'];
const MOTIVOS_BAJA  = ['Pérdida', 'Daño en almacén', 'Vencimiento', 'Otro'];

export default function StockPage() {
  const toast = useToast(s => s.show);
  const productos  = useAppStore(s => s.productos);
  const allLotes   = useAppStore(s => s.lotes);
  const registrarProduccion = useAppStore(s => s.registrarProduccion);
  const registrarBajaPT    = useAppStore(s => s.registrarBajaPT);

  const [prodModal, setProdModal] = useState<{ tipo: 'produccion' | 'baja'; producto: Producto } | null>(null);

  function handleProduccion(dto: Parameters<typeof registrarProduccion>[0]) {
    const res = registrarProduccion(dto);
    if (!res.ok) { toast(res.error ?? 'Error al registrar producción', 'error'); return; }
    setProdModal(null);
    toast(`Producción registrada — ${dto.bolsasProducidas} bolsas · Lote #${String(dto.numeroLote).padStart(3,'0')}`, 'success');
  }

  function handleBaja(productoId: string, cantidad: number, motivo: string, descripcion: string) {
    registrarBajaPT({ productoId, cantidad, motivo, descripcion });
    setProdModal(null);
    toast('Baja registrada en inventario', 'warning');
  }

  const getLotes = (pid: string) =>
    allLotes.filter(l => l.productoId === pid && l.cantidadActual > 0)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-[22px] font-900 text-[var(--color-gr-text)]">Stock de Productos</h1>
        <p className="text-[var(--color-gr-muted)] text-[13.5px] mt-0.5">
          Productos terminados · las ventas descuentan automáticamente
        </p>
      </div>

      <div className="bg-[var(--color-gr-info-bg)] border border-[var(--color-gr-info)]/20 rounded-[12px] px-5 py-3 flex items-center gap-3">
        <Info size={15} className="text-[var(--color-gr-info)] shrink-0" />
        <p className="text-[13px] text-[var(--color-gr-info)] font-500">
          <strong>Las ventas descuentan automáticamente.</strong> Usa "Registrar baja" solo para pérdidas, daños o vencimiento.
        </p>
      </div>

      {/* Product cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {productos.map(p => {
          const low  = p.stockActual < p.stockMinimo;
          const warn = !low && p.stockActual < p.stockMinimo * 2;
          return (
            <div key={p.id} className="card border-t-4 flex flex-col gap-3"
              style={{ borderTopColor: low ? 'var(--color-gr-danger)' : warn ? 'var(--color-gr-warning)' : 'var(--color-gr-success)' }}>
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-[10.5px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide font-mono">{p.codigo}</p>
                  <p className="font-800 text-[var(--color-gr-text)] text-[13.5px] leading-tight mt-0.5">{p.nombre}</p>
                </div>
                <Badge color={low ? 'red' : warn ? 'yellow' : 'green'} className="shrink-0 ml-2">
                  {low ? 'Crítico' : warn ? 'Bajo' : 'OK'}
                </Badge>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[36px] font-900 text-[var(--color-gr-text)] leading-none">{formatNum(p.stockActual, 0)}</span>
                  <span className="text-[13px] font-600 text-[var(--color-gr-muted)]">{p.bolsaEsQQ ? 'QQ' : 'bol'}</span>
                </div>
                <p className="text-[12px] text-[var(--color-gr-muted)] mt-0.5">
                  {formatNum((p.stockActual * p.kgPorBolsa) / 46, 2)} QQ equiv. · mín {p.stockMinimo}
                </p>
              </div>

              <StockBar value={p.stockActual} min={p.stockMinimo} />

              <div className="flex gap-2 mt-auto">
                <Btn variant="primary" size="sm" className="flex-1"
                  onClick={() => setProdModal({ tipo: 'produccion', producto: p })}>
                  <Plus size={13} /> Producción
                </Btn>
                <div className="relative group">
                  <Btn variant="ghost" size="sm"
                    onClick={() => setProdModal({ tipo: 'baja', producto: p })}>
                    <ArrowDownCircle size={13} /> Baja
                  </Btn>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[200px] bg-[var(--color-gr-text)] text-white text-[11px] rounded-[8px] px-3 py-2 text-center
                    opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 leading-relaxed">
                    Solo para pérdidas o daños — las ventas descuentan automáticamente
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--color-gr-text)]" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lote table */}
      <div>
        <h2 className="text-[13px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide mb-3">
          Desglose por lote
        </h2>
        <div className="card-no-pad">
          <div className="hidden md:grid gap-4 px-5 py-3 text-[11.5px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide border-b border-[var(--color-gr-border)]"
            style={{ gridTemplateColumns: 'auto 1fr auto auto auto auto', background: 'var(--color-gr-border-lite)' }}>
            <span>Lote</span><span>Producto</span><span className="text-right">Disponibles</span><span className="text-right">QQ</span><span>Fecha prod.</span><span>Estado</span>
          </div>

          {productos.flatMap(p => {
            const lotesProd = getLotes(p.id);
            if (lotesProd.length === 0) return [];
            return lotesProd.map((l, i) => {
              const pct    = l.cantidadActual / Math.max(l.cantidadInicial, 1);
              const status = pct < 0.15 ? 'red' : pct < 0.4 ? 'yellow' : 'green';
              const isLast = i === lotesProd.length - 1;
              return (
                <div key={l.id}
                  className={`border-b ${isLast ? 'border-b-[var(--color-gr-border)]' : 'border-b-[var(--color-gr-border-lite)]'}`}>
                  {/* Mobile */}
                  <div className="flex items-center justify-between px-5 py-3.5 md:hidden">
                    <div>
                      <p className="font-700 text-[var(--color-gr-text)] text-[13px]">
                        Lote #{String(l.numero).padStart(3,'0')} · {p.nombre.split(' ').slice(0,3).join(' ')}
                      </p>
                      <p className="text-[12px] text-[var(--color-gr-muted)]">{l.cantidadActual} {p.bolsaEsQQ ? 'QQ' : 'bol'} · {l.fecha}</p>
                    </div>
                    <Badge color={status}>{status === 'red' ? 'Agotando' : status === 'yellow' ? 'Medio' : 'OK'}</Badge>
                  </div>
                  {/* Desktop */}
                  <div className="hidden md:grid gap-4 px-5 py-3.5 items-center"
                    style={{ gridTemplateColumns: 'auto 1fr auto auto auto auto' }}>
                    <span className="font-700 font-mono text-[12.5px] text-[var(--color-gr-primary)]">
                      #{String(l.numero).padStart(3,'0')}
                    </span>
                    <div>
                      <p className="font-600 text-[var(--color-gr-text)] text-[13px]">{p.nombre}</p>
                      <p className="text-[11.5px] text-[var(--color-gr-muted)]">{p.codigo}</p>
                    </div>
                    <span className="text-right font-800 text-[var(--color-gr-text)] text-[14px]">
                      {formatNum(l.cantidadActual, 0)}
                      <span className="text-[11px] font-500 text-[var(--color-gr-muted)] ml-1">{p.bolsaEsQQ ? 'QQ' : 'bol'}</span>
                    </span>
                    <span className="text-right text-[13px] text-[var(--color-gr-sub)]">
                      {formatNum((l.cantidadActual * p.kgPorBolsa) / 46, 2)}
                    </span>
                    <span className="text-[13px] text-[var(--color-gr-muted)]">{l.fecha}</span>
                    <Badge color={status}>{pct < 0.15 ? 'Agotando' : pct < 0.4 ? 'Medio' : 'Disponible'}</Badge>
                  </div>
                </div>
              );
            });
          })}

          <div className="px-5 py-3 flex items-center justify-between text-[12.5px]"
            style={{ background: 'var(--color-gr-border-lite)' }}>
            <span className="text-[var(--color-gr-muted)]">
              {productos.reduce((s, p) => s + getLotes(p.id).length, 0)} lotes activos
            </span>
            <span className="font-700 text-[var(--color-gr-text)]">
              Valor inventario: {formatBs(productos.reduce((s, p) => s + p.stockActual * p.precioUnitarioBs, 0))}
            </span>
          </div>
        </div>
      </div>

      {prodModal?.tipo === 'produccion' && (
        <ProduccionModal producto={prodModal.producto} onClose={() => setProdModal(null)} onSave={handleProduccion} />
      )}
      {prodModal?.tipo === 'baja' && (
        <BajaModal producto={prodModal.producto} onClose={() => setProdModal(null)} onSave={handleBaja} />
      )}
    </div>
  );
}

// ─── Producción Modal — con verificación de MP ────────────────────────────────
function ProduccionModal({ producto, onClose, onSave }: {
  producto: Producto;
  onClose: () => void;
  onSave:  (dto: ProduccionDTO) => void;
}) {
  const allLotes         = useAppStore(s => s.lotes);
  const calcularConsumo  = useAppStore(s => s.calcularConsumoMP);

  const lastLote   = allLotes.filter(l => l.productoId === producto.id).sort((a, b) => b.numero - a.numero)[0];
  const nextLote   = (lastLote?.numero ?? 0) + 1;

  const [bolsas,      setBolsas]      = useState('');
  const [numeroLote,  setNumeroLote]  = useState(String(nextLote));
  const [responsable, setResponsable] = useState('');
  const [obs,         setObs]         = useState('');

  const bolsasNum  = parseInt(bolsas) || 0;
  const totalQQ    = (bolsasNum * producto.kgPorBolsa) / 46;
  const checks     = calcularConsumo(producto.id, bolsasNum);
  const todosOK    = checks.length === 0 || checks.every(c => c.ok);
  const puedeGuardar = bolsasNum > 0 && responsable && todosOK && parseInt(numeroLote) > 0;

  return (
    <Modal open title={`Registrar producción — ${producto.nombre}`} onClose={onClose}>
      {/* Stock actual */}
      <div className="rounded-[10px] px-4 py-3" style={{ background: 'var(--color-gr-primary-lite)' }}>
        <p className="font-600 text-[13px] text-[var(--color-gr-primary)]">
          Stock actual: <strong>{formatNum(producto.stockActual, 0)} {producto.bolsaEsQQ ? 'QQ' : 'bolsas'}</strong>
        </p>
        <p className="text-[12px] text-[var(--color-gr-sub)] mt-0.5">
          Lote siguiente sugerido: <strong>#{String(nextLote).padStart(3,'0')}</strong>
        </p>
      </div>

      {/* Cantidad + lote */}
      <div className="grid grid-cols-2 gap-3">
        <FormField label={`Bolsas a producir${producto.bolsaEsQQ ? ' (= QQ)' : ''}`} required>
          <Input type="number" min="1" placeholder="0" value={bolsas}
            onChange={e => setBolsas(e.target.value)} autoFocus />
        </FormField>
        <FormField label="N° de lote" required>
          <Input type="number" min="1" value={numeroLote}
            onChange={e => setNumeroLote(e.target.value)} />
        </FormField>
      </div>

      {/* Live QQ calculation */}
      {bolsasNum > 0 && (
        <div className="grid grid-cols-3 gap-3 rounded-[10px] px-4 py-3 text-[13px]"
          style={{ background: 'var(--color-gr-border-lite)' }}>
          <div>
            <p className="text-[var(--color-gr-muted)] text-[10.5px] font-600 uppercase">QQ a producir</p>
            <p className="font-800 text-[var(--color-gr-text)]">{formatNum(totalQQ, 2)}</p>
          </div>
          <div>
            <p className="text-[var(--color-gr-muted)] text-[10.5px] font-600 uppercase">Stock después</p>
            <p className="font-800 text-[var(--color-gr-text)]">{formatNum(producto.stockActual + bolsasNum, 0)}</p>
          </div>
          <div>
            <p className="text-[var(--color-gr-muted)] text-[10.5px] font-600 uppercase">Valor producido</p>
            <p className="font-800 text-[var(--color-gr-primary)]">{formatBs(bolsasNum * producto.precioUnitarioBs)}</p>
          </div>
        </div>
      )}

      {/* MP consumption section */}
      {producto.receta.length > 0 && (
        <div className="space-y-2">
          <p className="text-[12px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide">
            Materia prima que se consumirá
          </p>
          <div className="rounded-[10px] overflow-hidden border border-[var(--color-gr-border)]">
            {/* Header */}
            <div className="grid px-4 py-2 text-[11px] font-700 text-white uppercase tracking-wide"
              style={{ gridTemplateColumns: '1fr auto auto', background: 'var(--color-gr-primary)' }}>
              <span>Materia Prima</span>
              <span className="text-right">Ratio</span>
              <span className="text-right min-w-[80px]">A consumir</span>
            </div>
            {checks.length === 0
              ? producto.receta.map(r => (
                  <div key={r.materia_prima_id} className="grid px-4 py-3 text-[13px] border-t border-[var(--color-gr-border-lite)]"
                    style={{ gridTemplateColumns: '1fr auto auto' }}>
                    <span className="font-600 text-[var(--color-gr-text)]">{r.nombre}</span>
                    <span className="text-right text-[var(--color-gr-muted)] pr-4">{r.qq_por_qq_producido} qq/qq</span>
                    <span className="text-right font-700 text-[var(--color-gr-muted)] min-w-[80px]">—</span>
                  </div>
                ))
              : checks.map(c => (
                  <div key={c.mpId} className={`border-t border-[var(--color-gr-border-lite)] ${!c.ok ? '' : ''}`}
                    style={{ background: c.ok ? undefined : 'var(--color-gr-danger-bg)' }}>
                    <div className="grid px-4 py-3 text-[13px]"
                      style={{ gridTemplateColumns: '1fr auto auto' }}>
                      <div>
                        <p className="font-600 text-[var(--color-gr-text)]">{c.nombre}</p>
                        <p className="text-[11.5px] mt-0.5" style={{ color: c.ok ? 'var(--color-gr-success)' : 'var(--color-gr-danger)' }}>
                          {c.ok
                            ? <><CheckCircle2 size={11} className="inline mr-0.5" />Disponible: {formatNum(c.disponibleQQ, 1)} QQ ✓</>
                            : <><XCircle size={11} className="inline mr-0.5" />Insuficiente — disponible: {formatNum(c.disponibleQQ, 1)} QQ</>
                          }
                        </p>
                      </div>
                      <span className="text-right text-[var(--color-gr-muted)] pr-4 self-start pt-0.5">
                        {producto.receta.find(r => r.materia_prima_id === c.mpId)?.qq_por_qq_producido} qq/qq
                      </span>
                      <span className="text-right font-800 min-w-[80px] self-start pt-0.5"
                        style={{ color: c.ok ? 'var(--color-gr-text)' : 'var(--color-gr-danger)' }}>
                        {formatNum(c.necesarioQQ, 2)} QQ
                      </span>
                    </div>
                    {!c.ok && (
                      <div className="flex items-center gap-1.5 px-4 pb-2.5 text-[11.5px]" style={{ color: 'var(--color-gr-danger)' }}>
                        <AlertTriangle size={12} />
                        Necesario: {formatNum(c.necesarioQQ, 2)} QQ · Disponible: {formatNum(c.disponibleQQ, 1)} QQ
                      </div>
                    )}
                  </div>
                ))
            }
          </div>
        </div>
      )}

      {/* Responsable + observaciones */}
      <FormField label="Responsable" required>
        <Select value={responsable} onChange={e => setResponsable(e.target.value)}>
          <option value="">— Seleccionar —</option>
          {RESPONSABLES.map(r => <option key={r} value={r}>{r}</option>)}
        </Select>
      </FormField>

      <FormField label="Observaciones">
        <Textarea placeholder="Turno, notas del lote..." value={obs} onChange={e => setObs(e.target.value)} />
      </FormField>

      {/* Error si hay MP insuficiente */}
      {bolsasNum > 0 && !todosOK && (
        <div className="flex items-center gap-2 rounded-[10px] px-4 py-3 text-[13px]"
          style={{ background: 'var(--color-gr-danger-bg)', border: '1px solid rgba(181,61,53,0.2)' }}>
          <AlertTriangle size={15} className="text-[var(--color-gr-danger)] shrink-0" />
          <p className="text-[var(--color-gr-danger)] font-600">
            No se puede confirmar — falta stock de materia prima
          </p>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={() => puedeGuardar && onSave({
            productoId: producto.id,
            bolsasProducidas: bolsasNum,
            numeroLote: parseInt(numeroLote),
            responsable,
            observaciones: obs || undefined,
          })} disabled={!puedeGuardar}>
          <Plus size={14} /> Confirmar producción
        </Btn>
      </div>
    </Modal>
  );
}

// ─── Baja Modal ───────────────────────────────────────────────────────────────
function BajaModal({ producto, onClose, onSave }: {
  producto: Producto;
  onClose: () => void;
  onSave: (id: string, cantidad: number, motivo: string, desc: string) => void;
}) {
  const [motivo, setMotivo]   = useState('');
  const [cantidad, setCant]   = useState('');
  const [desc, setDesc]       = useState('');
  const cantNum = parseInt(cantidad) || 0;
  const valid   = motivo && cantNum > 0 && cantNum <= producto.stockActual;

  return (
    <Modal open title={`Registrar baja — ${producto.nombre}`} onClose={onClose}>
      <div className="rounded-[10px] px-4 py-3 flex items-start gap-2"
        style={{ background: 'var(--color-gr-danger-bg)', border: '1px solid rgba(181,61,53,0.15)' }}>
        <AlertTriangle size={15} className="text-[var(--color-gr-danger)] shrink-0 mt-0.5" />
        <div>
          <p className="font-600 text-[13px] text-[var(--color-gr-danger)]">Solo para pérdidas, daños o vencimiento.</p>
          <p className="text-[12px] text-[var(--color-gr-sub)]">Stock actual: <strong>{formatNum(producto.stockActual, 0)} {producto.bolsaEsQQ ? 'QQ' : 'bol'}</strong></p>
        </div>
      </div>
      <FormField label="Motivo" required>
        <Select value={motivo} onChange={e => setMotivo(e.target.value)}>
          <option value="">— Seleccionar —</option>
          {MOTIVOS_BAJA.map(m => <option key={m} value={m}>{m}</option>)}
        </Select>
      </FormField>
      <FormField label="Cantidad" required>
        <Input type="number" min="1" max={producto.stockActual} placeholder="0"
          value={cantidad} onChange={e => setCant(e.target.value)} />
      </FormField>
      <FormField label="Descripción" required>
        <Textarea placeholder="Describir qué ocurrió..." value={desc} onChange={e => setDesc(e.target.value)} />
      </FormField>
      <div className="flex gap-3 justify-end">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="danger" onClick={() => valid && onSave(producto.id, cantNum, motivo, desc)} disabled={!valid}>
          Confirmar baja
        </Btn>
      </div>
    </Modal>
  );
}
