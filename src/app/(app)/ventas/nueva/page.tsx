'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useClientes, useTransportistas } from '@/lib/api/catalogos';
import { useProductos } from '@/lib/api/productos';
import { useLotes } from '@/lib/api/produccion';
import { useCreateVenta } from '@/lib/api/ventas';
import { TipoFlete, type CreateVentaRequest, type CreateDetalleVentaRequest, type LoteProduccion, type Producto } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { equivPT } from '@/lib/utils';
import { Spinner, useToast } from '@/components/ui';
import { NuevoClienteModal } from '@/components/NuevoClienteModal';
import { NuevoTransportistaModal } from '@/components/NuevoTransportistaModal';
import { ChevronLeft } from 'lucide-react';
import { PasoCliente } from './_components/PasoCliente';
import { PasoProductos } from './_components/PasoProductos';
import { PasoConfirmar } from './_components/PasoConfirmar';
import { type Step, type LineaDetalle, type LoteAsignado } from './_components/types';

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
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [showNuevoTransportista, setShowNuevoTransportista] = useState(false);
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

  /** Reparte `cantidad` entre los lotes disponibles del producto, FIFO (más antiguo primero),
   *  limitado a lo que cada lote realmente tiene. `faltante` > 0 indica que los lotes activos
   *  no alcanzan a cubrir la cantidad (aunque el stock total del producto sí lo indique). */
  function asignarLotesFifo(productoId: string, cantidad: number): { asignaciones: LoteAsignado[]; faltante: number } {
    const disponibles = lotesParaProducto(productoId);
    const asignaciones: LoteAsignado[] = [];
    let restante = cantidad;
    for (const lote of disponibles) {
      if (restante <= 0) break;
      const disp = Number(lote.stockRestante);
      const usar = Math.min(restante, disp);
      if (usar > 0) {
        asignaciones.push({ lote, cantidad: usar });
        restante -= usar;
      }
    }
    return { asignaciones, faltante: Math.max(0, restante) };
  }

  function agregarProducto(prod: Producto) {
    setLineas(ls => {
      const exist = ls.find(l => l.productoId === prod.id);
      if (exist) {
        return ls.map(l => l.productoId === prod.id
          ? { ...l, cantidad: l.cantidad + 1 }
          : l);
      }
      return [...ls, {
        key: prod.id,
        productoId: prod.id,
        cantidad: 1,
        precioUnitario: prod.precioUnitarioBs != null ? String(prod.precioUnitarioBs) : '',
      }];
    });
  }

  /** Actualiza la cantidad sin eliminar la línea (permite 0 temporalmente
   *  mientras el usuario escribe, evita perder la línea al borrar dígitos). */
  function setCantidad(productoId: string, cant: number) {
    const safe = Math.max(0, Number.isFinite(cant) ? cant : 0);
    setLineas(ls => ls.map(l => l.productoId === productoId ? { ...l, cantidad: safe } : l));
  }

  /** Botón "−": si baja a 0 elimina la línea, si no decrementa. */
  function decrementarLinea(productoId: string) {
    setLineas(ls => {
      const linea = ls.find(l => l.productoId === productoId);
      if (!linea) return ls;
      if (linea.cantidad <= 1) return ls.filter(l => l.productoId !== productoId);
      return ls.map(l => l.productoId === productoId ? { ...l, cantidad: l.cantidad - 1 } : l);
    });
  }

  /** Botón papelera: elimina la línea sin importar la cantidad. */
  function eliminarLinea(productoId: string) {
    setLineas(ls => ls.filter(l => l.productoId !== productoId));
  }

  function setPrecio(productoId: string, precio: string) {
    setLineas(ls => ls.map(l => l.productoId === productoId ? { ...l, precioUnitario: precio } : l));
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
    const { asignaciones, faltante } = asignarLotesFifo(prod.id, l.cantidad);
    return {
      key: l.key,
      productoId: prod.id,
      productoNombre: prod.nombre,
      cantidad: l.cantidad,
      unidadId: prod.unidadProduccion?.id ?? '',
      unidadLabel: prod.unidadProduccion?.abreviatura ?? prod.unidadProduccion?.codigo ?? '',
      precioUnitario: parseFloat(l.precioUnitario),
      lotes: asignaciones,
      loteFaltante: faltante,
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
      // Una línea de producto puede cubrir la cantidad con VARIOS lotes (FIFO) — cada lote
      // se manda como su propio detalle, con la porción que realmente le corresponde, para
      // que la trazabilidad quede correcta (no se le puede atribuir a un solo lote más de lo
      // que ese lote realmente tenía).
      detalles: detallesUI.flatMap((d): CreateDetalleVentaRequest[] =>
        d.lotes.length > 0
          ? d.lotes.map(a => ({
              productoId: d.productoId,
              unidadId: d.unidadId,
              loteId: a.lote.id,
              cantidad: a.cantidad,
              precioUnitarioBs: d.precioUnitario,
            }))
          : [{
              productoId: d.productoId,
              unidadId: d.unidadId,
              loteId: undefined,
              cantidad: d.cantidad,
              precioUnitarioBs: d.precioUnitario,
            }],
      ),
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
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gr-border-lite transition-colors text-gr-muted">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-[20px] font-900 text-gr-text">Nueva venta</h1>
          <p className="text-gr-muted text-[12.5px]">La remisión se genera automáticamente</p>
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
            {i < 2 && <div className="w-8 h-px bg-gr-border shrink-0" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <PasoCliente
          clientesFiltrados={clientesFiltrados}
          searchCliente={searchCliente}
          onSearchChange={setSearchC}
          clienteId={clienteId}
          onSelectCliente={setClienteId}
          onNuevoCliente={() => setShowNuevoCliente(true)}
          fecha={fecha}
          onFechaChange={setFecha}
          onContinuar={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <PasoProductos
          clienteSel={clienteSel}
          onVolver={() => setStep(0)}
          onContinuar={() => setStep(2)}
          productos={productos}
          productosFiltrados={productosFiltrados}
          searchProducto={searchProducto}
          onSearchProductoChange={setSearchP}
          lineas={lineas}
          lineasValidas={lineasValidas}
          lotesParaProducto={lotesParaProducto}
          asignarLotesFifo={asignarLotesFifo}
          agregarProducto={agregarProducto}
          decrementarLinea={decrementarLinea}
          setCantidad={setCantidad}
          eliminarLinea={eliminarLinea}
          setPrecio={setPrecio}
          descuento={descuento}
          onDescuentoChange={setDescuento}
          descNum={descNum}
          tipoFlete={tipoFlete}
          onTipoFleteChange={setTipoFlete}
          fleteConMonto={fleteConMonto}
          fleteUnidad={fleteUnidad}
          onFleteUnidadChange={setFleteUni}
          fleteBs={fleteBs}
          onFleteBsChange={setFleteBs}
          totalQQ={totalQQ}
          fleteNum={fleteNum}
          transportistaId={transportistaId}
          onTransportistaChange={setTransp}
          transportistas={transportistas}
          onNuevoTransportista={() => setShowNuevoTransportista(true)}
          observaciones={observaciones}
          onObservacionesChange={setObs}
          totalFinal={totalFinal}
          hayStockInsuf={hayStockInsuf}
        />
      )}

      {step === 2 && (
        <PasoConfirmar
          clienteSel={clienteSel}
          fecha={fecha}
          detallesUI={detallesUI}
          subtotal={subtotal}
          tipoFlete={tipoFlete}
          fleteNum={fleteNum}
          descNum={descNum}
          totalFinal={totalFinal}
          transportistaSel={transportistaSel}
          onVolver={() => setStep(1)}
          onConfirmar={guardar}
          guardando={createVenta.isPending}
        />
      )}

      {showNuevoCliente && (
        <NuevoClienteModal
          onClose={() => setShowNuevoCliente(false)}
          onCreated={cliente => setClienteId(cliente.id)}
        />
      )}

      {showNuevoTransportista && (
        <NuevoTransportistaModal
          onClose={() => setShowNuevoTransportista(false)}
          onCreated={transportista => setTransp(transportista.id)}
        />
      )}
    </div>
  );
}
