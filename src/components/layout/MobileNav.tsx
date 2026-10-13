'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-store';
import { NAV_GROUPS, NAV_BOTTOM } from '@/lib/nav-config';
import { Menu, X, LogOut, ChevronRight } from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const groups = NAV_GROUPS
    .map(g => ({ ...g, items: g.items.filter(n => user && n.roles.includes(user.rol)) }))
    .filter(g => g.items.length > 0);
  const bottomAllowed = NAV_BOTTOM.filter(n => user && n.roles.includes(user.rol));

  return (
    <>
      {/* ── Header móvil ─────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-40 h-14 flex items-center justify-between px-4 bg-gr-primary-dark md:hidden">
        <span className="text-white font-800 text-[17px] tracking-tight">Grano Rey</span>
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-[8px] text-white/70 hover:text-white hover:bg-white/10 transition-colors">
          <Menu size={22} />
        </button>
      </header>

      {/* ── Drawer overlay ───────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

          {/* Panel */}
          <div
            className="absolute top-0 right-0 h-full w-72 bg-gr-primary-dark flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}>

            {/* Cabecera del drawer */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-white/10 shrink-0">
              <span className="text-white font-800 text-[16px]">Menú</span>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-[8px] text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 px-3 py-4 space-y-3 overflow-y-auto">
              {groups.map((group, gi) => (
                <div key={group.section ?? `g${gi}`} className="space-y-0.5">
                  {group.section && (
                    <p className="px-3 pt-2 pb-1 text-[10.5px] font-700 text-white/35 uppercase tracking-widest">
                      {group.section}
                    </p>
                  )}
                  {group.items.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                    return (
                      <Link key={href} href={href} onClick={() => setOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-3 rounded-[8px] text-[14px] font-600 transition-all',
                          active ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/8 hover:text-white/90',
                        )}>
                        <Icon size={18} className={cn('shrink-0', active ? 'text-gr-gold' : 'text-white/45')} />
                        <span className="flex-1">{label}</span>
                        {active && <ChevronRight size={14} className="text-white/35" />}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Usuario + logout */}
            {user && (
              <div className="border-t border-white/10 p-4 shrink-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gr-gold flex items-center justify-center text-[13px] font-800 text-[#1a0e00] shrink-0">
                    {user.iniciales}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-[13px] font-600 truncate">{user.nombre}</p>
                    <p className="text-white/45 text-[11px] capitalize">{user.rol}</p>
                  </div>
                </div>
                <button
                  onClick={() => { logout(); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-[8px] text-white/50 hover:text-white hover:bg-white/8 text-[13px] font-500 transition-all">
                  <LogOut size={14} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom tab bar ────────────────────────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gr-border flex md:hidden no-print">
        {bottomAllowed.map(({ href, label, shortLabel, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-600 transition-colors',
                active ? 'text-gr-primary' : 'text-gr-muted',
              )}>
              <Icon size={20} />
              {shortLabel ?? label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
