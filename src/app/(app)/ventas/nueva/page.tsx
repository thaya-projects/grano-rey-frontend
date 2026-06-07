'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useClientes, useTransportistas } from '@/lib/api/catalogos';
import { useProductos } from '@/lib/api/productos';
import { useLotes } from '@/lib/api/produccion';
import { useCreateVenta } from '@/lib/api/ventas';
import { TipoFlete, type CreateVentaRequest, type LoteProduccion } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { formatBs, formatNum } from '@/lib/utils';
import { Btn, FormField, Input, Select, StepBar, SearchBox, Badge, Spinner, useToast } from '@/components/ui';
import { Plus, Trash2, ChevronRight, AlertTriangle, Package, CheckCircle2, Truck } from 'lucide-react';

type Step = 0 | 1 | 2;

interface LineaDetalle {
  key: string;
  productoId: string;
  loteId: string;
  cantidad: string;
  precioUnitario: string;
}

function emptyLinea(): LineaDetalle {
  return { key: Math.random().toString(36).slice(2), productoId: '', loteId: '', cantidad: '', precioUnitario: '' };
}

const FLETE_OPCIONES: { value: TipoFlete; label: string; desc: string }[] = [
  { value: TipoFlete.SIN_FLETE,            label: 'Sin flete',            desc: 'El cliente retira en planta'           },
  { value: TipoFlete.CLIENTE_PAGA_DIRECTO, label: 'Cliente paga directo', desc: 'El cliente paga al transportista'      },
  { value: TipoFlete.INCLUIDO_EN_VENTA,    label: 'Incluido en venta',    desc: 'El flete va en el total de la venta'   },
  { value: TipoFlete.GRANO_REY_PAGA,       label: 'Grano Rey paga',       desc: 'La empresa asume el costo del flete'  },
];

