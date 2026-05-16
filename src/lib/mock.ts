// ─── Mock data store — all state lives here, mutated via actions ───────────

export interface Cliente {
  id: string; nombre: string; telefono?: string; ciudad?: string; nit?: string;
}
export interface Transportista {
  id: string; nombre: string; empresa?: string; placa: string; marca: string; telefono?: string;
}
export interface Proveedor {
  id: string; nombre: string; ciudad?: string; telefono?: string;
}
export interface UnidadMedida {
  id: string; codigo: string; nombre: string; factorKg: number;
}
export interface Lote {
  id: string; productoId: string; numero: number; fecha: string; cantidadInicial: number; cantidadActual: number;
}
export interface Producto {
  id: string; codigo: string; nombre: string; kgPorBolsa: number; precioUnitarioBs: number; stockActual: number; stockMinimo: number; unidadId: string;
}
export interface SubtipoMP { id: string; nombre: string; }
export interface CategoriaMP { id: string; nombre: string; subtipos?: SubtipoMP[]; }
export interface MateriaPrimaStock {
  id: string; categoriaId: string; nombre: string; unidad: string;
  stockEntero?: number; stockParChico?: number; stockParGrande?: number;
  stockTotal: number; stockMinimo: number; proveedorId?: string;
}
export interface StockIngreso {
  id: string; mpId: string; fecha: string; proveedor: string; lote: number;
  entero?: number; parChico?: number; parGrande?: number; total: number; costo?: number;
}
export type EstadoVenta = 'pendiente' | 'despachado' | 'entregado' | 'cancelado';
export type TipoFlete = 'sin_flete' | 'cliente_paga_directo' | 'incluido_en_venta' | 'grano_rey_paga';
export interface DetalleVenta {
  productoId: string; productoNombre: string; cantidad: number; unidad: string;
  precioUnitario: number; loteId: string; loteNum: number; totalBs: number;
}
export interface Venta {
  id: string; numero: number; fecha: string; clienteId: string; clienteNombre: string;
  detalles: DetalleVenta[]; subtotalBs: number; descuentoBs: number; totalBs: number;
  transportistaId?: string; estado: EstadoVenta; numeroGuia: number; observaciones?: string;
  tipoFlete?: TipoFlete; fleteBs?: number;
}
export interface Remision {
  ventaId: string; numeroGuia: number; responsableProduccion: string; fecha: string;
  estado: EstadoVenta; observaciones?: string;
}
export interface LoteProduccion {
  id: string; productoId: string; numero: number; fecha: string;
  cantidad: number; responsable: string; observaciones?: string;
}

// ─── Gastos ───────────────────────────────────────────────────────────────────
export type CategoriaGasto = 'materia_prima' | 'transporte' | 'mano_de_obra' | 'servicios' | 'otros';
export interface Gasto {
  id: string; fecha: string; categoria: CategoriaGasto;
  descripcion: string; montoBs: number; esAutomatico: boolean;
}

// ─── Movimientos MP ───────────────────────────────────────────────────────────
export type TipoMovimientoMP = 'ingreso' | 'salida';
export interface MovimientoMP {
  id: string; fecha: string; mpId: string; mpNombre: string;
  tipo: TipoMovimientoMP;
  entero?: number; parChico?: number; parGrande?: number; totalQQ: number;
  costoBs?: number; proveedorId?: string; lote?: number; responsable: string;
}

// ─────────────────────────────────────────────────────────────────────────────

export const unidades: UnidadMedida[] = [
  { id: 'u1', codigo: 'BOL', nombre: 'Bolsa',      factorKg: 1  },
  { id: 'u2', codigo: 'QQ',  nombre: 'Quintal',    factorKg: 46 },
  { id: 'u3', codigo: 'KG',  nombre: 'Kilogramo',  factorKg: 1  },
  { id: 'u4', codigo: 'LT',  nombre: 'Litro',      factorKg: 1  },
];

