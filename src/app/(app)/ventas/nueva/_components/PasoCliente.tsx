import { type Cliente } from '@/lib/types';
import { Btn, FormField, Input, SearchBox } from '@/components/ui';
import { Plus, ChevronRight, User, MapPin, Phone, CheckCircle2 } from 'lucide-react';

export function PasoCliente({
  clientesFiltrados, searchCliente, onSearchChange, clienteId, onSelectCliente,
  onNuevoCliente, fecha, onFechaChange, onContinuar,
}: {
  clientesFiltrados: Cliente[];
  searchCliente: string;
  onSearchChange: (v: string) => void;
  clienteId: string;
  onSelectCliente: (id: string) => void;
  onNuevoCliente: () => void;
  fecha: string;
  onFechaChange: (v: string) => void;
  onContinuar: () => void;
}) {
  return (
    <div className="space-y-4 animate-fade-up">
      <div className="card">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <p className="font-700 text-gr-text text-[15px]">¿A quién le vendemos?</p>
            <p className="text-gr-muted text-[12.5px]">Selecciona o busca el cliente</p>
          </div>
          <Btn variant="ghost" onClick={onNuevoCliente} className="shrink-0">
            <Plus size={14} /> Nuevo cliente
          </Btn>
        </div>

        <SearchBox value={searchCliente} onChange={onSearchChange} placeholder="Buscar por nombre o ciudad..." />

        <div className="mt-3 space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {clientesFiltrados.map(c => (
            <button key={c.id} onClick={() => onSelectCliente(c.id)}
              className="w-full text-left px-4 py-3.5 rounded-[12px] border-2 transition-all flex items-center gap-3"
              style={{
                borderColor: clienteId === c.id ? 'var(--color-gr-primary)' : 'var(--color-gr-border)',
                background:  clienteId === c.id ? 'var(--color-gr-primary-lite)' : 'white',
              }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: clienteId === c.id ? 'var(--color-gr-primary)' : 'var(--color-gr-border-lite)' }}>
                <User size={15} style={{ color: clienteId === c.id ? 'white' : 'var(--color-gr-muted)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-700 text-gr-text text-[14px]">{c.nombre}</p>
                <div className="flex flex-wrap gap-x-3 mt-0.5">
                  {c.ciudad && (
                    <span className="flex items-center gap-1 text-[11.5px] text-gr-muted">
                      <MapPin size={10} /> {c.ciudad}
                    </span>
                  )}
                  {c.telefono && (
                    <span className="flex items-center gap-1 text-[11.5px] text-gr-muted">
                      <Phone size={10} /> {c.telefono}
                    </span>
                  )}
                </div>
              </div>
              {clienteId === c.id && (
                <CheckCircle2 size={18} style={{ color: 'var(--color-gr-primary)', flexShrink: 0 }} />
              )}
            </button>
          ))}
          {clientesFiltrados.length === 0 && (
            <p className="text-center py-8 text-gr-muted text-[13px]">Sin resultados</p>
          )}
        </div>
      </div>

      <FormField label="Fecha de la venta">
        <Input type="date" value={fecha} onChange={e => onFechaChange(e.target.value)} />
      </FormField>

      <div className="flex justify-end">
        <Btn onClick={onContinuar} disabled={!clienteId}>
          Continuar <ChevronRight size={15} />
        </Btn>
      </div>
    </div>
  );
}
