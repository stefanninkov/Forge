import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

/* ─── Template Types ─── */

interface CommunityTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  type: 'SKELETON' | 'STYLED';
  tags: string[];
  authorName: string;
  downloads: number;
  likes: number;
  featured: boolean;
  isLiked: boolean;
  publishedAt: string;
}

interface TemplateBrowseResponse {
  data: CommunityTemplate[];
  total: number;
  hasMore: boolean;
}

interface TemplateBrowseFilters {
  category?: string;
  type?: string;
  search?: string;
  sort?: 'recent' | 'popular' | 'most-liked';
  featured?: boolean;
  skip?: number;
  take?: number;
}

/* ─── Preset Types ─── */

interface CommunityPreset {
  id: string;
  name: string;
  description: string | null;
  engine: 'CSS' | 'GSAP';
  trigger: string;
  category: string;
  authorName: string;
  downloads: number;
  publishedAt: string;
}

interface PresetBrowseResponse {
  data: CommunityPreset[];
  total: number;
  hasMore: boolean;
}

interface PresetBrowseFilters {
  engine?: string;
  trigger?: string;
  search?: string;
  sort?: 'recent' | 'popular' | 'name';
  skip?: number;
  take?: number;
}

/* ─── Helpers ─── */

function buildQueryString(filters: Record<string, string | number | boolean | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/* ─── Template Hooks ─── */

export function useCommunityTemplates(filters: TemplateBrowseFilters = {}) {
  const qs = buildQueryString(filters);
  return useQuery({
    queryKey: ['community', 'templates', filters],
    queryFn: () => api.get<TemplateBrowseResponse>(`/community/templates${qs}`).then((r) => r.data),
  });
}

export function useCommunityTemplate(id: string | null) {
  return useQuery({
    queryKey: ['community', 'template', id],
    queryFn: () => api.get<{ data: CommunityTemplate }>(`/community/browse/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function usePublishTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) =>
      api.post<{ data: CommunityTemplate }>(`/community/templates/${templateId}/publish`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Template published to community');
      qc.invalidateQueries({ queryKey: ['community'] });
      qc.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useUnpublishTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) =>
      api.post(`/community/templates/${templateId}/unpublish`),
    onSuccess: () => {
      toast.success('Template unpublished');
      qc.invalidateQueries({ queryKey: ['community'] });
      qc.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useInstallTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) =>
      api.post<{ data: unknown }>(`/community/templates/${templateId}/install`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Template installed to your library');
      qc.invalidateQueries({ queryKey: ['community'] });
      qc.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

/* ─── Preset Hooks ─── */

export function useCommunityPresets(filters: PresetBrowseFilters = {}) {
  const qs = buildQueryString(filters);
  return useQuery({
    queryKey: ['community', 'presets', filters],
    queryFn: () => api.get<PresetBrowseResponse>(`/community/presets${qs}`).then((r) => r.data),
  });
}

export function usePublishPreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (presetId: string) =>
      api.post<{ data: CommunityPreset }>(`/community/presets/${presetId}/publish`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Preset published to community');
      qc.invalidateQueries({ queryKey: ['community'] });
      qc.invalidateQueries({ queryKey: ['animations'] });
    },
  });
}

export function useUnpublishPreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (presetId: string) =>
      api.post(`/community/presets/${presetId}/unpublish`),
    onSuccess: () => {
      toast.success('Preset unpublished');
      qc.invalidateQueries({ queryKey: ['community'] });
      qc.invalidateQueries({ queryKey: ['animations'] });
    },
  });
}

export function useInstallPreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (presetId: string) =>
      api.post<{ data: unknown }>(`/community/presets/${presetId}/install`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Animation preset installed');
      qc.invalidateQueries({ queryKey: ['community'] });
      qc.invalidateQueries({ queryKey: ['animations'] });
    },
  });
}

/* ─── Utility Hooks ─── */

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (communityId: string) =>
      api.post<{ data: { liked: boolean } }>(`/community/browse/${communityId}/like`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community'] });
    },
  });
}

export function useMyPublished() {
  return useQuery({
    queryKey: ['community', 'mine'],
    queryFn: () =>
      api.get<{
        data: Array<{
          id: string;
          templateId: string;
          name: string;
          category: string;
          downloads: number;
          likes: number;
          publishedAt: string;
        }>;
      }>('/community/mine').then((r) => r.data),
  });
}

export type { CommunityTemplate, CommunityPreset, TemplateBrowseFilters, PresetBrowseFilters };
