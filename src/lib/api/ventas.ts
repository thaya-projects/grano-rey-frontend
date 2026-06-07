import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { NotaVenta, EstadoVenta, CreateVentaRequest } from '../types';
import { productosKeys } from './productos';
import { lotesKeys } from './produccion';

export const ventasKeys = {
  all: ['ventas'] as const,
  detail: (id: string) => ['ventas', id] as const,
};

export function useVentas() {
  return useQuery({
    queryKey: ventasKeys.all,
    queryFn: async () => (await api.get<NotaVenta[]>('/ventas')).data,
  });
}

export function useVenta(id: string | undefined) {
  return useQuery({
    queryKey: id ? ventasKeys.detail(id) : ['ventas', 'noop'],
    queryFn: async () => (await api.get<NotaVenta>(`/ventas/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateVenta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateVentaRequest) =>
      (await api.post<NotaVenta>('/ventas', dto)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ventasKeys.all });
      qc.invalidateQueries({ queryKey: productosKeys.all });
      qc.invalidateQueries({ queryKey: lotesKeys.all });
      qc.invalidateQueries({ queryKey: ['gastos'] });
    },
  });
}

export function useCambiarEstadoVenta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: EstadoVenta }) =>
      (await api.patch<NotaVenta>(`/ventas/${id}/estado`, { estado })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ventasKeys.all }),
  });
}