export const productos: Producto[] = [
  { id: 'p1', codigo: 'HMAP-06', nombre: 'Harina de Maíz Amarillo Precocida 1kg', kgPorBolsa: 1,    precioUnitarioBs: 8.5, stockActual: 1240, stockMinimo: 300, unidadId: 'u1' },
  { id: 'p2', codigo: 'HMBP-02', nombre: 'Harina de Maíz Blanco Precocida 1kg',  kgPorBolsa: 1,    precioUnitarioBs: 8.5, stockActual: 850,  stockMinimo: 300, unidadId: 'u1' },
  { id: 'p3', codigo: 'SMAP',    nombre: 'Semolina de Maíz Amarillo 500g',       kgPorBolsa: 0.5,  precioUnitarioBs: 5.5, stockActual: 420,  stockMinimo: 200, unidadId: 'u1' },
  { id: 'p4', codigo: 'CMAP-01', nombre: 'Crema de Maíz Amarillo 250g',          kgPorBolsa: 0.25, precioUnitarioBs: 4,   stockActual: 95,   stockMinimo: 150, unidadId: 'u1' },
];

export const lotes: Lote[] = [
  { id: 'l1', productoId: 'p1', numero: 101, fecha: '2026-04-15', cantidadInicial: 600, cantidadActual: 540 },
  { id: 'l2', productoId: 'p1', numero: 102, fecha: '2026-04-28', cantidadInicial: 700, cantidadActual: 700 },
  { id: 'l3', productoId: 'p2', numero: 201, fecha: '2026-04-20', cantidadInicial: 500, cantidadActual: 400 },
  { id: 'l4', productoId: 'p2', numero: 202, fecha: '2026-05-01', cantidadInicial: 450, cantidadActual: 450 },
  { id: 'l5', productoId: 'p3', numero: 301, fecha: '2026-04-18', cantidadInicial: 420, cantidadActual: 420 },
  { id: 'l6', productoId: 'p4', numero: 401, fecha: '2026-04-10', cantidadInicial: 200, cantidadActual: 95  },
];

export const categoriasMP: CategoriaMP[] = [
  { id: 'cm1', nombre: 'Granos', subtipos: [
    { id: 'st1', nombre: 'Entero' },
    { id: 'st2', nombre: 'Partido Chico' },
    { id: 'st3', nombre: 'Partido Grande' },
  ]},
  { id: 'cm2', nombre: 'Harinas' },
  { id: 'cm3', nombre: 'Aditivos' },
];

export const materiaPrima: MateriaPrimaStock[] = [
  { id: 'mp1', categoriaId: 'cm1', nombre: 'Frangollo Amarillo', unidad: 'QQ', stockEntero: 85, stockParChico: 32, stockParGrande: 41, stockTotal: 158, stockMinimo: 100 },
  { id: 'mp2', categoriaId: 'cm1', nombre: 'Frangollo Blanco',   unidad: 'QQ', stockEntero: 60, stockParChico: 24, stockParGrande: 18, stockTotal: 102, stockMinimo: 80  },
  { id: 'mp3', categoriaId: 'cm2', nombre: 'Harina Precocida',   unidad: 'KG', stockTotal: 2400, stockMinimo: 500 },
  { id: 'mp4', categoriaId: 'cm3', nombre: 'Sal',                unidad: 'KG', stockTotal: 320,  stockMinimo: 100 },
  { id: 'mp5', categoriaId: 'cm3', nombre: 'Aceite Vegetal',     unidad: 'LT', stockTotal: 180,  stockMinimo: 60  },
];

export const proveedores: Proveedor[] = [
  { id: 'pv1', nombre: 'Agro Bolivia SRL',     ciudad: 'Santa Cruz',  telefono: '3-456-7890' },
  { id: 'pv2', nombre: 'Granos del Sur SA',    ciudad: 'Cochabamba',  telefono: '4-567-8901' },
  { id: 'pv3', nombre: 'Molinera Andina LTDA', ciudad: 'La Paz',      telefono: '2-678-9012' },
];

