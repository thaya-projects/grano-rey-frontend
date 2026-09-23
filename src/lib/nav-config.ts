import {
  LayoutDashboard, Package, Wheat, ShoppingCart, Truck, BarChart3,
  Settings, HardHat, Factory, Receipt, type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  /** Etiqueta corta para espacios angostos (ej. barra inferior móvil). Si falta, usa `label`. */
  shortLabel?: string;
  icon: LucideIcon;
  roles: string[];
}

export interface NavGroup {
  /** null = sin encabezado de sección (ej. "Inicio", siempre visible arriba) */
  section: string | null;
  items: NavItem[];
}

const TODOS = ['administradora', 'almacenero', 'vendedor', 'produccion'];

/**
 * Única fuente de verdad para el menú (Sidebar desktop + drawer/bottom-bar móvil).
 * Agrupado por proceso real del negocio, no por orden alfabético ni técnico:
 * Ventas (vender y entregar) · Producción (transformar MP en producto) ·
 * Inventario (cuánto hay) · Administración (exclusivo de la dueña/admin).
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    section: null,
    items: [
      { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard, roles: TODOS },
    ],
  },
  {
    section: 'Ventas',
    items: [
      { href: '/ventas', label: 'Ventas', icon: ShoppingCart, roles: ['administradora', 'vendedor'] },
      { href: '/despachos', label: 'Despachos', icon: Truck, roles: ['administradora', 'almacenero'] },
    ],
  },
  {
    section: 'Producción',
    items: [
      { href: '/produccion', label: 'Producción', icon: Factory, roles: ['administradora', 'almacenero', 'produccion'] },
      { href: '/materia-prima', label: 'Materia Prima', icon: Wheat, roles: ['administradora', 'almacenero', 'produccion'] },
      { href: '/cargadores', label: 'Personal', icon: HardHat, roles: ['administradora', 'almacenero', 'produccion'] },
    ],
  },
  {
    section: 'Inventario',
    items: [
      { href: '/stock', label: 'Stock', icon: Package, roles: TODOS },
    ],
  },
  {
    section: 'Administración',
    items: [
      { href: '/gastos', label: 'Gastos', icon: Receipt, roles: ['administradora'] },
      { href: '/reportes', label: 'Reportes', icon: BarChart3, roles: ['administradora'] },
      { href: '/configuracion', label: 'Configuración', shortLabel: 'Config', icon: Settings, roles: ['administradora'] },
    ],
  },
];

export const NAV_ALL: NavItem[] = NAV_GROUPS.flatMap(g => g.items);

/** Accesos rápidos de la barra inferior móvil — un ítem representativo por grupo. */
const NAV_BOTTOM_HREFS = ['/dashboard', '/ventas', '/produccion', '/stock', '/configuracion'];
export const NAV_BOTTOM: NavItem[] = NAV_BOTTOM_HREFS
  .map(href => NAV_ALL.find(n => n.href === href))
  .filter((n): n is NavItem => !!n);
