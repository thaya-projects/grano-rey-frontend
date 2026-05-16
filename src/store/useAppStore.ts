import { create } from 'zustand';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface RecetaItem {
  materia_prima_id: string;
  nombre: string;
  qq_por_qq_producido: number;
}

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  kgPorBolsa: number;
  bolsaEsQQ: boolean;
  precioUnitarioBs: number;
  stockActual: number;
  stockMinimo: number;
  receta: RecetaItem[];
}

export interface Lote {
  id: string;
  productoId: string;
  numero: number;
  fecha: string;
  cantidadInicial: number;
  cantidadActual: number;
}

export interface CategoriaMP {
  id: string;
  nombre: string;
  tieneSubtipos: boolean;
}

export interface MateriaPrimaStock {
  id: string;
  categoriaId: string;
  codigo: string;
  nombre: string;
  unidad: string;
  stockEntero?: number;
  stockParChico?: number;
  stockParGrande?: number;
  stockTotal: number;
  stockMinimo: number;
  proveedorId?: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono?: string;
  ciudad?: string;
  nit?: string;
}

export interface Transportista {
  id: string;
  nombre: string;
  empresa?: string;
  placa: string;
  marca: string;
  telefono?: string;
}

export interface Proveedor {
  id: string;
  nombre: string;
  ciudad?: string;
  telefono?: string;
}

export type EstadoVenta = 'pendiente' | 'despachado' | 'entregado' | 'cancelado';
export type TipoFlete   = 'sin_flete' | 'cliente_paga_directo' | 'incluido_en_venta' | 'grano_rey_paga';

export interface DetalleVenta {
  productoId: string;
  productoNombre: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  loteId: string;
  loteNum: number;
  totalBs: number;
}

export interface Venta {
  id: string;
  numero: number;
  fecha: string;
  clienteId: string;
  clienteNombre: string;
  detalles: DetalleVenta[];
  subtotalBs: number;
  descuentoBs: number;
  totalBs: number;
  transportistaId?: string;
  estado: EstadoVenta;
  numeroGuia: number;
  observaciones?: string;
  tipoFlete?: TipoFlete;
  fleteBs?: number;
}

export type CategoriaGasto = 'materia_prima' | 'transporte' | 'mano_de_obra' | 'servicios' | 'otros';

export interface Gasto {
  id: string;
  fecha: string;
  categoria: CategoriaGasto;
  descripcion: string;
  montoBs: number;
  esAutomatico: boolean;
}

export type TipoMovimientoMP = 'ingreso' | 'salida';

export interface MovimientoMP {
  id: string;
  fecha: string;
  mpId: string;
  mpNombre: string;
  tipo: TipoMovimientoMP;
  concepto: string;
  entero?: number;
  parChico?: number;
  parGrande?: number;
  totalQQ: number;
  costoBs?: number;
  proveedorId?: string;
  lote?: number;
  responsable: string;
}

// ─── DTOs for actions ─────────────────────────────────────────────────────────

export interface ProduccionDTO {
  productoId: string;
  bolsasProducidas: number;
  numeroLote: number;
  responsable: string;
  observaciones?: string;
}

export interface EntradaMPDTO {
  mpId: string;
  totalQQ: number;
  entero?: number;
  parChico?: number;
  parGrande?: number;
  costoBs?: number;
  proveedorId?: string;
  lote?: number;
  responsable: string;
  fecha?: string;
}

export interface BajaPTDTO {
  productoId: string;
  cantidad: number;
  motivo: string;
  descripcion: string;
}

export interface VentaDTO {
  clienteId: string;
  clienteNombre: string;
  detalles: DetalleVenta[];
  subtotalBs: number;
  descuentoBs: number;
  totalBs: number;
  transportistaId?: string;
  tipoFlete?: TipoFlete;
  fleteBs?: number;
  observaciones?: string;
  fecha: string;
}

// ─── Resultado de producción (con errores de stock) ───────────────────────────

export interface ProduccionCheck {
  mpId: string;
  nombre: string;
  necesarioQQ: number;
  disponibleQQ: number;
  ok: boolean;
}

// ─── Initial mock data ─────────────────────────────────────────────────────────

