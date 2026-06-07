import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { Empresa, ActualizarConfiguracionRequest } from '../types';

export const empresaKeys = {
  current: ['empresa'] as const,
};

export function useEmpresa() {
  return useQuery({
    queryKey: empresaKeys.current,
    queryFn: async () => (await api.get<Empresa>('/empresas')).data,
  });
}

export function useActualizarConfiguracion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: ActualizarConfiguracionRequest) =>
      (await api.patch<Empresa>('/empresas/configuracion', dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: empresaKeys.current }),
  });
}
