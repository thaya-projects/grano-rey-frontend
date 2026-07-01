'use client';
import { useState, useMemo } from 'react';
import { useProductos } from '@/lib/api/productos';
import { useLotes, useCreateLote } from '@/lib/api/produccion';
import { type Producto, type CreateLoteRequest } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { formatNum, formatBs } from '@/lib/utils';
import {
  Btn, Modal, FormField, Input, Select, Textarea, Badge,
  Spinner, SearchBox, useToast,
} from '@/components/ui';
import {
  Package, Plus, ShieldCheck, AlertTriangle, TrendingDown,
} from 'lucide-react';

const FILTROS = ['Hoy', 'Esta semana', 'Este mes', 'Personalizado', 'Todos'] as const;

export default function ProduccionPage() {
  const toast = useToast(s => s.show);
  const productosQ = useProductos();
  const lotesQ = useLotes();
  const productos = productosQ.data ?? [];
  const lotes = lotesQ.data ?? [];

  const [showModal, setShowModal] = useState(false);
  const [productoIdInicial, setProductoIdInicial] = useState<string>('');
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
          <h1 className="text-[22px] font-900 text-[var(--color-gr-text)]">Producción</h1>
          <p className="text-[var(--color-gr-muted)] text-[13.5px] mt-0.5">
            Registro de lotes producidos con código SENASAG, merma y trazabilidad.
          </p>
        </div>
        <Btn variant="gold" onClick={() => abrirRegistrar()}>
          <Plus size={14} /> Registrar producción
        </Btn>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card">
          <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">Lotes en el período</p>
          <p className="text-[28px] font-900 text-[var(--color-gr-text)]">{filtrados.length}</p>
        </div>
        <div className="card">
          <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">Total producido</p>
          <p className="text-[28px] font-900 text-[var(--color-gr-primary)]">{formatNum(totalProducido, 0)}</p>
        </div>
        <div className="card">
          <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">Merma del período</p>
          <p className="text-[28px] font-900 text-[var(--color-gr-warning)]">
            {formatNum(totalMerma, 0)}
            <span className="text-[12px] font-500 text-[var(--color-gr-muted)] ml-2">
              · {formatNum(totalMermaMp, 1)} kg MP
            </span>
          </p>
        </div>
        <div className="card">
          <p className="text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">Costo MP del período</p>
          <p className="text-[28px] font-900 text-[var(--color-gr-text)]">{formatBs(totalCosto)}</p>
        </div>
      </div>

      {proximosVencimientos.length > 0 && (
        <div className="rounded-[12px] p-4 flex gap-3 items-start"
          style={{ background: 'var(--color-gr-warning-bg)', border: '1px solid rgba(160,92,10,0.2)' }}>
          <AlertTriangle size={18} className="text-[var(--color-gr-warning)] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-700 text-[13.5px] text-[var(--color-gr-warning)]">
              {proximosVencimientos.length} {proximosVencimientos.length === 1 ? 'lote vence' : 'lotes vencen'} en los próximos 30 días
            </p>
            <ul className="mt-2 space-y-1 text-[12.5px] text-[var(--color-gr-text)]">
              {proximosVencimientos.slice(0, 4).map(l => (
                <li key={l.id}>
                  <span className="font-mono font-700">{l.codigoLote}</span> ·
                  {' '}{l.producto?.nombre} · vence <strong>{l.fechaVencimiento}</strong>
                </li>
              ))}
              {proximosVencimientos.length > 4 && (
                <li className="text-[var(--color-gr-muted)]">
                  +{proximosVencimientos.length - 4} más...
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 bg-white border border-[var(--color-gr-border)] rounded-[10px] p-1">
          {FILTROS.map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-600 transition-all ${filtro === f ? 'bg-[var(--color-gr-primary)] text-white' : 'text-[var(--color-gr-muted)] hover:text-[var(--color-gr-text)]'}`}>
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
        <div className="flex flex-wrap items-end gap-3 bg-[var(--color-gr-border-lite)] rounded-[10px] p-3">
          <div>
            <label className="block text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">Desde</label>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
              className="border border-[var(--color-gr-border)] rounded-[8px] px-3 py-1.5 text-[13px] bg-white" />
          </div>
          <div>
            <label className="block text-[11px] font-700 text-[var(--color-gr-muted)] uppercase mb-1">Hasta</label>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
              className="border border-[var(--color-gr-border)] rounded-[8px] px-3 py-1.5 text-[13px] bg-white" />
          </div>
          {(fechaDesde || fechaHasta) && (
            <button onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
              className="text-[12px] font-600 text-[var(--color-gr-primary)] underline">
              Limpiar
            </button>
          )}
        </div>
      )}

      <div className="card-no-pad">
        <div className="hidden md:grid gap-3 px-5 py-3 text-[11px] font-700 text-[var(--color-gr-muted)] uppercase tracking-wide border-b border-[var(--color-gr-border)]"
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
          <div className="py-16 text-center text-[var(--color-gr-muted)] text-[14px]">
            Sin lotes para los filtros seleccionados
          </div>
        ) : (
          filtrados.map((l, i) => {
            const restante = Number(l.stockRestante);
            const cant = Number(l.cantidadProducida);
            const pct = cant > 0 ? restante / cant : 0;
            const status: 'red' | 'yellow' | 'green' = pct < 0.15 ? 'red' : pct < 0.4 ? 'yellow' : 'green';
            const mermaUn = Number(l.mermaUnidades || 0);
            const mermaMp = Number(l.mermaMpKg || 0);
            const hasMerma = mermaUn > 0 || mermaMp > 0;

            return (
              <div key={l.id}
                className={`px-5 py-3.5 ${i < filtrados.length - 1 ? 'border-b border-[var(--color-gr-border-lite)]' : ''}`}>
                <div className="md:hidden">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-700 font-mono text-[13px] text-[var(--color-gr-primary)]">{l.codigoLote}</p>
                      {l.numeroLotePropio && (
                        <p className="text-[11px] font-mono text-[var(--color-gr-muted)]">
                          ({l.numeroLotePropio})
                        </p>
                      )}
                      <p className="text-[13px] mt-0.5 font-600">{l.producto?.nombre}</p>
                      <p className="text-[12px] text-[var(--color-gr-muted)]">
                        {formatNum(restante, 0)}/{formatNum(cant, 0)} · {l.fecha}
                      </p>
                      {hasMerma && (
                        <p className="text-[11.5px] text-[var(--color-gr-warning)] mt-0.5 flex items-center gap-1">
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
                  <span className="font-mono font-700 text-[12px] text-[var(--color-gr-primary)] break-all">
                    {l.codigoLote}
                  </span>
                  <span className="font-mono text-[12px] text-[var(--color-gr-muted)]">
                    {l.numeroLotePropio || '—'}
                  </span>
                  <div>
                    <p className="font-600 text-[13px] text-[var(--color-gr-text)]">{l.producto?.nombre}</p>
                    <p className="text-[11.5px] text-[var(--color-gr-muted)]">
                      {l.producto?.codigo}{l.registroSanitario ? ` · ${l.registroSanitario}` : ''}
                    </p>
                  </div>
                  <span className="text-right text-[13px] font-600">{formatNum(cant, 0)}</span>
                  <span className="text-right font-800 text-[14px] text-[var(--color-gr-text)]">
                    {formatNum(restante, 0)}
                  </span>
                  <span className="text-right text-[12.5px]">
                    {hasMerma ? (
                      <span className="text-[var(--color-gr-warning)] flex items-center justify-end gap-1">
                        <TrendingDown size={11} />
                        {mermaUn > 0 && `${formatNum(mermaUn, 0)}u`}
                        {mermaMp > 0 && (mermaUn > 0 ? ` / ${formatNum(mermaMp, 1)}kg` : `${formatNum(mermaMp, 1)}kg`)}
                      </span>
                    ) : (
                      <span className="text-[var(--color-gr-muted)]">—</span>
                    )}
                  </span>
                  <span className="text-[12px] text-[var(--color-gr-muted)]">{l.fecha}</span>
                  <span className="text-[12px] text-[var(--color-gr-muted)]">
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
  const [productoId, setProductoId] = useState(productoIdInicial);
  const [bolsas, setBolsas] = useState('');
  const [costoMpBs, setCosto] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [obs, setObs] = useState('');
  const [numeroLotePropio, setNumeroLotePropio] = useState('');
  const [mermaUnidades, setMermaUnidades] = useState('');
  const [mermaMpKg, setMermaMpKg] = useState('');
  const [mermaObs, setMermaObs] = useState('');

  const producto = productos.find(p => p.id === productoId);
  const bolsasNum = parseFloat(bolsas) || 0;
  const mermaUnNum = parseFloat(mermaUnidades) || 0;
  const mermaMpNum = parseFloat(mermaMpKg) || 0;
  const totalQQ = producto ? (bolsasNum * Number(producto.pesoKgPorUnidad)) / 46 : 0;
  const valid = !!producto && !!producto.unidadVenta?.id && bolsasNum > 0;

  async function handleSave() {
    if (!valid || !producto) return;
    const dto: CreateLoteRequest = {
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
    };
    try {
      const lote = await createLote.mutateAsync(dto);
      onSaved(lote.codigoLote);
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo registrar la producción'));
    }
  }

  return (
    <Modal open title="Registrar producción" onClose={onClose}>
      <FormField label="Producto" required>
        <Select value={productoId} onChange={e => setProductoId(e.target.value)}>
          <option value="">— Seleccionar —</option>
          {productos.map(p => (
            <option key={p.id} value={p.id}>{p.codigo} · {p.nombre}</option>
          ))}
        </Select>
      </FormField>

      {producto && (
        <div className="rounded-[10px] px-4 py-3" style={{ background: 'var(--color-gr-primary-lite)' }}>
          <p className="font-600 text-[13px] text-[var(--color-gr-primary)]">
            Stock actual: <strong>{formatNum(Number(producto.stockActual), 0)} {producto.unidadVenta?.abreviatura ?? ''}</strong>
          </p>
          <p className="text-[12px] text-[var(--color-gr-sub)] mt-0.5 flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-[var(--color-gr-primary)]" />
            El código SENASAG se genera automáticamente. Vida útil del producto: {producto.vidaUtilMeses} meses.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Cantidad producida" required>
          <Input type="number" min="1" placeholder="0" value={bolsas}
            onChange={e => setBolsas(e.target.value)} />
        </FormField>
        <FormField label="Fecha" required>
          <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
        </FormField>
      </div>

      {bolsasNum > 0 && producto && (
        <div className="grid grid-cols-3 gap-3 rounded-[10px] px-4 py-3 text-[13px]"
          style={{ background: 'var(--color-gr-border-lite)' }}>
          <div>
            <p className="text-[var(--color-gr-muted)] text-[10.5px] font-600 uppercase">QQ a producir</p>
            <p className="font-800 text-[var(--color-gr-text)]">{formatNum(totalQQ, 2)}</p>
          </div>
          <div>
            <p className="text-[var(--color-gr-muted)] text-[10.5px] font-600 uppercase">Stock después</p>
            <p className="font-800 text-[var(--color-gr-text)]">
              {formatNum(Number(producto.stockActual) + bolsasNum, 0)}
            </p>
          </div>
          <div>
            <p className="text-[var(--color-gr-muted)] text-[10.5px] font-600 uppercase">Valor producido</p>
            <p className="font-800 text-[var(--color-gr-primary)]">
              {formatBs(bolsasNum * Number(producto.precioUnitarioBs))}
            </p>
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
        <div className="flex items-center gap-2">
          <TrendingDown size={14} className="text-[var(--color-gr-warning)]" />
          <p className="font-700 text-[13px] text-[var(--color-gr-text)]">Merma (opcional)</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label={`Merma producto final (${producto?.unidadVenta?.abreviatura ?? 'u'})`}>
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
        <Btn onClick={handleSave} disabled={!valid} loading={createLote.isPending}>
          <Package size={14} /> Confirmar producción
        </Btn>
      </div>
    </Modal>
  );
}
