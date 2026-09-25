'use client';
import { useState, useMemo, useEffect } from 'react';
import { useProductos, useAjusteStock } from '@/lib/api/productos';
import { useLotes, useCreateLote } from '@/lib/api/produccion';
import { useMateriasPrimas, useCreateMateriaPrima, useCreateKardexMP, useKardexMP } from '@/lib/api/materia-prima';
import { useUnidades, useCategoriasMP, useProveedores } from '@/lib/api/catalogos';
import { useUsuarios } from '@/lib/api/usuarios';
import { type Producto, type MateriaPrima, type LoteProduccion, type CreateLoteRequest, TipoMovimientoMP, TipoUnidad, RolUsuario } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { formatNum, formatBs, KG_POR_QQ, kgToQQ, equivPT, equivLabel } from '@/lib/utils';
import {
  Btn, Modal, FormField, Input, Select, Textarea, Badge,
  Spinner, SearchBox, useToast, Combobox,
} from '@/components/ui';
import { NuevoProveedorModal } from '@/components/NuevoProveedorModal';
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
  const [residuoLote, setResiduoLote] = useState<LoteProduccion | null>(null);
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
                        {formatNum(restante, 2)}/{formatNum(cant, 2)} {loteAbrev} · {l.fecha}
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
                    {formatNum(cant, 2)}
                    {loteAbrev && <span className="text-[11px] font-500 text-gr-muted ml-1">{loteAbrev}</span>}
                  </span>
                  <span className="text-right font-800 text-[14px] text-gr-text">
                    {formatNum(restante, 2)}
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

                {hasMerma && (
                  <div className="mt-2 flex justify-end">
                    <Btn size="sm" variant="ghost" onClick={() => setResiduoLote(l)}>
                      <ArrowDownCircle size={13} /> Registrar residuo como materia prima
                    </Btn>
                  </div>
                )}
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
      {residuoLote && (
        <ResiduoAMPModal
          lote={residuoLote}
          onClose={() => setResiduoLote(null)}
          onSaved={() => {
            setResiduoLote(null);
            toast('Residuo registrado como materia prima', 'success');
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

  // Disponible REAL por lote: el backend solo guarda el stockActualKg total de la MP,
  // así que reconstruimos cuánto le queda a cada entrada de ingreso restando el consumo
  // acumulado (de todas las producciones anteriores) empezando por la más antigua —
  // mismo criterio que ya usa Materia Prima > lotes. Sin esto, un lote ya consumido
  // seguía apareciendo con su cantidad ORIGINAL para siempre.
  const dispKgPorLote = useMemo(() => {
    const totalIngresadoKg = ingresosMp.reduce((s, k) => s + Number(k.cantidadKg), 0);
    const stockActualKg = Number(mpSeleccionada?.stockActualKg ?? 0);
    const totalConsumidoKg = Math.max(0, totalIngresadoKg - stockActualKg);
    let pendConsumed = totalConsumidoKg;
    const map = new Map<string, number>();
    for (const k of ingresosMp) {
      const kgK = Number(k.cantidadKg);
      const consumidoK = Math.min(pendConsumed, kgK);
      map.set(k.id, kgK - consumidoK);
      pendConsumed = Math.max(0, pendConsumed - kgK);
    }
    return map;
  }, [ingresosMp, mpSeleccionada?.stockActualKg]);

  // Auto-agregar el lote disponible más antiguo (FIFO) cuando carga la MP
  useEffect(() => {
    if (loteKardexIds.length === 0) {
      const primerDisponible = ingresosMp.find(k => (dispKgPorLote.get(k.id) ?? 0) > 0);
      if (primerDisponible) setLoteKardexIds([primerDisponible.id]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingresosMp, dispKgPorLote]);

  const toKg = (v: number) => v * factorInput;

  const mpNum     = parseFloat(mpCantidad) || 0;
  const mermaNum  = parseFloat(mermaValor) || 0;
  const mpKg      = toKg(mpNum);
  const mermaKg   = toKg(mermaNum);
  const producidoKg = Math.max(0, mpKg - mermaKg);

  // Cantidad producida en unidades de producto — usa factorABase de la unidad de salida seleccionada.
  // SIN redondear: Math.round(2.5) da 3 en JS (redondea .5 hacia arriba), lo que fabricaría
  // más producto del que la materia prima usada puede dar (115 kg / 46 kg no son 3 quintales,
  // son 2.5). El balance de masa tiene que cuadrar exacto, así que se guarda el decimal real.
  const pesoUnit    = Number(selectedOutputUnit?.factorABase) || 0;
  const unidades    = pesoUnit > 0 ? producidoKg / pesoUnit : 0;

  // Stock MP después
  const mpStockDespues = mpSeleccionada
    ? Number(mpSeleccionada.stockActualKg) - mpKg
    : null;

  const lotesAgregados   = ingresosMp.filter(k => loteKardexIds.includes(k.id));
  // Un lote ya agotado (disponible <= 0) no se puede volver a elegir.
  const disponiblesLotes = ingresosMp.filter(k => !loteKardexIds.includes(k.id) && (dispKgPorLote.get(k.id) ?? 0) > 0);

  // Distribución FIFO: llenar desde el más antiguo hasta cubrir mpKg, limitado a lo
  // que realmente queda disponible en cada lote (no a su cantidad original).
  const fifoDistribucion: { id: string; usadoKg: number }[] = [];
  if (mpKg > 0 && lotesAgregados.length > 0) {
    let rem = mpKg;
    for (const k of lotesAgregados) {
      const dispoK  = dispKgPorLote.get(k.id) ?? 0;
      const usadoKg = Math.min(rem, dispoK);
      fifoDistribucion.push({ id: k.id, usadoKg });
      rem = Math.max(0, rem - dispoK);
      if (rem <= 0) break;
    }
  }
  const totalLotesKg = lotesAgregados.reduce((s, k) => s + (dispKgPorLote.get(k.id) ?? 0), 0);
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
          <Combobox
            value={mpId}
            onChange={id => { setMpId(id); setLoteKardexIds([]); }}
            placeholder="Escribí para buscar..."
            options={materiasPrimas.map(m => ({ value: m.id, label: m.nombre, sublabel: m.codigo }))}
          />
        </FormField>

        <FormField label="Lote a utilizar"
          hint={!mpId ? 'Seleccioná una MP primero'
            : kardexMpQ.isLoading ? 'Cargando lotes…'
            : ingresosMp.length === 0 ? 'Sin lotes registrados para esta MP'
            : disponiblesLotes.length === 0 && ingresosMp.every(k => (dispKgPorLote.get(k.id) ?? 0) <= 0)
            ? 'Todos los lotes de esta MP están agotados'
            : disponiblesLotes.length === 0 ? 'Todos los lotes con saldo ya están en la lista'
            : `${disponiblesLotes.length} disponible${disponiblesLotes.length !== 1 ? 's' : ''} — el más antiguo ya fue agregado`}>
          <Select value=""
            onChange={e => e.target.value && setLoteKardexIds(prev => [...prev, e.target.value])}
            disabled={!mpId || kardexMpQ.isLoading || disponiblesLotes.length === 0}>
            <option value="">
              {lotesAgregados.length === 0 ? '— Seleccionar lote —' : '+ Agregar otro lote…'}
            </option>
            {disponiblesLotes.map(k => {
              const label = k.numeroLotePropio ?? 'Sin N°';
              const factor = Number(k.unidad?.factorABase) || 1;
              const dispoNativo = (dispKgPorLote.get(k.id) ?? 0) / factor;
              const costo = k.costoUnitarioBs
                ? `Bs ${Number(k.costoUnitarioBs).toFixed(2)}/${k.unidad?.codigo ?? 'u'}`
                : 'sin costo';
              return (
                <option key={k.id} value={k.id}>
                  {label} · {k.fecha} · {formatNum(dispoNativo, 1)} {k.unidad?.codigo ?? ''} disp. · {costo}
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
            const dist    = fifoDistribucion.find(d => d.id === k.id);
            const dispoKg = dispKgPorLote.get(k.id) ?? 0;
            const label   = k.numeroLotePropio ?? 'Sin N°';
            const factor  = Number(k.unidad?.factorABase) || 1;
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
                    {formatNum(dispoKg / factor, 1)} {k.unidad?.codigo ?? ''} disp.
                    {k.costoUnitarioBs ? ` · Bs ${Number(k.costoUnitarioBs).toFixed(2)}/${k.unidad?.codigo ?? 'u'}` : ''}
                  </p>
                </div>
                {dist && mpKg > 0 ? (
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-800 text-gr-primary leading-tight">
                      {formatNum(dist.usadoKg / factor, 2)} {k.unidad?.abreviatura ?? k.unidad?.codigo ?? 'qq'}
                    </p>
                    {dist.usadoKg < dispoKg && (
                      <p className="text-[10.5px] text-gr-muted leading-tight">
                        de {formatNum(dispoKg / factor, 2)}
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
          <Combobox
            value={productoId}
            onChange={setProductoId}
            placeholder="Escribí para buscar..."
            options={productos.map(p => ({ value: p.id, label: p.nombre, sublabel: p.codigo }))}
          />
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
                = {formatNum(producidoKg, 2)} kg netos
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
            Confirmar producción{unidades > 0 ? ` · ${formatNum(unidades, 2)} ${abrev}` : ''}
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

function ResiduoAMPModal({ lote, onClose, onSaved, onError }: {
  lote: LoteProduccion;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const mpQuery = useMateriasPrimas();
  const unidadesQ = useUnidades();
  const categoriasQ = useCategoriasMP();
  const proveedoresQ = useProveedores();
  const allKardexQ = useKardexMP();
  const createMp = useCreateMateriaPrima();
  const createKardex = useCreateKardexMP();

  const materiasPrimas = mpQuery.data ?? [];
  const unidades = unidadesQ.data ?? [];
  const categorias = categoriasQ.data ?? [];
  const proveedores = proveedoresQ.data ?? [];
  const allKardex = allKardexQ.data ?? [];

  const mermaMp = Number(lote.mermaMpKg || 0);
  const mermaUn = Number(lote.mermaUnidades || 0);

  const [modo, setModo] = useState<'existente' | 'nueva'>('existente');
  const [materiaPrimaId, setMateriaPrimaId] = useState('');

  // Campos para dar de alta una MP nueva en el mismo paso
  const [nombreNueva, setNombreNueva]   = useState('');
  const [codigoNueva, setCodigoNueva]   = useState('');
  const [categoriaId, setCategoriaId]   = useState('');

  const [cantidad, setCantidad] = useState(mermaMp > 0 ? String(mermaMp) : '');
  const [unidadId, setUnidadId] = useState('');
  const [observaciones, setObs] = useState(`Residuo aprovechable del lote ${lote.codigoLote}`);

  // Número de lote propio sugerido: MP-XXXX secuencial, sin colisión con los existentes
  // (mismo criterio que en Materia Prima → Registrar entrada).
  const sugeridoLotePropio = useMemo(() => {
    const existentes = new Set(allKardex.map(k => k.numeroLotePropio).filter(Boolean));
    const nums = [...existentes]
      .map(n => { const m = /^MP-0*(\d+)$/i.exec(n!); return m ? parseInt(m[1]) : 0; })
      .filter(n => n > 0);
    let siguiente = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
    while (existentes.has(`MP-${String(siguiente).padStart(4, '0')}`)) siguiente++;
    return `MP-${String(siguiente).padStart(4, '0')}`;
  }, [allKardex]);
  const [numeroLotePropio, setNumeroLotePropio] = useState(sugeridoLotePropio);
  const [lotePropioEditado, setLotePropioEditado] = useState(false);
  // allKardex carga async — una vez que llega, refresca la sugerencia si el usuario no la tocó todavía.
  useEffect(() => {
    if (!lotePropioEditado) setNumeroLotePropio(sugeridoLotePropio);
  }, [sugeridoLotePropio, lotePropioEditado]);

  // Origen (opcional) y costo — un residuo interno puede no tener proveedor ni costo,
  // pero si se vendió/compró a alguien o tiene un valor, hay que poder registrarlo.
  const [proveedorId, setProveedorId] = useState('');
  const [showNuevoProveedor, setShowNuevoProveedor] = useState(false);
  const [costoModo, setCostoModo] = useState<'unitario' | 'total'>('unitario');
  const [costoValor, setCostoValor] = useState('');

  const cantNum = parseFloat(cantidad) || 0;
  const costoNum = parseFloat(costoValor) || 0;
  const costoUnitarioBs = costoNum > 0
    ? (costoModo === 'total' && cantNum > 0 ? costoNum / cantNum : costoNum)
    : undefined;
  const validNueva = !!nombreNueva && !!codigoNueva && !!categoriaId;
  const valid = cantNum > 0 && !!unidadId && !!numeroLotePropio.trim()
    && (modo === 'existente' ? !!materiaPrimaId : validNueva);
  const saving = createMp.isPending || createKardex.isPending;

  function elegirExistente(id: string) {
    setMateriaPrimaId(id);
    const mp = materiasPrimas.find(m => m.id === id);
    if (mp?.unidadMedida?.id) setUnidadId(mp.unidadMedida.id);
  }

  async function handleSave() {
    if (!valid) return;
    try {
      let mpId = materiaPrimaId;
      if (modo === 'nueva') {
        const nuevaMp = await createMp.mutateAsync({
          codigo: codigoNueva.toUpperCase(),
          nombre: nombreNueva,
          categoriaId,
          unidadMedidaId: unidadId,
        });
        mpId = nuevaMp.id;
      }
      await createKardex.mutateAsync({
        fecha: new Date().toISOString().slice(0, 10),
        tipoMovimiento: TipoMovimientoMP.INGRESO,
        cantidad: cantNum,
        materiaPrimaId: mpId,
        unidadId,
        loteProduccionId: lote.id,
        numeroLotePropio: numeroLotePropio.trim(),
        proveedorId: proveedorId || undefined,
        costoUnitarioBs,
        observaciones: observaciones || undefined,
      });
      onSaved();
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo registrar el residuo'));
    }
  }

  return (
    <Modal open title="Registrar residuo como materia prima" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!valid} loading={saving}>
          <ArrowDownCircle size={14} /> Registrar ingreso
        </Btn>
      </>}>

      <div className="rounded-md px-4 py-3 text-[13px]" style={{ background: 'var(--color-gr-primary-lite)' }}>
        <p className="font-600 text-gr-primary">
          Del lote <strong className="font-mono">{lote.codigoLote}</strong> ({lote.producto?.nombre})
          {(mermaMp > 0 || mermaUn > 0) && (
            <>
              {' '}— merma registrada: {mermaMp > 0 && `${formatNum(mermaMp, 1)} kg`}
              {mermaMp > 0 && mermaUn > 0 && ' / '}
              {mermaUn > 0 && `${formatNum(mermaUn, 0)} u`}
            </>
          )}
        </p>
      </div>

      <div className="flex rounded-[10px] overflow-hidden border border-gr-border">
        <button type="button" onClick={() => setModo('existente')}
          className={`flex-1 py-2 text-[13px] font-700 transition-all ${modo === 'existente' ? 'bg-gr-primary text-white' : 'bg-white text-gr-muted hover:text-gr-text'}`}>
          Materia prima existente
        </button>
        <button type="button" onClick={() => setModo('nueva')}
          className={`flex-1 py-2 text-[13px] font-700 transition-all ${modo === 'nueva' ? 'bg-gr-primary text-white' : 'bg-white text-gr-muted hover:text-gr-text'}`}>
          + Nueva materia prima
        </button>
      </div>

      {modo === 'existente' ? (
        <FormField label="Materia prima" required>
          <Select value={materiaPrimaId} onChange={e => elegirExistente(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {materiasPrimas.map(m => (
              <option key={m.id} value={m.id}>{m.codigo} · {m.nombre}</option>
            ))}
          </Select>
        </FormField>
      ) : (
        <>
          <FormField label="Nombre" required>
            <Input autoFocus value={nombreNueva} onChange={e => setNombreNueva(e.target.value)}
              placeholder="Ej. Cascarilla de arroz" />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Código" required hint="Ej. CASC-AR">
              <Input value={codigoNueva} onChange={e => setCodigoNueva(e.target.value.toUpperCase())} />
            </FormField>
            <FormField label="Categoría" required>
              <Select value={categoriaId} onChange={e => setCategoriaId(e.target.value)}>
                <option value="">— Seleccionar —</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </FormField>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Cantidad" required hint={mermaMp > 0 ? 'Sugerida según la merma del lote · editable' : undefined}>
          <Input type="number" min="0" step="0.01" value={cantidad} onChange={e => setCantidad(e.target.value)}
            className="text-[16px] font-700" />
        </FormField>
        <FormField label="Unidad" required>
          <Select value={unidadId} onChange={e => setUnidadId(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {unidades.map(u => <option key={u.id} value={u.id}>{u.codigo} · {u.nombre}</option>)}
          </Select>
        </FormField>
      </div>

      <FormField label="N° de lote" required hint="Sugerido · editable">
        <Input placeholder="MP-0001" value={numeroLotePropio}
          onChange={e => { setNumeroLotePropio(e.target.value); setLotePropioEditado(true); }} />
      </FormField>

      <FormField label="Proveedor / origen" hint="Opcional — deja en blanco si es 100% interno (sin proveedor externo)">
        <div className="flex gap-2">
          <Select value={proveedorId} onChange={e => setProveedorId(e.target.value)} className="flex-1">
            <option value="">— Sin proveedor —</option>
            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </Select>
          <Btn type="button" variant="ghost" onClick={() => setShowNuevoProveedor(true)} className="shrink-0">
            <Plus size={14} /> Nuevo
          </Btn>
        </div>
      </FormField>

      <FormField label="Costo" hint="Opcional — déjalo en 0 si el residuo no tiene un costo asignado">
        <div className="flex gap-2">
          <div className="flex rounded-[10px] overflow-hidden border border-gr-border shrink-0">
            <button type="button" onClick={() => setCostoModo('unitario')}
              className={`px-3 py-2 text-[12px] font-700 transition-all ${costoModo === 'unitario' ? 'bg-gr-primary text-white' : 'bg-white text-gr-muted hover:text-gr-text'}`}>
              Por unidad
            </button>
            <button type="button" onClick={() => setCostoModo('total')}
              className={`px-3 py-2 text-[12px] font-700 transition-all ${costoModo === 'total' ? 'bg-gr-primary text-white' : 'bg-white text-gr-muted hover:text-gr-text'}`}>
              Total
            </button>
          </div>
          <Input type="number" min="0" step="0.01" placeholder="0" value={costoValor}
            onChange={e => setCostoValor(e.target.value)} className="flex-1" />
        </div>
        {costoNum > 0 && costoModo === 'total' && cantNum > 0 && (
          <p className="text-[11.5px] text-gr-muted mt-1">
            = {formatBs(costoUnitarioBs ?? 0)} por unidad
          </p>
        )}
      </FormField>

      <FormField label="Observaciones">
        <Textarea value={observaciones} onChange={e => setObs(e.target.value)} />
      </FormField>

      {showNuevoProveedor && (
        <NuevoProveedorModal
          onClose={() => setShowNuevoProveedor(false)}
          onCreated={p => setProveedorId(p.id)}
        />
      )}
    </Modal>
  );
}
