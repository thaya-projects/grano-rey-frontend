'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useClientes, useTransportistas } from '@/lib/api/catalogos';
import { useProductos } from '@/lib/api/productos';
import { useLotes } from '@/lib/api/produccion';
import { useCreateVenta } from '@/lib/api/ventas';
import { TipoFlete, type CreateVentaRequest, type LoteProduccion, type Producto } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { formatBs, formatNum, equivPT } from '@/lib/utils';
import { Btn, FormField, Input, Select, SearchBox, Spinner, useToast } from '@/components/ui';
import {
  Plus, Minus, Trash2, ChevronRight, AlertTriangle,
  Package, CheckCircle2, Truck, User, MapPin, Phone,
  ChevronLeft, ShoppingCart,
} from 'lucide-react';

type Step = 0 | 1 | 2;

interface LineaDetalle {
  key: string;
  productoId: string;
  loteId: string;
  cantidad: number;
  precioUnitario: string;
}

const FLETE_OPCIONES = [
  { value: TipoFlete.SIN_FLETE,            label: 'Retira en planta',      desc: 'El cliente viene a buscar'          },
  { value: TipoFlete.CLIENTE_PAGA_DIRECTO, label: 'Cliente paga flete',    desc: 'Paga directo al transportista'      },
  { value: TipoFlete.INCLUIDO_EN_VENTA,    label: 'Flete en la venta',     desc: 'Se suma al total'                   },
  { value: TipoFlete.GRANO_REY_PAGA,       label: 'Grano Rey paga',        desc: 'La empresa asume el costo'          },
] as const;

