import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type {
  MateriaPrima,
  KardexMP,
  CreateMateriaPrimaRequest,
  UpdateMateriaPrimaRequest,
  CreateKardexMPRequest,
} from '../types';

export const mpKeys = {
  all: ['materias-primas'] as const,
  detail: (id: string) => ['materias-primas', id] as const,
  kardex: (mpId?: string) =>
    mpId ? (['kardex-mp', mpId] as const) : (['kardex-mp'] as const),
  pendientesPago: ['kardex-mp', 'pendientes-pago'] as const,
};

export function useMateriasPrimas() {
  return useQuery({
    queryKey: mpKeys.all,
    queryFn: async () => (await api.get<MateriaPrima[]>('/materias-primas')).data,
  });
}

export function useCreateMateriaPrima() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateMateriaPrimaRequest) =>
      (await api.post<MateriaPrima>('/materias-primas', dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: mpKeys.all }),
  });
}

export function useUpdateMateriaPrima() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateMateriaPrimaRequest }) =>
      (await api.patch<MateriaPrima>(`/materias-primas/${id}`, dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: mpKeys.all }),
  });
}

export function useKardexMP(materiaPrimaId?: string) {
  return useQuery({
    queryKey: mpKeys.kardex(materiaPrimaId),
    queryFn: async () =>
      (
        await api.get<KardexMP[]>('/kardex-mp', {
          params: materiaPrimaId ? { materiaPrimaId } : undefined,
        })
      ).data,
    // Cuando se pasa string vacío ('') el query queda desactivado
    enabled: materiaPrimaId !== '',
  });
}

export function useCreateKardexMP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateKardexMPRequest) =>
      (await api.post<KardexMP>('/kardex-mp', dto)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mpKeys.kardex() });
      qc.invalidateQueries({ queryKey: mpKeys.all });
    },
  });
}

export function useKardexMPPendientesPago() {
  return useQuery({
    queryKey: mpKeys.pendientesPago,
    queryFn: async () => (await api.get<KardexMP[]>('/kardex-mp/pendientes-pago')).data,
  });
}

export function usePagarKardexMP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.patch(`/kardex-mp/${id}/pagar`, {})).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mpKeys.kardex() });
      qc.invalidateQueries({ queryKey: mpKeys.pendientesPago });
    },
  });
}