const MOCK_CATEGORIAS_MP: CategoriaMP[] = [
  { id: 'cm1', nombre: 'Granos',  tieneSubtipos: true  },
  { id: 'cm2', nombre: 'Insumos', tieneSubtipos: false },
];

const MOCK_PRODUCTOS: Producto[] = [
  {
    id: 'p1', codigo: 'HMAP-06', nombre: 'Harina de Maíz Amarillo Precocida',
    kgPorBolsa: 1, bolsaEsQQ: false, precioUnitarioBs: 305,
    stockActual: 120, stockMinimo: 50,
    receta: [
      { materia_prima_id: 'mp1', nombre: 'Maíz Amarillo', qq_por_qq_producido: 1.2 },
    ],
  },
  {
    id: 'p2', codigo: 'HMBP-02', nombre: 'Hojuela de Maíz Blanco Precocida',
    kgPorBolsa: 23, bolsaEsQQ: true, precioUnitarioBs: 305,
    stockActual: 45, stockMinimo: 20,
    receta: [
      { materia_prima_id: 'mp2', nombre: 'Frangollo Blanco', qq_por_qq_producido: 1.15 },
    ],
  },
  {
    id: 'p3', codigo: 'SMAP', nombre: 'Sémola de Maíz Amarillo Precocida',
    kgPorBolsa: 1, bolsaEsQQ: false, precioUnitarioBs: 280,
    stockActual: 80, stockMinimo: 30,
    receta: [
      { materia_prima_id: 'mp1', nombre: 'Maíz Amarillo', qq_por_qq_producido: 1.3 },
      { materia_prima_id: 'mp3', nombre: 'Sal',           qq_por_qq_producido: 0.05 },
    ],
  },
];

// Stock = suma de lotes activos
const MOCK_LOTES: Lote[] = [
  { id: 'l1', productoId: 'p1', numero: 1, fecha: '2026-04-01', cantidadInicial: 80,  cantidadActual: 45  },
  { id: 'l2', productoId: 'p1', numero: 2, fecha: '2026-04-15', cantidadInicial: 75,  cantidadActual: 75  },
  { id: 'l3', productoId: 'p2', numero: 1, fecha: '2026-04-10', cantidadInicial: 45,  cantidadActual: 45  },
  { id: 'l4', productoId: 'p3', numero: 1, fecha: '2026-04-12', cantidadInicial: 80,  cantidadActual: 80  },
];

const MOCK_MP: MateriaPrimaStock[] = [
  {
    id: 'mp1', categoriaId: 'cm1', codigo: 'MAZ-AM', nombre: 'Maíz Amarillo', unidad: 'QQ',
    stockEntero: 60, stockParChico: 15.5, stockParGrande: 10,
    stockTotal: 85.5, stockMinimo: 20,
  },
  {
    id: 'mp2', categoriaId: 'cm1', codigo: 'FRA-BL', nombre: 'Frangollo Blanco', unidad: 'QQ',
    stockEntero: 30, stockParChico: 8, stockParGrande: 4,
    stockTotal: 42, stockMinimo: 15,
  },
  {
    id: 'mp3', categoriaId: 'cm2', codigo: 'SAL', nombre: 'Sal', unidad: 'QQ',
    stockTotal: 12, stockMinimo: 5,
  },
];

const MOCK_CLIENTES: Cliente[] = [
  { id: 'cl1', nombre: 'Distribuidora El Trigo',   ciudad: 'Santa Cruz', telefono: '7-601-2345', nit: '1234567890' },
  { id: 'cl2', nombre: 'Supermercados Fidalga',     ciudad: 'Santa Cruz', telefono: '3-333-4444' },
  { id: 'cl3', nombre: 'Cooperativa El Campesino',  ciudad: 'Cochabamba', telefono: '4-111-2222' },
  { id: 'cl4', nombre: 'Tiendas Naturales Bolivia', ciudad: 'La Paz',     telefono: '2-777-8888', nit: '9876543210' },
  { id: 'cl5', nombre: 'Exportadora Pacífico SAM',  ciudad: 'Santa Cruz', telefono: '7-999-0000' },
];

