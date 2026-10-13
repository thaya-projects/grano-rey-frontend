import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicEmpresa, getPublicProducto } from '@/lib/api/public';
import { formatBs } from '@/lib/utils';
import { ArrowLeft, Package } from 'lucide-react';
import { ProductGallery } from './_components/ProductGallery';
import { SiteFooter } from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

export default async function ProductoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [producto, empresa] = await Promise.all([
    getPublicProducto(id),
    getPublicEmpresa(),
  ]);

  if (!producto) notFound();

  const imagenes = producto.imagenes ?? [];
  const tel = empresa?.telefono ?? '';
  const nombre = empresa?.nombre ?? 'Grano Rey';
  const waNumber = '59168666330';

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease both; }
      `}</style>

      <div className="min-h-screen bg-gr-bg flex flex-col">

        {/* Navbar */}
        <header className="sticky top-0 z-50 bg-gr-primary-dark/95 backdrop-blur-md border-b border-white/10">
          <div className="max-w-6xl mx-auto px-5 h-14 flex items-center gap-4">
            <Link href="/catalogo"
              className="flex items-center gap-2 text-white/70 hover:text-white text-[13.5px] font-semibold transition-colors">
              <ArrowLeft size={16} /> Volver al catálogo
            </Link>
            <div className="flex-1" />
            <div className="relative w-32 h-9">
              <Image src="/logo-grano-rey.webp" alt={nombre} fill sizes="128px" className="object-contain" />
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-10 fade-up">

          {/* Breadcrumb */}
          <p className="text-[12.5px] text-gray-400 mb-6">
            <Link href="/" className="hover:text-gr-primary transition-colors">Inicio</Link>
            {' '}/{' '}
            <Link href="/catalogo" className="hover:text-gr-primary transition-colors">Catálogo</Link>
            {' '}/{' '}
            <span className="text-gray-600 font-semibold">{producto.nombre}</span>
          </p>

          <div className="grid md:grid-cols-2 gap-10 items-start">

            {/* Galería interactiva */}
            <ProductGallery imagenes={imagenes} nombre={producto.nombre} />

            {/* Info */}
            <div className="space-y-6">

              {/* Código + Nombre */}
              <div>
                <span className="inline-block font-mono text-[11px] font-bold text-gr-primary bg-gr-primary/10 px-3 py-1 rounded-full mb-3">
                  {producto.codigo}
                </span>
                <h1 className="text-[30px] md:text-[36px] font-black text-gray-900 leading-tight">{producto.nombre}</h1>
                {producto.descripcion && (
                  <p className="mt-3 text-[15px] text-gray-500 leading-relaxed">{producto.descripcion}</p>
                )}
              </div>

              {/* Precio + Presentación — mismo peso visual, ninguno domina sobre el producto */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Precio</p>
                  <p className="font-black text-[22px] text-gr-primary leading-none">
                    {producto.precio ? formatBs(Number(producto.precio)) : '—'}
                  </p>
                  {producto.unidad && (
                    <p className="text-[12px] text-gray-400 mt-1">por {producto.unidad.nombre}</p>
                  )}
                </div>
                {producto.unidad && (
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Package size={14} className="text-gr-primary" />
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Presentación</span>
                    </div>
                    <p className="font-black text-[20px] text-gray-800 leading-none">{producto.unidad.nombre}</p>
                  </div>
                )}
              </div>

              {/* CTA contacto */}
              <div className="pt-1 space-y-3">
                <p className="text-[13px] text-gray-500">¿Te interesa este producto? Contáctanos:</p>
                <div className="flex flex-wrap gap-2">
                  {waNumber && (
                    <a href={`https://wa.me/${waNumber}?text=Hola, me interesa el producto ${encodeURIComponent(producto.nombre)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#25d366] hover:bg-[#1ebe5d] text-white font-bold px-5 py-2.5 rounded-xl text-[14px] transition-colors shadow-sm">
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.858L.057 23.386a.75.75 0 0 0 .918.919l5.578-1.463A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.704 9.704 0 0 1-4.95-1.355l-.355-.21-3.676.964.981-3.584-.232-.369A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                      </svg>
                      Consultar por WhatsApp
                    </a>
                  )}
                  {tel && (
                    <a href={`tel:${tel.replace(/\s/g, '')}`}
                      className="inline-flex items-center gap-2 border border-gray-200 hover:border-gr-primary text-gray-600 hover:text-gr-primary font-semibold px-5 py-2.5 rounded-xl text-[14px] transition-colors bg-white shadow-sm">
                      Llamar
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        <SiteFooter nombre={nombre} />
      </div>
    </>
  );
}
