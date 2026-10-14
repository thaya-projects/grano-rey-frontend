import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gr-bg flex flex-col items-center justify-center px-5 text-center">
      <div className="relative w-36 h-11 mb-8">
        <Image src="/logo-grano-rey.webp" alt="Grano Rey" fill sizes="144px" className="object-contain" priority />
      </div>

      <p className="text-gr-primary font-800 text-[13px] uppercase tracking-[0.15em] mb-2">Error 404</p>
      <h1 className="font-black text-[32px] md:text-[42px] text-gray-900 mb-3">Página no encontrada</h1>
      <p className="text-gray-500 text-[15px] max-w-md mb-8">
        No encontramos lo que buscabas. Puede que el producto ya no esté disponible o que el enlace esté roto.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/catalogo"
          className="inline-flex items-center gap-2 bg-gr-primary hover:bg-gr-primary-dark text-white font-700 px-6 py-3 rounded-xl text-[14px] transition-colors">
          Ver catálogo <ArrowRight size={15} />
        </Link>
        <Link href="/"
          className="inline-flex items-center gap-2 border border-gray-200 hover:border-gr-primary text-gray-600 hover:text-gr-primary font-600 px-6 py-3 rounded-xl text-[14px] transition-colors bg-white">
          <Home size={15} /> Ir al inicio
        </Link>
      </div>
    </div>
  );
}
