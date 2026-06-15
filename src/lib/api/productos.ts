import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type {
  Producto,
  ProductoImagen,
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

export function useUploadProductoImagenes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productoId, files }: { productoId: string; files: File[] }) => {
      const formData = new FormData();
      files.forEach(f => formData.append('imagenes', f));
      return (await api.post<ProductoImagen[]>(
        `/productos/${productoId}/imagenes/upload`,
        formData,
        { headers: { 'Content-Type': null } },
      )).data;
    },
    onSuccess: (_, { productoId }) => {
      qc.invalidateQueries({ queryKey: productosKeys.all });
      qc.invalidateQueries({ queryKey: productosKeys.detail(productoId) });
    },
  });
}

export function useSetPrincipalImagen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productoId, imagenId }: { productoId: string; imagenId: string }) =>
      (await api.patch(`/productos/${productoId}/imagenes/${imagenId}/principal`, {})).data,
    onSuccess: (_, { productoId }) => {
      qc.invalidateQueries({ queryKey: productosKeys.all });
      qc.invalidateQueries({ queryKey: productosKeys.detail(productoId) });
    },
  });
}

export function useDeleteProductoImagen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productoId, imagenId }: { productoId: string; imagenId: string }) =>
      (await api.delete(`/productos/${productoId}/imagenes/${imagenId}`)).data,
    onSuccess: (_, { productoId }) => {
      qc.invalidateQueries({ queryKey: productosKeys.all });
      qc.invalidateQueries({ queryKey: productosKeys.detail(productoId) });
    },
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
