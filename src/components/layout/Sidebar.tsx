'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-store';
import Image from 'next/image';
import {
  LayoutDashboard, Package, Wheat, ShoppingCart, Truck, BarChart3,
  Settings, LogOut, ChevronRight
} from 'lucide-react';

const NAV = [
  { href: '/dashboard',     label: 'Inicio',        icon: LayoutDashboard, roles: ['administradora','almacenero','vendedor','produccion'] },
  { href: '/stock',         label: 'Stock',          icon: Package,         roles: ['administradora','almacenero','vendedor'] },
  { href: '/materia-prima', label: 'Materia Prima',  icon: Wheat,           roles: ['administradora','almacenero','produccion'] },
  { href: '/ventas',        label: 'Ventas',         icon: ShoppingCart,    roles: ['administradora','vendedor'] },
  { href: '/despachos',     label: 'Despachos',      icon: Truck,           roles: ['administradora','almacenero'] },
  { href: '/reportes',      label: 'Reportes',       icon: BarChart3,       roles: ['administradora'] },
  { href: '/configuracion', label: 'Configuración',  icon: Settings,        roles: ['administradora'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const allowed = NAV.filter(n => user && n.roles.includes(user.rol));

  return (
    <aside className="w-60 shrink-0 bg-gr-primary-dark flex flex-col h-screen sticky top-0 overflow-hidden">
      {/* Logo */}
      <div className="flex items-center justify-center px-5 py-4 border-b border-white/10">
        <div className="bg-white rounded-[12px] px-3 py-2">
          <div className="relative w-32.5 h-15">
            <Image
              src="/logo-grano-rey.webp"
              alt="Grano Rey"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {allowed.map(({ href, label, icon: Icon }) => {
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
      </nav>

      {/* User */}
      {user && (
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gr-gold flex items-center justify-center text-[12px] font-800 text-[#1a0e00] shrink-0">
              {user.iniciales}
            </div>
            <div className="min-w-0">
              <div className="text-white text-[13px] font-600 truncate">{user.nombre}</div>
              <div className="text-white/45 text-[11px] capitalize">{user.rol}</div>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-white/50 hover:text-white hover:bg-white/8 text-[13px] font-500 transition-all">
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      )}
    </aside>
  );
}
