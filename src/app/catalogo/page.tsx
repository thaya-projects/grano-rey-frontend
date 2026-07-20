import Image from 'next/image';
import Link from 'next/link';
import { getPublicEmpresa, getPublicProductos } from '@/lib/api/public';
import { formatBs } from '@/lib/utils';
import { Wheat, ArrowRight, ChevronLeft } from 'lucide-react';
import { SiteFooter } from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

export default async function CatalogoPage() {
  const [empresa, productos] = await Promise.all([
    getPublicEmpresa(),
    getPublicProductos(),
  ]);

  const nombre = empresa?.nombre ?? 'Grano Rey';

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.45s ease both; }
        .card-lift { transition: transform 0.22s ease, box-shadow 0.22s ease; }
        .card-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(46,68,52,0.13); }
        .img-zoom img { transition: transform 0.45s ease; }
        .img-zoom:hover img { transform: scale(1.07); }
      `}</style>

      {/* flex col + min-h-screen = footer siempre al fondo */}
      <div className="min-h-screen bg-gr-bg flex flex-col">

        {/* ── Navbar ── */}
        <header className="sticky top-0 z-50 bg-gr-primary-dark/95 backdrop-blur-md border-b border-white/10">
          <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
            <Link href="/"
              className="flex items-center gap-1.5 text-white/65 hover:text-white text-[13px] font-semibold transition-colors">
              <ChevronLeft size={16} strokeWidth={2.5} /> Inicio
            </Link>
            <div className="relative w-32 h-9">
              <Image src="/logo-grano-rey.webp" alt={nombre} fill sizes="128px" className="object-contain" priority />
            </div>
            <Link href="/login"
              className="text-[12.5px] font-bold bg-[#c8a84b] hover:bg-[#b8963e] text-[#1a0e00] px-3.5 py-1.5 rounded-lg transition-colors">
              Ingresar
            </Link>
          </div>
        </header>

        {/* ── Encabezado de sección ── */}
        <div className="bg-gr-primary-dark">
          <div className="max-w-6xl mx-auto px-5 py-8">
            <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.18em] mb-1.5">Catálogo</p>
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-white font-black text-[24px] md:text-[30px]">Todos nuestros productos</h1>
              {productos.length > 0 && (
                <span className="shrink-0 bg-white/10 text-white/60 text-[12px] font-semibold px-3 py-1 rounded-full">
                  {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Grid ── */}
        <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-8 fade-up">
          {productos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-gray-400">
              <Wheat size={44} className="mb-4 opacity-25" />
              <p className="font-semibold text-[15px]">Catálogo en actualización</p>
              <p className="text-[13px] mt-1 text-gray-400">Vuelve pronto para ver nuestros productos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {productos.map((p, i) => (
                <Link key={p.id} href={`/catalogo/${p.id}`}
                  className="card-lift bg-white rounded-xl border border-gr-border-lite shadow-sm overflow-hidden group block"
                  style={{ animationDelay: `${Math.min(i * 40, 300)}ms` }}>

                  <div className="img-zoom h-36 relative overflow-hidden bg-linear-to-br from-[#edf5ed] to-[#dbeadb]">
                    {p.fotoPrincipal ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.fotoPrincipal} alt={p.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Wheat size={28} className="text-gr-primary opacity-20" />
                      </div>
                    )}
                    <span className="absolute top-2 left-2 bg-white/95 text-gr-primary font-bold text-[9px] px-2 py-0.5 rounded-full font-mono shadow-sm tracking-wide">
                      {p.codigo}
                    </span>
                  </div>

                  <div className="p-3">
                    <h3 className="font-semibold text-[13px] text-gr-text group-hover:text-gr-primary transition-colors line-clamp-1 mb-2">
                      {p.nombre}
                    </h3>
                    <div className="flex items-center justify-between pt-2 border-t border-gr-border-lite">
                      <span className="font-bold text-[13px] text-gr-primary">
                        {p.precioUnitarioBs ? formatBs(Number(p.precioUnitarioBs)) : '—'}
                      </span>
                      <span className="text-[11px] text-gr-muted flex items-center gap-0.5 group-hover:text-gr-primary group-hover:gap-1.5 transition-all">
                        Ver <ArrowRight size={11} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>

        <SiteFooter nombre={nombre} />
      </div>
    </>
  );
}
