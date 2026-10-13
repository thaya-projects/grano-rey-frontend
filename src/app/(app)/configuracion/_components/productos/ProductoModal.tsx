'use client';
import { useState } from 'react';
import { useCreateProducto, useUpdateProducto } from '@/lib/api/productos';
import { apiErrorMessage } from '@/lib/api';
import type { Producto } from '@/lib/types';
import { Btn, Modal, FormField, Input, Select } from '@/components/ui';
import { sugerirCodigo } from '@/lib/utils';
import { ImagenesStrip } from './ProductoImagenes';

export function ProductoModal({ mode, producto, unidades, codigosExistentes, onClose, onSaved, onError }: {
  mode: 'create' | 'edit';
  producto?: Producto;
  unidades: { id: string; codigo: string; nombre: string }[];
  codigosExistentes: Set<string>;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const create = useCreateProducto();
  const update = useUpdateProducto();

  const [nombre, setNombre]        = useState(producto?.nombre ?? '');
  const [codigo, setCodigo]        = useState(producto?.codigo ?? '');
  const [codigoEditado, setCodEd]  = useState(false);
  const [unidadId, setUnidadId]    = useState(producto?.unidadProduccion?.id ?? '');
  const [descripcion, setDesc]     = useState(producto?.descripcion ?? '');
  const [stockMinimo, setStockMin] = useState(String(producto?.stockMinimo ?? '0'));
  const [precioRef, setPrecioRef]  = useState(String(producto?.precioReferencialBs ?? ''));
  const [vidaUtil, setVidaUtil]    = useState(String(producto?.vidaUtilMeses ?? '12'));
  const [activo, setActivo]        = useState(producto?.activo ?? true);

  function handleNombreChange(val: string) {
    setNombre(val);
    if (mode === 'create' && !codigoEditado) {
      setCodigo(sugerirCodigo(val, codigosExistentes));
    }
  }

  const codigoConflicto = mode === 'create' && !!codigo && codigosExistentes.has(codigo);
  const stockMin  = parseFloat(stockMinimo) || 0;
  const vidaNum   = parseInt(vidaUtil) || 0;
  const precioNum = parseFloat(precioRef) || 0;
  const valid    = !!nombre && vidaNum >= 1 && !!unidadId
    && (mode === 'create' ? !!codigo && !codigoConflicto : true);

  async function handleSave() {
    if (!valid) return;
    try {
      if (mode === 'create') {
        await create.mutateAsync({
          codigo,
          nombre,
          descripcion: descripcion || undefined,
          stockMinimo: stockMin || undefined,
          precioReferencialBs: precioNum || undefined,
          unidadProduccionId: unidadId,
          vidaUtilMeses: vidaNum,
        });
      } else if (producto) {
        await update.mutateAsync({
          id: producto.id,
          dto: {
            nombre,
            descripcion: descripcion || undefined,
            stockMinimo: stockMin || undefined,
            precioReferencialBs: precioNum || undefined,
            vidaUtilMeses: vidaNum,
            activo,
            unidadProduccionId: unidadId || undefined,
          },
        });
      }
      onSaved();
    } catch (err) {
      onError(apiErrorMessage(err, 'No se pudo guardar el producto'));
    }
  }

  return (
    <Modal open title={mode === 'create' ? 'Nuevo producto' : `Editar — ${producto?.nombre}`} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!valid} loading={create.isPending || update.isPending}>
          {mode === 'create' ? 'Crear' : 'Guardar'}
        </Btn>
      </>}>

      <FormField label="Nombre" required hint="Obligatorio">
        <Input autoFocus value={nombre} onChange={e => handleNombreChange(e.target.value)}
          placeholder="Harina de Maíz Amarillo" />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Código" required={mode === 'create'}
          hint={mode === 'edit' ? 'No editable' : codigoConflicto ? '⚠ Ya existe — cambialo' : codigoEditado ? 'Editado' : 'Sugerido · editable'}>
          <Input value={codigo}
            onChange={e => { setCodigo(e.target.value.toUpperCase()); setCodEd(true); }}
            disabled={mode === 'edit'}
            placeholder="HAMA-AM"
            className={codigoConflicto ? 'border-red-400 focus:ring-red-300' : ''} />
        </FormField>
        <FormField label="Unidad de producción" required hint="Obligatorio">
          <Select value={unidadId} onChange={e => setUnidadId(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {unidades.map(u => <option key={u.id} value={u.id}>{u.codigo} · {u.nombre}</option>)}
          </Select>
        </FormField>
      </div>

      <FormField label="Descripción" hint="Opcional">
        <Input value={descripcion ?? ''} onChange={e => setDesc(e.target.value)}
          placeholder="Descripción del producto" />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Stock mínimo" hint="Opcional">
          <Input type="number" min="0" step="1" value={stockMinimo}
            onChange={e => setStockMin(e.target.value)} />
        </FormField>
        <FormField label="Vida útil (meses)" hint="Obligatorio">
          <Input type="number" min="1" step="1" value={vidaUtil}
            onChange={e => setVidaUtil(e.target.value)} />
        </FormField>
      </div>

      <FormField label="Precio referencial (Bs)" hint="Opcional · se muestra en el catálogo público">
        <Input type="number" min="0" step="0.01" value={precioRef}
          onChange={e => setPrecioRef(e.target.value)} placeholder="155.00" />
      </FormField>

      {mode === 'edit' && (
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActivo(v => !v)}>
          <div className={`relative shrink-0 w-10 h-6 rounded-full transition-colors duration-200 ${activo ? 'bg-gr-primary' : 'bg-gr-border'}`}>
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${activo ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          <span className="text-[13.5px] font-semibold text-gr-text">
            Activo
          </span>
        </div>
      )}

      {mode === 'edit' && producto && <ImagenesStrip producto={producto} />}
    </Modal>
  );
}
