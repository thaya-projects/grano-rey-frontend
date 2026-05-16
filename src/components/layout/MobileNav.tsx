'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, ShoppingCart, Truck, Settings } from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Inicio',  icon: LayoutDashboard },
  { href: '/stock',     label: 'Stock',   icon: Package },
  { href: '/ventas',    label: 'Ventas',  icon: ShoppingCart },
  { href: '/despachos', label: 'Despachos', icon: Truck },
  { href: '/configuracion', label: 'Config', icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[var(--color-gr-border)] flex md:hidden safe-bottom">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
        return (
          <Link key={href} href={href}
            className={cn('flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-600 transition-colors',
              active ? 'text-[var(--color-gr-primary)]' : 'text-[var(--color-gr-muted)]')}>
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
