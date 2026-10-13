'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-store';
import { EditarPerfilModal } from './EditarPerfilModal';
import { UserCog, LogOut } from 'lucide-react';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-700 text-white shrink-0 transition-opacity hover:opacity-85"
        style={{ background: 'var(--color-gr-primary-dark)' }}
        title={user.nombre}>
        {user.iniciales}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white rounded-[12px] border border-gr-border shadow-xl overflow-hidden z-20 animate-fade-up">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gr-border-lite">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-700 text-white shrink-0"
              style={{ background: 'var(--color-gr-primary-dark)' }}>
              {user.iniciales}
            </div>
            <div className="min-w-0">
              <p className="text-[13.5px] font-700 text-gr-text truncate">{user.nombre}</p>
              <p className="text-[11px] text-gr-muted capitalize">{user.rol}</p>
            </div>
          </div>
          <button type="button" onClick={() => { setOpen(false); setEditando(true); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] font-500 text-gr-text hover:bg-gr-border-lite transition-colors">
            <UserCog size={15} className="text-gr-muted" /> Editar perfil
          </button>
          <button type="button" onClick={() => { setOpen(false); logout(); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] font-500 text-gr-danger hover:bg-gr-danger-bg transition-colors">
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      )}

      {editando && <EditarPerfilModal user={user} onClose={() => setEditando(false)} />}
    </div>
  );
}