export default function NuevaVentaPage() {
  const router = useRouter();
  const toast  = useToast(s => s.show);

  const clientesQ       = useClientes();
  const productosQ      = useProductos();
  const transportistasQ = useTransportistas();
  const lotesQ          = useLotes();
  const createVenta     = useCreateVenta();

  const clientes       = clientesQ.data ?? [];
  const productos      = (productosQ.data ?? []).filter(p => p.activo);
  const transportistas = transportistasQ.data ?? [];
  const lotes          = lotesQ.data ?? [];

  const lotesParaProducto = (productoId: string): LoteProduccion[] =>
    lotes
      .filter(l => l.producto?.id === productoId && Number(l.stockRestante) > 0)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const [step, setStep]             = useState<Step>(0);
  const [clienteId, setClienteId]   = useState('');
  const [searchCliente, setSearchC] = useState('');
  const [searchProducto, setSearchP]= useState('');
  const [lineas, setLineas]         = useState<LineaDetalle[]>([]);
  const [descuento, setDescuento]   = useState('0');
  const [tipoFlete, setTipoFlete]   = useState<TipoFlete>(TipoFlete.SIN_FLETE);
  const [fleteBs, setFleteBs]       = useState('');
  const [fleteUnidad, setFleteUni]  = useState<'bs' | 'bs_qq'>('bs');
  const [transportistaId, setTransp]= useState('');
  const [observaciones, setObs]     = useState('');
  const [fecha, setFecha]           = useState(new Date().toISOString().slice(0, 10));

  const clientesFiltrados = clientes.filter(c =>
    !searchCliente || c.nombre.toLowerCase().includes(searchCliente.toLowerCase())
      || (c.ciudad ?? '').toLowerCase().includes(searchCliente.toLowerCase()),
  );
  const productosFiltrados = productos.filter(p =>
    !searchProducto
      || p.nombre.toLowerCase().includes(searchProducto.toLowerCase())
      || p.codigo.toLowerCase().includes(searchProducto.toLowerCase()),
  );

  const clienteSel       = clientes.find(c => c.id === clienteId);
  const transportistaSel = transportistas.find(t => t.id === transportistaId);

  function agregarProducto(prod: Producto) {
    setLineas(ls => {
      const exist = ls.find(l => l.productoId === prod.id);
      if (exist) {
        return ls.map(l => l.productoId === prod.id
          ? { ...l, cantidad: l.cantidad + 1 }
          : l);
      }
      const ls2 = lotesParaProducto(prod.id);
      return [...ls, {
        key: prod.id,
        productoId: prod.id,
        loteId: ls2[0]?.id ?? '',
        cantidad: 1,
        precioUnitario: prod.precioUnitarioBs != null ? String(prod.precioUnitarioBs) : '',
      }];
    });
  }

  function setCantidad(productoId: string, cant: number) {
    if (cant <= 0) {
      setLineas(ls => ls.filter(l => l.productoId !== productoId));
    } else {
      setLineas(ls => ls.map(l => l.productoId === productoId ? { ...l, cantidad: cant } : l));
    }
  }

  function setPrecio(productoId: string, precio: string) {
    setLineas(ls => ls.map(l => l.productoId === productoId ? { ...l, precioUnitario: precio } : l));
  }

  function setLote(productoId: string, loteId: string) {
    setLineas(ls => ls.map(l => l.productoId === productoId ? { ...l, loteId } : l));
  }

  const lineasValidas = lineas.filter(l =>
    l.productoId && l.cantidad > 0 && parseFloat(l.precioUnitario) >= 0,
  );

  const subtotal = lineasValidas.reduce(
    (s, l) => s + l.cantidad * parseFloat(l.precioUnitario),
    0,
  );
  const descNum = parseFloat(descuento) || 0;

  const totalQQ = lineasValidas.reduce((s, l) => {
    const prod = productos.find(p => p.id === l.productoId);
    return s + equivPT(l.cantidad, prod?.unidadProduccion?.factorABase, prod?.unidadProduccion?.tipo);
  }, 0);

  const fleteConMonto = tipoFlete === TipoFlete.INCLUIDO_EN_VENTA || tipoFlete === TipoFlete.GRANO_REY_PAGA;
  const fleteNum = fleteConMonto
    ? (fleteUnidad === 'bs_qq' ? (parseFloat(fleteBs) || 0) * totalQQ : (parseFloat(fleteBs) || 0))
    : 0;

  const totalFinal = Math.max(
    0,
    subtotal + (tipoFlete === TipoFlete.INCLUIDO_EN_VENTA ? fleteNum : 0) - descNum,
  );

  const detallesUI = useMemo(() => lineasValidas.map(l => {
    const prod  = productos.find(p => p.id === l.productoId)!;
    const lt    = lotesParaProducto(prod.id).find(x => x.id === l.loteId) ?? lotesParaProducto(prod.id)[0];
    return {
      key: l.key,
      productoId: prod.id,
      productoNombre: prod.nombre,
      cantidad: l.cantidad,
      unidadId: prod.unidadProduccion?.id ?? '',
      unidadLabel: prod.unidadProduccion?.abreviatura ?? prod.unidadProduccion?.codigo ?? '',
      precioUnitario: parseFloat(l.precioUnitario),
      lote: lt,
      totalBs: l.cantidad * parseFloat(l.precioUnitario),
      stockInsuf: l.cantidad > Number(prod.stockActual),
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
      toast('¡Venta registrada!', 'success');
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

  const hayStockInsuf = detallesUI.some(d => d.stockInsuf);

  return (
    <div className="max-w-[820px] mx-auto animate-fade-up pb-32">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/ventas')}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-gr-border-lite)] transition-colors text-[var(--color-gr-muted)]">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-[20px] font-900 text-[var(--color-gr-text)]">Nueva venta</h1>
          <p className="text-[var(--color-gr-muted)] text-[12.5px]">La remisión se genera automáticamente</p>
        </div>
      </div>

      {/* Step pills */}
      <div className="flex items-center gap-2 mb-7">
        {(['Cliente', 'Productos', 'Confirmar'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-800 shrink-0"
                style={{
                  background: step > i ? 'var(--color-gr-success)' : step === i ? 'var(--color-gr-primary)' : 'var(--color-gr-border)',
                  color: step >= i ? 'white' : 'var(--color-gr-muted)',
                }}>
                {step > i ? '✓' : i + 1}
              </div>
              <span className="text-[13px] font-600 hidden sm:block"
                style={{ color: step === i ? 'var(--color-gr-text)' : 'var(--color-gr-muted)' }}>{s}</span>
            </div>
            {i < 2 && <div className="w-8 h-px bg-[var(--color-gr-border)] shrink-0" />}
          </div>
        ))}
      </div>

      {/* ── Step 0: Cliente ─────────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-4 animate-fade-up">
          <div className="card">
            <p className="font-700 text-[var(--color-gr-text)] text-[15px] mb-1">¿A quién le vendemos?</p>
            <p className="text-[var(--color-gr-muted)] text-[12.5px] mb-4">Selecciona o busca el cliente</p>

            <SearchBox value={searchCliente} onChange={setSearchC} placeholder="Buscar por nombre o ciudad..." />

            <div className="mt-3 space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {clientesFiltrados.map(c => (
                <button key={c.id} onClick={() => setClienteId(c.id)}
                  className="w-full text-left px-4 py-3.5 rounded-[12px] border-2 transition-all flex items-center gap-3"
                  style={{
                    borderColor: clienteId === c.id ? 'var(--color-gr-primary)' : 'var(--color-gr-border)',
                    background:  clienteId === c.id ? 'var(--color-gr-primary-lite)' : 'white',
                  }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: clienteId === c.id ? 'var(--color-gr-primary)' : 'var(--color-gr-border-lite)' }}>
                    <User size={15} style={{ color: clienteId === c.id ? 'white' : 'var(--color-gr-muted)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-700 text-[var(--color-gr-text)] text-[14px]">{c.nombre}</p>
                    <div className="flex flex-wrap gap-x-3 mt-0.5">
                      {c.ciudad && (
                        <span className="flex items-center gap-1 text-[11.5px] text-[var(--color-gr-muted)]">
                          <MapPin size={10} /> {c.ciudad}
                        </span>
                      )}
                      {c.telefono && (
                        <span className="flex items-center gap-1 text-[11.5px] text-[var(--color-gr-muted)]">
                          <Phone size={10} /> {c.telefono}
                        </span>
                      )}
                    </div>
                  </div>
                  {clienteId === c.id && (
                    <CheckCircle2 size={18} style={{ color: 'var(--color-gr-primary)', flexShrink: 0 }} />
                  )}
                </button>
              ))}
              {clientesFiltrados.length === 0 && (
                <p className="text-center py-8 text-[var(--color-gr-muted)] text-[13px]">Sin resultados</p>
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

      {/* ── Step 1: Productos ───────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-up">

          {/* Cliente seleccionado — resumen */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-[12px]"
            style={{ background: 'var(--color-gr-primary-lite)' }}>
            <User size={15} style={{ color: 'var(--color-gr-primary)' }} />
            <div className="flex-1">
              <p className="font-700 text-[var(--color-gr-primary)] text-[13.5px]">{clienteSel?.nombre}</p>
              {clienteSel?.ciudad && <p className="text-[11.5px] text-[var(--color-gr-muted)]">{clienteSel.ciudad}</p>}
            </div>
            <button onClick={() => setStep(0)} className="text-[11px] text-[var(--color-gr-primary)] font-600 underline underline-offset-2">
              Cambiar
            </button>
          </div>

          {/* Catálogo de productos */}
          <div className="card">
            <p className="font-700 text-[var(--color-gr-text)] text-[15px] mb-1">Agregar productos</p>
            <p className="text-[var(--color-gr-muted)] text-[12.5px] mb-3">Toca + para agregar al pedido</p>
            <SearchBox value={searchProducto} onChange={setSearchP} placeholder="Buscar producto..." />
            <div className="mt-3 space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {productosFiltrados.map(p => {
                const lineaActual = lineas.find(l => l.productoId === p.id);
                const enPedido   = lineaActual ? lineaActual.cantidad : 0;
                return (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] border transition-all"
                    style={{
                      borderColor: enPedido > 0 ? 'var(--color-gr-primary)' : 'var(--color-gr-border)',
                      background:  enPedido > 0 ? 'var(--color-gr-primary-lite)' : 'white',
                    }}>
                    <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
                      style={{ background: 'var(--color-gr-border-lite)' }}>
                      <Package size={14} style={{ color: 'var(--color-gr-primary)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-700 text-[var(--color-gr-text)] text-[13px] truncate">{p.nombre}</p>
                      <p className="text-[11px] text-[var(--color-gr-muted)]">
                        {p.precioUnitarioBs ? formatBs(Number(p.precioUnitarioBs)) : '—'} · Stock: {Number(p.stockActual)} {p.unidadProduccion?.abreviatura ?? ''}
                      </p>
                    </div>
                    {enPedido > 0 ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => setCantidad(p.id, enPedido - 1)}
                          className="w-7 h-7 rounded-full border flex items-center justify-center transition-colors hover:bg-[var(--color-gr-border-lite)]"
                          style={{ borderColor: 'var(--color-gr-border)' }}>
                          <Minus size={12} />
                        </button>
                        <span className="font-800 text-[var(--color-gr-primary)] text-[14px] min-w-[20px] text-center">{enPedido}</span>
                        <button onClick={() => setCantidad(p.id, enPedido + 1)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-colors"
                          style={{ background: 'var(--color-gr-primary)' }}>
                          <Plus size={12} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => agregarProducto(p)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 transition-colors hover:opacity-80"
                        style={{ background: 'var(--color-gr-primary)' }}>
                        <Plus size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items en el pedido */}
          {lineas.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingCart size={15} style={{ color: 'var(--color-gr-primary)' }} />
                <p className="font-700 text-[var(--color-gr-text)] text-[14px]">Pedido ({lineasValidas.length} ítem{lineasValidas.length !== 1 ? 's' : ''})</p>
              </div>
              <div className="space-y-3">
                {lineas.map(l => {
                  const prod       = productos.find(p => p.id === l.productoId)!;
                  const lotesProd  = prod ? lotesParaProducto(prod.id) : [];
                  const precio     = parseFloat(l.precioUnitario) || 0;
                  const stockInsuf = l.cantidad > Number(prod?.stockActual);

                  return (
                    <div key={l.key} className="rounded-[12px] border p-3 space-y-2.5"
                      style={{ borderColor: stockInsuf ? 'var(--color-gr-danger)' : 'var(--color-gr-border)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-700 text-[var(--color-gr-text)] text-[13.5px]">{prod?.nombre}</p>
                          <p className="text-[11.5px] text-[var(--color-gr-muted)] mt-0.5">
                            Stock: {Number(prod?.stockActual)} {prod?.unidadProduccion?.abreviatura ?? ''}
                          </p>
                        </div>
                        <button onClick={() => setCantidad(prod.id, 0)}
                          className="text-[var(--color-gr-muted)] hover:text-[var(--color-gr-danger)] transition-colors p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 items-end">
                        <FormField label="Cantidad">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setCantidad(prod.id, l.cantidad - 1)}
                              className="w-7 h-8 border rounded-[6px] flex items-center justify-center shrink-0 hover:bg-[var(--color-gr-border-lite)] transition-colors"
                              style={{ borderColor: 'var(--color-gr-border)' }}>
                              <Minus size={11} />
                            </button>
                            <Input type="number" min="1" value={l.cantidad}
                              onChange={e => setCantidad(prod.id, parseInt(e.target.value) || 0)}
                              className="text-center px-1" />
                            <button onClick={() => setCantidad(prod.id, l.cantidad + 1)}
                              className="w-7 h-8 border rounded-[6px] flex items-center justify-center shrink-0 hover:bg-[var(--color-gr-border-lite)] transition-colors"
                              style={{ borderColor: 'var(--color-gr-border)' }}>
                              <Plus size={11} />
                            </button>
                          </div>
                        </FormField>
                        <FormField label="Precio unit. (Bs)">
                          <Input type="number" min="0" step="0.5" value={l.precioUnitario}
                            onChange={e => setPrecio(prod.id, e.target.value)} />
                        </FormField>
                        <div className="pb-1 text-right">
                          <p className="text-[10.5px] text-[var(--color-gr-muted)] font-600 uppercase mb-0.5">Subtotal</p>
                          <p className="font-900 text-[var(--color-gr-primary)] text-[16px]">{formatBs(l.cantidad * precio)}</p>
                        </div>
                      </div>

                      {lotesProd.length > 0 && (
                        <FormField label="Lote (FIFO sugerido)">
                          <Select value={l.loteId} onChange={e => setLote(prod.id, e.target.value)}>
                            <option value="">— Sin asignar —</option>
                            {lotesProd.map(lt => (
                              <option key={lt.id} value={lt.id}>
                                {lt.codigoLote} · {Number(lt.stockRestante)} disp. · vence {lt.fechaVencimiento}
                              </option>
                            ))}
                          </Select>
                        </FormField>
                      )}

                      {stockInsuf && (
                        <div className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-[12px]"
                          style={{ background: 'var(--color-gr-danger-bg)', color: 'var(--color-gr-danger)' }}>
                          <AlertTriangle size={13} className="shrink-0" />
                          <span className="font-600">Solo hay <strong>{Number(prod?.stockActual)}</strong> unidades disponibles</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Descuento */}
          {lineasValidas.length > 0 && (
            <div className="card">
              <FormField label="Descuento (Bs)" hint="Opcional">
                <Input type="number" min="0" step="5" value={descuento}
                  onChange={e => setDescuento(e.target.value)} placeholder="0" />
              </FormField>
            </div>
          )}

          {/* Flete */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2">
              <Truck size={16} style={{ color: 'var(--color-gr-primary)' }} />
              <p className="font-700 text-[var(--color-gr-text)] text-[15px]">Flete y transporte</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {FLETE_OPCIONES.map(opt => (
                <button key={opt.value} onClick={() => setTipoFlete(opt.value)}
                  className="flex flex-col items-start p-3.5 rounded-[12px] border-2 transition-all text-left gap-1"
                  style={{
                    borderColor: tipoFlete === opt.value ? 'var(--color-gr-primary)' : 'var(--color-gr-border)',
                    background:  tipoFlete === opt.value ? 'var(--color-gr-primary-lite)' : 'white',
                  }}>
                  <span className="font-700 text-[13px]"
                    style={{ color: tipoFlete === opt.value ? 'var(--color-gr-primary)' : 'var(--color-gr-text)' }}>
                    {opt.label}
                  </span>
                  <span className="text-[11px] text-[var(--color-gr-muted)] leading-tight">{opt.desc}</span>
                </button>
              ))}
            </div>

            {fleteConMonto && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-600 text-[var(--color-gr-sub)]">Monto:</p>
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
                  <FormField label={fleteUnidad === 'bs' ? 'Monto flete (Bs)' : 'Precio (Bs/QQ)'}>
                    <Input type="number" min="0" step="10" placeholder="0"
                      value={fleteBs} onChange={e => setFleteBs(e.target.value)} />
                  </FormField>
                  {fleteUnidad === 'bs_qq' && totalQQ > 0 && parseFloat(fleteBs) > 0 && (
                    <div className="pb-1">
                      <p className="text-[10.5px] text-[var(--color-gr-muted)] font-600 mb-0.5">Total flete</p>
                      <p className="font-800 text-[var(--color-gr-text)] text-[15px]">{formatBs(fleteNum)}</p>
                      <p className="text-[11px] text-[var(--color-gr-muted)]">{formatNum(totalQQ, 2)} QQ × {formatBs(parseFloat(fleteBs))}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <FormField label="Transportista" hint="Opcional">
              <Select value={transportistaId} onChange={e => setTransp(e.target.value)}>
                <option value="">— Sin asignar —</option>
                {transportistas.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}{t.placa ? ` · ${t.placa}` : ''}{t.marca ? ` · ${t.marca}` : ''}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Observaciones" hint="Opcional">
              <Input placeholder="Instrucciones especiales..." value={observaciones}
                onChange={e => setObs(e.target.value)} />
            </FormField>
          </div>

          <div className="flex gap-3 justify-between">
            <Btn variant="ghost" onClick={() => setStep(0)}><ChevronLeft size={15} /> Volver</Btn>
            <Btn onClick={() => setStep(2)} disabled={lineasValidas.length === 0 || hayStockInsuf}>
              Revisar pedido <ChevronRight size={15} />
            </Btn>
          </div>
        </div>
      )}

      {/* ── Step 2: Confirmar ───────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-up">
          <div className="card">
            {/* Cabecera */}
            <div className="flex items-center gap-4 pb-4 mb-4 border-b border-[var(--color-gr-border-lite)]">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'var(--color-gr-primary-lite)' }}>
                <User size={18} style={{ color: 'var(--color-gr-primary)' }} />
              </div>
              <div>
                <p className="font-800 text-[var(--color-gr-text)] text-[15px]">{clienteSel?.nombre}</p>
                <p className="text-[12px] text-[var(--color-gr-muted)]">
                  {clienteSel?.ciudad}{clienteSel?.nit ? ` · NIT ${clienteSel.nit}` : ''} · {fecha}
                </p>
              </div>
            </div>

            {/* Líneas */}
            <div className="space-y-2 mb-4">
              {detallesUI.map(d => (
                <div key={d.key} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
                    style={{ background: 'var(--color-gr-primary-lite)' }}>
                    <Package size={13} style={{ color: 'var(--color-gr-primary)' }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-600 text-[var(--color-gr-text)] text-[13px]">{d.productoNombre}</p>
                    <p className="text-[11px] text-[var(--color-gr-muted)]">
                      {d.cantidad} {d.unidadLabel} × {formatBs(d.precioUnitario)}
                      {d.lote ? ` · ${d.lote.codigoLote}` : ''}
                    </p>
                  </div>
                  <span className="font-800 text-[var(--color-gr-primary)] text-[14px]">{formatBs(d.totalBs)}</span>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="space-y-2 text-[13.5px] border-t border-[var(--color-gr-border-lite)] pt-3">
              <div className="flex justify-between text-[var(--color-gr-sub)]">
                <span>Subtotal productos</span><span>{formatBs(subtotal)}</span>
              </div>
              {tipoFlete === TipoFlete.INCLUIDO_EN_VENTA && fleteNum > 0 && (
                <div className="flex justify-between" style={{ color: 'var(--color-gr-info)' }}>
                  <span className="flex items-center gap-1"><Truck size={12} /> Flete incluido</span>
                  <span>+{formatBs(fleteNum)}</span>
                </div>
              )}
              {tipoFlete === TipoFlete.GRANO_REY_PAGA && fleteNum > 0 && (
                <div className="flex justify-between" style={{ color: 'var(--color-gr-warning)' }}>
                  <span className="flex items-center gap-1"><Truck size={12} /> Flete Grano Rey</span>
                  <span>{formatBs(fleteNum)} (egreso)</span>
                </div>
              )}
              {tipoFlete === TipoFlete.CLIENTE_PAGA_DIRECTO && (
                <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--color-gr-info)' }}>
                  <Truck size={12} /><span>El cliente paga el flete al transportista</span>
                </div>
              )}
              {descNum > 0 && (
                <div className="flex justify-between text-[var(--color-gr-muted)]">
                  <span>Descuento</span><span>-{formatBs(descNum)}</span>
                </div>
              )}
              <div className="flex justify-between font-900 text-[24px] text-[var(--color-gr-primary)] pt-2 border-t border-[var(--color-gr-border)]">
                <span>Total</span><span>{formatBs(totalFinal)}</span>
              </div>
            </div>

            {transportistaSel && (
              <div className="mt-4 rounded-[10px] px-4 py-3 text-[12.5px] flex items-center gap-3"
                style={{ background: 'var(--color-gr-border-lite)' }}>
                <Truck size={14} style={{ color: 'var(--color-gr-muted)' }} />
                <span className="text-[var(--color-gr-sub)]">
                  {transportistaSel.nombre}
                  {transportistaSel.marca ? ` · ${transportistaSel.marca}` : ''}
                  {transportistaSel.placa ? ` · ${transportistaSel.placa}` : ''}
                </span>
              </div>
            )}
          </div>

          <div className="rounded-[12px] px-5 py-4 flex items-start gap-3"
            style={{ background: 'var(--color-gr-success-bg)', border: '1px solid rgba(46,125,82,0.15)' }}>
            <CheckCircle2 size={18} style={{ color: 'var(--color-gr-success)', flexShrink: 0, marginTop: 2 }} />
            <p className="text-[13px] text-[var(--color-gr-sub)]">
              La remisión se genera automáticamente al guardar — solo deberás imprimirla.
            </p>
          </div>

          <div className="flex gap-3 justify-between">
            <Btn variant="ghost" onClick={() => setStep(1)}><ChevronLeft size={15} /> Volver</Btn>
            <Btn variant="gold" onClick={guardar} loading={createVenta.isPending}>
              <CheckCircle2 size={15} /> Confirmar venta
            </Btn>
          </div>
        </div>
      )}

      {/* ── Barra fija inferior ─────────────────────────────────────────────── */}
      {step === 1 && lineasValidas.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:left-[240px] z-30 pointer-events-none">
          <div className="max-w-[820px] mx-auto px-5 pb-4 pointer-events-auto">
            <div className="bg-white border border-[var(--color-gr-border)] rounded-[16px] px-5 py-3.5 shadow-xl">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <div>
                    <p className="text-[10.5px] text-[var(--color-gr-muted)] font-600 uppercase">Ítems</p>
                    <p className="font-800 text-[var(--color-gr-text)] text-[15px]">{lineasValidas.length}</p>
                  </div>
                  {fleteConMonto && fleteNum > 0 && (
                    <div>
                      <p className="text-[10.5px] text-[var(--color-gr-muted)] font-600 uppercase">Flete</p>
                      <p className="font-700 text-[13px]" style={{ color: tipoFlete === TipoFlete.INCLUIDO_EN_VENTA ? 'var(--color-gr-info)' : 'var(--color-gr-warning)' }}>
                        {formatBs(fleteNum)}
                      </p>
                    </div>
                  )}
                  {descNum > 0 && (
                    <div>
                      <p className="text-[10.5px] text-[var(--color-gr-muted)] font-600 uppercase">Desc.</p>
                      <p className="font-700 text-[13px] text-[var(--color-gr-muted)]">-{formatBs(descNum)}</p>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[10.5px] font-700 text-[var(--color-gr-primary)] uppercase">Total</p>
                  <p className="font-900 text-[var(--color-gr-primary)] text-[20px] leading-tight">{formatBs(totalFinal)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
