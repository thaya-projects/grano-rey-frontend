import { type Usuario } from '@/lib/types';
import { Badge } from '@/components/ui';
import { CheckCircle2, XCircle, Pencil, Trash2 } from 'lucide-react';
import { ROL_LABELS, ROL_COLORS } from './constants';

const GRID_COLS = '1fr 190px 110px 120px 80px 64px';

export function UsuarioRow({ usuario: u, isLast, onEditar, onEliminar }: {
  usuario: Usuario;
  isLast: boolean;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  return (
    <div className={`px-5 py-3.5 ${!isLast ? 'border-b border-gr-border-lite' : ''}`}>
      {/* Mobile */}
      <div className="flex items-start justify-between gap-2 md:hidden">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <Badge color={ROL_COLORS[u.rol]}>{ROL_LABELS[u.rol]}</Badge>
            {u.activo ? (
              <span className="flex items-center gap-1 text-[11px] font-600 text-emerald-600">
                <CheckCircle2 size={11} /> Activo
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-600 text-gr-muted">
                <XCircle size={11} /> Inhabilitado
              </span>
            )}
          </div>
          <p className="text-[13px] font-700 text-gr-text">{u.nombre}</p>
          <p className="text-[12px] text-gr-muted font-mono">{u.email}</p>
          {u.telefono && <p className="text-[11px] text-gr-muted mt-0.5">{u.telefono}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={onEditar}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gr-muted hover:text-gr-primary hover:bg-gr-primary/10 transition-colors">
            <Pencil size={14} />
          </button>
          <button type="button" onClick={onEliminar}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gr-muted hover:text-gr-danger hover:bg-red-50 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:grid gap-3 items-center" style={{ gridTemplateColumns: GRID_COLS }}>
        <div>
          <p className="font-700 text-[13.5px] text-gr-text leading-tight">{u.nombre}</p>
          {u.ultimoAcceso && (
            <p className="text-[11px] text-gr-muted mt-0.5">Último acceso {u.ultimoAcceso.slice(0, 10)}</p>
          )}
        </div>
        <span className="text-[12.5px] text-gr-muted font-mono truncate" title={u.email}>
          {u.email}
        </span>
        <span className="text-[12.5px] text-gr-muted">{u.telefono ?? '—'}</span>
        <Badge color={ROL_COLORS[u.rol]}>{ROL_LABELS[u.rol]}</Badge>
        <div>
          {u.activo ? (
            <span className="flex items-center gap-1.5 text-[12px] font-600 text-emerald-600">
              <CheckCircle2 size={13} /> Activo
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[12px] font-600 text-gr-muted">
              <XCircle size={13} /> Inhabilitado
            </span>
          )}
        </div>
        <div className="flex justify-end gap-1">
          <button type="button" onClick={onEditar} title="Editar"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gr-muted hover:text-gr-primary hover:bg-gr-primary/10 transition-colors">
            <Pencil size={14} />
          </button>
          <button type="button" onClick={onEliminar} title="Eliminar"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gr-muted hover:text-gr-danger hover:bg-red-50 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