export const clientes: Cliente[] = [
  { id: 'cl1', nombre: 'Distribuidora El Trigo',   ciudad: 'Santa Cruz', telefono: '7-601-2345', nit: '1234567890' },
  { id: 'cl2', nombre: 'Supermercados Fidalga',     ciudad: 'Santa Cruz', telefono: '3-333-4444' },
  { id: 'cl3', nombre: 'Cooperativa El Campesino',  ciudad: 'Cochabamba', telefono: '4-111-2222' },
  { id: 'cl4', nombre: 'Tiendas Naturales Bolivia', ciudad: 'La Paz',     telefono: '2-777-8888', nit: '9876543210' },
  { id: 'cl5', nombre: 'Exportadora Pacífico SAM',  ciudad: 'Santa Cruz', telefono: '7-999-0000' },
];

export const transportistas: Transportista[] = [
  { id: 't1', nombre: 'Pedro Garnica', empresa: 'Transporte Garnica', placa: 'SCZ-2341', marca: 'Toyota Hilux',    telefono: '7-123-4567' },
  { id: 't2', nombre: 'Hugo Vásquez',  empresa: 'Express Vásquez',    placa: 'SCZ-8821', marca: 'Nissan Frontier', telefono: '7-234-5678' },
  { id: 't3', nombre: 'Ramón Flores',  placa: 'LP-5543',  marca: 'Ford F-150', telefono: '7-345-6789' },
];

function makeVentas(): Venta[] {
  const base: Omit<Venta, 'id' | 'numero' | 'numeroGuia'>[] = [
    { fecha: '2026-04-01', clienteId: 'cl1', clienteNombre: 'Distribuidora El Trigo',   detalles: [{ productoId: 'p1', productoNombre: 'Harina de Maíz Amarillo 1kg', cantidad: 500, unidad: 'BOL', precioUnitario: 8.5, loteId: 'l1', loteNum: 101, totalBs: 4250 }], subtotalBs: 4250, descuentoBs: 0,   totalBs: 4250, transportistaId: 't1', estado: 'entregado', tipoFlete: 'sin_flete' },
    { fecha: '2026-04-05', clienteId: 'cl2', clienteNombre: 'Supermercados Fidalga',    detalles: [{ productoId: 'p1', productoNombre: 'Harina de Maíz Amarillo 1kg', cantidad: 200, unidad: 'BOL', precioUnitario: 8.5, loteId: 'l1', loteNum: 101, totalBs: 1700 }, { productoId: 'p2', productoNombre: 'Harina de Maíz Blanco 1kg', cantidad: 150, unidad: 'BOL', precioUnitario: 8.5, loteId: 'l3', loteNum: 201, totalBs: 1275 }], subtotalBs: 2975, descuentoBs: 75, totalBs: 2900, transportistaId: 't2', estado: 'entregado', tipoFlete: 'incluido_en_venta', fleteBs: 230 },
    { fecha: '2026-04-12', clienteId: 'cl3', clienteNombre: 'Cooperativa El Campesino', detalles: [{ productoId: 'p3', productoNombre: 'Semolina Maíz Amarillo 500g', cantidad: 300, unidad: 'BOL', precioUnitario: 5.5, loteId: 'l5', loteNum: 301, totalBs: 1650 }], subtotalBs: 1650, descuentoBs: 0, totalBs: 1650, transportistaId: 't1', estado: 'entregado', tipoFlete: 'cliente_paga_directo' },
    { fecha: '2026-04-20', clienteId: 'cl4', clienteNombre: 'Tiendas Naturales Bolivia',detalles: [{ productoId: 'p1', productoNombre: 'Harina de Maíz Amarillo 1kg', cantidad: 100, unidad: 'BOL', precioUnitario: 8.5, loteId: 'l1', loteNum: 101, totalBs: 850 }], subtotalBs: 850, descuentoBs: 0, totalBs: 850, transportistaId: 't3', estado: 'despachado', tipoFlete: 'sin_flete' },
    { fecha: '2026-05-02', clienteId: 'cl1', clienteNombre: 'Distribuidora El Trigo',   detalles: [{ productoId: 'p1', productoNombre: 'Harina de Maíz Amarillo 1kg', cantidad: 400, unidad: 'BOL', precioUnitario: 8.5, loteId: 'l2', loteNum: 102, totalBs: 3400 }, { productoId: 'p2', productoNombre: 'Harina de Maíz Blanco 1kg', cantidad: 200, unidad: 'BOL', precioUnitario: 8.5, loteId: 'l4', loteNum: 202, totalBs: 1700 }], subtotalBs: 5100, descuentoBs: 100, totalBs: 5000, transportistaId: 't1', estado: 'pendiente', tipoFlete: 'grano_rey_paga', fleteBs: 350 },
    { fecha: '2026-05-06', clienteId: 'cl5', clienteNombre: 'Exportadora Pacífico SAM', detalles: [{ productoId: 'p3', productoNombre: 'Semolina Maíz Amarillo 500g', cantidad: 120, unidad: 'BOL', precioUnitario: 5.5, loteId: 'l5', loteNum: 301, totalBs: 660 }], subtotalBs: 660, descuentoBs: 0, totalBs: 660, transportistaId: 't2', estado: 'pendiente', tipoFlete: 'cliente_paga_directo' },
    { fecha: '2026-05-08', clienteId: 'cl2', clienteNombre: 'Supermercados Fidalga',    detalles: [{ productoId: 'p4', productoNombre: 'Crema de Maíz Amarillo 250g', cantidad: 80, unidad: 'BOL', precioUnitario: 4, loteId: 'l6', loteNum: 401, totalBs: 320 }], subtotalBs: 320, descuentoBs: 0, totalBs: 320, transportistaId: 't3', estado: 'pendiente', tipoFlete: 'sin_flete' },
  ];
  return base.map((v, i) => ({ ...v, id: `v${i + 1}`, numero: 1001 + i, numeroGuia: 5001 + i }));
}
export const ventas: Venta[] = makeVentas();

