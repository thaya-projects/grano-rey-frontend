import { TipoFlete, type LoteProduccion } from '@/lib/types';

export type Step = 0 | 1 | 2;

export interface LineaDetalle {
  key: string;
  productoId: string;
  cantidad: number;
  precioUnitario: string;
}

export interface LoteAsignado {
  lote: LoteProduccion;
  cantidad: number;
}

export interface DetalleUI {
  key: string;
  productoId: string;
  productoNombre: string;
  cantidad: number;
  unidadId: string;
  unidadLabel: string;
  precioUnitario: number;
  lotes: LoteAsignado[];
  loteFaltante: number;
  totalBs: number;
  stockInsuf: boolean;
}

export const FLETE_OPCIONES = [
  { value: TipoFlete.SIN_FLETE,            label: 'Retira en planta',      desc: 'El cliente viene a buscar'          },
  { value: TipoFlete.CLIENTE_PAGA_DIRECTO, label: 'Cliente paga flete',    desc: 'Paga directo al transportista'      },
  { value: TipoFlete.INCLUIDO_EN_VENTA,    label: 'Flete en la venta',     desc: 'Se suma al total'                   },
  { value: TipoFlete.GRANO_REY_PAGA,       label: 'Grano Rey paga',        desc: 'La empresa asume el costo'          },
] as const;
