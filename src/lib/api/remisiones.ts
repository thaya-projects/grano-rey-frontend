import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { Remision, EstadoRemision, CreateRemisionRequest } from '../types';
import { ventasKeys } from './ventas';

export const remisionesKeys = {
  all: ['remisiones'] as const,
  detail: (id: string) => ['remisiones', id] as const,
};

export function useRemisiones() {
  return useQuery({
    queryKey: remisionesKeys.all,
    queryFn: async () => (await api.get<Remision[]>('/remisiones')).data,
  });
}

export function useCreateRemision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateRemisionRequest) =>
      (await api.post<Remision>('/remisiones', dto)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: remisionesKeys.all });
      qc.invalidateQueries({ queryKey: ventasKeys.all });
    },
  });
}

export function useCambiarEstadoRemision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: EstadoRemision }) =>
      (await api.patch<Remision>(`/remisiones/${id}/estado`, { estado })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: remisionesKeys.all });
      qc.invalidateQueries({ queryKey: ventasKeys.all });
    },
  });
}