export const lotesProduccion: LoteProduccion[] = [
  { id: 'lp1', productoId: 'p1', numero: 101, fecha: '2026-04-15', cantidad: 600, responsable: 'Luis Mamani',  observaciones: 'Primer lote del mes' },
  { id: 'lp2', productoId: 'p1', numero: 102, fecha: '2026-04-28', cantidad: 700, responsable: 'Luis Mamani' },
  { id: 'lp3', productoId: 'p2', numero: 201, fecha: '2026-04-20', cantidad: 500, responsable: 'Carlos Rojas' },
  { id: 'lp4', productoId: 'p2', numero: 202, fecha: '2026-05-01', cantidad: 450, responsable: 'Luis Mamani' },
  { id: 'lp5', productoId: 'p3', numero: 301, fecha: '2026-04-18', cantidad: 420, responsable: 'Carlos Rojas' },
  { id: 'lp6', productoId: 'p4', numero: 401, fecha: '2026-04-10', cantidad: 200, responsable: 'Luis Mamani',  observaciones: 'Lote especial exportación' },
];

// ─── Gastos mock ──────────────────────────────────────────────────────────────
export const gastos: Gasto[] = [
  { id: 'g1',  fecha: '2026-05-02', categoria: 'materia_prima', descripcion: 'Compra Frangollo Blanco · 10 QQ · Lote 003',         montoBs: 1500, esAutomatico: true  },
  { id: 'g2',  fecha: '2026-05-02', categoria: 'transporte',    descripcion: 'Flete venta N°1005 · Distribuidora El Trigo',         montoBs: 350,  esAutomatico: true  },
  { id: 'g3',  fecha: '2026-04-05', categoria: 'transporte',    descripcion: 'Flete venta N°1002 · Supermercados Fidalga',          montoBs: 230,  esAutomatico: true  },
  { id: 'g4',  fecha: '2026-05-05', categoria: 'mano_de_obra',  descripcion: 'Sueldo semanal operarios — semana 18',                montoBs: 1800, esAutomatico: false },
  { id: 'g5',  fecha: '2026-05-07', categoria: 'servicios',     descripcion: 'Energía eléctrica — abril',                          montoBs: 450,  esAutomatico: false },
  { id: 'g6',  fecha: '2026-05-01', categoria: 'servicios',     descripcion: 'Agua industrial',                                    montoBs: 180,  esAutomatico: false },
  { id: 'g7',  fecha: '2026-04-15', categoria: 'materia_prima', descripcion: 'Compra Frangollo Amarillo · 8 QQ · Lote 002',        montoBs: 1200, esAutomatico: true  },
  { id: 'g8',  fecha: '2026-04-28', categoria: 'mano_de_obra',  descripcion: 'Sueldo semanal operarios — semana 17',               montoBs: 1800, esAutomatico: false },
  { id: 'g9',  fecha: '2026-05-03', categoria: 'otros',         descripcion: 'Material de embalaje',                               montoBs: 320,  esAutomatico: false },
  { id: 'g10', fecha: '2026-04-20', categoria: 'servicios',     descripcion: 'Mantenimiento maquinaria',                           montoBs: 650,  esAutomatico: false },
];

