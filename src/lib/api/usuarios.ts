import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { Usuario, CreateUsuarioRequest, UpdateUsuarioRequest } from '../types';

export const usuariosKeys = {
  all: ['usuarios'] as const,
  detail: (id: string) => ['usuarios', id] as const,
};

export function useUsuarios() {
  return useQuery({
    queryKey: usuariosKeys.all,
    queryFn: async () => (await api.get<Usuario[]>('/usuarios')).data,
  });
}

export function useCreateUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateUsuarioRequest) =>
      (await api.post<Usuario>('/usuarios', dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: usuariosKeys.all }),
  });
}

export function useUpdateUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateUsuarioRequest }) =>
      (await api.patch<Usuario>(`/usuarios/${id}`, dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: usuariosKeys.all }),
  });
}

export function useDeleteUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/usuarios/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: usuariosKeys.all }),
  });
}
