'use client';
import { useState, useMemo, useEffect } from 'react';
import { useMateriasPrimas, useCreateMateriaPrima, useCreateKardexMP, useKardexMP } from '@/lib/api/materia-prima';
import { useUnidades, useCategoriasMP, useProveedores } from '@/lib/api/catalogos';
import { type LoteProduccion, TipoMovimientoMP } from '@/lib/types';
import { apiErrorMessage } from '@/lib/api';
import { formatNum, formatBs } from '@/lib/utils';
import { Btn, Modal, FormField, Input, Select, Textarea } from '@/components/ui';
import { NuevoProveedorModal } from '@/components/NuevoProveedorModal';
import { ArrowDownCircle, Plus } from 'lucide-react';

export function ResiduoAMPModal({ lote, onClose, onSaved, onError }: {
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

  // La merma de este lote generó su propio movimiento de kardex (tipo MERMA, vinculado al
  // lote). Se lo pasamos al backend como origen para que valide que esa merma puntual no se
  // haya convertido ya en materia prima antes (evita duplicar el mismo residuo dos veces).
  const mermaKardex = allKardex.find(k =>
    k.tipoMovimiento === TipoMovimientoMP.MERMA && k.loteProduccion?.id === lote.id,
  );

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

  // Convierte lo que ya está escrito en "Cantidad" a la nueva unidad, en vez de dejarlo tal
  // cual reinterpretado (115 kg no puede pasar a ser "115 qq" solo porque cambió la unidad).
  // Si todavía no había unidad elegida, la cantidad inicial está en kg (factor 1).
  function cambiarUnidad(nuevaUnidadId: string) {
    const factorAnterior = Number(unidades.find(u => u.id === unidadId)?.factorABase) || 1;
    const factorNuevo    = Number(unidades.find(u => u.id === nuevaUnidadId)?.factorABase) || 1;
    setUnidadId(nuevaUnidadId);
    setCantidad(prev => {
      const num = parseFloat(prev);
      if (!Number.isFinite(num) || num === 0) return prev;
      return String(Math.round((num * factorAnterior / factorNuevo) * 100) / 100);
    });
  }

  function elegirExistente(id: string) {
    setMateriaPrimaId(id);
    const mp = materiasPrimas.find(m => m.id === id);
    if (mp?.unidadMedida?.id) cambiarUnidad(mp.unidadMedida.id);
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
        mermaOrigenId: mermaKardex?.id,
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
        {mermaMp > 0 && (
          mermaKardex ? (
            <p className="text-[11.5px] text-gr-primary mt-1">
              ✓ Vinculado a esta merma — el sistema no va a permitir convertirla en materia prima dos veces.
            </p>
          ) : (
            <p className="text-[11.5px] text-gr-warning mt-1">
              ⚠ No se encontró el movimiento de merma de este lote en el kardex — se registrará sin ese control.
            </p>
          )
        )}
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
          <Select value={unidadId} onChange={e => cambiarUnidad(e.target.value)}>
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
