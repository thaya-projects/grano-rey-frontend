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

const CODIGO_STOPWORDS = new Set(['DE', 'DEL', 'LA', 'LAS', 'LOS', 'EL', 'Y', 'E', 'A', 'EN', 'CON', 'POR', 'UN', 'UNA']);

/** Sugiere un código corto (ej. "MBL-BL") a partir de un nombre, evitando colisiones con `existentes`. */
export function sugerirCodigo(nombre: string, existentes: Set<string>): string {
  const palabras = nombre
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '')
    .split(/\s+/)
    .filter(p => p.length > 0 && !CODIGO_STOPWORDS.has(p));

  if (palabras.length === 0) return '';

  let base: string;
  if (palabras.length === 1) {
    base = palabras[0].slice(0, 4);
  } else {
    const ultima = palabras[palabras.length - 1];
    const prefijo = palabras[0].slice(0, 1)
      + palabras.slice(1).map(p => p.slice(0, 2)).join('');
    const sufijo = ultima.slice(0, 2);
    base = `${prefijo}-${sufijo}`;
  }

  if (!existentes.has(base)) return base;
  for (let i = 2; i <= 99; i++) {
    const c = `${base}-${i}`;
    if (!existentes.has(c)) return c;
  }
  return base;
}

// ── Monto en letras (para "SON: ... BOLIVIANOS" en documentos impresos) ──

const UNIDADES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const DECENAS = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const DECENAS_DESDE_20 = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function numeroALetras(n: number): string {
  if (n === 0) return 'cero';
  if (n < 10) return UNIDADES[n];
  if (n < 20) return DECENAS[n - 10];
  if (n < 100) {
    const resto = n % 10;
    return DECENAS_DESDE_20[Math.floor(n / 10)] + (resto > 0 ? ` y ${UNIDADES[resto]}` : '');
  }
  if (n < 1000) {
    if (n === 100) return 'cien';
    const resto = n % 100;
    return CENTENAS[Math.floor(n / 100)] + (resto > 0 ? ` ${numeroALetras(resto)}` : '');
  }
  if (n < 1000000) {
    const miles = Math.floor(n / 1000);
    const resto = n % 1000;
    const prefijoMiles = miles === 1 ? 'mil' : `${numeroALetras(miles)} mil`;
    return prefijoMiles + (resto > 0 ? ` ${numeroALetras(resto)}` : '');
  }
  const millones = Math.floor(n / 1000000);
  const resto = n % 1000000;
  const prefijoMillones = millones === 1 ? 'un millón' : `${numeroALetras(millones)} millones`;
  return prefijoMillones + (resto > 0 ? ` ${numeroALetras(resto)}` : '');
}

/** Monto en Bs → "SON: TRES MIL CINCUENTA 00/100 BOLIVIANOS". */
export function montoEnLetras(monto: number): string {
  const entero = Math.floor(monto);
  const centavos = Math.round((monto - entero) * 100);
  const letras = numeroALetras(entero).toUpperCase();
  return `${letras} ${String(centavos).padStart(2, '0')}/100 BOLIVIANOS`;
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

/**
 * Genera una contraseña aleatoria válida para el backend (regla única: mínimo 6 caracteres,
 * sin restricciones de mayúsculas/números/símbolos — @MinLength(6), bcrypt al guardar).
 * 8 caracteres, sin ambiguos (0/O, 1/l/I), mezcla letras y números para que sea fácil de leer/dictar.
 */
export function generarPassword(length = 8): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}
