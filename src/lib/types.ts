// ─── Enums (espejados del backend) ───────────────────────────

export const RolUsuario = {
  ADMINISTRADORA: 'administradora',
  ALMACENERO: 'almacenero',
  VENDEDOR: 'vendedor',
  PRODUCCION: 'produccion',
} as const;
export type RolUsuario = (typeof RolUsuario)[keyof typeof RolUsuario];

export const TipoUnidad = {
  PESO: 'peso',
  VOLUMEN: 'volumen',
  UNIDAD: 'unidad',
} as const;
export type TipoUnidad = (typeof TipoUnidad)[keyof typeof TipoUnidad];

export const TipoMovimientoMP = {
  INGRESO:    'ingreso',
  SALIDA:     'salida',
  MERMA:      'merma',
  DESECHO:    'desecho',
  AJUSTE:     'ajuste',
  DEVOLUCION: 'devolucion',
} as const;
export type TipoMovimientoMP = (typeof TipoMovimientoMP)[keyof typeof TipoMovimientoMP];

export const TipoMovimientoPT = {
  INGRESO: 'ingreso',
  SALIDA: 'salida',
  AJUSTE: 'ajuste',
} as const;
export type TipoMovimientoPT = (typeof TipoMovimientoPT)[keyof typeof TipoMovimientoPT];

export const EstadoVenta = {
  PENDIENTE: 'pendiente',
  DESPACHADA: 'despachada',
  ENTREGADA: 'entregada',
  CANCELADA: 'cancelada',
} as const;
export type EstadoVenta = (typeof EstadoVenta)[keyof typeof EstadoVenta];

export const TipoFlete = {
  SIN_FLETE: 'sin_flete',
  CLIENTE_PAGA_DIRECTO: 'cliente_paga_directo',
  INCLUIDO_EN_VENTA: 'incluido_en_venta',
  GRANO_REY_PAGA: 'grano_rey_paga',
} as const;
export type TipoFlete = (typeof TipoFlete)[keyof typeof TipoFlete];

export const EstadoRemision = {
  PENDIENTE: 'pendiente',
  DESPACHADO: 'despachado',
  ENTREGADO: 'entregado',
} as const;
export type EstadoRemision = (typeof EstadoRemision)[keyof typeof EstadoRemision];

export const EstadoPagoVenta = {
  PENDIENTE: 'pendiente',
  COBRADO:   'cobrado',
} as const;
export type EstadoPagoVenta = (typeof EstadoPagoVenta)[keyof typeof EstadoPagoVenta];

export const MetodoPago = {
  EFECTIVO:      'efectivo',
  QR:            'qr',
  TRANSFERENCIA: 'transferencia',
} as const;
export type MetodoPago = (typeof MetodoPago)[keyof typeof MetodoPago];

export const EstadoPagoMP = {
  PENDIENTE: 'pendiente',
  PAGADO:    'pagado',
} as const;
export type EstadoPagoMP = (typeof EstadoPagoMP)[keyof typeof EstadoPagoMP];

export const CategoriaGasto = {
  TRANSPORTE:        'transporte',
  SERVICIOS_BASICOS: 'servicios_basicos',
  MANO_DE_OBRA:      'mano_de_obra',
  MANTENIMIENTO:     'mantenimiento',
  MATERIA_PRIMA:     'materia_prima',
  ADMINISTRATIVO:    'administrativo',
  IMPUESTOS:         'impuestos',
  OTROS:             'otros',
} as const;
export type CategoriaGasto = (typeof CategoriaGasto)[keyof typeof CategoriaGasto];

// ─── Entidades base ──────────────────────────────────────────

