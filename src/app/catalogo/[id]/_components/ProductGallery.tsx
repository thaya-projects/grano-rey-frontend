'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Wheat } from 'lucide-react';

interface Imagen {
  id: string;
  url: string;
  esPrincipal: boolean;
  orden: number;
}

export function ProductGallery({ imagenes, nombre }: { imagenes: Imagen[]; nombre: string }) {
  const ordered = [...imagenes].sort((a, b) => {
    if (a.esPrincipal !== b.esPrincipal) return a.esPrincipal ? -1 : 1;
    return a.orden - b.orden;
  });
  const [current, setCurrent] = useState<Imagen | null>(ordered[0] ?? null);

  return (
    <div className="space-y-3">
      <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-[#edf5ed] to-[#dbeadb] relative shadow-md">
        {current ? (
          <Image src={current.url} alt={`Foto de ${nombre}`} fill priority
            sizes="(max-width: 768px) 100vw, 500px"
            className="object-cover transition-opacity duration-300" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <Wheat size={64} className="text-[#3C5A44]/15" />
            <span className="text-[12px] text-[#3C5A44]/30 font-semibold">Foto próximamente</span>
          </div>
        )}
      </div>

      {ordered.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {ordered.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setCurrent(img)}
              className={`relative w-[72px] h-[72px] rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                current?.id === img.id
                  ? 'border-[#3C5A44] shadow-md opacity-100'
                  : 'border-gray-200 hover:border-[#3C5A44]/50 opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={img.url} alt={`Miniatura ${i + 1} de ${nombre}`} fill sizes="72px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
