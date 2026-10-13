import type { DetalleVenta } from '@/lib/types';

export type ReporteId      = 'financiero' | 'ventas' | 'movimientos_mp' | 'stock' | 'cargadores';
export type AgrupacionTipo = 'semana' | 'mes' | 'año';
export type StockTab       = 'productos' | 'mp';

export const MESES       = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
export const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
export const DIAS_SEM     = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

export function getWeekBounds(anchor: Date): { start: string; end: string } {
  const d   = new Date(anchor);
  const day = d.getDay();
  const mon = new Date(d); mon.setDate(d.getDate() - ((day + 6) % 7));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmt = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  return { start: fmt(mon), end: fmt(sun) };
}

export function navigateAnchor(anchor: Date, tipo: AgrupacionTipo, dir: -1 | 1): Date {
  const d = new Date(anchor);
  if      (tipo === 'semana') d.setDate(d.getDate() + dir * 7);
  else if (tipo === 'mes')   d.setMonth(d.getMonth() + dir);
  else                       d.setFullYear(d.getFullYear() + dir);
  return d;
}

export function getPeriodLabel(anchor: Date, tipo: AgrupacionTipo): string {
  if (tipo === 'año') return String(anchor.getFullYear());
  if (tipo === 'mes') {
    const m = MESES[anchor.getMonth()];
    return `${m[0].toUpperCase()}${m.slice(1)} ${anchor.getFullYear()}`;
  }
  const { start, end } = getWeekBounds(anchor);
  const [,sm,sd] = start.split('-').map(Number);
  const [ey,em,ed] = end.split('-').map(Number);
  return `${sd} ${MESES[sm-1].slice(0,3)} – ${ed} ${MESES[em-1].slice(0,3)} ${ey}`;
}

export function filterByPeriod<T extends { fecha: string }>(items: T[], anchor: Date, tipo: AgrupacionTipo): T[] {
  if (tipo === 'año') {
    const prefix = String(anchor.getFullYear());
    return items.filter(it => it.fecha.startsWith(prefix));
  }
  if (tipo === 'mes') {
    const prefix = `${anchor.getFullYear()}-${String(anchor.getMonth()+1).padStart(2,'0')}`;
    return items.filter(it => it.fecha.startsWith(prefix));
  }
  const { start, end } = getWeekBounds(anchor);
  return items.filter(it => it.fecha >= start && it.fecha <= end);
}

/**
 * Un mismo producto puede venir repartido en varios lotes (varios "detalles" del backend,
 * cada uno con su propio loteId) — se agrupan por producto sumando cantidades para no
 * mostrarlo como si fueran productos distintos (ej. "Maíz ×3 · Maíz ×2" en vez de "Maíz ×5").
 */
export function agruparDetallesPorProducto(detalles: DetalleVenta[]): { nombre: string; cantidad: number }[] {
  return Object.values(
    detalles.reduce<Record<string, { nombre: string; cantidad: number }>>((acc, d) => {
      const key = d.producto?.id ?? d.producto?.nombre ?? '';
      if (!acc[key]) acc[key] = { nombre: d.producto?.nombre ?? '—', cantidad: 0 };
      acc[key].cantidad += Number(d.cantidad ?? 0);
      return acc;
    }, {}),
  );
}

export function buildChartData(
  ventas: { fecha: string; totalBs: string | number }[],
  gastos: { fecha: string; montoBs: string | number }[],
  anchor: Date,
  tipo: AgrupacionTipo,
): { label: string; ingresos: number; egresos: number }[] {
  if (tipo === 'semana') {
    const { start } = getWeekBounds(anchor);
    const [sy,sm,sd] = start.split('-').map(Number);
    return DIAS_SEM.map((label, i) => {
      const dt  = new Date(sy, sm-1, sd+i);
      const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
      return {
        label,
        ingresos: ventas.filter(v => v.fecha === key).reduce((s,v) => s + Number(v.totalBs), 0),
        egresos:  gastos.filter(g => g.fecha === key).reduce((s,g) => s + Number(g.montoBs), 0),
      };
    });
  }
  if (tipo === 'mes') {
    const prefix = `${anchor.getFullYear()}-${String(anchor.getMonth()+1).padStart(2,'0')}`;
    return ['Sem 1','Sem 2','Sem 3','Sem 4'].map((label, i) => {
      const d1 = i*7+1; const d2 = d1+6;
      return {
        label,
        ingresos: ventas.filter(v => v.fecha.startsWith(prefix) && +v.fecha.slice(8) >= d1 && +v.fecha.slice(8) <= d2).reduce((s,v) => s + Number(v.totalBs), 0),
        egresos:  gastos.filter(g => g.fecha.startsWith(prefix) && +g.fecha.slice(8) >= d1 && +g.fecha.slice(8) <= d2).reduce((s,g) => s + Number(g.montoBs), 0),
      };
    });
  }
  const year = anchor.getFullYear();
  return MESES_CORTO.map((label, i) => {
    const prefix = `${year}-${String(i+1).padStart(2,'0')}`;
    return {
      label,
      ingresos: ventas.filter(v => v.fecha.startsWith(prefix)).reduce((s,v) => s + Number(v.totalBs), 0),
      egresos:  gastos.filter(g => g.fecha.startsWith(prefix)).reduce((s,g) => s + Number(g.montoBs), 0),
    };
  });
}
