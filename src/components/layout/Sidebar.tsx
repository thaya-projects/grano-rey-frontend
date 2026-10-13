'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-store';
import { NAV_GROUPS } from '@/lib/nav-config';
import Image from 'next/image';
import { LogOut, ChevronRight } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const groups = NAV_GROUPS
    .map(g => ({ ...g, items: g.items.filter(n => user && n.roles.includes(user.rol)) }))
    .filter(g => g.items.length > 0);

  return (
    <aside className="w-60 shrink-0 bg-gr-primary-dark flex flex-col h-screen sticky top-0 overflow-hidden">
      {/* Logo */}
      <div className="flex items-center justify-center px-5 py-4 border-b border-white/10">
        <div className="relative w-32.5 h-15">
          <Image
            src="/logo-grano-rey.webp"
            alt="Grano Rey"
            fill
            sizes="130px"
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Nav */}
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
                <Link key={href} href={href}
                  className={cn('flex items-center gap-3 px-3 py-2.5 rounded-md text-[14px] font-600 transition-all duration-150 group',
                    active
                      ? 'bg-white/15 text-white'
                      : 'text-white/65 hover:bg-white/8 hover:text-white/90')}>
                  <Icon size={18} className={cn('shrink-0', active ? 'text-gr-gold' : 'text-white/50 group-hover:text-white/70')} />
                  <span className="flex-1">{label}</span>
                  {active && <ChevronRight size={14} className="text-white/40" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      {user && (
        <div className="border-t border-white/10 p-4">
          <button onClick={logout}
            className="w-full cursor-pointer flex items-center gap-2 px-3 py-2 rounded-[8px] text-white/50 hover:text-white hover:bg-white/8 text-[13px] font-500 transition-all">
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      )}
    </aside>
  );
}
