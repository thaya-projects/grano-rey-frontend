import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type AgrupacionTipo, navigateAnchor, getPeriodLabel } from './helpers';

export function AgrupacionSelector({ tipo, setTipo, anchor, setAnchor }: {
  tipo: AgrupacionTipo; setTipo: (t: AgrupacionTipo) => void;
  anchor: Date; setAnchor: (d: Date) => void;
}) {
  const labels: Record<AgrupacionTipo, string> = { semana: 'Semana', mes: 'Mes', año: 'Año' };
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex rounded-[8px] overflow-hidden border border-gr-border">
        {(['semana','mes','año'] as AgrupacionTipo[]).map(t => (
          <button key={t} onClick={() => setTipo(t)}
            className="px-3 py-1.5 text-[12px] font-600 transition-colors"
            style={tipo === t
              ? { background: 'var(--color-gr-primary)', color: '#fff' }
              : { background: '#fff', color: 'var(--color-gr-muted)' }}>
            {labels[t]}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => setAnchor(navigateAnchor(anchor, tipo, -1))}
          className="w-7 h-7 flex items-center justify-center rounded-[6px] transition-colors hover:bg-gr-border-lite">
          <ChevronLeft size={14} color="var(--color-gr-muted)" />
        </button>
        <span className="text-[13px] font-700 text-gr-text min-w-[160px] text-center">
          {getPeriodLabel(anchor, tipo)}
        </span>
        <button onClick={() => setAnchor(navigateAnchor(anchor, tipo, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-[6px] transition-colors hover:bg-gr-border-lite">
          <ChevronRight size={14} color="var(--color-gr-muted)" />
        </button>
      </div>
    </div>
  );
}