const MOCK_TRANSPORTISTAS: Transportista[] = [
  { id: 't1', nombre: 'Pedro Garnica', empresa: 'Transporte Garnica', placa: 'SCZ-2341', marca: 'Toyota Hilux',    telefono: '7-123-4567' },
  { id: 't2', nombre: 'Hugo Vásquez',  empresa: 'Express Vásquez',    placa: 'SCZ-8821', marca: 'Nissan Frontier', telefono: '7-234-5678' },
  { id: 't3', nombre: 'Ramón Flores',  placa: 'LP-5543',              marca: 'Ford F-150', telefono: '7-345-6789' },
];

const MOCK_PROVEEDORES: Proveedor[] = [
  { id: 'pv1', nombre: 'Agro Bolivia SRL',     ciudad: 'Santa Cruz' },
  { id: 'pv2', nombre: 'Granos del Sur SA',    ciudad: 'Cochabamba' },
  { id: 'pv3', nombre: 'Molinera Andina LTDA', ciudad: 'La Paz' },
];

const MOCK_VENTAS: Venta[] = [
  {
    id: 'v1', numero: 1001, fecha: '2026-04-05', clienteId: 'cl1', clienteNombre: 'Distribuidora El Trigo',
    detalles: [{ productoId: 'p1', productoNombre: 'Harina de Maíz Amarillo Precocida', cantidad: 25, unidad: 'BOL', precioUnitario: 305, loteId: 'l1', loteNum: 1, totalBs: 7625 }],
    subtotalBs: 7625, descuentoBs: 0, totalBs: 7625,
    transportistaId: 't1', estado: 'entregado', numeroGuia: 5001, tipoFlete: 'sin_flete',
  },
  {
    id: 'v2', numero: 1002, fecha: '2026-04-18', clienteId: 'cl2', clienteNombre: 'Supermercados Fidalga',
    detalles: [
      { productoId: 'p1', productoNombre: 'Harina de Maíz Amarillo Precocida', cantidad: 10, unidad: 'BOL', precioUnitario: 305, loteId: 'l1', loteNum: 1, totalBs: 3050 },
      { productoId: 'p3', productoNombre: 'Sémola de Maíz Amarillo Precocida', cantidad: 30, unidad: 'BOL', precioUnitario: 280, loteId: 'l4', loteNum: 1, totalBs: 8400 },
    ],
    subtotalBs: 11450, descuentoBs: 450, totalBs: 11000,
    transportistaId: 't2', estado: 'entregado', numeroGuia: 5002, tipoFlete: 'incluido_en_venta', fleteBs: 500,
  },
  {
    id: 'v3', numero: 1003, fecha: '2026-05-02', clienteId: 'cl3', clienteNombre: 'Cooperativa El Campesino',
    detalles: [{ productoId: 'p2', productoNombre: 'Hojuela de Maíz Blanco Precocida', cantidad: 15, unidad: 'BOL', precioUnitario: 305, loteId: 'l3', loteNum: 1, totalBs: 4575 }],
    subtotalBs: 4575, descuentoBs: 0, totalBs: 4575,
    transportistaId: 't1', estado: 'despachado', numeroGuia: 5003, tipoFlete: 'cliente_paga_directo',
  },
  {
    id: 'v4', numero: 1004, fecha: '2026-05-07', clienteId: 'cl4', clienteNombre: 'Tiendas Naturales Bolivia',
    detalles: [{ productoId: 'p1', productoNombre: 'Harina de Maíz Amarillo Precocida', cantidad: 30, unidad: 'BOL', precioUnitario: 305, loteId: 'l2', loteNum: 2, totalBs: 9150 }],
    subtotalBs: 9150, descuentoBs: 0, totalBs: 9150,
    transportistaId: 't3', estado: 'pendiente', numeroGuia: 5004, tipoFlete: 'grano_rey_paga', fleteBs: 350,
  },
  {
    id: 'v5', numero: 1005, fecha: '2026-05-08', clienteId: 'cl1', clienteNombre: 'Distribuidora El Trigo',
    detalles: [{ productoId: 'p3', productoNombre: 'Sémola de Maíz Amarillo Precocida', cantidad: 20, unidad: 'BOL', precioUnitario: 280, loteId: 'l4', loteNum: 1, totalBs: 5600 }],
    subtotalBs: 5600, descuentoBs: 0, totalBs: 5600,
    transportistaId: 't2', estado: 'pendiente', numeroGuia: 5005, tipoFlete: 'sin_flete',
  },
];

