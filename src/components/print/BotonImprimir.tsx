'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Printer } from 'lucide-react';
import { Modal, Btn } from '@/components/ui';

const MODO_DOBLE = { nota: 'nota-doble', proforma: 'remision-doble' } as const;

/**
 * Botón de imprimir que, antes de navegar, pregunta si se quiere una sola
 * copia o doble (copia cliente + copia Grano Rey) — así no hace falta un
 * botón aparte por cada combinación.
 */
export function BotonImprimir({
  ventaId, tipo, className,
}: { ventaId: string; tipo: 'nota' | 'proforma'; className: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const label = tipo === 'nota' ? 'nota de venta' : 'proforma';

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <Printer size={14} /> {tipo === 'nota' ? 'Nota' : 'Proforma'}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Imprimir ${label}`}
        footer={<>
          <Btn variant="ghost" onClick={() => router.push(`/ventas/${ventaId}/imprimir?modo=${tipo}`)}>
            Una sola
          </Btn>
          <Btn variant="primary" onClick={() => router.push(`/ventas/${ventaId}/imprimir?modo=${MODO_DOBLE[tipo]}`)}>
            Sí, doble
          </Btn>
        </>}>
        <p className="text-[14px] text-gr-sub">
          ¿Quieres {label} doble (copia cliente + copia Grano Rey) o solo una?
        </p>
      </Modal>
    </>
  );
}
