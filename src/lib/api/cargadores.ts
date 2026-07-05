import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type {
  Cargador,
  CargaTrabajo,
  CreateCargadorRequest,
  UpdateCargadorRequest,
  UpdateCargaTrabajoRequest,
  PagarBulkRequest,
  DeudaCargador,
  DeudaItem,
  PagoCargadorResponse,
  ReporteCargadores,
} from '../types';
import { gastosKeys } from './gastos';
import { mpKeys } from './materia-prima';
import { ventasKeys } from './ventas';

export const cargadoresKeys = {
  all: ['cargadores'] as const,
  detail: (id: string) => ['cargadores', id] as const,
  deudaTotal: ['cargadores', 'deuda'] as const,
  deuda: (id: string) => ['cargadores', id, 'deuda'] as const,
  cargas: (id: string, filtros?: object) =>
    ['cargadores', id, 'cargas', filtros ?? {}] as const,
  todasCargas: (pagado?: boolean, desde?: string, hasta?: string) =>
    ['cargadores', 'todas-cargas', pagado ?? null, desde ?? null, hasta ?? null] as const,
  reporte: (desde?: string, hasta?: string) =>
    ['cargadores', 'reporte', desde ?? null, hasta ?? null] as const,
};

export function useTodasCargas(
  pagado?: boolean,
  desde?: string,
  hasta?: string,
  opts: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: cargadoresKeys.todasCargas(pagado, desde, hasta),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (typeof pagado === 'boolean') params.pagado = String(pagado);
      if (desde) params.desde = desde;
      if (hasta) params.hasta = hasta;
      const { data } = await api.get<DeudaItem[]>('/cargadores/todas-cargas', { params });
      return data;
    },
    enabled: opts.enabled !== false,
  });
}

// ── Cargadores ───────────────────────────────────────────────
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

export function useDeleteCargador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/cargadores/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: cargadoresKeys.all }),
  });
}

// ── Deuda ─────────────────────────────────────────────────────
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

// ── Cargas de trabajo ─────────────────────────────────────────
type CargasFiltros = { pagado?: boolean; desde?: string; hasta?: string };

export function useCargasCargador(id: string | undefined, filtros: CargasFiltros = {}) {
  return useQuery({
    queryKey: id
      ? cargadoresKeys.cargas(id, filtros)
      : ['cargadores', 'noop', 'cargas'],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (typeof filtros.pagado === 'boolean') params.pagado = String(filtros.pagado);
      if (filtros.desde) params.desde = filtros.desde;
      if (filtros.hasta) params.hasta = filtros.hasta;
      const { data } = await api.get<CargaTrabajo[]>(`/cargadores/${id}/cargas`, { params });
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateCargaTrabajo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateCargaTrabajoRequest }) =>
      (await api.patch<CargaTrabajo>(`/cargadores/cargas/${id}`, dto)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cargadoresKeys.all });
      qc.invalidateQueries({ queryKey: cargadoresKeys.deudaTotal });
      qc.invalidateQueries({ queryKey: ['cargadores', 'todas-cargas'] });
    },
  });
}

export function usePagarCarga() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fechaPago }: { id: string; fechaPago?: string }) =>
      (await api.post<PagoCargadorResponse>(`/cargadores/cargas/${id}/pagar`, { fechaPago })).data,
    onSuccess: invalidateCargasQueries(qc),
  });
}

export function usePagarCargasBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: PagarBulkRequest) =>
      (await api.post<PagoCargadorResponse>('/cargadores/cargas/pagar-bulk', dto)).data,
    onSuccess: invalidateCargasQueries(qc),
  });
}

function invalidateCargasQueries(qc: ReturnType<typeof useQueryClient>) {
  return () => {
    qc.invalidateQueries({ queryKey: cargadoresKeys.all });
    qc.invalidateQueries({ queryKey: cargadoresKeys.deudaTotal });
    qc.invalidateQueries({ queryKey: ['cargadores', 'todas-cargas'] });
    qc.invalidateQueries({ queryKey: gastosKeys.all });
    qc.invalidateQueries({ queryKey: mpKeys.kardex() });
    qc.invalidateQueries({ queryKey: ventasKeys.all });
  };
}

// ── Reporte ──────────────────────────────────────────────────
export function useReporteCargadores(desde?: string, hasta?: string) {
  return useQuery({
    queryKey: cargadoresKeys.reporte(desde, hasta),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (desde) params.desde = desde;
      if (hasta) params.hasta = hasta;
      const { data } = await api.get<ReporteCargadores>('/cargadores/reporte', { params });
      return data;
    },
  });
}
