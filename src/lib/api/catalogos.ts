import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type {
  Cliente,
  Proveedor,
  Transportista,
  UnidadMedida,
  CategoriaMP,
  SubtipoMP,
  CreateClienteRequest,
  UpdateClienteRequest,
  CreateProveedorRequest,
  UpdateProveedorRequest,
  CreateTransportistaRequest,
  UpdateTransportistaRequest,
  CreateCategoriaMPRequest,
} from '../types';

// ─── Keys ────────────────────────────────────────────────────
export const catalogosKeys = {
  clientes: ['clientes'] as const,
  proveedores: ['proveedores'] as const,
  transportistas: ['transportistas'] as const,
  unidades: ['unidades-medida'] as const,
  categoriasMp: ['categorias-mp'] as const,
  subtiposMp: (categoriaId?: string) =>
    categoriaId ? (['subtipos-mp', categoriaId] as const) : (['subtipos-mp'] as const),
};

// ─── Clientes ────────────────────────────────────────────────
export function useClientes() {
  return useQuery({
    queryKey: catalogosKeys.clientes,
    queryFn: async () => (await api.get<Cliente[]>('/clientes')).data,
  });
}

export function useCreateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateClienteRequest) =>
      (await api.post<Cliente>('/clientes', dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogosKeys.clientes }),
  });
}

export function useUpdateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateClienteRequest }) =>
      (await api.patch<Cliente>(`/clientes/${id}`, dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogosKeys.clientes }),
  });
}

// ─── Proveedores ─────────────────────────────────────────────
export function useProveedores() {
  return useQuery({
    queryKey: catalogosKeys.proveedores,
    queryFn: async () => (await api.get<Proveedor[]>('/proveedores')).data,
  });
}

export function useCreateProveedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateProveedorRequest) =>
      (await api.post<Proveedor>('/proveedores', dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogosKeys.proveedores }),
  });
}

export function useUpdateProveedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateProveedorRequest }) =>
      (await api.patch<Proveedor>(`/proveedores/${id}`, dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogosKeys.proveedores }),
  });
}

// ─── Transportistas ──────────────────────────────────────────
export function useTransportistas() {
  return useQuery({
    queryKey: catalogosKeys.transportistas,
    queryFn: async () => (await api.get<Transportista[]>('/transportistas')).data,
  });
}

export function useCreateTransportista() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateTransportistaRequest) =>
      (await api.post<Transportista>('/transportistas', dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogosKeys.transportistas }),
  });
}

export function useUpdateTransportista() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateTransportistaRequest }) =>
      (await api.patch<Transportista>(`/transportistas/${id}`, dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogosKeys.transportistas }),
  });
}

// ─── Unidades de medida ──────────────────────────────────────
export function useUnidades() {
  return useQuery({
    queryKey: catalogosKeys.unidades,
    queryFn: async () => (await api.get<UnidadMedida[]>('/unidades-medida')).data,
  });
}

export function useCreateUnidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { codigo: string; nombre: string; abreviatura?: string; tipo: string; factorABase: number }) =>
      (await api.post<UnidadMedida>('/unidades-medida', dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogosKeys.unidades }),
  });
}

export function useUpdateUnidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: Partial<{ codigo: string; nombre: string; abreviatura: string; tipo: string; factorABase: number }> }) =>
      (await api.patch<UnidadMedida>(`/unidades-medida/${id}`, dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogosKeys.unidades }),
  });
}

export function useDeleteUnidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/unidades-medida/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogosKeys.unidades }),
  });
}

// ─── Categorías MP ───────────────────────────────────────────
export function useCategoriasMP() {
  return useQuery({
    queryKey: catalogosKeys.categoriasMp,
    queryFn: async () => (await api.get<CategoriaMP[]>('/categorias-mp')).data,
  });
}

export function useCreateCategoriaMP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateCategoriaMPRequest) =>
      (await api.post<CategoriaMP>('/categorias-mp', dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogosKeys.categoriasMp }),
  });
}

// ─── Subtipos MP ─────────────────────────────────────────────
export function useSubtiposMP(categoriaId?: string) {
  return useQuery({
    queryKey: catalogosKeys.subtiposMp(categoriaId),
    queryFn: async () =>
      (
        await api.get<SubtipoMP[]>('/subtipos-mp', {
          params: categoriaId ? { categoriaId } : undefined,
        })
      ).data,
  });
}
