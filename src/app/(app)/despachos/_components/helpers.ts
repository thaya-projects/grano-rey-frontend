import { type NotaVenta, TipoFlete } from '@/lib/types';
import { formatBs } from '@/lib/utils';

/**
 * Desglose del total cuando el flete ya está sumado adentro (INCLUIDO_EN_VENTA),
 * para que la cuenta cierre visualmente y no se lea como "+ flete aparte".
 * `coincide` compara la suma calculada contra el totalBs que manda el backend —
 * si no coincide, es una inconsistencia real de datos, no solo de redacción.
 */
export function desgloseFleteIncluido(v: NotaVenta): { texto: string; coincide: boolean } | null {
  if (v.tipoFlete !== TipoFlete.INCLUIDO_EN_VENTA || Number(v.fleteBs) <= 0) return null;
  const subtotal = Number(v.subtotalBs);
  const flete = Number(v.fleteBs);
  const descuento = Number(v.descuentoBs) || 0;
  const suma = subtotal + flete - descuento;
  const partes = [`${formatBs(subtotal)} productos`, `${formatBs(flete)} flete`];
  if (descuento > 0) partes.push(`-${formatBs(descuento)} desc.`);
  const texto = `${partes.join(' + ').replace('+ -', '- ')} = ${formatBs(suma)}`;
  return { texto, coincide: Math.abs(suma - Number(v.totalBs)) < 0.01 };
}
