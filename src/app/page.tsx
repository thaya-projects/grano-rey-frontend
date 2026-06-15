import Image from 'next/image';
import Link from 'next/link';
import { getPublicEmpresa, getPublicProductos } from '@/lib/api/public';
import { formatBs } from '@/lib/utils';
import { ShieldCheck, Wheat, Truck, ArrowRight, MapPin, Phone } from 'lucide-react';
import { SiteFooter } from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const [empresa, productos] = await Promise.all([
    getPublicEmpresa(),
    getPublicProductos(),
  ]);

  const preview = productos.slice(0, 4);

  const tel    = empresa?.telefono ?? '+591 76012345';
  const ciudad = empresa?.ciudad   ?? 'Monteagudo, Chuquisaca';
  const nombre = empresa?.nombre   ?? 'Grano Rey';

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-18px) rotate(3deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-12px) rotate(-2deg); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .float-1 { animation: float  6s ease-in-out infinite; }
        .float-2 { animation: float2 8s ease-in-out infinite; }
        .float-3 { animation: float  5s ease-in-out infinite 1s; }
        .fade-up-1 { animation: fadeUp 0.7s ease both 0.1s; }
        .fade-up-2 { animation: fadeUp 0.7s ease both 0.25s; }
        .fade-up-3 { animation: fadeUp 0.7s ease both 0.4s; }
        .fade-up-4 { animation: fadeUp 0.7s ease both 0.55s; }
        .shimmer-text {
          background: linear-gradient(90deg, #c8a84b 0%, #f5d98a 40%, #c8a84b 60%, #f5d98a 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        .card-hover {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.12);
        }
        .img-zoom img {
          transition: transform 0.6s ease;
        }
        .img-zoom:hover img {
          transform: scale(1.08);
        }
        .pulse-ring::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid #c8a84b;
          animation: pulse-ring 2s ease-out infinite;
        }
      `}</style>

      <div className="min-h-screen bg-white overflow-x-hidden">

        {/* ── Navbar ─────────────────────────────────────────── */}
        <header className="fixed top-0 inset-x-0 z-50 bg-gr-primary-dark/90 backdrop-blur-md border-b border-white/10">
          <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
            <div className="relative w-28 h-9">
              <Image src="/logo-grano-rey.webp" alt={nombre} fill sizes="112px" className="object-contain" priority />
            </div>
            <nav className="hidden md:flex items-center gap-6 text-[13.5px] font-600 text-white/60">
              <a href="#productos" className="hover:text-white transition-colors">Productos</a>
              <a href="#proceso"   className="hover:text-white transition-colors">Proceso</a>
              <a href="#nosotros"  className="hover:text-white transition-colors">Nosotros</a>
            </nav>
            <Link href="/login"
              className="text-[13px] font-700 bg-[#c8a84b] hover:bg-[#b8963e] text-[#1a0e00] px-4 py-2 rounded-lg transition-colors">
              Ingresar al sistema
            </Link>
          </div>
        </header>

        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="relative min-h-screen flex items-center bg-gr-primary-dark overflow-hidden pt-16">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, #c8a84b 0%, transparent 70%)' }} />
            <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #567A5F 0%, transparent 70%)' }} />
          </div>
          <div className="absolute right-8 top-24 opacity-10 float-1 hidden lg:block">
            <Wheat size={120} className="text-white" />
          </div>
          <div className="absolute right-32 bottom-32 opacity-8 float-2 hidden lg:block">
            <Wheat size={60} className="text-[#c8a84b]" />
          </div>
          <div className="absolute left-8 bottom-20 opacity-6 float-3 hidden lg:block">
            <Wheat size={44} className="text-white" />
          </div>

          <div className="max-w-6xl mx-auto px-5 py-24 relative w-full">
            <div className="max-w-3xl">
              <div className="fade-up-1 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 bg-[#c8a84b] rounded-full relative pulse-ring" />
                <span className="text-white/70 text-[12.5px] font-600 tracking-wide">{ciudad} · Bolivia</span>
              </div>

              <h1 className="fade-up-2 text-white font-900 text-[42px] md:text-[62px] leading-[1.05] mb-6">
                Alimentos listos<br />
                para cocinar.<br />
                <span className="shimmer-text">Hechos en Bolivia.</span>
              </h1>

              <p className="fade-up-3 text-white/55 text-[16px] md:text-[18px] leading-relaxed mb-10 max-w-xl">
                Harinas y granos precocidos de altísima calidad — ya pasaron por el primer proceso
                de cocción, así que en tu hogar o negocio se preparan en menos tiempo y con
                resultados siempre perfectos.
              </p>

              <div className="fade-up-4 flex flex-wrap gap-3">
                <Link href="/catalogo"
                  className="group flex items-center gap-2 bg-[#c8a84b] hover:bg-[#b8963e] text-[#1a0e00] font-800 px-6 py-3.5 rounded-xl text-[15px] transition-all hover:gap-3">
                  Ver catálogo <ArrowRight size={16} className="transition-all" />
                </Link>
                <a href="#proceso"
                  className="flex items-center gap-2 border border-white/20 hover:border-white/50 hover:bg-white/5 text-white/80 hover:text-white font-600 px-6 py-3.5 rounded-xl text-[15px] transition-all">
                  ¿Qué es precocido?
                </a>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 inset-x-0">
            <svg viewBox="0 0 1440 80" className="w-full" preserveAspectRatio="none" style={{ display: 'block' }}>
              <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="white" />
            </svg>
          </div>
        </section>

        {/* ── Qué es precocido ────────────────────────────────── */}
        <section id="proceso" className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-5">
            <div className="text-center mb-10">
              <p className="text-gr-primary font-700 text-[12px] uppercase tracking-[0.15em] mb-2">Cómo funciona</p>
              <h2 className="text-[28px] md:text-[36px] font-900 text-gray-900">¿Qué significa <span className="text-gr-primary">precocido</span>?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { n: '01', title: 'Selección del grano', desc: 'Elegimos los mejores granos bolivianos, limpios y sin impurezas, directamente de productores locales de confianza.' },
                { n: '02', title: 'Primer cocido industrial', desc: 'El grano pasa por un proceso controlado de cocción parcial que rompe la estructura del almidón. Así tú solo terminas de cocinarlo.' },
                { n: '03', title: 'Listo en tu mesa', desc: 'En tu hogar o negocio se prepara en menos tiempo, con menos energía y siempre con la misma textura y sabor perfectos.' },
              ].map(s => (
                <div key={s.n} className="card-hover relative bg-linear-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <span className="text-[48px] font-900 text-gr-primary/10 leading-none block mb-3">{s.n}</span>
                  <h3 className="font-800 text-[16px] text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-[13.5px] text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Sellos de calidad ───────────────────────────────── */}
        <section className="py-10 bg-[#f7faf7]">
          <div className="max-w-6xl mx-auto px-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: <ShieldCheck size={20} />, color: '#3C5A44', title: 'Certificado SENASAG', desc: 'NB 314001 · R.A. 042/2023 — Registro sanitario oficial boliviano' },
                { icon: <Wheat size={20} />,       color: '#c8a84b', title: '100% origen boliviano', desc: 'Granos seleccionados de agricultores de Monteagudo y la región' },
                { icon: <Truck size={20} />,       color: '#3C5A44', title: 'Distribución nacional', desc: 'Entregamos en todo el país con trazabilidad de cada lote' },
              ].map(b => (
                <div key={b.title} className="card-hover flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: b.color + '18', color: b.color }}>
                    {b.icon}
                  </div>
                  <div>
                    <p className="font-700 text-[14px] text-gray-800">{b.title}</p>
                    <p className="text-[12.5px] text-gray-500 mt-0.5 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Productos ──────────────────────────────────────── */}
        <section id="productos" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-5">
            <div className="mb-10">
              <p className="text-gr-primary font-700 text-[12px] uppercase tracking-[0.15em] mb-2">Catálogo</p>
              <h2 className="text-[28px] md:text-[36px] font-900 text-gray-900">Nuestros productos</h2>
            </div>

            {preview.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Wheat size={40} className="mx-auto mb-4 opacity-30" />
                <p className="font-600">Catálogo en actualización</p>
                <p className="text-[13px] mt-1">Vuelve pronto para ver nuestros productos.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {preview.map(p => (
                    <Link key={p.id} href={`/catalogo/${p.id}`}
                      className="card-hover bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group block">
                      <div className="img-zoom h-36 relative overflow-hidden bg-linear-to-br from-[#edf5ed] to-[#dbeadb]">
                        {p.fotoPrincipal ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.fotoPrincipal} alt={p.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Wheat size={32} className="text-gr-primary/20" />
                          </div>
                        )}
                        <span className="absolute top-2 left-2 bg-white/95 text-gr-primary font-700 text-[9px] px-2 py-0.5 rounded-full font-mono shadow-sm">
                          {p.codigo}
                        </span>
                      </div>

                      <div className="p-3">
                        <h3 className="font-700 text-[13px] text-gray-900 mb-0.5 group-hover:text-gr-primary transition-colors line-clamp-1">
                          {p.nombre}
                        </h3>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                          <span className="font-800 text-[13px] text-gr-primary">{formatBs(Number(p.precioUnitarioBs))}</span>
                          <span className="text-[11px] font-600 text-gray-400 flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                            Ver <ArrowRight size={11} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {productos.length > 4 && (
                  <div className="text-center mt-8">
                    <Link href="/catalogo"
                      className="inline-flex items-center gap-2 border-2 border-gr-primary text-gr-primary hover:bg-gr-primary hover:text-white font-700 px-6 py-2.5 rounded-xl text-[13.5px] transition-all">
                      Ver todos los productos <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ── Nosotros ───────────────────────────────────────── */}
        <section id="nosotros" className="py-20 bg-gr-primary-dark relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-5"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #c8a84b 0%, transparent 50%), radial-gradient(circle at 80% 20%, #567A5F 0%, transparent 50%)' }} />

          <div className="max-w-6xl mx-auto px-5 relative">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-[#c8a84b] font-700 text-[12px] uppercase tracking-[0.15em] mb-4">Quiénes somos</p>
                <h2 className="text-white font-900 text-[30px] md:text-[40px] leading-tight mb-6">
                  Alimentos bolivianos<br />
                  <span className="text-[#c8a84b]">con sello de calidad.</span>
                </h2>
                <p className="text-white/60 text-[15px] leading-relaxed mb-4">
                  Nacimos en {ciudad} — tierra fértil de Bolivia — con una misión clara:
                  ofrecer alimentos precocidos de alta calidad que faciliten la vida de las familias
                  bolivianas y potencien los negocios de nuestros distribuidores.
                </p>
                <p className="text-white/50 text-[14px] leading-relaxed mb-8">
                  Cada producto que sale de nuestra planta lleva el registro sanitario SENASAG y pasa
                  por estrictos controles de inocuidad. Tu confianza es nuestra mayor certificación.
                </p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-[#c8a84b] shrink-0" />
                    <span className="text-white/60 text-[14px]">{empresa?.direccion ?? ciudad}, Bolivia</span>
                  </div>
                  {empresa?.telefono && (
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-[#c8a84b] shrink-0" />
                      <span className="text-white/60 text-[14px]">{empresa.telefono}</span>
                    </div>
                  )}
                  {empresa?.email && (
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#c8a84b" strokeWidth="2" className="shrink-0">
                        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                      </svg>
                      <span className="text-white/60 text-[14px]">{empresa.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { val: 'SENASAG', sub: 'Certificación', desc: 'Registro sanitario oficial' },
                  { val: '100%',    sub: 'Boliviano',     desc: 'Materia prima local' },
                  { val: '<30min',  sub: 'Preparación',   desc: 'Rápido en tu cocina' },
                  { val: 'Nac.',    sub: 'Distribución',  desc: 'Llegamos a todo el país' },
                ].map(s => (
                  <div key={s.sub}
                    className="card-hover bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-5 text-center transition-colors">
                    <p className="shimmer-text font-900 text-[28px] leading-none mb-1">{s.val}</p>
                    <p className="text-white font-700 text-[13px]">{s.sub}</p>
                    <p className="text-white/40 text-[11px] mt-1">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA final ──────────────────────────────────────── */}
        <section className="py-16 bg-[#c8a84b] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 21px)' }} />
          <div className="max-w-2xl mx-auto px-5 text-center relative">
            <h2 className="font-900 text-[28px] md:text-[36px] text-[#1a0e00] mb-4">
              ¿Te interesan<br />nuestros productos?
            </h2>
            <p className="text-[#1a0e00]/60 text-[15px] mb-8">
              Ponte en contacto con nosotros.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {tel && (
                <a href={`tel:${tel.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-2 bg-gr-primary-dark hover:bg-[#243a2b] text-white font-800 px-6 py-3.5 rounded-xl text-[14px] transition-colors shadow-lg">
                  <Phone size={15} /> Llámanos
                </a>
              )}
              {tel && (
                <a href={`https://wa.me/${tel.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25d366] hover:bg-[#1ebe5d] text-white font-800 px-6 py-3.5 rounded-xl text-[14px] transition-colors shadow-lg">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.858L.057 23.386a.75.75 0 0 0 .918.919l5.578-1.463A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.704 9.704 0 0 1-4.95-1.355l-.355-.21-3.676.964.981-3.584-.232-.369A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>

        <SiteFooter nombre={nombre} ciudad={ciudad} />

      </div>
    </>
  );
}