export interface AuditFields {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Usuario extends AuditFields {
  nombre: string;
  email: string;
  rol: RolUsuario;
  telefono?: string | null;
  activo: boolean;
  ultimoAcceso?: string | null;
}

export interface Empresa {
  id: string;
  nombre: string;
  rubro?: string | null;
  nit?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  logoUrl?: string | null;
  plan: 'basico' | 'profesional' | 'enterprise';
  configuracion: { registroSanitario?: string; [k: string]: unknown };
  activo: boolean;
}

export interface UnidadMedida extends AuditFields {
  codigo: string;
  nombre: string;
  abreviatura?: string | null;
  tipo: TipoUnidad;
  factorABase: number;
}

export interface CategoriaMP extends AuditFields {
  nombre: string;
  descripcion?: string | null;
  tieneSubtipos: boolean;
}

export interface SubtipoMP extends AuditFields {
  nombre: string;
  descripcion?: string | null;
  categoria?: CategoriaMP;
}

export interface Cliente extends AuditFields {
  nombre: string;
  telefono?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  nit?: string | null;
}

export interface Proveedor extends AuditFields {
  nombre: string;
  contacto?: string | null;
  telefono?: string | null;
  ciudad?: string | null;
  nit?: string | null;
}

export interface Transportista extends AuditFields {
  nombre: string;
  ci?: string | null;
  empresa?: string | null;
  telefono?: string | null;
  placa?: string | null;
  marca?: string | null;
  color?: string | null;
  destinoHabitual?: string | null;
}

export interface Cargador extends AuditFields {
  nombre: string;
  ci?: string | null;
  telefono?: string | null;
  activo: boolean;
}

/** Enum numérico espejado del back. */
export const TipoPagoCarga = {
  BOLSA: 0,
  JORNAL: 1,
} as const;
export type TipoPagoCarga = (typeof TipoPagoCarga)[keyof typeof TipoPagoCarga];

/** Una fila de la tabla cargas_trabajo — cargador + trabajo. */
export interface CargaTrabajo extends AuditFields {
  cargador: Cargador;
  tipoPago: TipoPagoCarga;
  cantidad: number;
  tarifaBs: number;
  montoBs: number;
  pagado: boolean;
  fechaPago?: string | null;
  observaciones?: string | null;
  // Origen (uno de los 2)
  kardexMp?: {
    id: string;
    fecha: string;
    materiaPrima?: { id: string; nombre: string };
  } | null;
  notaVenta?: {
    id: string;
    numeroNota: number;
    fecha: string;
    cliente?: { id: string; nombre: string };
  } | null;
}

export interface DeudaItem {
  id: string;
  fecha: string;
  origen: 'kardex_mp' | 'venta';
  origenId: string;
  referencia: string;
  numeroReferencia?: string;
  clienteNombre?: string;
  materiaPrimaNombre?: string;
  tipoPago: TipoPagoCarga;
  cantidad: number;
  tarifaBs: number;
  montoBs: number;
  pagado?: boolean;
  fechaPago?: string | null;
  cargadorId?: string;
  cargadorNombre?: string;
}

export interface DeudaCargador {
  cargadorId: string;
  cargadorNombre: string;
  totalBs: number;
  cantidad: number;
  items: DeudaItem[];
}

export interface PagoCargadorResponse {
  totalBs: number;
  cantidadPagada: number;
  fechaPago: string;
}

export interface ReporteCargadoresItem {
  cargadorId: string;
  cargadorNombre: string;
  cantidadPagos: number;
  totalPagadoBs: number;
  pendienteBs: number;
}

export interface ReporteCargadores {
  desde: string | null;
  hasta: string | null;
  totalPagadoBs: number;
  totalPendienteBs: number;
  cantidadCargadores: number;
  porCargador: ReporteCargadoresItem[];
  porOrigen?: {
    materiaPrima: { totalPagadoBs: number; pendienteBs: number; cantidad: number };
    despacho:     { totalPagadoBs: number; pendienteBs: number; cantidad: number };
  };
}

export interface MateriaPrima extends AuditFields {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  stockActualKg: number;
  stockMinimoKg: number;
  stockBajo: boolean;
  activo: boolean;
  categoria?: CategoriaMP;
  unidadMedida?: UnidadMedida;
}

export interface LoteProduccionRef {
  id: string;
  codigoLote: string;
  fecha: string;
  cantidadProducida: number;
  mermaMpKg?: number | null;
  mermaUnidades?: number | null;
}

export interface KardexMP extends AuditFields {
  fecha: string;
  tipoMovimiento: TipoMovimientoMP;
  cantidad: number;
  cantidadKg: number;
  numeroLotePropio?: string | null;
  costoUnitarioBs?: number | null;
  observaciones?: string | null;
  estadoPago: EstadoPagoMP;
  fechaPago?: string | null;
  materiaPrima: MateriaPrima;
  subtipo?: SubtipoMP | null;
  proveedor?: Proveedor | null;
  unidad: UnidadMedida;
  responsable?: Usuario;
  cargas?: CargaTrabajo[];
  loteProduccion?: LoteProduccionRef | null;
  anulado?: boolean;
  motivoAnulacion?: string | null;
}

export interface ProductoImagen {
  id: string;
  url: string;
  esPrincipal: boolean;
  orden: number;
  productoId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Producto extends AuditFields {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  pesoKgPorUnidad?: number | null;
  precioUnitarioBs?: number | null;
  stockActual: number;
  stockMinimo: number;
  vidaUtilMeses: number;
  activo: boolean;
  unidadProduccion: UnidadMedida;
  fotoPrincipal?: string | null;
  imagenes?: ProductoImagen[];
}

export interface LoteProduccion extends AuditFields {
  fecha: string;
  codigoLote: string;
  numeroLotePropio?: string | null;
  fechaVencimiento: string;
  registroSanitario?: string | null;
  cantidadProducida: number;
  stockRestante: number;
  totalKg: number;
  costoMpBs: number;
  mermaUnidades: number;
  mermaMpKg: number;
  mermaObservaciones?: string | null;
  observaciones?: string | null;
  producto: Producto;
  unidad: UnidadMedida;
  responsable?: Usuario;
}

export interface KardexProducto extends AuditFields {
  fecha: string;
  tipoMovimiento: TipoMovimientoPT;
  cantidad: number;
  totalKg: number;
  detalle?: string | null;
  producto: Producto;
  lote?: LoteProduccion | null;
  unidad: UnidadMedida;
  responsable?: Usuario;
}

export interface DetalleVenta extends AuditFields {
  cantidad: number;
  pesoUnitarioKg: number;
  totalKg: number;
  totalQq: number;
  precioUnitarioBs: number;
  valorTotalBs: number;
  producto: Producto;
  unidad?: UnidadMedida;
  lote?: LoteProduccion | null;
}

export interface NotaVenta extends AuditFields {
  numeroNota: number;
  fecha: string;
  subtotalBs: number;
  descuentoBs: number;
  totalBs: number;
  estado: EstadoVenta;
  tipoFlete: TipoFlete;
  fleteBs: number;
  numeroGuia?: number | null;
  observaciones?: string | null;
  estadoPago: EstadoPagoVenta;
  metodoPago?: MetodoPago | null;
  fechaCobro?: string | null;
  cliente: Cliente;
  vendedor?: Usuario;
  transportista?: Transportista | null;
  detalles: DetalleVenta[];
  cargas?: CargaTrabajo[];
}

export interface Remision extends AuditFields {
  fecha: string;
  numeroGuia?: number | null;
  numeroLote?: number | null;
  estado: EstadoRemision;
  fechaEntrega?: string | null;
  whatsappConfirmado: boolean;
  whatsappMensajeId?: string | null;
  observaciones?: string | null;
  notaVenta: NotaVenta;
  transportista: Transportista;
  despachadoPor?: Usuario;
  responsableProduccion?: Usuario;
}

export interface Gasto extends AuditFields {
  fecha: string;
  categoria: CategoriaGasto;
  descripcion: string;
  montoBs: number;
  comprobante?: string | null;
  comprobanteImagenUrl?: string | null;
  responsable?: Usuario;
}

// ─── DTOs (request bodies) ───────────────────────────────────

export interface LoginRequest { email: string; password: string; }
export interface LoginResponse {
  access_token: string;
  usuario: { id: string; nombre: string; email: string; rol: RolUsuario };
}

export interface ActualizarConfiguracionRequest {
  registroSanitario?: string;
}

export interface ActualizarEmpresaRequest {
  nombre?: string;
  rubro?: string;
  nit?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  logoUrl?: string;
}

export interface CreateClienteRequest {
  nombre: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  nit?: string;
}

export interface UpdateClienteRequest {
  nombre?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  nit?: string;
}

export interface CreateProveedorRequest {
  nombre: string;
  contacto?: string;
  telefono?: string;
  ciudad?: string;
  nit?: string;
}

export interface UpdateProveedorRequest {
  nombre?: string;
  contacto?: string;
  telefono?: string;
  ciudad?: string;
  nit?: string;
}

export interface CreateTransportistaRequest {
  nombre: string;
  ci?: string;
  empresa?: string;
  telefono?: string;
  placa?: string;
  marca?: string;
  color?: string;
  destinoHabitual?: string;
}

export interface UpdateTransportistaRequest {
  nombre?: string;
  ci?: string;
  empresa?: string;
  telefono?: string;
  placa?: string;
  marca?: string;
  color?: string;
  destinoHabitual?: string;
}

export interface CreateCategoriaMPRequest {
  nombre: string;
  descripcion?: string;
  tieneSubtipos: boolean;
}

export interface CreateProductoRequest {
  codigo: string;
  nombre: string;
  descripcion?: string;
  pesoKgPorUnidad?: number;
  stockMinimo?: number;
  unidadProduccionId: string;
  vidaUtilMeses?: number;
}

export interface UpdateProductoRequest {
  nombre?: string;
  descripcion?: string;
  pesoKgPorUnidad?: number;
  stockMinimo?: number;
  vidaUtilMeses?: number;
  activo?: boolean;
  unidadProduccionId?: string;
}

export interface CreateMateriaPrimaRequest {
  codigo: string;
  nombre: string;
  descripcion?: string;
  stockMinimoKg?: number;
  categoriaId: string;
  unidadMedidaId: string;
}

export interface CobrarVentaRequest {
  metodoPago: MetodoPago;
  fechaCobro?: string;
}

export interface CreateCargaTrabajoRequest {
  cargadorId: string;
  tipoPago: TipoPagoCarga;
  cantidad: number;
  tarifaBs: number;
  pagado?: boolean;
  observaciones?: string;
}

export interface UpdateCargaTrabajoRequest {
  tipoPago?: TipoPagoCarga;
  cantidad?: number;
  tarifaBs?: number;
  observaciones?: string;
}

export interface PagarBulkRequest {
  ids: string[];
  fechaPago?: string;
}

export interface CreateKardexMPRequest {
  fecha: string;
  tipoMovimiento: TipoMovimientoMP;
  cantidad: number;
  materiaPrimaId: string;
  unidadId: string;
  subtipoId?: string;
  proveedorId?: string;
  numeroLotePropio?: string;
  costoUnitarioBs?: number;
  observaciones?: string;
  estadoPago?: EstadoPagoMP;
  fechaPago?: string;
  cargas?: CreateCargaTrabajoRequest[];
  loteProduccionId?: string;
  /** Id de un KardexMP de tipo MERMA del que proviene este ingreso (evita reusar la misma merma dos veces). */
  mermaOrigenId?: string;
}

export interface CreateCargadorRequest {
  nombre: string;
  ci?: string;
  telefono?: string;
}

export interface UpdateCargadorRequest {
  nombre?: string;
  ci?: string;
  telefono?: string;
}

export interface UpdateMateriaPrimaRequest {
  nombre?: string;
  descripcion?: string;
  stockMinimoKg?: number;
  unidadMedidaId?: string;
}

export interface CreateKardexProductoRequest {
  fecha: string;
  tipoMovimiento: TipoMovimientoPT;
  cantidad: number;
  productoId: string;
  unidadId: string;
  loteId?: string;
  detalle?: string;
}

export interface CreateLoteRequest {
  fecha: string;
  cantidadProducida: number;
  productoId: string;
  unidadId: string;
  responsableId?: string;
  costoMpBs?: number;
  precioReferencialBs?: number;
  numeroLotePropio?: string;
  mermaUnidades?: number;
  mermaMpKg?: number;
  mermaObservaciones?: string;
  observaciones?: string;
  consumoMp?: {
    materiaPrimaId: string;
    unidadId: string;
    cantidad: number;
    observaciones?: string;
  }[];
}

export interface CreateDetalleVentaRequest {
  productoId: string;
  unidadId: string;
  loteId?: string;
  cantidad: number;
  precioUnitarioBs?: number;
}

export interface CreateVentaRequest {
  fecha: string;
  clienteId: string;
  transportistaId?: string;
  descuentoBs?: number;
  tipoFlete?: TipoFlete;
  fleteBs?: number;
  numeroGuia?: number;
  observaciones?: string;
  detalles: CreateDetalleVentaRequest[];
}

export interface CreateRemisionRequest {
  fecha: string;
  notaVentaId: string;
  transportistaId: string;
  despachadoPorId: string;
  responsableProduccionId: string;
  numeroGuia?: number;
  numeroLote?: number;
  observaciones?: string;
}

export interface CreateGastoRequest {
  fecha: string;
  categoria: CategoriaGasto;
  descripcion: string;
  montoBs: number;
  comprobante?: string;
}

export interface CreateUsuarioRequest {
  nombre: string;
  email: string;
  password: string;
  rol?: RolUsuario;
  telefono?: string;
}

export interface UpdateUsuarioRequest {
  nombre?: string;
  email?: string;
  password?: string;
  rol?: RolUsuario;
  telefono?: string;
  activo?: boolean;
}
