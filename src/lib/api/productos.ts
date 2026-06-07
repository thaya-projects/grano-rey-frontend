import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type {
  Producto,
  KardexProducto,
  CreateProductoRequest,
  UpdateProductoRequest,
  CreateKardexProductoRequest,
} from '../types';

export const productosKeys = {
  all: ['productos'] as const,
  detail: (id: string) => ['productos', id] as const,
  kardex: (productoId?: string) =>
    productoId ? (['kardex-productos', productoId] as const) : (['kardex-productos'] as const),
};

export function useProductos() {
  return useQuery({
    queryKey: productosKeys.all,
    queryFn: async () => (await api.get<Producto[]>('/productos')).data,
  });
}

export function useProducto(id: string | undefined) {
  return useQuery({
    queryKey: id ? productosKeys.detail(id) : ['productos', 'noop'],
    queryFn: async () => (await api.get<Producto>(`/productos/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateProductoRequest) =>
      (await api.post<Producto>('/productos', dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: productosKeys.all }),
  });
}

export function useUpdateProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateProductoRequest }) =>
      (await api.patch<Producto>(`/productos/${id}`, dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: productosKeys.all }),
  });
}

export function useKardexProductos(productoId?: string) {
  return useQuery({
    queryKey: productosKeys.kardex(productoId),
    queryFn: async () =>
      (
        await api.get<KardexProducto[]>('/kardex-productos', {
          params: productoId ? { productoId } : undefined,
        })
      ).data,
  });
}

export function useCreateKardexProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateKardexProductoRequest) =>
      (await api.post<KardexProducto>('/kardex-productos', dto)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productosKeys.kardex() });
      qc.invalidateQueries({ queryKey: productosKeys.all });
    },
  });
}