const MOCK_GASTOS: Gasto[] = [
  { id: 'g1', fecha: '2026-05-02', categoria: 'transporte',   descripcion: 'Flete venta N°1003 · Cooperativa El Campesino', montoBs: 420,  esAutomatico: true  },
  { id: 'g2', fecha: '2026-05-05', categoria: 'mano_de_obra', descripcion: 'Sueldo semanal operarios — semana 18',           montoBs: 1800, esAutomatico: false },
  { id: 'g3', fecha: '2026-05-07', categoria: 'transporte',   descripcion: 'Flete venta N°1004 · Tiendas Naturales',        montoBs: 350,  esAutomatico: true  },
  { id: 'g4', fecha: '2026-05-06', categoria: 'servicios',    descripcion: 'Energía eléctrica — abril',                     montoBs: 450,  esAutomatico: false },
  { id: 'g5', fecha: '2026-05-01', categoria: 'servicios',    descripcion: 'Agua industrial',                               montoBs: 180,  esAutomatico: false },
  { id: 'g6', fecha: '2026-04-15', categoria: 'materia_prima',descripcion: 'Compra Maíz Amarillo · 30 QQ · Lote 001',      montoBs: 4500, esAutomatico: true  },
  { id: 'g7', fecha: '2026-04-20', categoria: 'materia_prima',descripcion: 'Compra Frangollo Blanco · 20 QQ · Lote 001',   montoBs: 3200, esAutomatico: true  },
  { id: 'g8', fecha: '2026-04-28', categoria: 'mano_de_obra', descripcion: 'Sueldo semanal operarios — semana 17',          montoBs: 1800, esAutomatico: false },
  { id: 'g9', fecha: '2026-05-03', categoria: 'otros',        descripcion: 'Material de embalaje',                          montoBs: 320,  esAutomatico: false },
];

