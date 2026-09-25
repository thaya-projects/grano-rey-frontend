import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { LoteProduccion, CreateLoteRequest } from '../types';
import { productosKeys } from './productos';
import { mpKeys } from './materia-prima';

export const lotesKeys = {
  all: ['lotes-produccion'] as const,
  detail: (id: string) => ['lotes-produccion', id] as const,
};

export function useLotes() {
  return useQuery({
    queryKey: lotesKeys.all,
    queryFn: async () => (await api.get<LoteProduccion[]>('/lotes-produccion')).data,
  });
}

export function useLote(id: string | undefined) {
  return useQuery({
    queryKey: id ? lotesKeys.detail(id) : ['lotes-produccion', 'noop'],
    queryFn: async () => (await api.get<LoteProduccion>(`/lotes-produccion/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateLote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateLoteRequest) =>
      (await api.post<LoteProduccion>('/lotes-produccion', dto)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lotesKeys.all });
      qc.invalidateQueries({ queryKey: productosKeys.all });
      // Registrar producción consume materia prima — refrescamos stock y kardex de MP,
      // si no la pantalla de Materia Prima muestra datos viejos (stock/lote sin descontar).
      qc.invalidateQueries({ queryKey: mpKeys.all });
      qc.invalidateQueries({ queryKey: mpKeys.kardex() });
    },
  });
}