export default function NuevaVentaPage() {
  const router = useRouter();
  const toast  = useToast(s => s.show);

  const clientesQ       = useClientes();
  const productosQ      = useProductos();
  const transportistasQ = useTransportistas();
  const lotesQ          = useLotes();
  const createVenta     = useCreateVenta();

  const clientes       = clientesQ.data ?? [];
  const productos      = productosQ.data ?? [];
  const transportistas = transportistasQ.data ?? [];
  const lotes          = lotesQ.data ?? [];

  const lotesParaProducto = (productoId: string): LoteProduccion[] =>
    lotes
      .filter(l => l.producto?.id === productoId && Number(l.stockRestante) > 0)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const [step, setStep]             = useState<Step>(0);
  const [clienteId, setClienteId]   = useState('');
  const [search, setSearch]         = useState('');
  const [lineas, setLineas]         = useState<LineaDetalle[]>([emptyLinea()]);
  const [descuento, setDescuento]   = useState('0');
  const [tipoFlete, setTipoFlete]   = useState<TipoFlete>(TipoFlete.SIN_FLETE);
  const [fleteBs, setFleteBs]       = useState('');
  const [fleteUnidad, setFleteUni]  = useState<'bs' | 'bs_qq'>('bs');
  const [transportistaId, setTransp]= useState('');
  const [observaciones, setObs]     = useState('');
  const [fecha, setFecha]           = useState(new Date().toISOString().slice(0, 10));

  const clientesFiltrados = clientes.filter(c =>
    !search || c.nombre.toLowerCase().includes(search.toLowerCase()) || (c.ciudad ?? '').toLowerCase().includes(search.toLowerCase()),
  );
  const clienteSel       = clientes.find(c => c.id === clienteId);
  const transportistaSel = transportistas.find(t => t.id === transportistaId);

  function setLinea(key: string, field: keyof LineaDetalle, val: string) {
    setLineas(ls => ls.map(l => {
      if (l.key !== key) return l;
      const updated = { ...l, [field]: val };
      if (field === 'productoId') {
        const prod = productos.find(p => p.id === val);
        if (prod) {
          updated.precioUnitario = String(prod.precioUnitarioBs);
          const ls = lotesParaProducto(prod.id);
          updated.loteId = ls[0]?.id ?? '';
        } else {
          updated.loteId = ''; updated.precioUnitario = '';
        }
      }
      return updated;
    }));
  }

  const lineasValidas = lineas.filter(l =>
    l.productoId && parseFloat(l.cantidad) > 0 && parseFloat(l.precioUnitario) >= 0,
  );

  const subtotal = lineasValidas.reduce((s, l) => s + parseFloat(l.cantidad) * parseFloat(l.precioUnitario), 0);
  const descNum  = parseFloat(descuento) || 0;

  const totalQQ = lineasValidas.reduce((s, l) => {
    const prod = productos.find(p => p.id === l.productoId);
    return s + (parseFloat(l.cantidad) || 0) * (Number(prod?.pesoKgPorUnidad) || 0) / 46;
  }, 0);

  const fleteConMonto = tipoFlete === TipoFlete.INCLUIDO_EN_VENTA || tipoFlete === TipoFlete.GRANO_REY_PAGA;
  const fleteNum = fleteConMonto
    ? (fleteUnidad === 'bs_qq' ? (parseFloat(fleteBs) || 0) * totalQQ : (parseFloat(fleteBs) || 0))
    : 0;

  const totalSinDesc = subtotal + (tipoFlete === TipoFlete.INCLUIDO_EN_VENTA ? fleteNum : 0);
  const totalFinal   = Math.max(0, totalSinDesc - descNum);

  const detallesUI = useMemo(() => lineasValidas.map(l => {
    const prod  = productos.find(p => p.id === l.productoId)!;
    const lt    = lotesParaProducto(prod.id).find(x => x.id === l.loteId) ?? lotesParaProducto(prod.id)[0];
    const cant   = parseFloat(l.cantidad);
    const precio = parseFloat(l.precioUnitario);
    return {
      key: l.key,
      productoId: prod.id,
      productoNombre: prod.nombre,
      cantidad: cant,
      unidadId: prod.unidadVenta?.id ?? '',
      unidadLabel: prod.unidadVenta?.abreviatura ?? prod.unidadVenta?.codigo ?? 'bol',
      precioUnitario: precio,
      lote: lt,
      totalBs: cant * precio,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [lineas, productos, lotes]);

  async function guardar() {
    if (!clienteSel) return;
    const dto: CreateVentaRequest = {
      fecha,
      clienteId: clienteSel.id,
      transportistaId: transportistaId || undefined,
      descuentoBs: descNum || undefined,
      tipoFlete,
      fleteBs: fleteConMonto ? fleteNum : undefined,
      observaciones: observaciones || undefined,
      detalles: detallesUI.map(d => ({
        productoId: d.productoId,
        unidadId: d.unidadId,
        loteId: d.lote?.id,
        cantidad: d.cantidad,
        precioUnitarioBs: d.precioUnitario,
      })),
    };
    try {
      await createVenta.mutateAsync(dto);
      toast('¡Venta registrada! La remisión está lista.', 'success');
      router.push('/despachos');
    } catch (err) {
      toast(apiErrorMessage(err, 'No se pudo registrar la venta'), 'error');
    }
  }

  const loading = clientesQ.isLoading || productosQ.isLoading || transportistasQ.isLoading || lotesQ.isLoading;
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner size={28} color="var(--color-gr-primary)" />
      </div>
    );
  }

  return (
    <div className="max-w-[760px] mx-auto animate-fade-up pb-32">
      <div className="mb-5">
        <h1 className="text-[22px] font-900 text-[var(--color-gr-text)]">Nueva nota de venta</h1>
        <p className="text-[var(--color-gr-muted)] text-[13.5px] mt-0.5">La remisión se genera automáticamente al guardar</p>
      </div>

      <StepBar steps={['Cliente', 'Productos y flete', 'Confirmar']} current={step} />

      {/* ── Step 0: Cliente ───────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-4 mt-5 animate-fade-up">
          <div className="card">
            <p className="font-700 text-[var(--color-gr-text)] text-[15px] mb-4">Buscar cliente</p>
            <SearchBox value={search} onChange={setSearch} placeholder="Nombre, ciudad..." />
            <div className="mt-3 space-y-1.5 max-h-[300px] overflow-y-auto">
              {clientesFiltrados.map(c => (
                <button key={c.id} onClick={() => { setClienteId(c.id); setSearch(''); }}
                  className="w-full text-left px-4 py-3 rounded-[10px] border transition-all"
                  style={{
                    borderColor: clienteId === c.id ? 'var(--color-gr-primary)' : 'var(--color-gr-border)',
                    background:  clienteId === c.id ? 'var(--color-gr-primary-lite)' : 'white',
                  }}>
                  <p className="font-700 text-[var(--color-gr-text)] text-[14px]">{c.nombre}</p>
                  <p className="text-[12px] text-[var(--color-gr-muted)]">
                    {c.ciudad}{c.nit ? ` · NIT ${c.nit}` : ''}{c.telefono ? ` · ${c.telefono}` : ''}
                  </p>
                </button>
              ))}
              {clientesFiltrados.length === 0 && (
                <p className="text-center py-6 text-[var(--color-gr-muted)] text-[13px]">Sin resultados</p>
              )}
            </div>
          </div>

          <FormField label="Fecha de la venta">
            <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </FormField>

          <div className="flex justify-end">
            <Btn onClick={() => setStep(1)} disabled={!clienteId}>
              Continuar <ChevronRight size={15} />
            </Btn>
          </div>
        </div>
      )}

      {/* ── Step 1: Productos + Flete ─────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4 mt-5 animate-fade-up">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <p className="font-700 text-[var(--color-gr-text)] text-[15px]">Productos</p>
              <Btn size="sm" variant="ghost" onClick={() => setLineas(ls => [...ls, emptyLinea()])}>
                <Plus size={14} /> Agregar línea
              </Btn>
            </div>

            <div className="space-y-3">
              {lineas.map(l => {
                const prod      = productos.find(p => p.id === l.productoId);
                const lotesProd = prod ? lotesParaProducto(prod.id) : [];
                const lotesSel  = lotesProd.find(lt => lt.id === l.loteId);
                const cant      = parseFloat(l.cantidad) || 0;
                const precio    = parseFloat(l.precioUnitario) || 0;
                const subLin    = cant * precio;
                const stockInsuf = prod && cant > 0 && cant > Number(prod.stockActual);

                return (
                  <div key={l.key} className="border rounded-[12px] p-4 space-y-3"
                    style={{ borderColor: stockInsuf ? 'var(--color-gr-danger)' : 'var(--color-gr-border)' }}>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Producto">
                        <Select value={l.productoId} onChange={e => setLinea(l.key, 'productoId', e.target.value)}>
                          <option value="">— Seleccionar —</option>
                          {productos.map(p => (
                            <option key={p.id} value={p.id}>{p.codigo} · {p.nombre}</option>
                          ))}
                        </Select>
                      </FormField>
                      <FormField label="Lote (FIFO sugerido)">
                        <Select value={l.loteId} onChange={e => setLinea(l.key, 'loteId', e.target.value)}
                          disabled={lotesProd.length === 0}>
                          <option value="">— Sin asignar —</option>
                          {lotesProd.map(lt => (
                            <option key={lt.id} value={lt.id}>
                              {lt.codigoLote} · {Number(lt.stockRestante)} disponibles · {lt.fecha}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                    </div>

                    {lotesSel && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge color="gray">
                          {lotesSel.codigoLote} · {Number(lotesSel.stockRestante)} disp.
                        </Badge>
                        <Badge color="blue">Vence: {lotesSel.fechaVencimiento}</Badge>
                        {cant > Number(lotesSel.stockRestante) && (
                          <Badge color="red">Cantidad supera stock del lote</Badge>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                      <FormField label="Cantidad">
                        <Input type="number" min="1" placeholder="0" value={l.cantidad}
                          onChange={e => setLinea(l.key, 'cantidad', e.target.value)} />
                      </FormField>
                      <FormField label="Precio unit. (Bs)">
                        <Input type="number" min="0" step="0.5" placeholder="0" value={l.precioUnitario}
                          onChange={e => setLinea(l.key, 'precioUnitario', e.target.value)} />
                      </FormField>
                      <div className="flex flex-col justify-end pb-0.5">
                        {subLin > 0 && (
                          <div className="text-right">
                            <p className="text-[11px] text-[var(--color-gr-muted)] font-600">Subtotal</p>
                            <p className="font-800 text-[var(--color-gr-primary)] text-[15px]">{formatBs(subLin)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {prod && cant > 0 && (
                      <div className={`rounded-[8px] px-3 py-2 text-[12px] flex items-start gap-2 ${stockInsuf ? 'bg-[var(--color-gr-danger-bg)]' : 'bg-[var(--color-gr-border-lite)]'}`}>
                        {stockInsuf
                          ? <AlertTriangle size={13} className="text-[var(--color-gr-danger)] shrink-0 mt-0.5" />
                          : <Package size={13} className="text-[var(--color-gr-muted)] shrink-0 mt-0.5" />}
                        <div>
                          {stockInsuf
                            ? <span className="font-600 text-[var(--color-gr-danger)]">Solo quedan <strong>{formatNum(Number(prod.stockActual), 0)} unidades</strong> disponibles</span>
                            : <span className="text-[var(--color-gr-muted)]">
                                Disponible: <strong className="text-[var(--color-gr-text)]">{formatNum(Number(prod.stockActual), 0)} {prod.unidadVenta?.abreviatura ?? ''}</strong>
                                {' '}· {formatNum(cant * Number(prod.pesoKgPorUnidad), 1)} kg · {formatNum(cant * Number(prod.pesoKgPorUnidad) / 46, 2)} QQ
                              </span>}
                        </div>
                      </div>
                    )}

                    {lineas.length > 1 && (
                      <div className="flex justify-end">
                        <Btn size="sm" variant="danger" onClick={() => setLineas(ls => ls.filter(x => x.key !== l.key))}>
                          <Trash2 size={12} /> Quitar
                        </Btn>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Flete */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-[var(--color-gr-primary)]" />
              <p className="font-700 text-[var(--color-gr-text)] text-[15px]">Flete</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FLETE_OPCIONES.map(opt => (
                <button key={opt.value} onClick={() => setTipoFlete(opt.value)}
                  className="flex flex-col items-center text-center p-3 rounded-[10px] border-2 transition-all text-[12px]"
                  style={{
                    borderColor: tipoFlete === opt.value ? 'var(--color-gr-primary)' : 'var(--color-gr-border)',
                    background:  tipoFlete === opt.value ? 'var(--color-gr-primary-lite)' : 'white',
                  }}>
                  <span className="font-700 text-[13px]"
                    style={{ color: tipoFlete === opt.value ? 'var(--color-gr-primary)' : 'var(--color-gr-text)' }}>
                    {opt.label}
                  </span>
                  <span className="text-[var(--color-gr-muted)] mt-0.5 leading-tight">{opt.desc}</span>
                </button>
              ))}
            </div>

            {fleteConMonto && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-600 text-[var(--color-gr-sub)]">Monto del flete:</p>
                  <div className="flex border border-[var(--color-gr-border)] rounded-[8px] overflow-hidden text-[12px]">
                    {(['bs', 'bs_qq'] as const).map(u => (
                      <button key={u} onClick={() => setFleteUni(u)}
                        className="px-3 py-1.5 font-600 transition-colors"
                        style={{
                          background: fleteUnidad === u ? 'var(--color-gr-primary)' : 'white',
                          color:      fleteUnidad === u ? 'white' : 'var(--color-gr-muted)',
                        }}>
                        {u === 'bs' ? 'Bs total' : 'Bs/QQ'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-end">
                  <FormField label={fleteUnidad === 'bs' ? 'Monto flete (Bs)' : 'Precio flete (Bs/QQ)'}>
                    <Input type="number" min="0" step="10" placeholder="0"
                      value={fleteBs} onChange={e => setFleteBs(e.target.value)} autoFocus />
                  </FormField>
                  {fleteUnidad === 'bs_qq' && totalQQ > 0 && parseFloat(fleteBs) > 0 && (
                    <div className="pb-0.5">
                      <p className="text-[11px] text-[var(--color-gr-muted)] font-600">Total flete</p>
                      <p className="font-800 text-[var(--color-gr-text)] text-[15px]">{formatBs(fleteNum)}</p>
                      <p className="text-[11px] text-[var(--color-gr-muted)]">{formatNum(totalQQ, 2)} QQ × {formatBs(parseFloat(fleteBs))}</p>
                    </div>
                  )}
                </div>

                {tipoFlete === TipoFlete.INCLUIDO_EN_VENTA && fleteNum > 0 && (
                  <p className="text-[12px] text-[var(--color-gr-info)] bg-[var(--color-gr-info-bg)] rounded-[8px] px-3 py-2">
                    El flete de <strong>{formatBs(fleteNum)}</strong> se suma al total de la venta
                  </p>
                )}
                {tipoFlete === TipoFlete.GRANO_REY_PAGA && fleteNum > 0 && (
                  <p className="text-[12px] text-[var(--color-gr-warning)] bg-[var(--color-gr-warning-bg)] rounded-[8px] px-3 py-2">
                    Grano Rey asumirá <strong>{formatBs(fleteNum)}</strong> como egreso de transporte
                  </p>
                )}
              </div>
            )}

            {tipoFlete === TipoFlete.CLIENTE_PAGA_DIRECTO && (
              <div className="rounded-[10px] px-4 py-3 text-[13px] flex items-center gap-2"
                style={{ background: 'var(--color-gr-info-bg)', color: 'var(--color-gr-info)' }}>
                <Truck size={14} className="shrink-0" />
                El cliente pagará el flete directamente al transportista — no afecta el total de la venta
              </div>
            )}

            <FormField label="Transportista (opcional)">
              <Select value={transportistaId} onChange={e => setTransp(e.target.value)}>
                <option value="">— Sin asignar —</option>
                {transportistas.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                    {t.placa ? ` · ${t.placa}` : ''}
                    {t.marca ? ` · ${t.marca}` : ''}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Observaciones">
              <Input placeholder="Instrucciones especiales..." value={observaciones}
                onChange={e => setObs(e.target.value)} />
            </FormField>
          </div>

          <div className="flex gap-3 justify-between">
            <Btn variant="ghost" onClick={() => setStep(0)}>← Volver</Btn>
            <Btn onClick={() => setStep(2)} disabled={lineasValidas.length === 0 || lineasValidas.some(l => {
              const prod = productos.find(p => p.id === l.productoId);
              return prod && parseFloat(l.cantidad) > Number(prod.stockActual);
            })}>
              Continuar <ChevronRight size={15} />
            </Btn>
          </div>
        </div>
      )}

      {/* ── Step 2: Confirmar ─────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4 mt-5 animate-fade-up">
          <div className="card">
            <p className="font-800 text-[var(--color-gr-text)] text-[15px] mb-4">Resumen de la venta</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">Cliente</p>
                <p className="font-700 text-[var(--color-gr-text)]">{clienteSel?.nombre}</p>
                <p className="text-[12px] text-[var(--color-gr-muted)]">{clienteSel?.ciudad}{clienteSel?.nit ? ` · NIT ${clienteSel.nit}` : ''}</p>
              </div>
              <div>
                <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">Fecha</p>
                <p className="font-700 text-[var(--color-gr-text)]">{fecha}</p>
              </div>
            </div>

            <div className="border border-[var(--color-gr-border)] rounded-[10px] overflow-hidden mb-4">
              {detallesUI.map((d, i) => (
                <div key={d.key} className={`flex items-center gap-4 px-4 py-3 ${i < detallesUI.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}>
                  <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
                    style={{ background: 'var(--color-gr-primary-lite)' }}>
                    <Package size={14} className="text-[var(--color-gr-primary)]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-600 text-[var(--color-gr-text)] text-[13.5px]">{d.productoNombre}</p>
                    <p className="text-[11.5px] text-[var(--color-gr-muted)]">
                      {d.cantidad} {d.unidadLabel} {d.lote ? `· ${d.lote.codigoLote}` : ''} · {formatBs(d.precioUnitario)}/u
                    </p>
                  </div>
                  <span className="font-800 text-[var(--color-gr-primary)] text-[14px]">{formatBs(d.totalBs)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-[13.5px]">
              <div className="flex justify-between text-[var(--color-gr-sub)]">
                <span>Subtotal productos</span><span>{formatBs(subtotal)}</span>
              </div>
              {tipoFlete === TipoFlete.INCLUIDO_EN_VENTA && fleteNum > 0 && (
                <div className="flex justify-between text-[var(--color-gr-info)]">
                  <span className="flex items-center gap-1"><Truck size={13} /> Flete incluido</span>
                  <span>+{formatBs(fleteNum)}</span>
                </div>
              )}
              {tipoFlete === TipoFlete.CLIENTE_PAGA_DIRECTO && (
                <div className="flex items-center gap-2 text-[var(--color-gr-info)] text-[12.5px]">
                  <Truck size={13} />
                  <span>Cliente paga flete al transportista — no incluido en el total</span>
                </div>
              )}
              {tipoFlete === TipoFlete.GRANO_REY_PAGA && fleteNum > 0 && (
                <div className="flex justify-between text-[var(--color-gr-warning)]">
                  <span className="flex items-center gap-1"><Truck size={13} /> Flete Grano Rey</span>
                  <span>{formatBs(fleteNum)} (egreso)</span>
                </div>
              )}
              {descNum > 0 && (
                <div className="flex justify-between text-[var(--color-gr-muted)]">
                  <span>Descuento</span><span>-{formatBs(descNum)}</span>
                </div>
              )}
              <div className="flex justify-between font-900 text-[22px] text-[var(--color-gr-primary)] pt-2 border-t border-[var(--color-gr-border)]">
                <span>TOTAL</span><span>{formatBs(totalFinal)}</span>
              </div>
            </div>

            {transportistaSel && (
              <div className="mt-4 rounded-[10px] px-4 py-3 text-[12.5px] space-y-0.5"
                style={{ background: 'var(--color-gr-border-lite)' }}>
                <p className="font-700 text-[var(--color-gr-sub)] mb-1">Transportista asignado</p>
                <p>
                  {transportistaSel.nombre}
                  {transportistaSel.marca ? ` · ${transportistaSel.marca}` : ''}
                  {transportistaSel.placa ? ` · ${transportistaSel.placa}` : ''}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-[12px] px-5 py-4 flex items-start gap-3"
            style={{ background: 'var(--color-gr-success-bg)', border: '1px solid rgba(46,125,82,0.15)' }}>
            <CheckCircle2 size={18} className="text-[var(--color-gr-success)] shrink-0 mt-0.5" />
            <div className="text-[13px]">
              <p className="font-700 text-[var(--color-gr-text)]">La remisión se genera automáticamente ✓</p>
              <p className="text-[var(--color-gr-sub)] mt-0.5">
                El número de guía, responsable y todos los datos se asignan solos. Solo deberás imprimirla.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-between">
            <Btn variant="ghost" onClick={() => setStep(1)}>← Volver</Btn>
            <div className="flex gap-2">
              <Btn variant="secondary" onClick={guardar} loading={createVenta.isPending}>Guardar venta</Btn>
              <Btn variant="gold" onClick={guardar} loading={createVenta.isPending}>Guardar y ver remisión</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Barra fija inferior (step 1) ──────────────────────────────────── */}
      {step === 1 && subtotal > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:left-[240px] z-30">
          <div className="max-w-[760px] mx-auto px-6 pb-4">
            <div className="bg-white border border-[var(--color-gr-border)] rounded-[16px] px-5 py-3.5 shadow-xl flex items-center gap-4">
              <div className="flex-1 grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-[10.5px] text-[var(--color-gr-muted)] font-600 uppercase">Subtotal</p>
                  <p className="font-700 text-[var(--color-gr-text)] text-[14px]">{formatBs(subtotal)}</p>
                </div>
                {fleteConMonto && fleteNum > 0 && (
                  <div>
                    <p className="text-[10.5px] text-[var(--color-gr-muted)] font-600 uppercase">Flete</p>
                    <p className="font-700 text-[13px]" style={{ color: tipoFlete === TipoFlete.INCLUIDO_EN_VENTA ? 'var(--color-gr-info)' : 'var(--color-gr-warning)' }}>
                      {formatBs(fleteNum)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[10.5px] text-[var(--color-gr-muted)] font-600 uppercase">Descuento (Bs)</p>
                  <Input type="number" min="0" step="5" value={descuento}
                    onChange={e => setDescuento(e.target.value)}
                    className="h-7 text-[12px] text-center px-2 mt-0.5" />
                </div>
                <div>
                  <p className="text-[10.5px] font-700 text-[var(--color-gr-primary)] uppercase">Total</p>
                  <p className="font-900 text-[var(--color-gr-primary)] text-[18px] leading-tight">{formatBs(totalFinal)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
