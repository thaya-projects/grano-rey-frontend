'use client';
import { useState } from 'react';
import { useProductos, useCreateKardexProducto } from '@/lib/api/productos';
import { useLotes, useCreateLote } from '@/lib/api/produccion';
import { TipoMovimientoPT, type Producto } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { formatNum, formatBs } from '@/lib/utils';
import { Btn, Modal, FormField, Input, Select, Textarea, StockBar, Badge, Spinner, useToast } from '@/components/ui';
import { Package, Plus, ArrowDownCircle, Info, AlertTriangle, ShieldCheck } from 'lucide-react';

const MOTIVOS_BAJA = ['Pérdida', 'Daño en almacén', 'Vencimiento', 'Otro'];

export default function StockPage() {
  const toast = useToast(s => s.show);
  const productosQ = useProductos();
  const lotesQ     = useLotes();

  const productos = productosQ.data ?? [];
  const lotes     = lotesQ.data ?? [];

  const [prodModal, setProdModal] = useState<{ tipo: 'produccion' | 'baja'; producto: Producto } | null>(null);

  const getLotes = (pid: string) =>
    lotes
      .filter(l => l.producto?.id === pid && Number(l.stockRestante) > 0)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

  if (productosQ.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner size={28} color="var(--color-gr-primary)" />
      </div>
    );
  }

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
          <strong>Las ventas descuentan automáticamente.</strong> Usa &quot;Registrar baja&quot; solo para pérdidas, daños o vencimiento.
        </p>
      </div>

      {/* Product cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {productos.map(p => {
          const stock = Number(p.stockActual);
          const min   = Number(p.stockMinimo);
          const low   = stock < min;
          const warn  = !low && stock < min * 2;
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
                  <span className="text-[36px] font-900 text-[var(--color-gr-text)] leading-none">{formatNum(stock, 0)}</span>
                  <span className="text-[13px] font-600 text-[var(--color-gr-muted)]">{p.unidadVenta?.abreviatura ?? 'u'}</span>
                </div>
                <p className="text-[12px] text-[var(--color-gr-muted)] mt-0.5">
                  {formatNum((stock * Number(p.pesoKgPorUnidad)) / 46, 2)} QQ equiv. · mín {min} · vida útil {p.vidaUtilMeses}m
                </p>
              </div>

              <StockBar value={stock} min={min} />

              <div className="flex gap-2 mt-auto">
                <Btn variant="primary" size="sm" className="flex-1"
                  onClick={() => setProdModal({ tipo: 'produccion', producto: p })}>
                  <Plus size={13} /> Producción
                </Btn>
                <Btn variant="ghost" size="sm"
                  onClick={() => setProdModal({ tipo: 'baja', producto: p })}>
                  <ArrowDownCircle size={13} /> Baja
                </Btn>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lote table */}
      <div>
        <h2 className="text-[13px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide mb-3">
          Lotes activos · trazabilidad SENASAG
        </h2>
        <div className="card-no-pad">
          <div className="overflow-x-auto">
          <div style={{ minWidth: 620 }}>
          <div className="hidden md:grid gap-4 px-5 py-3 text-[11.5px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide border-b border-[var(--color-gr-border)]"
            style={{ gridTemplateColumns: '180px 1fr auto auto auto auto', background: 'var(--color-gr-border-lite)' }}>
            <span>Código Lote</span><span>Producto</span><span className="text-right">Disponible</span><span>Producido</span><span>Vence</span><span>Estado</span>
          </div>

          {productos.flatMap(p => {
            const lotesProd = getLotes(p.id);
            if (lotesProd.length === 0) return [];
            return lotesProd.map((l, i) => {
              const pct    = Number(l.stockRestante) / Math.max(Number(l.cantidadProducida), 1);
              const status = pct < 0.15 ? 'red' : pct < 0.4 ? 'yellow' : 'green';
              const isLast = i === lotesProd.length - 1;
              return (
                <div key={l.id}
                  className={`border-b ${isLast ? 'border-b-[var(--color-gr-border)]' : 'border-b-[var(--color-gr-border-lite)]'}`}>
                  {/* Mobile */}
                  <div className="flex items-center justify-between px-5 py-3.5 md:hidden">
                    <div>
                      <p className="font-700 text-[var(--color-gr-text)] text-[13px]">{l.codigoLote}</p>
                      <p className="text-[12px] text-[var(--color-gr-muted)]">
                        {Number(l.stockRestante)} {p.unidadVenta?.abreviatura ?? ''} · vence {l.fechaVencimiento}
                      </p>
                    </div>
                    <Badge color={status}>{status === 'red' ? 'Agotando' : status === 'yellow' ? 'Medio' : 'OK'}</Badge>
                  </div>
                  {/* Desktop */}
                  <div className="hidden md:grid gap-4 px-5 py-3.5 items-center"
                    style={{ gridTemplateColumns: '180px 1fr auto auto auto auto' }}>
                    <span className="font-700 font-mono text-[12.5px] text-[var(--color-gr-primary)]">
                      {l.codigoLote}
                    </span>
                    <div>
                      <p className="font-600 text-[var(--color-gr-text)] text-[13px]">{p.nombre}</p>
                      <p className="text-[11.5px] text-[var(--color-gr-muted)]">{p.codigo}{l.registroSanitario ? ` · ${l.registroSanitario}` : ''}</p>
                    </div>
                    <span className="text-right font-800 text-[var(--color-gr-text)] text-[14px]">
                      {formatNum(Number(l.stockRestante), 0)}
                      <span className="text-[11px] font-500 text-[var(--color-gr-muted)] ml-1">{p.unidadVenta?.abreviatura ?? ''}</span>
                    </span>
                    <span className="text-[13px] text-[var(--color-gr-sub)]">
                      {formatNum(Number(l.cantidadProducida), 0)} · {l.fecha}
                    </span>
                    <span className="text-[13px] text-[var(--color-gr-muted)]">{l.fechaVencimiento}</span>
                    <Badge color={status}>{pct < 0.15 ? 'Agotando' : pct < 0.4 ? 'Medio' : 'Disponible'}</Badge>
                  </div>
                </div>
              );
            });
          })}

          {productos.reduce((s, p) => s + getLotes(p.id).length, 0) === 0 && (
            <div className="py-12 text-center text-[var(--color-gr-muted)] text-[13.5px]">
              Sin lotes activos. Registrá la primera producción desde el panel superior.
            </div>
          )}

          <div className="px-5 py-3 flex items-center justify-between text-[12.5px]"
            style={{ background: 'var(--color-gr-border-lite)' }}>
            <span className="text-[var(--color-gr-muted)]">
              {productos.reduce((s, p) => s + getLotes(p.id).length, 0)} lotes activos
            </span>
            <span className="font-700 text-[var(--color-gr-text)]">
              Valor inventario: {formatBs(productos.reduce((s, p) => s + Number(p.stockActual) * Number(p.precioUnitarioBs), 0))}
            </span>
          </div>
          </div>
          </div>
        </div>
      </div>

      {prodModal?.tipo === 'produccion' && (
        <ProduccionModal
          producto={prodModal.producto}
          onClose={() => setProdModal(null)}
          onSaved={(codigoLote) => {
            setProdModal(null);
            toast(`Lote ${codigoLote} registrado correctamente`, 'success');
          }}
          onError={(msg) => toast(msg, 'error')}
        />
      )}
      {prodModal?.tipo === 'baja' && (
        <BajaModal
          producto={prodModal.producto}
          onClose={() => setProdModal(null)}
          onSaved={() => {
            setProdModal(null);
            toast('Baja registrada', 'warning');
          }}
          onError={(msg) => toast(msg, 'error')}
        />
      )}
    </div>
  );
}

