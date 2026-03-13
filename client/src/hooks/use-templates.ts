import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { TemplateSummary, Template, TemplateFilters } from '@/types/template';

const KEYS = {
  all: ['templates'] as const,
  list: (filters: TemplateFilters) => [...KEYS.all, 'list', filters] as const,
  detail: (id: string) => [...KEYS.all, 'detail', id] as const,
};

export function useTemplates(filters: TemplateFilters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.type) params.set('type', filters.type);
  if (filters.search) params.set('search', filters.search);

  const qs = params.toString();

  return useQuery({
    queryKey: KEYS.list(filters),
    queryFn: async () => {
      const res = await api.get(`/templates${qs ? `?${qs}` : ''}`);
      return (res as { data: TemplateSummary[] }).data;
    },
  });
}

export function useTemplate(id: string | null) {
  return useQuery({
    queryKey: KEYS.detail(id ?? ''),
    queryFn: async () => {
      const res = await api.get(`/templates/${id}`);
      return (res as { data: Template }).data;
    },
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      category: string;
      type: 'SKELETON' | 'STYLED';
      structure: Record<string, unknown>;
      styles?: Record<string, unknown>;
      animationAttrs?: Record<string, unknown>;
      tags?: string[];
    }) => {
      const res = await api.post('/templates', data);
      return (res as { data: Template }).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; category?: string; type?: 'SKELETON' | 'STYLED'; structure?: Record<string, unknown>; tags?: string[] }) => {
      const res = await api.put(`/templates/${id}`, data);
      return (res as { data: Template }).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/templates/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useDuplicateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/templates/${id}/duplicate`, {});
      return (res as { data: Template }).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useSeedTemplates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/templates/seed', {});
      return res as { data: { seeded: boolean; count: number } };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
