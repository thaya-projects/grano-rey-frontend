import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type {
  Cargador,
  CreateCargadorRequest,
  UpdateCargadorRequest,
  DeudaCargador,
  SaldarCargadorRequest,
  SaldoCargadorResponse,
} from '../types';
import { gastosKeys } from './gastos';
import { mpKeys } from './materia-prima';
import { remisionesKeys } from './remisiones';
import { empresaKeys } from './empresa';

export const cargadoresKeys = {
  all: ['cargadores'] as const,
  detail: (id: string) => ['cargadores', id] as const,
  tarifa: ['cargadores', 'tarifa'] as const,
  deudaTotal: ['cargadores', 'deuda'] as const,
  deuda: (id: string) => ['cargadores', id, 'deuda'] as const,
};

export function useCargadores() {
  return useQuery({
    queryKey: cargadoresKeys.all,
    queryFn: async () => (await api.get<Cargador[]>('/cargadores')).data,
  });
}

export function useCargador(id: string | undefined) {
  return useQuery({
    queryKey: id ? cargadoresKeys.detail(id) : ['cargadores', 'noop'],
    queryFn: async () => (await api.get<Cargador>(`/cargadores/${id}`)).data,
    enabled: !!id,
  });
}

export function useTarifaCarga() {
  return useQuery({
    queryKey: cargadoresKeys.tarifa,
    queryFn: async () =>
      (await api.get<{ tarifaPorBolsaBs: number }>('/cargadores/tarifa')).data,
  });
}

export function useDeudaCargadores() {
  return useQuery({
    queryKey: cargadoresKeys.deudaTotal,
    queryFn: async () => (await api.get<DeudaCargador[]>('/cargadores/deuda')).data,
  });
}

export function useDeudaCargador(id: string | undefined) {
  return useQuery({
    queryKey: id ? cargadoresKeys.deuda(id) : ['cargadores', 'noop', 'deuda'],
    queryFn: async () => (await api.get<DeudaCargador>(`/cargadores/${id}/deuda`)).data,
    enabled: !!id,
  });
}

export function useCreateCargador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateCargadorRequest) =>
      (await api.post<Cargador>('/cargadores', dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: cargadoresKeys.all }),
  });
}

export function useUpdateCargador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateCargadorRequest }) =>
      (await api.patch<Cargador>(`/cargadores/${id}`, dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: cargadoresKeys.all }),
  });
}

export function useSaldarCargador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: SaldarCargadorRequest }) =>
      (await api.post<SaldoCargadorResponse>(`/cargadores/${id}/saldar`, dto)).data,
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: cargadoresKeys.deuda(id) });
      qc.invalidateQueries({ queryKey: cargadoresKeys.deudaTotal });
      qc.invalidateQueries({ queryKey: gastosKeys.all });
      qc.invalidateQueries({ queryKey: mpKeys.kardex() });
      qc.invalidateQueries({ queryKey: remisionesKeys.all });
      qc.invalidateQueries({ queryKey: empresaKeys.current });
    },
  });
}
