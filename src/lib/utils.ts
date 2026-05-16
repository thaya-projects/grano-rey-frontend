import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}
