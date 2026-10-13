import { TipoFlete, type Cliente, type Producto, type Transportista, type LoteProduccion } from '@/lib/types';
import { formatBs, formatNum } from '@/lib/utils';
import { Btn, FormField, Input, Select, SearchBox } from '@/components/ui';
import {
  Plus, Minus, Trash2, ChevronRight, ChevronLeft, AlertTriangle,
  Package, Truck, User, ShoppingCart,
} from 'lucide-react';
import { FLETE_OPCIONES, type LineaDetalle, type LoteAsignado } from './types';

export function PasoProductos({
  clienteSel, onVolver, onContinuar,
  productos, productosFiltrados, searchProducto, onSearchProductoChange,
  lineas, lineasValidas, lotesParaProducto, asignarLotesFifo,
  agregarProducto, decrementarLinea, setCantidad, eliminarLinea, setPrecio,
  descuento, onDescuentoChange, descNum,
  tipoFlete, onTipoFleteChange, fleteConMonto, fleteUnidad, onFleteUnidadChange,
  fleteBs, onFleteBsChange, totalQQ, fleteNum,
  transportistaId, onTransportistaChange, transportistas, onNuevoTransportista,
  observaciones, onObservacionesChange,
  totalFinal, hayStockInsuf,
}: {
  clienteSel?: Cliente;
  onVolver: () => void;
  onContinuar: () => void;
  productos: Producto[];
  productosFiltrados: Producto[];
  searchProducto: string;
  onSearchProductoChange: (v: string) => void;
  lineas: LineaDetalle[];
  lineasValidas: LineaDetalle[];
  lotesParaProducto: (productoId: string) => LoteProduccion[];
  asignarLotesFifo: (productoId: string, cantidad: number) => { asignaciones: LoteAsignado[]; faltante: number };
  agregarProducto: (prod: Producto) => void;
  decrementarLinea: (productoId: string) => void;
  setCantidad: (productoId: string, cant: number) => void;
  eliminarLinea: (productoId: string) => void;
  setPrecio: (productoId: string, precio: string) => void;
  descuento: string;
  onDescuentoChange: (v: string) => void;
  descNum: number;
  tipoFlete: TipoFlete;
  onTipoFleteChange: (v: TipoFlete) => void;
  fleteConMonto: boolean;
  fleteUnidad: 'bs' | 'bs_qq';
  onFleteUnidadChange: (v: 'bs' | 'bs_qq') => void;
  fleteBs: string;
  onFleteBsChange: (v: string) => void;
  totalQQ: number;
  fleteNum: number;
  transportistaId: string;
  onTransportistaChange: (v: string) => void;
  transportistas: Transportista[];
  onNuevoTransportista: () => void;
  observaciones: string;
  onObservacionesChange: (v: string) => void;
  totalFinal: number;
  hayStockInsuf: boolean;
}) {
  return (
    <div className="space-y-4 animate-fade-up">

      {/* Cliente seleccionado — resumen */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-[12px]"
        style={{ background: 'var(--color-gr-primary-lite)' }}>
        <User size={15} style={{ color: 'var(--color-gr-primary)' }} />
        <div className="flex-1">
          <p className="font-700 text-gr-primary text-[13.5px]">{clienteSel?.nombre}</p>
          {clienteSel?.ciudad && <p className="text-[11.5px] text-gr-muted">{clienteSel.ciudad}</p>}
        </div>
        <button onClick={onVolver} className="text-[11px] text-gr-primary font-600 underline underline-offset-2">
          Cambiar
        </button>
      </div>

      {/* Catálogo de productos */}
      <div className="card">
        <p className="font-700 text-gr-text text-[15px] mb-1">Agregar productos</p>
        <p className="text-gr-muted text-[12.5px] mb-3">Toca + para agregar al pedido</p>
        <SearchBox value={searchProducto} onChange={onSearchProductoChange} placeholder="Buscar producto..." />
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
                  <p className="font-700 text-gr-text text-[13px] truncate">{p.nombre}</p>
                  <p className="text-[11px] text-gr-muted">
                    {p.precioUnitarioBs ? formatBs(Number(p.precioUnitarioBs)) : '—'} · Stock: {Number(p.stockActual)} {p.unidadProduccion?.abreviatura ?? ''}
                  </p>
                </div>
                {enPedido > 0 ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => decrementarLinea(p.id)}
                      className="w-7 h-7 rounded-full border flex items-center justify-center transition-colors hover:bg-gr-border-lite"
                      style={{ borderColor: 'var(--color-gr-border)' }}>
                      <Minus size={12} />
                    </button>
                    <span className="font-800 text-gr-primary text-[14px] min-w-[20px] text-center">{enPedido}</span>
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
            <p className="font-700 text-gr-text text-[14px]">Pedido ({lineasValidas.length} ítem{lineasValidas.length !== 1 ? 's' : ''})</p>
          </div>
          <div className="space-y-3">
            {lineas.map(l => {
              const prod       = productos.find(p => p.id === l.productoId)!;
              const lotesProd  = prod ? lotesParaProducto(prod.id) : [];
              const precio     = parseFloat(l.precioUnitario) || 0;
              const stockInsuf = l.cantidad > Number(prod?.stockActual);
              const { asignaciones: lotesAsignados, faltante: loteFaltante } =
                prod ? asignarLotesFifo(prod.id, l.cantidad) : { asignaciones: [], faltante: 0 };

              return (
                <div key={l.key} className="rounded-[12px] border p-3 space-y-2.5"
                  style={{ borderColor: stockInsuf ? 'var(--color-gr-danger)' : 'var(--color-gr-border)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-700 text-gr-text text-[13.5px]">{prod?.nombre}</p>
                      <p className="text-[11.5px] text-gr-muted mt-0.5">
                        Stock: {Number(prod?.stockActual)} {prod?.unidadProduccion?.abreviatura ?? ''}
                      </p>
                    </div>
                    <button onClick={() => eliminarLinea(prod.id)}
                      className="text-gr-muted hover:text-gr-danger transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-end">
                    <FormField label="Cantidad">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => decrementarLinea(prod.id)}
                          className="w-7 h-8 border rounded-[6px] flex items-center justify-center shrink-0 hover:bg-gr-border-lite transition-colors"
                          style={{ borderColor: 'var(--color-gr-border)' }}>
                          <Minus size={11} />
                        </button>
                        <Input
                          type="number"
                          min="0"
                          value={l.cantidad === 0 ? '' : l.cantidad}
                          onChange={e => {
                            const raw = e.target.value;
                            setCantidad(prod.id, raw === '' ? 0 : parseInt(raw, 10));
                          }}
                          onBlur={e => {
                            // Al perder el foco, si quedó vacío o 0 volvemos a 1 —
                            // así el usuario nunca se queda con cantidad inválida.
                            if (!e.target.value || parseInt(e.target.value, 10) < 1) {
                              setCantidad(prod.id, 1);
                            }
                          }}
                          className="text-center px-1" />
                        <button onClick={() => setCantidad(prod.id, l.cantidad + 1)}
                          className="w-7 h-8 border rounded-[6px] flex items-center justify-center shrink-0 hover:bg-gr-border-lite transition-colors"
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
                      <p className="text-[10.5px] text-gr-muted font-600 uppercase mb-0.5">Subtotal</p>
                      <p className="font-900 text-gr-primary text-[16px]">{formatBs(l.cantidad * precio)}</p>
                    </div>
                  </div>

                  {lotesProd.length > 0 && (
                    <div>
                      <p className="text-[10.5px] font-700 text-gr-muted uppercase tracking-wide mb-1">
                        Lote (FIFO automático)
                      </p>
                      <div className="space-y-1">
                        {lotesAsignados.map(a => (
                          <div key={a.lote.id}
                            className="flex items-center justify-between gap-2 rounded-[8px] px-2.5 py-1.5 text-[12px]"
                            style={{ background: 'var(--color-gr-border-lite)' }}>
                            <span className="font-600 text-gr-text truncate">
                              {a.lote.codigoLote} <span className="text-gr-muted font-500">· vence {a.lote.fechaVencimiento}</span>
                            </span>
                            <span className="font-800 text-gr-primary whitespace-nowrap">{a.cantidad}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {loteFaltante > 0 && (
                    <div className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-[12px]"
                      style={{ background: 'var(--color-gr-danger-bg)', color: 'var(--color-gr-danger)' }}>
                      <AlertTriangle size={13} className="shrink-0" />
                      <span className="font-600">
                        Los lotes activos no alcanzan — faltan <strong>{loteFaltante}</strong> {prod?.unidadProduccion?.abreviatura ?? 'unid.'}
                      </span>
                    </div>
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
              onChange={e => onDescuentoChange(e.target.value)} placeholder="0" />
          </FormField>
        </div>
      )}

      {/* Flete */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Truck size={16} style={{ color: 'var(--color-gr-primary)' }} />
          <p className="font-700 text-gr-text text-[15px]">Flete y transporte</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {FLETE_OPCIONES.map(opt => (
            <button key={opt.value} onClick={() => onTipoFleteChange(opt.value)}
              className="flex flex-col items-start p-3.5 rounded-[12px] border-2 transition-all text-left gap-1"
              style={{
                borderColor: tipoFlete === opt.value ? 'var(--color-gr-primary)' : 'var(--color-gr-border)',
                background:  tipoFlete === opt.value ? 'var(--color-gr-primary-lite)' : 'white',
              }}>
              <span className="font-700 text-[13px]"
                style={{ color: tipoFlete === opt.value ? 'var(--color-gr-primary)' : 'var(--color-gr-text)' }}>
                {opt.label}
              </span>
              <span className="text-[11px] text-gr-muted leading-tight">{opt.desc}</span>
            </button>
          ))}
        </div>

        {fleteConMonto && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-600 text-gr-sub">Monto:</p>
              <div className="flex border border-gr-border rounded-[8px] overflow-hidden text-[12px]">
                {(['bs', 'bs_qq'] as const).map(u => (
                  <button key={u} onClick={() => onFleteUnidadChange(u)}
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
                  value={fleteBs} onChange={e => onFleteBsChange(e.target.value)} />
              </FormField>
              {fleteUnidad === 'bs_qq' && totalQQ > 0 && parseFloat(fleteBs) > 0 && (
                <div className="pb-1">
                  <p className="text-[10.5px] text-gr-muted font-600 mb-0.5">Total flete</p>
                  <p className="font-800 text-gr-text text-[15px]">{formatBs(fleteNum)}</p>
                  <p className="text-[11px] text-gr-muted">{formatNum(totalQQ, 2)} QQ × {formatBs(parseFloat(fleteBs))}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <FormField label="Transportista" hint="Opcional — puedes dejarlo en blanco y asignarlo después">
          <div className="flex gap-2">
            <Select value={transportistaId} onChange={e => onTransportistaChange(e.target.value)} className="flex-1">
              <option value="">— Sin asignar —</option>
              {transportistas.map(t => (
                <option key={t.id} value={t.id}>
                  {t.nombre}{t.placa ? ` · ${t.placa}` : ''}{t.marca ? ` · ${t.marca}` : ''}
                </option>
              ))}
            </Select>
            <Btn type="button" variant="ghost" onClick={onNuevoTransportista} className="shrink-0">
              <Plus size={14} /> Nuevo
            </Btn>
          </div>
        </FormField>

        <FormField label="Observaciones" hint="Opcional">
          <Input placeholder="Instrucciones especiales..." value={observaciones}
            onChange={e => onObservacionesChange(e.target.value)} />
        </FormField>
      </div>

      <div className="flex gap-3 justify-between">
        <Btn variant="ghost" onClick={onVolver}><ChevronLeft size={15} /> Volver</Btn>
        <Btn onClick={onContinuar} disabled={lineasValidas.length === 0 || hayStockInsuf}>
          Revisar pedido <ChevronRight size={15} />
        </Btn>
      </div>

      {/* ── Barra fija inferior ─────────────────────────────────────────────── */}
      {lineasValidas.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:left-[240px] z-30 pointer-events-none">
          <div className="max-w-[820px] mx-auto px-5 pb-4 pointer-events-auto">
            <div className="bg-white border border-gr-border rounded-[16px] px-5 py-3.5 shadow-xl">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <div>
                    <p className="text-[10.5px] text-gr-muted font-600 uppercase">Ítems</p>
                    <p className="font-800 text-gr-text text-[15px]">{lineasValidas.length}</p>
                  </div>
                  {fleteConMonto && fleteNum > 0 && (
                    <div>
                      <p className="text-[10.5px] text-gr-muted font-600 uppercase">Flete</p>
                      <p className="font-700 text-[13px]" style={{ color: tipoFlete === TipoFlete.INCLUIDO_EN_VENTA ? 'var(--color-gr-info)' : 'var(--color-gr-warning)' }}>
                        {formatBs(fleteNum)}
                      </p>
                    </div>
                  )}
                  {descNum > 0 && (
                    <div>
                      <p className="text-[10.5px] text-gr-muted font-600 uppercase">Desc.</p>
                      <p className="font-700 text-[13px] text-gr-muted">-{formatBs(descNum)}</p>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[10.5px] font-700 text-gr-primary uppercase">Total</p>
                  <p className="font-900 text-gr-primary text-[20px] leading-tight">{formatBs(totalFinal)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
