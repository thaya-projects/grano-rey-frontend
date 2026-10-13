import { type Gasto } from '@/lib/types';
import { formatBs } from '@/lib/utils';
import { Badge, Spinner } from '@/components/ui';
import { Trash2, ImagePlus, Eye } from 'lucide-react';
import { CATEGORIA_LABELS, CATEGORIA_COLORS } from './constants';

const GRID_COLS = '100px 130px 1fr 120px 36px 36px 36px';

export function GastoRow({ gasto: g, isLast, uploading, onVerImagen, onSubirImagen, onEliminar }: {
  gasto: Gasto;
  isLast: boolean;
  uploading: boolean;
  onVerImagen: () => void;
  onSubirImagen: () => void;
  onEliminar: () => void;
}) {
  const hasImg = !!g.comprobanteImagenUrl;

  return (
    <div className={`px-5 py-3.5 ${!isLast ? 'border-b border-gr-border-lite' : ''}`}>
      {/* Mobile */}
      <div className="flex items-start justify-between gap-2 md:hidden">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Badge color={CATEGORIA_COLORS[g.categoria]} className="text-[10px]">
              {CATEGORIA_LABELS[g.categoria]}
            </Badge>
            <span className="text-[11px] text-gr-muted">{g.fecha}</span>
          </div>
          <p className="text-[13px] font-600 text-gr-text">{g.descripcion}</p>
          {g.comprobante && (
            <p className="text-[11px] text-gr-muted font-mono">{g.comprobante}</p>
          )}
          <p className="text-[15px] font-800 text-gr-primary mt-1">{formatBs(Number(g.montoBs))}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {hasImg ? (
            <button type="button" onClick={onVerImagen}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gr-primary hover:bg-gr-primary/10 transition-colors">
              <Eye size={14} />
            </button>
          ) : (
            <button type="button" disabled={uploading} onClick={onSubirImagen}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gr-muted hover:text-gr-primary hover:bg-gr-primary/10 transition-colors disabled:opacity-40">
              {uploading ? <Spinner size={12} /> : <ImagePlus size={14} />}
            </button>
          )}
          <button type="button" onClick={onEliminar}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gr-muted hover:text-gr-danger hover:bg-red-50 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:grid gap-3 items-center" style={{ gridTemplateColumns: GRID_COLS }}>
        <span className="text-[12.5px] text-gr-muted font-mono">{g.fecha}</span>
        <Badge color={CATEGORIA_COLORS[g.categoria]}>
          {CATEGORIA_LABELS[g.categoria]}
        </Badge>
        <div>
          <p className="font-600 text-[13px] text-gr-text">{g.descripcion}</p>
          {g.comprobante && (
            <p className="text-[11px] text-gr-muted font-mono">{g.comprobante}</p>
          )}
        </div>
        <span className="text-right font-800 text-[14px] text-gr-primary">
          {formatBs(Number(g.montoBs))}
        </span>
        {/* Ver imagen */}
        <button type="button"
          onClick={() => hasImg ? onVerImagen() : undefined}
          disabled={!hasImg}
          title={hasImg ? 'Ver comprobante' : 'Sin imagen'}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            hasImg ? 'text-gr-primary hover:bg-gr-primary/10' : 'text-gr-border cursor-default'
          }`}>
          <Eye size={14} />
        </button>
        {/* Subir imagen */}
        <button type="button" disabled={uploading}
          title="Subir comprobante"
          onClick={onSubirImagen}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gr-muted hover:text-gr-primary hover:bg-gr-primary/10 transition-colors disabled:opacity-40">
          {uploading ? <Spinner size={12} /> : <ImagePlus size={14} />}
        </button>
        {/* Eliminar gasto */}
        <button type="button" onClick={onEliminar}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gr-muted hover:text-gr-danger hover:bg-red-50 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
