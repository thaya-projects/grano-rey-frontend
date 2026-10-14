import type { MetadataRoute } from 'next';
import { getPublicProductos } from '@/lib/api/public';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://grano-rey.thaya.app';
  const productos = await getPublicProductos();

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'monthly', priority: 1.0 },
    { url: `${base}/catalogo`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    ...productos.map(p => ({
      url: `${base}/catalogo/${p.id}`,
      // La API pública no devuelve fecha de actualización por producto (ver reporte del Bloque G) —
      // se usa la fecha de build como aproximación hasta que el backend la exponga.
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
