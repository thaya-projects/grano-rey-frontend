import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TipoUnidad } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBs(n: number): string {
  return `Bs ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatNum(n: number, decimals = 0): string {
  return n.toLocaleString('es-BO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function toNum(v: string | number | undefined | null): number {
  return parseFloat(String(v ?? 0)) || 0;
}

// ── Conversiones de unidades ──────────────────────────────────

export const KG_POR_QQ = 46;

/** kg → QQ. Solo para materia prima (siempre en kg). */
export function kgToQQ(kg: number): number {
  return kg / KG_POR_QQ;
}

/**
 * Stock de producto en unidades → equivalente en base (QQ o litros).
 * PESO:    stock × factorABase = kg → / 46 = QQ
 * VOLUMEN: stock × factorABase = litros
 * UNIDAD:  stock × factorABase = unidades
 */
export function equivPT(
  stock: number,
  factorABase: number | string | null | undefined,
  tipo: string | null | undefined,
): number {
  const base = stock * (Number(factorABase) || 0);
  return (tipo ?? '') === TipoUnidad.PESO ? base / KG_POR_QQ : base;
}

/** Etiqueta del equivalente según el tipo de unidad. */
export function equivLabel(tipo: string | null | undefined): string {
  if ((tipo ?? '') === TipoUnidad.VOLUMEN) return 'L';
  if ((tipo ?? '') === TipoUnidad.PESO)    return 'QQ';
  return '';
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}
