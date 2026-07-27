'use client';
import { useState, useMemo, useEffect } from 'react';
import { useProductos, useAjusteStock } from '@/lib/api/productos';
import { useLotes, useCreateLote } from '@/lib/api/produccion';
import { useMateriasPrimas, useKardexMP } from '@/lib/api/materia-prima';
import { useUnidades } from '@/lib/api/catalogos';
import { useUsuarios } from '@/lib/api/usuarios';
import { type Producto, type MateriaPrima, type CreateLoteRequest, TipoMovimientoMP, TipoUnidad, RolUsuario } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { formatNum, formatBs, KG_POR_QQ, kgToQQ, equivPT, equivLabel } from '@/lib/utils';
import {
  Btn, Modal, FormField, Input, Select, Textarea, Badge,
  Spinner, SearchBox, useToast,
} from '@/components/ui';
import {
  Package, Plus, ShieldCheck, AlertTriangle, TrendingDown, Wheat, Coins, X, ArrowDownCircle,
} from 'lucide-react';

const MOTIVOS_BAJA = ['Pérdida', 'Daño en almacén', 'Vencimiento', 'Otro'];


const FILTROS = ['Hoy', 'Esta semana', 'Este mes', 'Personalizado', 'Todos'] as const;

/**
 * Código de lote sugerido para producciones (producto terminado):
 * `PT-YYMMDD-HHMM` (ej. PT-260701-2006 = 1-jul-2026 20:06).
 */
function autoLotePt(): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `PT-${yy}${mm}${dd}-${hh}${mi}`;
}

