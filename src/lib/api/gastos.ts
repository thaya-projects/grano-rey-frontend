import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { Gasto, CreateGastoRequest } from '../types';

export const gastosKeys = {
  all: ['gastos'] as const,
  detail: (id: string) => ['gastos', id] as const,
};

export function useGastos() {
  return useQuery({
    queryKey: gastosKeys.all,
    queryFn: async () => (await api.get<Gasto[]>('/gastos')).data,
  });
}

export function useCreateGasto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateGastoRequest) =>
      (await api.post<Gasto>('/gastos', dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: gastosKeys.all }),
  });
}

export function useDeleteGasto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/gastos/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: gastosKeys.all }),
  });
}

export function useUploadComprobante() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append('comprobante', file);
      return (await api.post<Gasto>(`/gastos/${id}/comprobante`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: gastosKeys.all }),
  });
}

export function useDeleteComprobante() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/gastos/${id}/comprobante`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: gastosKeys.all }),
  });
}
