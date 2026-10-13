import { RolUsuario } from '@/lib/types';

export const ROL_LABELS: Record<RolUsuario, string> = {
  administradora: 'Administrador',
  almacenero:     'Almacenero',
  vendedor:       'Vendedor',
  produccion:     'Producción',
};

export const ROL_COLORS: Record<RolUsuario, 'blue' | 'yellow' | 'green' | 'red' | 'gray'> = {
  administradora: 'red',
  almacenero:     'blue',
  vendedor:       'green',
  produccion:     'yellow',
};
