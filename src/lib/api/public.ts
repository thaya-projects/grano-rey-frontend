import axios from 'axios';

export interface PublicEmpresa {
  id: string;
  nombre: string;
  rubro?: string | null;
  nit?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  logoUrl?: string | null;
}

export interface PublicUnidad {
  nombre: string;
  abreviatura: string;
  factorABase: number;
}

export interface PublicProducto {
  id: string;
  codigo: string;
  nombre: string;
  fotoPrincipal?: string | null;
  precio?: string | null;
  unidad?: PublicUnidad | null;
}

export interface PublicImagen {
  id: string;
  url: string;
  esPrincipal: boolean;
  orden: number;
}

export interface PublicProductoDetalle extends PublicProducto {
  descripcion?: string | null;
  imagenes: PublicImagen[];
}

async function publicGet<T>(path: string): Promise<T | null> {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001/api/v1').replace(/\/+$/, '');
  const apiKey = process.env.PUBLIC_API_KEY ?? '';
  const url = `${baseUrl}${path}`;
  try {
    const res = await axios.get<T>(url, {
      headers: { 'x-api-key': apiKey },
    });
    return res.data;
  } catch (err) {
    console.error(`[public API] error → ${url} | key length: ${apiKey.length}`, err);
    return null;
  }
}

export async function getPublicEmpresa(): Promise<PublicEmpresa | null> {
  return publicGet<PublicEmpresa>('/public/empresa');
}

export async function getPublicProductos(): Promise<PublicProducto[]> {
  return (await publicGet<PublicProducto[]>('/public/productos')) ?? [];
}

export async function getPublicProducto(id: string): Promise<PublicProductoDetalle | null> {
  return publicGet<PublicProductoDetalle>(`/public/productos/${id}`);
}