export default function ProduccionPage() {
  const toast = useToast(s => s.show);
  const productosQ = useProductos();
  const lotesQ = useLotes();
  const productos = productosQ.data ?? [];
  const lotes = lotesQ.data ?? [];

  const [showModal, setShowModal] = useState(false);
  const [productoIdInicial, setProductoIdInicial] = useState<string>('');
  const [showBajaModal, setShowBajaModal] = useState(false);
  const [filtro, setFiltro] = useState<typeof FILTROS[number]>('Este mes');
  const [search, setSearch] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  function abrirRegistrar(productoId?: string) {
    setProductoIdInicial(productoId ?? '');
    setShowModal(true);
  }

  const ahora = new Date();
  const hoy = ahora.toISOString().slice(0, 10);
  const lunes = new Date(ahora); lunes.setDate(ahora.getDate() - ahora.getDay() + 1);
  const primerMes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

  const filtrados = useMemo(() => {
    return lotes.filter(l => {
      let okFiltro = true;
      if (filtro === 'Hoy') okFiltro = l.fecha === hoy;
      else if (filtro === 'Esta semana') okFiltro = new Date(l.fecha) >= lunes;
      else if (filtro === 'Este mes') okFiltro = l.fecha.startsWith(primerMes);
      else if (filtro === 'Personalizado') {
        if (fechaDesde && l.fecha < fechaDesde) okFiltro = false;
        if (fechaHasta && l.fecha > fechaHasta) okFiltro = false;
      }

      const q = search.toLowerCase();
      const okSearch = !search
        || (l.codigoLote ?? '').toLowerCase().includes(q)
        || (l.numeroLotePropio ?? '').toLowerCase().includes(q)
        || (l.producto?.nombre ?? '').toLowerCase().includes(q)
        || (l.producto?.codigo ?? '').toLowerCase().includes(q);
      return okFiltro && okSearch;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotes, filtro, search, fechaDesde, fechaHasta]);

  const totalProducido = filtrados.reduce((s, l) => s + Number(l.cantidadProducida), 0);
  const totalMerma = filtrados.reduce((s, l) => s + Number(l.mermaUnidades || 0), 0);
  const totalMermaMp = filtrados.reduce((s, l) => s + Number(l.mermaMpKg || 0), 0);
  const totalCosto = filtrados.reduce((s, l) => s + Number(l.costoMpBs), 0);

  const en30 = new Date();
  en30.setDate(en30.getDate() + 30);
  const en30Str = en30.toISOString().slice(0, 10);
  const proximosVencimientos = lotes
    .filter(l => l.fechaVencimiento && l.fechaVencimiento <= en30Str && Number(l.stockRestante) > 0)
    .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento));

  if (productosQ.isLoading || lotesQ.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner size={28} color="var(--color-gr-primary)" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-900 text-gr-text">Producción</h1>
          <p className="text-gr-muted text-[13.5px] mt-0.5">
            Registro de lotes producidos con código SENASAG, merma y trazabilidad.
          </p>
        </div>
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={() => setShowBajaModal(true)}>
            <ArrowDownCircle size={14} /> Registrar baja
          </Btn>
          <Btn variant="gold" onClick={() => abrirRegistrar()}>
            <Plus size={14} /> Registrar producción
          </Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card">
          <p className="text-[11px] font-700 text-gr-muted uppercase mb-1">Lotes en el período</p>
          <p className="text-[28px] font-900 text-gr-text">{filtrados.length}</p>
        </div>
        <div className="card">
          <p className="text-[11px] font-700 text-gr-muted uppercase mb-1">Total producido</p>
          <p className="text-[28px] font-900 text-gr-primary">{formatNum(totalProducido, 0)}</p>
        </div>
        <div className="card">
          <p className="text-[11px] font-700 text-gr-muted uppercase mb-1">Merma del período</p>
          <p className="text-[28px] font-900 text-gr-warning">
            {formatNum(totalMerma, 0)}
            <span className="text-[12px] font-500 text-gr-muted ml-2">
              · {formatNum(totalMermaMp, 1)} kg MP
            </span>
          </p>
        </div>
        <div className="card">
          <p className="text-[11px] font-700 text-gr-muted uppercase mb-1">Costo MP del período</p>
          <p className="text-[28px] font-900 text-gr-text">{formatBs(totalCosto)}</p>
        </div>
      </div>

      {proximosVencimientos.length > 0 && (
        <div className="rounded-[12px] p-4 flex gap-3 items-start"
          style={{ background: 'var(--color-gr-warning-bg)', border: '1px solid rgba(160,92,10,0.2)' }}>
          <AlertTriangle size={18} className="text-gr-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-700 text-[13.5px] text-gr-warning">
              {proximosVencimientos.length} {proximosVencimientos.length === 1 ? 'lote vence' : 'lotes vencen'} en los próximos 30 días
            </p>
            <ul className="mt-2 space-y-1 text-[12.5px] text-gr-text">
              {proximosVencimientos.slice(0, 4).map(l => (
                <li key={l.id}>
                  <span className="font-mono font-700">{l.codigoLote}</span> ·
                  {' '}{l.producto?.nombre} · vence <strong>{l.fechaVencimiento}</strong>
                </li>
              ))}
              {proximosVencimientos.length > 4 && (
                <li className="text-gr-muted">
                  +{proximosVencimientos.length - 4} más...
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 bg-white border border-gr-border rounded-md p-1">
          {FILTROS.map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-600 transition-all ${filtro === f ? 'bg-gr-primary text-white' : 'text-gr-muted hover:text-gr-text'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px]">
          <SearchBox value={search} onChange={setSearch}
            placeholder="Buscar por código de lote, número propio o producto..." />
        </div>
      </div>

      {filtro === 'Personalizado' && (
        <div className="flex flex-wrap items-end gap-3 bg-gr-border-lite rounded-md p-3">
          <div>
            <label className="block text-[11px] font-700 text-gr-muted uppercase mb-1">Desde</label>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
              className="border border-gr-border rounded-[8px] px-3 py-1.5 text-[13px] bg-white" />
          </div>
          <div>
            <label className="block text-[11px] font-700 text-gr-muted uppercase mb-1">Hasta</label>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
              className="border border-gr-border rounded-[8px] px-3 py-1.5 text-[13px] bg-white" />
          </div>
          {(fechaDesde || fechaHasta) && (
            <button onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
              className="text-[12px] font-600 text-gr-primary underline">
              Limpiar
            </button>
          )}
        </div>
      )}

      <div className="card-no-pad">
        <div className="hidden md:grid gap-3 px-5 py-3 text-[11px] font-700 text-gr-muted uppercase tracking-wide border-b border-gr-border"
          style={{ gridTemplateColumns: '160px 90px 1fr 90px 90px 100px 90px 90px', background: 'var(--color-gr-border-lite)' }}>
          <span>Código Lote</span>
          <span>N° Propio</span>
          <span>Producto</span>
          <span className="text-right">Producido</span>
          <span className="text-right">Restante</span>
          <span className="text-right">Merma</span>
          <span>Fecha</span>
          <span>Vence</span>
        </div>

        {filtrados.length === 0 ? (
          <div className="py-16 text-center text-gr-muted text-[14px]">
            Sin lotes para los filtros seleccionados
          </div>
        ) : (
          filtrados.map((l, i) => {
            const restante   = Number(l.stockRestante);
            const cant       = Number(l.cantidadProducida);
            const loteAbrev  = l.unidad?.abreviatura ?? l.unidad?.codigo ?? '';
            const pct        = cant > 0 ? restante / cant : 0;
            const status: 'red' | 'yellow' | 'green' = pct < 0.15 ? 'red' : pct < 0.4 ? 'yellow' : 'green';
            const mermaUn = Number(l.mermaUnidades || 0);
            const mermaMp = Number(l.mermaMpKg || 0);
            const hasMerma = mermaUn > 0 || mermaMp > 0;

            return (
              <div key={l.id}
                className={`px-5 py-3.5 ${i < filtrados.length - 1 ? 'border-b border-gr-border-lite' : ''}`}>
                <div className="md:hidden">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-700 font-mono text-[13px] text-gr-primary">{l.codigoLote}</p>
                      {l.numeroLotePropio && (
                        <p className="text-[11px] font-mono text-gr-muted">
                          ({l.numeroLotePropio})
                        </p>
                      )}
                      <p className="text-[13px] mt-0.5 font-600">{l.producto?.nombre}</p>
                      <p className="text-[12px] text-gr-muted">
                        {formatNum(restante, 0)}/{formatNum(cant, 0)} {loteAbrev} · {l.fecha}
                      </p>
                      {hasMerma && (
                        <p className="text-[11.5px] text-gr-warning mt-0.5 flex items-center gap-1">
                          <TrendingDown size={11} /> Merma: {mermaUn > 0 && `${formatNum(mermaUn, 0)} u`}
                          {mermaUn > 0 && mermaMp > 0 && ' / '}
                          {mermaMp > 0 && `${formatNum(mermaMp, 1)} kg MP`}
                        </p>
                      )}
                    </div>
                    <Badge color={status}>
                      {status === 'red' ? 'Agotando' : status === 'yellow' ? 'Medio' : 'OK'}
                    </Badge>
                  </div>
                </div>

                <div className="hidden md:grid gap-3 items-center"
                  style={{ gridTemplateColumns: '160px 90px 1fr 90px 90px 100px 90px 90px' }}>
                  <span className="font-mono font-700 text-[12px] text-gr-primary break-all">
                    {l.codigoLote}
                  </span>
                  <span className="font-mono text-[12px] text-gr-muted">
                    {l.numeroLotePropio || '—'}
                  </span>
                  <div>
                    <p className="font-600 text-[13px] text-gr-text">{l.producto?.nombre}</p>
                    <p className="text-[11.5px] text-gr-muted">
                      {l.producto?.codigo}{l.registroSanitario ? ` · ${l.registroSanitario}` : ''}
                    </p>
                  </div>
                  <span className="text-right text-[13px] font-600">
                    {formatNum(cant, 0)}
                    {loteAbrev && <span className="text-[11px] font-500 text-gr-muted ml-1">{loteAbrev}</span>}
                  </span>
                  <span className="text-right font-800 text-[14px] text-gr-text">
                    {formatNum(restante, 0)}
                    {loteAbrev && <span className="text-[11px] font-500 text-gr-muted ml-1">{loteAbrev}</span>}
                  </span>
                  <span className="text-right text-[12.5px]">
                    {hasMerma ? (
                      <span className="text-gr-warning flex items-center justify-end gap-1">
                        <TrendingDown size={11} />
                        {mermaUn > 0 && `${formatNum(mermaUn, 0)}u`}
                        {mermaMp > 0 && (mermaUn > 0 ? ` / ${formatNum(mermaMp, 1)}kg` : `${formatNum(mermaMp, 1)}kg`)}
                      </span>
                    ) : (
                      <span className="text-gr-muted">—</span>
                    )}
                  </span>
                  <span className="text-[12px] text-gr-muted">{l.fecha}</span>
                  <span className="text-[12px] text-gr-muted">
                    {l.fechaVencimiento}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <ProduccionModal
          productos={productos}
          productoIdInicial={productoIdInicial}
          onClose={() => setShowModal(false)}
          onSaved={(codigoLote) => {
            setShowModal(false);
            toast(`Lote ${codigoLote} registrado correctamente`, 'success');
          }}
          onError={(msg) => toast(msg, 'error')}
        />
      )}
      {showBajaModal && (
        <BajaModal
          productos={productos}
          onClose={() => setShowBajaModal(false)}
          onSaved={() => {
            setShowBajaModal(false);
            toast('Baja registrada', 'warning');
          }}
          onError={(msg) => toast(msg, 'error')}
        />
      )}
    </div>
  );
}

function UnitToggle({ value, onChange }: { value: 'kg' | 'qq'; onChange: (v: 'kg' | 'qq') => void }) {
  return (
    <div className="flex rounded-[8px] overflow-hidden border border-gr-border shrink-0">
      {(['qq', 'kg'] as const).map(u => (
        <button key={u} type="button" onClick={() => onChange(u)}
          className={`px-3 py-1.5 text-[12px] font-700 transition-all ${value === u ? 'bg-gr-primary text-white' : 'bg-white text-gr-muted hover:text-gr-text'}`}>
          {u}
        </button>
      ))}
    </div>
  );
}

function ProduccionModal({ productos, productoIdInicial, onClose, onSaved, onError }: {
  productos: Producto[];
  productoIdInicial: string;
  onClose: () => void;
  onSaved: (codigoLote: string) => void;
  onError: (msg: string) => void;
}) {
  const createLote = useCreateLote();
  const mpQuery = useMateriasPrimas();
  const unidadesQ = useUnidades();
  const usuariosQ = useUsuarios();
  const materiasPrimas: MateriaPrima[] = mpQuery.data ?? [];
  const unidadesPeso = (unidadesQ.data ?? []).filter(u => u.tipo === TipoUnidad.PESO);
  const personalProduccion = (usuariosQ.data ?? []).filter(u => u.rol === RolUsuario.PRODUCCION && u.activo);

  const [productoId, setProductoId]       = useState(productoIdInicial);
  const [mpId, setMpId]                   = useState('');
  const [loteKardexIds, setLoteKardexIds] = useState<string[]>([]);
  const [unidadInputId, setUnidadInputId] = useState<string>('__kg');
  const [mpCantidad, setMpCantidad]       = useState('');
  const [mermaValor, setMermaValor]       = useState('');
  const [mermaObs, setMermaObs]           = useState('');
  const [fecha, setFecha]                 = useState(new Date().toISOString().slice(0, 10));
  const [numeroLotePropio, setNroLote]    = useState(() => autoLotePt());
  const [precioRefBs, setPrecioRefBs]     = useState('');
  const [margen, setMargen]               = useState('30');
  const [obs, setObs]                     = useState('');
  const [unidadSalidaId, setUnidadSalidaId]   = useState<string>('');
  const [responsableId, setResponsableId]     = useState<string>('');

  const producto       = productos.find(p => p.id === productoId);
  const mpSeleccionada = materiasPrimas.find(m => m.id === mpId);
  const mpFactor       = mpSeleccionada?.unidadMedida?.factorABase ?? KG_POR_QQ;
  const mpUnitLabel    = mpSeleccionada?.unidadMedida?.abreviatura ?? mpSeleccionada?.unidadMedida?.codigo ?? 'qq';

  // Auto-seleccionar la unidad del MP cuando cambia
  useEffect(() => {
    if (mpSeleccionada?.unidadMedida?.id) {
      setUnidadInputId(mpSeleccionada.unidadMedida.id);
    } else {
      setUnidadInputId('__kg');
    }
  }, [mpSeleccionada?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-seleccionar la unidad de salida del producto cuando cambia
  useEffect(() => {
    setUnidadSalidaId(producto?.unidadProduccion?.id ?? '');
  }, [producto?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedInputUnit  = unidadesPeso.find(u => u.id === unidadInputId);
  const factorInput        = selectedInputUnit?.factorABase ?? 1;
  const unitLabel          = selectedInputUnit?.abreviatura ?? selectedInputUnit?.codigo ?? 'kg';

  const selectedOutputUnit = unidadesPeso.find(u => u.id === unidadSalidaId);

  // Kardex del MP seleccionado — desactivado cuando mpId está vacío
  // Ordenado más antiguo primero (FIFO)
  const kardexMpQ  = useKardexMP(mpId);
  const ingresosMp = useMemo(() =>
    (kardexMpQ.data ?? [])
      .filter(k => k.tipoMovimiento === TipoMovimientoMP.INGRESO)
      .sort((a, b) => {
        const d = a.fecha.localeCompare(b.fecha);
        return d !== 0 ? d : a.createdAt.localeCompare(b.createdAt);
      }), // más antiguo primero = FIFO (tiebreaker: createdAt)
    [kardexMpQ.data],
  );

  // Auto-agregar el lote más antiguo (FIFO) cuando carga la MP
  useEffect(() => {
    if (ingresosMp.length > 0 && loteKardexIds.length === 0) {
      setLoteKardexIds([ingresosMp[0].id]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingresosMp]);

  const toKg = (v: number) => v * factorInput;

  const mpNum     = parseFloat(mpCantidad) || 0;
  const mermaNum  = parseFloat(mermaValor) || 0;
  const mpKg      = toKg(mpNum);
  const mermaKg   = toKg(mermaNum);
  const producidoKg = Math.max(0, mpKg - mermaKg);

  // Cantidad producida en unidades de producto — usa factorABase de la unidad de salida seleccionada
  const pesoUnit    = Number(selectedOutputUnit?.factorABase) || 0;
  const unidades    = pesoUnit > 0 ? Math.round(producidoKg / pesoUnit) : 0;

  // Stock MP después
  const mpStockDespues = mpSeleccionada
    ? Number(mpSeleccionada.stockActualKg) - mpKg
    : null;

  const lotesAgregados   = ingresosMp.filter(k => loteKardexIds.includes(k.id));
  const disponiblesLotes = ingresosMp.filter(k => !loteKardexIds.includes(k.id));

  // Distribución FIFO: llenar desde el más antiguo hasta cubrir mpKg
  const fifoDistribucion: { id: string; usadoKg: number }[] = [];
  if (mpKg > 0 && lotesAgregados.length > 0) {
    let rem = mpKg;
    for (const k of lotesAgregados) {
      const usadoKg = Math.min(rem, Number(k.cantidadKg));
      fifoDistribucion.push({ id: k.id, usadoKg });
      rem = Math.max(0, rem - Number(k.cantidadKg));
      if (rem <= 0) break;
    }
  }
  const totalLotesKg = lotesAgregados.reduce((s, k) => s + Number(k.cantidadKg), 0);
  const costoMpBs    = fifoDistribucion.reduce((total, d) => {
    const lote   = ingresosMp.find(k => k.id === d.id);
    if (!lote?.costoUnitarioBs) return total;
    const factor = Number(lote.unidad?.factorABase) || 1;
    return total + (d.usadoKg / factor) * Number(lote.costoUnitarioBs);
  }, 0);
  const superaLotes  = lotesAgregados.length > 0 && mpKg > 0 && mpKg > totalLotesKg;
  const faltaKg      = Math.max(0, mpKg - totalLotesKg);
  const costoDetalle = fifoDistribucion.length === 1
    ? (() => {
        const lote   = ingresosMp.find(k => k.id === fifoDistribucion[0].id);
        const factor = Number(lote?.unidad?.factorABase) || 1;
        return `${formatNum(fifoDistribucion[0].usadoKg / factor, 2)} ${lote?.unidad?.codigo ?? 'u'} × Bs ${Number(lote?.costoUnitarioBs ?? 0).toFixed(2)}`;
      })()
    : fifoDistribucion.length > 1 ? `${fifoDistribucion.length} lotes` : '';

  const margenNum      = parseFloat(margen) || 0;
  const costoUnitario  = unidades > 0 && costoMpBs > 0 ? costoMpBs / unidades : 0;
  const precioSugerido = costoUnitario > 0 ? costoUnitario * (1 + margenNum / 100) : 0;

  const valid = !!producto && !!unidadSalidaId && mpNum > 0 && unidades > 0;

  const blockReason = !producto
    ? 'Seleccioná un producto terminado'
    : !unidadSalidaId
    ? 'Seleccioná la unidad de salida (producto terminado)'
    : mpNum <= 0
    ? 'Ingresá la cantidad de MP usada'
    : pesoUnit <= 0
    ? 'La unidad de salida no tiene factor configurado — revisalo en Configuración > Unidades'
    : unidades <= 0
    ? 'La cantidad es demasiado pequeña para producir al menos una unidad'
    : null;

  async function handleSave() {
    if (!valid || !producto) return;
    const dto: CreateLoteRequest = {
      fecha,
      cantidadProducida: unidades,
      productoId: producto.id,
      unidadId: unidadSalidaId,
      observaciones: obs || undefined,
      numeroLotePropio: numeroLotePropio.trim() || undefined,
      responsableId: responsableId || undefined,
      mermaMpKg: mermaKg > 0 ? mermaKg : undefined,
      mermaObservaciones: mermaObs.trim() || undefined,
      costoMpBs: costoMpBs > 0 ? costoMpBs : undefined,
      precioReferencialBs: precioRefBs ? parseFloat(precioRefBs) : undefined,
      // Expresar el consumo en la unidad nativa del MP para que el backend lo descuente
      consumoMp: mpNum > 0 && mpId && mpSeleccionada?.unidadMedida?.id
        ? [{
            materiaPrimaId: mpId,
            unidadId: mpSeleccionada.unidadMedida.id,
            cantidad: mpFactor > 0 ? mpKg / mpFactor : mpNum,
          }]
        : undefined,
    };
    try {
      const lote = await createLote.mutateAsync(dto);
      onSaved(lote.codigoLote);
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo registrar la producción'));
    }
  }

  const abrev = selectedOutputUnit?.abreviatura ?? selectedOutputUnit?.codigo ?? 'u';

  return (
    <Modal xl open title="Registrar producción" onClose={onClose}>

      {/* ── Fila 1: Materia prima + Lote ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Materia prima" required>
          <Select value={mpId} onChange={e => { setMpId(e.target.value); setLoteKardexIds([]); }}>
            <option value="">— Seleccionar —</option>
            {materiasPrimas.map(m => (
              <option key={m.id} value={m.id}>{m.codigo} · {m.nombre}</option>
            ))}
          </Select>
        </FormField>

        <FormField label="Lote a utilizar"
          hint={!mpId ? 'Seleccioná una MP primero'
            : kardexMpQ.isLoading ? 'Cargando lotes…'
            : ingresosMp.length === 0 ? 'Sin lotes registrados para esta MP'
            : disponiblesLotes.length === 0 ? 'Todos los lotes están en la lista'
            : `${disponiblesLotes.length} disponible${disponiblesLotes.length !== 1 ? 's' : ''} — el más antiguo ya fue agregado`}>
          <Select value=""
            onChange={e => e.target.value && setLoteKardexIds(prev => [...prev, e.target.value])}
            disabled={!mpId || kardexMpQ.isLoading || disponiblesLotes.length === 0}>
            <option value="">
              {lotesAgregados.length === 0 ? '— Seleccionar lote —' : '+ Agregar otro lote…'}
            </option>
            {disponiblesLotes.map(k => {
              const label = k.numeroLotePropio ?? 'Sin N°';
              const costo = k.costoUnitarioBs
                ? `Bs ${Number(k.costoUnitarioBs).toFixed(2)}/${k.unidad?.codigo ?? 'u'}`
                : 'sin costo';
              return (
                <option key={k.id} value={k.id}>
                  {label} · {k.fecha} · {formatNum(k.cantidad, 1)} {k.unidad?.codigo ?? ''} · {costo}
                </option>
              );
            })}
          </Select>
        </FormField>
      </div>

      {/* Lotes agregados */}
      {lotesAgregados.length > 0 && (
        <div className="space-y-1.5">
          {lotesAgregados.map(k => {
            const dist   = fifoDistribucion.find(d => d.id === k.id);
            const loteKg = Number(k.cantidadKg);
            const label  = k.numeroLotePropio ?? 'Sin N°';
            const factor = Number(k.unidad?.factorABase) || 1;
            const costoParcial = dist && k.costoUnitarioBs && mpKg > 0
              ? (dist.usadoKg / factor) * Number(k.costoUnitarioBs)
              : null;
            return (
              <div key={k.id}
                className="grid items-center gap-2 rounded-lg border border-gr-border-lite px-3 py-2 bg-white"
                style={{ gridTemplateColumns: '1fr auto auto 32px' }}>
                <div className="min-w-0">
                  <p className="font-700 text-[13px] text-gr-text leading-tight truncate">
                    {label}
                    <span className="font-500 text-gr-muted text-[11.5px] ml-1.5">{k.fecha}</span>
                  </p>
                  <p className="text-[11px] text-gr-muted leading-tight mt-0.5">
                    {formatNum(k.cantidad, 1)} {k.unidad?.codigo ?? ''}
                    {k.costoUnitarioBs ? ` · Bs ${Number(k.costoUnitarioBs).toFixed(2)}/${k.unidad?.codigo ?? 'u'}` : ''}
                  </p>
                </div>
                {dist && mpKg > 0 ? (
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-800 text-gr-primary leading-tight">
                      {formatNum(dist.usadoKg / factor, 2)} {k.unidad?.abreviatura ?? k.unidad?.codigo ?? 'qq'}
                    </p>
                    {dist.usadoKg < loteKg && (
                      <p className="text-[10.5px] text-gr-muted leading-tight">
                        de {formatNum(loteKg / factor, 2)}
                      </p>
                    )}
                  </div>
                ) : <span />}
                {costoParcial !== null ? (
                  <p className="text-[12px] font-700 text-gr-sub shrink-0 whitespace-nowrap">
                    {formatBs(costoParcial)}
                  </p>
                ) : <span />}
                <button type="button"
                  onClick={() => setLoteKardexIds(prev => prev.filter(id => id !== k.id))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gr-muted hover:text-gr-danger hover:bg-red-50 transition-colors">
                  <X size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Aviso FIFO: los lotes no cubren la cantidad */}
      {superaLotes && (
        <div className="rounded-lg px-3.5 py-2.5 flex items-start gap-2"
          style={{ background: 'var(--color-gr-warning-bg)', border: '1px solid rgba(160,92,10,0.2)' }}>
          <AlertTriangle size={14} className="text-gr-warning shrink-0 mt-0.5" />
          <div className="text-[12.5px] text-gr-warning">
            <p className="font-700">Los lotes no cubren la cantidad</p>
            <p className="font-400 mt-0.5">
              Tenés <strong>{formatNum(totalLotesKg / mpFactor, 2)} {mpUnitLabel}</strong> en la lista
              pero necesitás <strong>{formatNum(mpKg / mpFactor, 2)} {mpUnitLabel}</strong>.
              Agregá otro lote para cubrir los <strong>{formatNum(faltaKg / mpFactor, 2)} {mpUnitLabel}</strong> faltantes.
            </p>
          </div>
        </div>
      )}

      {/* ── Fila 2: Producto + Producir en ── */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
        <FormField label="Producto terminado" required>
          <Select value={productoId} onChange={e => setProductoId(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {productos.map(p => (
              <option key={p.id} value={p.id}>{p.codigo} · {p.nombre}</option>
            ))}
          </Select>
        </FormField>

        <FormField label="Producir en" hint={selectedOutputUnit ? `1 ${abrev} = ${selectedOutputUnit.factorABase} kg` : 'Seleccioná'}>
          <Select value={unidadSalidaId} onChange={e => setUnidadSalidaId(e.target.value)} className="text-[13px]">
            <option value="">— Seleccionar —</option>
            {unidadesPeso.map(u => (
              <option key={u.id} value={u.id}>
                {u.abreviatura ?? u.codigo} — {u.nombre} ({u.factorABase} kg)
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      {/* ── Fila 3: Info de contexto ── */}
      {(mpSeleccionada || costoMpBs > 0 || producto) && (
        <div className="flex flex-wrap gap-2">
          {mpSeleccionada && (
            <div className="flex-1 rounded-lg px-3.5 py-2.5 flex items-center gap-3"
              style={{ background: 'var(--color-gr-border-lite)', minWidth: 180 }}>
              <Wheat size={14} className="text-gr-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-gr-muted font-600 uppercase">Stock MP</p>
                <p className="text-[13px] font-800 text-gr-text truncate">
                  {formatNum(Number(mpSeleccionada.stockActualKg) / mpFactor, 2)} {mpUnitLabel}
                  <span className="font-500 text-gr-muted ml-1 text-[12px]">
                    ({formatNum(Number(mpSeleccionada.stockActualKg), 0)} kg)
                  </span>
                </p>
              </div>
              {mpKg > 0 && mpStockDespues !== null && (
                <>
                  <div className="w-px h-6 bg-gr-border shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-gr-muted font-600 uppercase">Después</p>
                    <p className={`text-[13px] font-800 ${mpStockDespues < Number(mpSeleccionada.stockMinimoKg) ? 'text-gr-danger' : 'text-gr-text'}`}>
                      {formatNum(mpStockDespues / mpFactor, 2)} {mpUnitLabel}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
          {costoMpBs > 0 && (
            <div className="rounded-lg px-3.5 py-2.5 flex items-center gap-3"
              style={{ background: 'var(--color-gr-primary-lite)', minWidth: 160 }}>
              <Coins size={14} className="text-gr-primary shrink-0" />
              <div>
                <p className="text-[11px] text-gr-muted font-600 uppercase">Costo MP</p>
                <p className="text-[13px] font-800 text-gr-primary">{formatBs(costoMpBs)}</p>
                {costoDetalle && (
                  <p className="text-[10.5px] text-gr-muted">{costoDetalle}</p>
                )}
              </div>
            </div>
          )}
          {producto && (
            <div className="flex-1 rounded-lg px-3.5 py-2.5 flex items-center gap-3"
              style={{ background: 'var(--color-gr-primary-lite)', minWidth: 180 }}>
              <ShieldCheck size={14} className="text-gr-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-gr-muted font-600 uppercase">Stock producto</p>
                <p className="text-[13px] font-800 text-gr-primary truncate">
                  {formatNum(Number(producto.stockActual), 0)} {abrev}
                  <span className="font-500 text-gr-sub ml-1 text-[12px]">
                    · vida útil {producto.vidaUtilMeses} m
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Fila 3: Inputs principales (3 columnas) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* MP usada */}
        <div className="rounded-xl border-2 border-gr-border p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 mb-2">
            <Wheat size={13} className="text-gr-primary" />
            <p className="text-[11px] font-700 text-gr-muted uppercase tracking-wide">MP usada</p>
          </div>
          <Input type="number" min="0" step="0.01" placeholder="0"
            value={mpCantidad} onChange={e => setMpCantidad(e.target.value)}
            className="text-[22px] font-800 text-center" />
          <p className="text-[11px] text-center text-gr-muted">{unitLabel}</p>
          {mpKg > 0 && (
            <p className="text-[11px] text-center text-gr-sub pt-1 border-t border-gr-border-lite">
              = {formatNum(mpKg, 1)} kg
            </p>
          )}

          {/* Desglose por lote */}
          {fifoDistribucion.length > 0 && mpKg > 0 && (
            <div className="pt-2 border-t border-gr-border-lite space-y-1.5">
              {fifoDistribucion.map(d => {
                const lote   = ingresosMp.find(k => k.id === d.id);
                if (!lote) return null;
                const f      = Number(lote.unidad?.factorABase) || KG_POR_QQ;
                const uLabel = lote.unidad?.abreviatura ?? lote.unidad?.codigo ?? 'qq';
                const costoParcial = lote.costoUnitarioBs
                  ? (d.usadoKg / f) * Number(lote.costoUnitarioBs)
                  : null;
                return (
                  <div key={d.id} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-700 text-gr-text truncate">
                      {lote.numeroLotePropio ?? 'Sin N°'}
                    </span>
                    <span className="text-[11px] text-gr-primary font-700 whitespace-nowrap">
                      {formatNum(d.usadoKg / f, 2)} {uLabel}
                    </span>
                    {costoParcial !== null ? (
                      <span className="text-[11px] text-gr-sub whitespace-nowrap">
                        {formatBs(costoParcial)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gr-muted italic">sin costo</span>
                    )}
                  </div>
                );
              })}
              {costoMpBs > 0 && (
                <div className="flex items-center justify-between pt-1.5 border-t border-gr-border-lite">
                  <span className="text-[11px] font-700 text-gr-muted uppercase tracking-wide">Total MP</span>
                  <span className="text-[13px] font-900 text-gr-primary">{formatBs(costoMpBs)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Merma */}
        <div className="rounded-xl border-2 border-gr-border p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown size={13} className="text-gr-warning" />
            <p className="text-[11px] font-700 text-gr-muted uppercase tracking-wide">Merma</p>
            <span className="text-[9px] text-gr-muted/60 ml-auto">(opcional)</span>
          </div>
          <Input type="number" min="0" step="0.01" placeholder="0"
            value={mermaValor} onChange={e => setMermaValor(e.target.value)}
            className="text-[22px] font-800 text-center" />
          <p className="text-[11px] text-center text-gr-muted">{unitLabel}</p>
          <Textarea placeholder="Causa..." value={mermaObs}
            onChange={e => setMermaObs(e.target.value)} rows={1}
            className="text-[12px] mt-1 resize-none" />
        </div>

        {/* Resultado */}
        <div className="rounded-xl border-2 p-4 flex flex-col justify-center items-center text-center space-y-1"
          style={{
            borderColor: unidades > 0 ? 'var(--color-gr-primary)' : mermaNum >= mpNum && mpNum > 0 ? 'var(--color-gr-danger)' : 'var(--color-gr-border)',
            background: unidades > 0 ? 'var(--color-gr-primary-lite)' : 'var(--color-gr-border-lite)',
          }}>
          <div className="flex items-center gap-1.5 self-start mb-1">
            <Package size={13} className="text-gr-primary" />
            <p className="text-[11px] font-700 text-gr-muted uppercase tracking-wide">Producido</p>
          </div>

          {mpNum === 0 ? (
            <p className="text-[12px] text-gr-muted">Ingresá la MP usada</p>
          ) : unidades > 0 ? (
            <>
              {/* Resultado en unidades del PRODUCTO (no en unidad de entrada) */}
              <p className="text-[36px] font-900 leading-none" style={{ color: 'var(--color-gr-primary)' }}>
                {formatNum(unidades, 2)}
              </p>
              <p className="text-[13px] font-600 text-gr-sub">{abrev} producidos</p>

              {/* Desglose: cómo se calculó */}
              <div className="w-full text-[11.5px] text-gr-muted space-y-0.5 py-2 border-y border-gr-border-lite my-1">
                <div className="flex justify-between">
                  <span>MP usada</span><span className="font-600">{formatNum(mpNum, 2)} {unitLabel}</span>
                </div>
                {mermaNum > 0 && (
                  <div className="flex justify-between text-gr-warning">
                    <span>− Merma</span><span className="font-600">{formatNum(mermaNum, 2)} {unitLabel}</span>
                  </div>
                )}
              </div>

              {/* kg netos */}
              <p className="text-[11.5px] text-gr-sub text-center">
                = {formatNum(producidoKg, 0)} kg netos
              </p>
            </>
          ) : (
            <p className="text-[12px] text-gr-danger font-600">Merma ≥ MP usada</p>
          )}
        </div>
      </div>

      {/* ── Fila 4: Detalles del lote ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
        <FormField label="Fecha" required>
          <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
        </FormField>
        <FormField label="N° de lote" hint="Editable">
          <Input value={numeroLotePropio} onChange={e => setNroLote(e.target.value)} />
        </FormField>
        <FormField label="Responsable" hint="Vacío = usuario actual">
          <Select value={responsableId} onChange={e => setResponsableId(e.target.value)}
            disabled={usuariosQ.isLoading}>
            <option value="">— Auto (yo) —</option>
            {personalProduccion.map(u => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Precio referencial (Bs)" hint="Opcional — se usa al vender">
          <div className="flex gap-1.5">
            <Input type="number" min="0" step="0.5" placeholder="0.00"
              value={precioRefBs} onChange={e => setPrecioRefBs(e.target.value)}
              className="flex-1" />
            {precioSugerido > 0 && (
              <button
                type="button"
                onClick={() => setPrecioRefBs(precioSugerido.toFixed(2))}
                className="shrink-0 rounded-[8px] px-2.5 py-1.5 text-[11.5px] font-700 border-2 border-gr-primary text-gr-primary hover:bg-gr-primary hover:text-white transition-all whitespace-nowrap"
                title="Aplicar precio sugerido"
              >
                {formatBs(precioSugerido)}
              </button>
            )}
          </div>
          {precioSugerido > 0 && (
            <p className="text-[11px] text-gr-muted mt-1">
              Costo/u {formatBs(costoUnitario)} · margen
              <input
                type="number" min="0" max="500" step="5"
                value={margen}
                onChange={e => setMargen(e.target.value)}
                className="inline-block w-12 mx-1 px-1 text-center border border-gr-border rounded text-[11px] bg-white"
              />
              % → sugerido {formatBs(precioSugerido)}
            </p>
          )}
        </FormField>
        <FormField label="Observaciones">
          <Input placeholder="Turno, notas del lote..." value={obs}
            onChange={e => setObs(e.target.value)} />
        </FormField>
      </div>

      {/* ── Footer ── */}
      <div className="flex flex-col gap-2 pt-2 border-t border-gr-border-lite">
        {!valid && blockReason && (
          <p className="text-[12px] text-gr-muted text-right">{blockReason}</p>
        )}
        <div className="flex gap-3 justify-end">
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn onClick={handleSave} disabled={!valid} loading={createLote.isPending}>
            <Package size={14} />
            Confirmar producción{unidades > 0 ? ` · ${formatNum(unidades, 0)} ${abrev}` : ''}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─── Baja Modal ────────────────────────────────────────────────────────────
function BajaModal({ productos, onClose, onSaved, onError }: {
  productos: Producto[];
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const ajusteStock = useAjusteStock();
  const [productoId, setProductoId] = useState(productos[0]?.id ?? '');
  const [motivo, setMotivo]         = useState('');
  const [cantidad, setCantidad]     = useState('');
  const [desc, setDesc]             = useState('');

  const producto = productos.find(p => p.id === productoId) ?? null;
  const cantNum  = parseFloat(cantidad) || 0;
  const valid    = !!productoId && !!motivo && cantNum > 0
    && cantNum <= Number(producto?.stockActual ?? 0);

  async function handleSave() {
    if (!valid || !producto) return;
    try {
      await ajusteStock.mutateAsync({
        id: producto.id,
        cantidad: -cantNum, // negativo = baja de stock
        motivo: `${motivo}${desc ? ` — ${desc}` : ''}`,
      });
      onSaved();
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo registrar la baja'));
    }
  }

  return (
    <Modal open title="Registrar baja de producto" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="danger" onClick={handleSave} disabled={!valid} loading={ajusteStock.isPending}>
          Confirmar baja
        </Btn>
      </>}>

      <div className="rounded-md px-4 py-3 flex items-start gap-2"
        style={{ background: 'var(--color-gr-danger-bg)', border: '1px solid rgba(181,61,53,0.15)' }}>
        <AlertTriangle size={15} className="text-gr-danger shrink-0 mt-0.5" />
        <p className="font-600 text-[13px] text-gr-danger">
          Solo para pérdidas, daños o vencimiento. Las ventas descuentan automáticamente.
        </p>
      </div>

      <FormField label="Producto" required>
        <Select value={productoId} onChange={e => { setProductoId(e.target.value); setCantidad(''); }}>
          <option value="">— Seleccionar producto —</option>
          {productos.map(p => (
            <option key={p.id} value={p.id}>
              {p.nombre} — {formatNum(Number(p.stockActual), 0)} {p.unidadProduccion?.abreviatura ?? 'u'} disponibles
            </option>
          ))}
        </Select>
      </FormField>

      {producto && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Motivo" required>
              <Select value={motivo} onChange={e => setMotivo(e.target.value)}>
                <option value="">— Seleccionar —</option>
                {MOTIVOS_BAJA.map(m => <option key={m} value={m}>{m}</option>)}
              </Select>
            </FormField>
            <FormField label={`Cantidad (${producto.unidadProduccion?.abreviatura ?? 'u'})`} required>
              <Input type="number" min="1" max={Number(producto.stockActual)} placeholder="0"
                value={cantidad} onChange={e => setCantidad(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Descripción">
            <Textarea placeholder="Describir qué ocurrió..." value={desc}
              onChange={e => setDesc(e.target.value)} />
          </FormField>
        </>
      )}
    </Modal>
  );
}
