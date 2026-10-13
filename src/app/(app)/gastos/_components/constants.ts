import { CategoriaGasto } from '@/lib/types';

export const CATEGORIA_LABELS: Record<CategoriaGasto, string> = {
  transporte:        'Transporte',
  servicios_basicos: 'Servicios Básicos',
  mano_de_obra:      'Mano de Obra',
  mantenimiento:     'Mantenimiento',
  materia_prima:     'Materia Prima',
  administrativo:    'Administrativo',
  impuestos:         'Impuestos',
  otros:             'Otros',
};

export const CATEGORIA_COLORS: Record<CategoriaGasto, 'blue' | 'yellow' | 'green' | 'red' | 'gray'> = {
  transporte:        'blue',
  servicios_basicos: 'yellow',
  mano_de_obra:      'green',
  mantenimiento:     'yellow',
  materia_prima:     'green',
  administrativo:    'blue',
  impuestos:         'red',
  otros:             'gray',
};

export const FILTROS = ['Este mes', 'Mes anterior', 'Todos'] as const;