// ─── Movimientos MP mock ──────────────────────────────────────────────────────
export const movimientosMP: MovimientoMP[] = [
  { id: 'mm1', fecha: '2026-05-02', mpId: 'mp2', mpNombre: 'Frangollo Blanco',   tipo: 'ingreso', entero: 6,  parChico: 2, parGrande: 2, totalQQ: 10, costoBs: 1500, proveedorId: 'pv1', lote: 3,   responsable: 'Luis Mamani'  },
  { id: 'mm2', fecha: '2026-04-15', mpId: 'mp1', mpNombre: 'Frangollo Amarillo', tipo: 'ingreso', entero: 5,  parChico: 2, parGrande: 1, totalQQ: 8,  costoBs: 1200, proveedorId: 'pv2', lote: 2,   responsable: 'Carlos Rojas' },
  { id: 'mm3', fecha: '2026-04-01', mpId: 'mp1', mpNombre: 'Frangollo Amarillo', tipo: 'salida',  entero: 10, parChico: 3, parGrande: 5, totalQQ: 18, responsable: 'Luis Mamani'  },
  { id: 'mm4', fecha: '2026-04-10', mpId: 'mp2', mpNombre: 'Frangollo Blanco',   tipo: 'salida',  entero: 8,  parChico: 2, parGrande: 2, totalQQ: 12, responsable: 'Carlos Rojas' },
  { id: 'mm5', fecha: '2026-05-05', mpId: 'mp3', mpNombre: 'Harina Precocida',   tipo: 'ingreso', totalQQ: 500, costoBs: 750, proveedorId: 'pv3', responsable: 'Luis Mamani'  },
  { id: 'mm6', fecha: '2026-04-25', mpId: 'mp3', mpNombre: 'Harina Precocida',   tipo: 'salida',  totalQQ: 300, responsable: 'Carlos Rojas' },
  { id: 'mm7', fecha: '2026-05-01', mpId: 'mp4', mpNombre: 'Sal',                tipo: 'ingreso', totalQQ: 100, costoBs: 200, responsable: 'Luis Mamani'  },
];