// ─── Producción Modal ──────────────────────────────────────────────────────
function ProduccionModal({ producto, onClose, onSaved, onError }: {
  producto: Producto;
  onClose: () => void;
  onSaved: (codigoLote: string) => void;
  onError: (msg: string) => void;
}) {
  const createLote = useCreateLote();
  const [bolsas, setBolsas] = useState('');
  const [costoMpBs, setCosto] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [obs, setObs] = useState('');
  const [numeroLotePropio, setNumeroLotePropio] = useState('');
  const [mermaUnidades, setMermaUnidades] = useState('');
  const [mermaMpKg, setMermaMpKg] = useState('');
  const [mermaObs, setMermaObs] = useState('');

  const bolsasNum = parseFloat(bolsas) || 0;
  const mermaUnNum = parseFloat(mermaUnidades) || 0;
  const mermaMpNum = parseFloat(mermaMpKg) || 0;
  const totalQQ   = (bolsasNum * Number(producto.pesoKgPorUnidad)) / 46;
  const puedeGuardar = bolsasNum > 0 && !!producto.unidadVenta?.id;

  async function handleSave() {
    if (!puedeGuardar) return;
    try {
      const lote = await createLote.mutateAsync({
        fecha,
        cantidadProducida: bolsasNum,
        productoId: producto.id,
        unidadId: producto.unidadVenta!.id,
        costoMpBs: parseFloat(costoMpBs) || undefined,
        observaciones: obs || undefined,
        numeroLotePropio: numeroLotePropio.trim() || undefined,
        mermaUnidades: mermaUnNum > 0 ? mermaUnNum : undefined,
        mermaMpKg: mermaMpNum > 0 ? mermaMpNum : undefined,
        mermaObservaciones: mermaObs.trim() || undefined,
      });
      onSaved(lote.codigoLote);
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo registrar la producción'));
    }
  }

  return (
    <Modal open title={`Registrar producción — ${producto.nombre}`} onClose={onClose}>
      <div className="rounded-[10px] px-4 py-3" style={{ background: 'var(--color-gr-primary-lite)' }}>
        <p className="font-600 text-[13px] text-[var(--color-gr-primary)]">
          Stock actual: <strong>{formatNum(Number(producto.stockActual), 0)} {producto.unidadVenta?.abreviatura ?? ''}</strong>
        </p>
        <p className="text-[12px] text-[var(--color-gr-sub)] mt-0.5 flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-[var(--color-gr-primary)]" />
          El código de lote SENASAG se genera automáticamente al guardar.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Cantidad producida" required>
          <Input type="number" min="1" placeholder="0" value={bolsas}
            onChange={e => setBolsas(e.target.value)} autoFocus />
        </FormField>
        <FormField label="Fecha" required>
          <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
        </FormField>
      </div>

      {bolsasNum > 0 && (
        <div className="grid grid-cols-3 gap-3 rounded-[10px] px-4 py-3 text-[13px]"
          style={{ background: 'var(--color-gr-border-lite)' }}>
          <div>
            <p className="text-[var(--color-gr-muted)] text-[10.5px] font-600 uppercase">QQ a producir</p>
            <p className="font-800 text-[var(--color-gr-text)]">{formatNum(totalQQ, 2)}</p>
          </div>
          <div>
            <p className="text-[var(--color-gr-muted)] text-[10.5px] font-600 uppercase">Stock después</p>
            <p className="font-800 text-[var(--color-gr-text)]">{formatNum(Number(producto.stockActual) + bolsasNum, 0)}</p>
          </div>
          <div>
            <p className="text-[var(--color-gr-muted)] text-[10.5px] font-600 uppercase">Valor producido</p>
            <p className="font-800 text-[var(--color-gr-primary)]">{formatBs(bolsasNum * Number(producto.precioUnitarioBs))}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <FormField label="N° lote propio (opcional)">
          <Input placeholder="ej: GR-0042" value={numeroLotePropio}
            onChange={e => setNumeroLotePropio(e.target.value)} />
        </FormField>
        <FormField label="Costo MP (Bs)">
          <Input type="number" min="0" step="0.01" placeholder="0" value={costoMpBs}
            onChange={e => setCosto(e.target.value)} />
        </FormField>
      </div>

      <div className="rounded-[10px] border border-[var(--color-gr-border)] p-3 space-y-3">
        <p className="font-700 text-[13px] text-[var(--color-gr-text)]">Merma (opcional)</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField label={`Merma producto final (${producto.unidadVenta?.abreviatura ?? 'u'})`}>
            <Input type="number" min="0" step="0.01" placeholder="0" value={mermaUnidades}
              onChange={e => setMermaUnidades(e.target.value)} />
          </FormField>
          <FormField label="Merma materia prima (kg)">
            <Input type="number" min="0" step="0.01" placeholder="0" value={mermaMpKg}
              onChange={e => setMermaMpKg(e.target.value)} />
          </FormField>
        </div>
        <FormField label="Observaciones de la merma">
          <Textarea placeholder="Detalles de la pérdida..." value={mermaObs}
            onChange={e => setMermaObs(e.target.value)} />
        </FormField>
      </div>

      <FormField label="Observaciones generales">
        <Textarea placeholder="Turno, notas del lote..." value={obs} onChange={e => setObs(e.target.value)} />
      </FormField>

      <div className="flex gap-3 justify-end">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!puedeGuardar} loading={createLote.isPending}>
          <Package size={14} /> Confirmar producción
        </Btn>
      </div>
    </Modal>
  );
}

// ─── Baja Modal ────────────────────────────────────────────────────────────
function BajaModal({ producto, onClose, onSaved, onError }: {
  producto: Producto;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const createKardex = useCreateKardexProducto();
  const [motivo, setMotivo] = useState('');
  const [cantidad, setCant] = useState('');
  const [desc, setDesc] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));

  const cantNum = parseFloat(cantidad) || 0;
  const valid   = !!motivo && cantNum > 0 && cantNum <= Number(producto.stockActual) && !!producto.unidadVenta?.id;

  async function handleSave() {
    if (!valid) return;
    try {
      await createKardex.mutateAsync({
        fecha,
        tipoMovimiento: TipoMovimientoPT.SALIDA,
        cantidad: cantNum,
        productoId: producto.id,
        unidadId: producto.unidadVenta!.id,
        detalle: `${motivo}${desc ? ` — ${desc}` : ''}`,
      });
      onSaved();
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo registrar la baja'));
    }
  }

  return (
    <Modal open title={`Registrar baja — ${producto.nombre}`} onClose={onClose}>
      <div className="rounded-[10px] px-4 py-3 flex items-start gap-2"
        style={{ background: 'var(--color-gr-danger-bg)', border: '1px solid rgba(181,61,53,0.15)' }}>
        <AlertTriangle size={15} className="text-[var(--color-gr-danger)] shrink-0 mt-0.5" />
        <div>
          <p className="font-600 text-[13px] text-[var(--color-gr-danger)]">Solo para pérdidas, daños o vencimiento.</p>
          <p className="text-[12px] text-[var(--color-gr-sub)]">
            Stock actual: <strong>{formatNum(Number(producto.stockActual), 0)} {producto.unidadVenta?.abreviatura ?? ''}</strong>
          </p>
        </div>
      </div>
      <FormField label="Motivo" required>
        <Select value={motivo} onChange={e => setMotivo(e.target.value)}>
          <option value="">— Seleccionar —</option>
          {MOTIVOS_BAJA.map(m => <option key={m} value={m}>{m}</option>)}
        </Select>
      </FormField>
      <FormField label="Cantidad" required>
        <Input type="number" min="1" max={Number(producto.stockActual)} placeholder="0"
          value={cantidad} onChange={e => setCant(e.target.value)} />
      </FormField>
      <FormField label="Fecha" required>
        <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
      </FormField>
      <FormField label="Descripción">
        <Textarea placeholder="Describir qué ocurrió..." value={desc} onChange={e => setDesc(e.target.value)} />
      </FormField>
      <div className="flex gap-3 justify-end">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="danger" onClick={handleSave} disabled={!valid} loading={createKardex.isPending}>
          Confirmar baja
        </Btn>
      </div>
    </Modal>
  );
}
