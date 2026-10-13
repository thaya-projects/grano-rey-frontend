import type { DeudaItem } from '@/lib/types';

export type Tab = 'pendientes' | 'pagados';
export type FiltroFecha = 'Hoy' | 'Esta semana' | 'Este mes' | 'Este año' | 'Personalizado' | 'Todos';

export const FILTROS_FECHA: FiltroFecha[] = ['Hoy', 'Esta semana', 'Este mes', 'Este año', 'Personalizado', 'Todos'];

export interface GrupoMovimiento {
  key: string;
  origen: 'kardex_mp' | 'venta';
  origenId: string;
  referencia: string;
  numeroReferencia?: string;
  clienteNombre?: string;
  materiaPrimaNombre?: string;
  fecha: string;
  items: DeudaItem[];
  totalBs: number;
  pagado: boolean;
}

/** Fecha local YYYY-MM-DD (no UTC — evita off-by-one por la noche). */
export function toLocalIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Devuelve el rango [desde, hasta] YYYY-MM-DD para un filtro rápido.
 * Null indica sin filtro (Todos).
 */
export function rangoFiltro(filtro: FiltroFecha, custom: { desde: string; hasta: string }): { desde?: string; hasta?: string } {
  const hoy = new Date();
  if (filtro === 'Hoy') {
    const s = toLocalIso(hoy);
    return { desde: s, hasta: s };
  }
  if (filtro === 'Esta semana') {
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
    return { desde: toLocalIso(lunes), hasta: toLocalIso(hoy) };
  }
  if (filtro === 'Este mes') {
    const primer = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    return { desde: toLocalIso(primer), hasta: toLocalIso(hoy) };
  }
  if (filtro === 'Este año') {
    const primer = new Date(hoy.getFullYear(), 0, 1);
    return { desde: toLocalIso(primer), hasta: toLocalIso(hoy) };
  }
  if (filtro === 'Personalizado') {
    return { desde: custom.desde || undefined, hasta: custom.hasta || undefined };
  }
  return {};
}
