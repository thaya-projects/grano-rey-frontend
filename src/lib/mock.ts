// Type-only definitions retained for the legacy PDF report components.
// Data is consumed from the API; the reportes page adapts API entities to these shapes.

export interface Producto {
  id: string; codigo: string; nombre: string;
  factorABase: number; tipo?: string | null;
  precioUnitarioBs: number; stockActual: number; stockMinimo: number;
}

export interface MateriaPrimaStock {
  id: string; nombre: string; unidad: string;
  stockEntero?: number; stockParChico?: number; stockParGrande?: number;
  stockTotal: number; stockMinimo: number;
}

export type EstadoVenta = 'pendiente' | 'despachado' | 'entregado' | 'cancelado'
  | 'despachada' | 'entregada' | 'cancelada';

export interface DetalleVentaLegacy {
  productoNombre: string;
  cantidad: number;
}

export interface Venta {
  id: string;
  numero: number;
  fecha: string;
  clienteNombre: string;
  totalBs: number;
  estado: EstadoVenta;
  detalles: DetalleVentaLegacy[];
}

export type TipoMovimientoMP = 'ingreso' | 'salida' | 'merma' | 'desecho' | 'ajuste' | 'devolucion';

export interface MovimientoMP {
  id: string;
  fecha: string;
  mpNombre: string;
  tipo: TipoMovimientoMP;
  totalQQ: number;
  costoBs?: number | null;
  lote?: number | null;
  responsable: string;
}
