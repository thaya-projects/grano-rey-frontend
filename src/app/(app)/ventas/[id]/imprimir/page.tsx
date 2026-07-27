'use client';
import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useVenta } from '@/lib/api/ventas';
import { DocumentoVenta, type ModoDocumento } from '@/components/print/DocumentoVenta';
import { Spinner, Btn } from '@/components/ui';
import { ArrowLeft, Printer } from 'lucide-react';

const MODOS_VALIDOS: ModoDocumento[] = ['nota', 'proforma', 'combinada'];

const TITULOS: Record<ModoDocumento, string> = {
  nota:      'Nota de venta',
  proforma:  'Proforma (con datos del chofer)',
  combinada: 'Nota + Proforma para Grano Rey (uso interno)',
};

export default function ImprimirVentaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const modoRaw = (search.get('modo') ?? 'nota') as ModoDocumento;
  const modo: ModoDocumento = MODOS_VALIDOS.includes(modoRaw) ? modoRaw : 'nota';

  const ventaQ = useVenta(params?.id);
  const venta = ventaQ.data;

  useEffect(() => {
    if (venta && search.get('autoprint') === '1') {
      const t = setTimeout(() => window.print(), 300);
      return () => clearTimeout(t);
    }
  }, [venta, search]);

  if (ventaQ.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner size={28} color="var(--color-gr-primary)" />
      </div>
    );
  }
  if (!venta) {
    return <div className="text-center py-12 text-[var(--color-gr-muted)]">Venta no encontrada</div>;
  }

  return (
    <div className="space-y-4 print:space-y-0">
      <div className="no-print flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Btn variant="ghost" onClick={() => router.back()}>
            <ArrowLeft size={14} /> Volver
          </Btn>
          <div>
            <h1 className="text-[18px] font-900 text-[var(--color-gr-text)]">{TITULOS[modo]}</h1>
            <p className="text-[12.5px] text-[var(--color-gr-muted)]">NV-{venta.numeroNota} · {venta.cliente?.nombre}</p>
          </div>
        </div>
        <Btn onClick={() => window.print()}><Printer size={14} /> Imprimir</Btn>
      </div>

      <div className="print-only-target max-w-[800px] mx-auto">
        <DocumentoVenta venta={venta} modo={modo} />
      </div>
    </div>
  );
}