// ─── Derived stats ────────────────────────────────────────────────────────────
export function statsDelMes() {
  const mesKey = '2026-05';
  const delMes = ventas.filter(v => v.fecha.startsWith(mesKey));
  const totalVentas = delMes.reduce((s, v) => s + v.totalBs, 0);
  const pendientes  = ventas.filter(v => v.estado === 'pendiente').length;
  const totalStock  = productos.reduce((s, p) => s + p.stockActual, 0);
  const totalQQ     = productos.reduce((s, p) => s + p.stockActual * p.kgPorBolsa / 46, 0);
  const totalMP     = materiaPrima.reduce((s, m) => s + m.stockTotal, 0);
  return { totalVentas, notasMes: delMes.length, pendientes, totalStock, totalQQ, totalMP };
}

export function ventasPorMes() {
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const now = new Date('2026-05-09');
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monto = ventas.filter(v => v.fecha.startsWith(key)).reduce((s, v) => s + v.totalBs, 0);
    return { mes: meses[d.getMonth()], monto };
  });
}

export function lotesParaProducto(productoId: string): Lote[] {
  return lotes.filter(l => l.productoId === productoId && l.cantidadActual > 0)
    .sort((a, b) => a.fecha.localeCompare(b.fecha)); // FIFO
}

// ─── Financial reporting ──────────────────────────────────────────────────────
export function resumenFinanciero(periodo: 'mes_actual' | 'mes_anterior' = 'mes_actual') {
  const key = periodo === 'mes_actual' ? '2026-05' : '2026-04';
  const ingresosVentas = ventas.filter(v => v.fecha.startsWith(key)).reduce((s, v) => s + v.totalBs, 0);
  const gastosDelPeriodo = gastos.filter(g => g.fecha.startsWith(key));
  const egresos = gastosDelPeriodo.reduce((s, g) => s + g.montoBs, 0);
  const utilidad = ingresosVentas - egresos;
  const margen = ingresosVentas > 0 ? (utilidad / ingresosVentas) * 100 : 0;
  return { ingresosBs: ingresosVentas, egresosBs: egresos, utilidadBs: utilidad, margenPct: margen };
}

export function gastosPorCategoria(periodo: 'mes_actual' | 'mes_anterior' = 'mes_actual') {
  const key = periodo === 'mes_actual' ? '2026-05' : '2026-04';
  const g = gastos.filter(g => g.fecha.startsWith(key));
  const total = g.reduce((s, x) => s + x.montoBs, 0);
  const LABELS: Record<CategoriaGasto, string> = {
    materia_prima: 'Materia Prima', transporte: 'Transporte/Flete',
    mano_de_obra: 'Mano de Obra',  servicios: 'Servicios', otros: 'Otros',
  };
  const bycat = g.reduce((acc, x) => {
    if (!acc[x.categoria]) acc[x.categoria] = { label: LABELS[x.categoria], monto: 0, esAutomatico: x.esAutomatico };
    acc[x.categoria].monto += x.montoBs;
    return acc;
  }, {} as Record<string, { label: string; monto: number; esAutomatico: boolean }>);
  return Object.values(bycat).map(c => ({ ...c, pct: total > 0 ? (c.monto / total) * 100 : 0 })).sort((a, b) => b.monto - a.monto);
}

export function ventasPorSemana(periodo: 'mes_actual' | 'mes_anterior' = 'mes_actual') {
  const key = periodo === 'mes_actual' ? '2026-05' : '2026-04';
  const g = gastos.filter(x => x.fecha.startsWith(key));
  const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
  return weeks.map((sem, i) => {
    const d1 = i * 7 + 1; const d2 = d1 + 6;
    const ing = ventas.filter(v => {
      if (!v.fecha.startsWith(key)) return false;
      const day = parseInt(v.fecha.slice(8, 10));
      return day >= d1 && day <= d2;
    }).reduce((s, v) => s + v.totalBs, 0);
    const egr = g.filter(x => {
      const day = parseInt(x.fecha.slice(8, 10));
      return day >= d1 && day <= d2;
    }).reduce((s, x) => s + x.montoBs, 0);
    return { sem, ingresos: ing, egresos: egr };
  });
}
