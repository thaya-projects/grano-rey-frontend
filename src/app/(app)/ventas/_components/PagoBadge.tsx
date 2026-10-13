import { EstadoPagoVenta } from '@/lib/types';
import { Badge } from '@/components/ui';
import { CheckCircle, Banknote } from 'lucide-react';

export const METODO_LABEL: Record<string, string> = {
  efectivo:      'Efectivo',
  qr:            'QR',
  transferencia: 'Transferencia',
};

export function PagoBadge({ estado, metodo }: { estado: EstadoPagoVenta; metodo?: string | null }) {
  if (estado === EstadoPagoVenta.COBRADO) {
    return (
      <Badge color="green" className="gap-1">
        <CheckCircle size={10} /> {metodo ? METODO_LABEL[metodo] ?? metodo : 'Cobrado'}
      </Badge>
    );
  }
  return (
    <Badge color="yellow" className="gap-1">
      <Banknote size={10} /> Por cobrar
    </Badge>
  );
}