const MOCK_MOVIMIENTOS_MP: MovimientoMP[] = [
  { id: 'mm1', fecha: '2026-04-15', mpId: 'mp1', mpNombre: 'Maíz Amarillo',   tipo: 'ingreso', concepto: 'Compra proveedor', entero: 20, parChico: 6, parGrande: 4, totalQQ: 30, costoBs: 4500, proveedorId: 'pv1', lote: 1, responsable: 'Luis Mamani' },
  { id: 'mm2', fecha: '2026-04-20', mpId: 'mp2', mpNombre: 'Frangollo Blanco',tipo: 'ingreso', concepto: 'Compra proveedor', entero: 12, parChico: 5, parGrande: 3, totalQQ: 20, costoBs: 3200, proveedorId: 'pv2', lote: 1, responsable: 'Carlos Rojas' },
  { id: 'mm3', fecha: '2026-04-25', mpId: 'mp1', mpNombre: 'Maíz Amarillo',   tipo: 'salida',  concepto: 'Producción HMAP-06', totalQQ: 12.5, responsable: 'Luis Mamani' },
  { id: 'mm4', fecha: '2026-04-28', mpId: 'mp2', mpNombre: 'Frangollo Blanco',tipo: 'salida',  concepto: 'Producción HMBP-02', totalQQ: 8.5,  responsable: 'Carlos Rojas' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

function today() { return new Date().toISOString().slice(0, 10); }

// Deduct MP stock proportionally across subtipos
function deductMP(mp: MateriaPrimaStock, cantidad: number): Partial<MateriaPrimaStock> {
  const newTotal = Math.max(0, mp.stockTotal - cantidad);
  if (mp.stockEntero === undefined) return { stockTotal: newTotal };
  // proportional deduction across subtipos
  const ratio = mp.stockTotal > 0 ? cantidad / mp.stockTotal : 0;
  return {
    stockTotal:      newTotal,
    stockEntero:     Math.max(0, (mp.stockEntero  || 0) - (mp.stockEntero  || 0) * ratio),
    stockParChico:   Math.max(0, (mp.stockParChico  || 0) - (mp.stockParChico  || 0) * ratio),
    stockParGrande:  Math.max(0, (mp.stockParGrande || 0) - (mp.stockParGrande || 0) * ratio),
  };
}

// ─── Store ─────────────────────────────────────────────────────────────────────

interface AppState {
  // Data
  productos:      Producto[];
  lotes:          Lote[];
  materiasPrimas: MateriaPrimaStock[];
  categoriasMP:   CategoriaMP[];
  ventas:         Venta[];
  gastos:         Gasto[];
  movimientosMP:  MovimientoMP[];
  clientes:       Cliente[];
  transportistas: Transportista[];
  proveedores:    Proveedor[];

  // Helpers (derived)
  lotesParaProducto: (productoId: string) => Lote[];
  calcularConsumoMP: (productoId: string, bolsas: number) => ProduccionCheck[];

  // Actions
  registrarProduccion:  (dto: ProduccionDTO) => { ok: boolean; error?: string };
  registrarVenta:       (dto: VentaDTO) => Venta;
  registrarEntradaMP:   (dto: EntradaMPDTO) => void;
  registrarBajaPT:      (dto: BajaPTDTO) => void;
  cambiarEstadoVenta:   (id: string, estado: EstadoVenta) => void;

  // Config CRUD
  addCliente:          (c: Omit<Cliente, 'id'>) => Cliente;
  addTransportista:    (t: Omit<Transportista, 'id'>) => Transportista;
  updateProducto:      (id: string, data: Partial<Omit<Producto, 'id'>>) => void;
  addProducto:         (p: Omit<Producto, 'id'>) => Producto;
  addMateriaPrima:     (mp: Omit<MateriaPrimaStock, 'id'>) => MateriaPrimaStock;
  updateMateriaPrima:  (id: string, data: Partial<MateriaPrimaStock>) => void;
  addCategoriaMP:      (c: Omit<CategoriaMP, 'id'>) => CategoriaMP;

  // Reportes computed
  resumenFinanciero:   (periodo: 'mes_actual' | 'mes_anterior') => { ingresosBs: number; egresosBs: number; utilidadBs: number; margenPct: number };
  gastosPorCategoria:  (periodo: 'mes_actual' | 'mes_anterior') => { label: string; monto: number; pct: number; esAutomatico: boolean }[];
  ventasPorSemana:     (periodo: 'mes_actual' | 'mes_anterior') => { sem: string; ingresos: number; egresos: number }[];
  ventasPorMes:        () => { mes: string; monto: number }[];
  statsDelMes:         () => { totalVentas: number; notasMes: number; pendientes: number; totalStock: number; totalQQ: number; totalMP: number };
}

export const useAppStore = create<AppState>((set, get) => ({
  productos:      MOCK_PRODUCTOS,
  lotes:          MOCK_LOTES,
  materiasPrimas: MOCK_MP,
  categoriasMP:   MOCK_CATEGORIAS_MP,
  ventas:         MOCK_VENTAS,
  gastos:         MOCK_GASTOS,
  movimientosMP:  MOCK_MOVIMIENTOS_MP,
  clientes:       MOCK_CLIENTES,
  transportistas: MOCK_TRANSPORTISTAS,
  proveedores:    MOCK_PROVEEDORES,

  // ── Helpers ────────────────────────────────────────────────────────────────

  lotesParaProducto: (productoId) =>
    get().lotes
      .filter(l => l.productoId === productoId && l.cantidadActual > 0)
      .sort((a, b) => a.fecha.localeCompare(b.fecha)),

  calcularConsumoMP: (productoId, bolsas) => {
    const { productos, materiasPrimas } = get();
    const prod = productos.find(p => p.id === productoId);
    if (!prod || bolsas <= 0) return [];
    const totalQQ = (bolsas * prod.kgPorBolsa) / 46;
    return prod.receta.map(r => {
      const mp = materiasPrimas.find(m => m.id === r.materia_prima_id);
      const necesarioQQ = totalQQ * r.qq_por_qq_producido;
      const disponibleQQ = mp?.stockTotal ?? 0;
      return {
        mpId: r.materia_prima_id,
        nombre: r.nombre,
        necesarioQQ,
        disponibleQQ,
        ok: disponibleQQ >= necesarioQQ,
      };
    });
  },

  // ── Producción ─────────────────────────────────────────────────────────────

  registrarProduccion: (dto) => {
    const { productos, lotes, materiasPrimas, movimientosMP, calcularConsumoMP } = get();
    const checks = calcularConsumoMP(dto.productoId, dto.bolsasProducidas);
    const sinStock = checks.filter(c => !c.ok);
    if (sinStock.length > 0) {
      return { ok: false, error: `Stock insuficiente: ${sinStock.map(c => c.nombre).join(', ')}` };
    }
    const prod = productos.find(p => p.id === dto.productoId)!;
    const fechaHoy = today();

    // Create new lote
    const newLote: Lote = {
      id: uid(), productoId: dto.productoId, numero: dto.numeroLote,
      fecha: fechaHoy, cantidadInicial: dto.bolsasProducidas, cantidadActual: dto.bolsasProducidas,
    };

    // Build MP deductions and movimientos
    const newMovimientos: MovimientoMP[] = [];
    const mpUpdates = new Map<string, Partial<MateriaPrimaStock>>();
    const totalQQProd = (dto.bolsasProducidas * prod.kgPorBolsa) / 46;

    for (const check of checks) {
      const mp = materiasPrimas.find(m => m.id === check.mpId)!;
      mpUpdates.set(mp.id, deductMP(mp, check.necesarioQQ));
      newMovimientos.push({
        id: uid(), fecha: fechaHoy, mpId: mp.id, mpNombre: mp.nombre,
        tipo: 'salida', concepto: `Producción ${prod.codigo} — Lote #${String(dto.numeroLote).padStart(3, '0')}`,
        totalQQ: check.necesarioQQ, responsable: dto.responsable,
      });
    }

    set(s => ({
      lotes:     [...s.lotes, newLote],
      productos: s.productos.map(p =>
        p.id === dto.productoId ? { ...p, stockActual: p.stockActual + dto.bolsasProducidas } : p
      ),
      materiasPrimas: s.materiasPrimas.map(mp =>
        mpUpdates.has(mp.id) ? { ...mp, ...mpUpdates.get(mp.id) } : mp
      ),
      movimientosMP: [...s.movimientosMP, ...newMovimientos],
    }));

    return { ok: true };
  },

  // ── Venta ──────────────────────────────────────────────────────────────────

  registrarVenta: (dto) => {
    const { ventas, gastos } = get();
    const nextNum = Math.max(...ventas.map(v => v.numero), 1000) + 1;
    const nextGuia = Math.max(...ventas.map(v => v.numeroGuia), 5000) + 1;

    const venta: Venta = {
      id: uid(), numero: nextNum, numeroGuia: nextGuia,
      fecha: dto.fecha, clienteId: dto.clienteId, clienteNombre: dto.clienteNombre,
      detalles: dto.detalles, subtotalBs: dto.subtotalBs, descuentoBs: dto.descuentoBs,
      totalBs: dto.totalBs, transportistaId: dto.transportistaId,
      estado: 'pendiente', tipoFlete: dto.tipoFlete, fleteBs: dto.fleteBs,
      observaciones: dto.observaciones,
    };

    // Deduct lotes FIFO
    const loteUpdates = new Map<string, number>(); // loteId → new cantidadActual
    for (const detalle of dto.detalles) {
      let remaining = detalle.cantidad;
      const lotesFIFO = get().lotes
        .filter(l => l.productoId === detalle.productoId && l.cantidadActual > 0)
        .sort((a, b) => a.fecha.localeCompare(b.fecha));
      for (const lote of lotesFIFO) {
        if (remaining <= 0) break;
        const current = loteUpdates.get(lote.id) ?? lote.cantidadActual;
        const toDeduct = Math.min(current, remaining);
        loteUpdates.set(lote.id, current - toDeduct);
        remaining -= toDeduct;
      }
    }

    // Auto-generate gasto for flete if grano_rey_paga
    const newGastos: Gasto[] = [];
    if (dto.tipoFlete === 'grano_rey_paga' && (dto.fleteBs ?? 0) > 0) {
      newGastos.push({
        id: uid(), fecha: dto.fecha, categoria: 'transporte',
        descripcion: `Flete venta N°${nextNum} · ${dto.clienteNombre}`,
        montoBs: dto.fleteBs!, esAutomatico: true,
      });
    }

    set(s => ({
      ventas: [...s.ventas, venta],
      gastos: [...s.gastos, ...newGastos],
      lotes: s.lotes.map(l => loteUpdates.has(l.id) ? { ...l, cantidadActual: loteUpdates.get(l.id)! } : l),
      productos: s.productos.map(p => {
        const totalVendido = dto.detalles.filter(d => d.productoId === p.id).reduce((sum, d) => sum + d.cantidad, 0);
        return totalVendido > 0 ? { ...p, stockActual: Math.max(0, p.stockActual - totalVendido) } : p;
      }),
    }));

    return venta;
  },

  // ── Entrada MP ─────────────────────────────────────────────────────────────

  registrarEntradaMP: (dto) => {
    const { materiasPrimas } = get();
    const mp = materiasPrimas.find(m => m.id === dto.mpId)!;
    const fechaHoy = dto.fecha ?? today();

    const mpActualizado: Partial<MateriaPrimaStock> = {
      stockTotal: mp.stockTotal + dto.totalQQ,
    };
    if (mp.stockEntero !== undefined) {
      mpActualizado.stockEntero   = (mp.stockEntero   || 0) + (dto.entero    ?? 0);
      mpActualizado.stockParChico = (mp.stockParChico  || 0) + (dto.parChico  ?? 0);
      mpActualizado.stockParGrande= (mp.stockParGrande || 0) + (dto.parGrande ?? 0);
    }

    const mov: MovimientoMP = {
      id: uid(), fecha: fechaHoy, mpId: mp.id, mpNombre: mp.nombre,
      tipo: 'ingreso', concepto: 'Compra proveedor',
      entero: dto.entero, parChico: dto.parChico, parGrande: dto.parGrande,
      totalQQ: dto.totalQQ, costoBs: dto.costoBs,
      proveedorId: dto.proveedorId, lote: dto.lote, responsable: dto.responsable,
    };

    const gastoMP: Gasto | null = dto.costoBs
      ? { id: uid(), fecha: fechaHoy, categoria: 'materia_prima', descripcion: `Compra ${mp.nombre} · ${dto.totalQQ} QQ${dto.lote ? ` · Lote ${dto.lote}` : ''}`, montoBs: dto.costoBs, esAutomatico: true }
      : null;

    set(s => ({
      materiasPrimas: s.materiasPrimas.map(m => m.id === dto.mpId ? { ...m, ...mpActualizado } : m),
      movimientosMP: [...s.movimientosMP, mov],
      gastos: gastoMP ? [...s.gastos, gastoMP] : s.gastos,
    }));
  },

  // ── Baja PT ────────────────────────────────────────────────────────────────

  registrarBajaPT: (dto) => {
    set(s => ({
      productos: s.productos.map(p =>
        p.id === dto.productoId ? { ...p, stockActual: Math.max(0, p.stockActual - dto.cantidad) } : p
      ),
    }));
  },

  cambiarEstadoVenta: (id, estado) => {
    set(s => ({ ventas: s.ventas.map(v => v.id === id ? { ...v, estado } : v) }));
  },

  // ── Config CRUD ────────────────────────────────────────────────────────────

  addCliente: (c) => {
    const nuevo: Cliente = { ...c, id: uid() };
    set(s => ({ clientes: [...s.clientes, nuevo] }));
    return nuevo;
  },

  addTransportista: (t) => {
    const nuevo: Transportista = { ...t, id: uid() };
    set(s => ({ transportistas: [...s.transportistas, nuevo] }));
    return nuevo;
  },

  updateProducto: (id, data) => {
    set(s => ({ productos: s.productos.map(p => p.id === id ? { ...p, ...data } : p) }));
  },

  addMateriaPrima: (mp) => {
    const nuevo: MateriaPrimaStock = { ...mp, id: uid() };
    set(s => ({ materiasPrimas: [...s.materiasPrimas, nuevo] }));
    return nuevo;
  },

  updateMateriaPrima: (id, data) => {
    set(s => ({ materiasPrimas: s.materiasPrimas.map(m => m.id === id ? { ...m, ...data } : m) }));
  },

  addProducto: (p) => {
    const nuevo: Producto = { ...p, id: uid() };
    const lotesIniciales: Lote[] = [];
    if (p.stockActual > 0) {
      lotesIniciales.push({
        id: uid(), productoId: nuevo.id, numero: 1,
        fecha: today(), cantidadInicial: p.stockActual, cantidadActual: p.stockActual,
      });
    }
    set(s => ({ productos: [...s.productos, nuevo], lotes: [...s.lotes, ...lotesIniciales] }));
    return nuevo;
  },

  addCategoriaMP: (c) => {
    const nueva: CategoriaMP = { ...c, id: uid() };
    set(s => ({ categoriasMP: [...s.categoriasMP, nueva] }));
    return nueva;
  },

  // ── Reportes (computed from live state) ───────────────────────────────────

  statsDelMes: () => {
    const { ventas, productos, materiasPrimas } = get();
    const mesKey = '2026-05';
    const delMes = ventas.filter(v => v.fecha.startsWith(mesKey));
    return {
      totalVentas: delMes.reduce((s, v) => s + v.totalBs, 0),
      notasMes:    delMes.length,
      pendientes:  ventas.filter(v => v.estado === 'pendiente').length,
      totalStock:  productos.reduce((s, p) => s + p.stockActual, 0),
      totalQQ:     productos.reduce((s, p) => s + (p.stockActual * p.kgPorBolsa) / 46, 0),
      totalMP:     materiasPrimas.reduce((s, m) => s + m.stockTotal, 0),
    };
  },

  ventasPorMes: () => {
    const { ventas } = get();
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const now = new Date('2026-05-09');
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return { mes: meses[d.getMonth()], monto: ventas.filter(v => v.fecha.startsWith(key)).reduce((s, v) => s + v.totalBs, 0) };
    });
  },

  resumenFinanciero: (periodo) => {
    const { ventas, gastos } = get();
    const key = periodo === 'mes_actual' ? '2026-05' : '2026-04';
    const ingresosBs = ventas.filter(v => v.fecha.startsWith(key)).reduce((s, v) => s + v.totalBs, 0);
    const egresosBs  = gastos.filter(g => g.fecha.startsWith(key)).reduce((s, g) => s + g.montoBs, 0);
    const utilidadBs = ingresosBs - egresosBs;
    return { ingresosBs, egresosBs, utilidadBs, margenPct: ingresosBs > 0 ? (utilidadBs / ingresosBs) * 100 : 0 };
  },

  gastosPorCategoria: (periodo) => {
    const { gastos } = get();
    const key = periodo === 'mes_actual' ? '2026-05' : '2026-04';
    const g = gastos.filter(x => x.fecha.startsWith(key));
    const total = g.reduce((s, x) => s + x.montoBs, 0);
    const LABELS: Record<CategoriaGasto, string> = {
      materia_prima: 'Materia Prima', transporte: 'Transporte/Flete',
      mano_de_obra: 'Mano de Obra', servicios: 'Servicios', otros: 'Otros',
    };
    const bycat = g.reduce((acc, x) => {
      if (!acc[x.categoria]) acc[x.categoria] = { label: LABELS[x.categoria], monto: 0, esAutomatico: x.esAutomatico };
      acc[x.categoria].monto += x.montoBs;
      return acc;
    }, {} as Record<string, { label: string; monto: number; esAutomatico: boolean }>);
    return Object.values(bycat).map(c => ({ ...c, pct: total > 0 ? (c.monto / total) * 100 : 0 })).sort((a, b) => b.monto - a.monto);
  },

  ventasPorSemana: (periodo) => {
    const { ventas, gastos } = get();
    const key = periodo === 'mes_actual' ? '2026-05' : '2026-04';
    const gPeriodo = gastos.filter(x => x.fecha.startsWith(key));
    return ['Sem 1','Sem 2','Sem 3','Sem 4'].map((sem, i) => {
      const d1 = i * 7 + 1; const d2 = d1 + 6;
      const inRange = (fecha: string) => { const day = parseInt(fecha.slice(8, 10)); return fecha.startsWith(key) && day >= d1 && day <= d2; };
      return {
        sem,
        ingresos: ventas.filter(v => inRange(v.fecha)).reduce((s, v) => s + v.totalBs, 0),
        egresos:  gPeriodo.filter(g => { const day = parseInt(g.fecha.slice(8, 10)); return day >= d1 && day <= d2; }).reduce((s, g) => s + g.montoBs, 0),
      };
    });
  },
}));
