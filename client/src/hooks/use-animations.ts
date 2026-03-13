import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AnimationPreset,
  AnimationConfig,
  MasterScriptResponse,
  PresetFilters,
  AnimationEngine,
  AnimationTrigger,
} from '@/types/animation';

interface PresetsResponse {
  data: AnimationPreset[];
}

interface PresetResponse {
  data: AnimationPreset;
}

interface AnimationConfigResponse {
  data: AnimationConfig;
}

interface MasterScriptApiResponse {
  data: MasterScriptResponse;
}

interface SeedResponse {
  data: { seeded: boolean; count: number };
}

/** Fetch all animation presets with optional filters */
export function useAnimationPresets(filters: PresetFilters = {}) {
  const params = new URLSearchParams();
  if (filters.engine) params.set('engine', filters.engine);
  if (filters.trigger) params.set('trigger', filters.trigger);
  if (filters.category) params.set('category', filters.category);
  if (filters.search) params.set('search', filters.search);

  const queryString = params.toString();
  const path = `/animations${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: ['animation-presets', filters],
    queryFn: () => api.get<PresetsResponse>(path).then((r) => r.data),
  });
}

/** Fetch a single animation preset */
export function useAnimationPreset(presetId: string | null) {
  return useQuery({
    queryKey: ['animation-preset', presetId],
    queryFn: () =>
      api.get<PresetResponse>(`/animations/${presetId}`).then((r) => r.data),
    enabled: !!presetId,
  });
}

/** Create a custom animation preset */
export function useCreateAnimationPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      category: string;
      engine: AnimationEngine;
      trigger: AnimationTrigger;
      config: Record<string, unknown>;
      previewHtml?: string;
      tags?: string[];
    }) => api.post<PresetResponse>('/animations', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animation-presets'] });
    },
  });
}

/** Update a custom animation preset */
export function useUpdateAnimationPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      description?: string;
      category?: string;
      engine?: AnimationEngine;
      trigger?: AnimationTrigger;
      config?: Record<string, unknown>;
      previewHtml?: string;
      tags?: string[];
    }) => api.put<PresetResponse>(`/animations/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animation-presets'] });
    },
  });
}

/** Delete a custom animation preset */
export function useDeleteAnimationPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/animations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animation-presets'] });
    },
  });
}

/** Get project animation config */
export function useProjectAnimationConfig(projectId: string | null) {
  return useQuery({
    queryKey: ['project-animation-config', projectId],
    queryFn: () =>
      api
        .get<AnimationConfigResponse>(`/projects/${projectId}/animations`)
        .then((r) => r.data),
    enabled: !!projectId,
  });
}

/** Update project animation config */
export function useUpdateProjectAnimationConfig(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: Record<string, unknown>) =>
      api
        .put<AnimationConfigResponse>(`/projects/${projectId}/animations`, config)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-animation-config', projectId],
      });
    },
  });
}

/** Generate master animation script for a project */
export function useGenerateMasterScript(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api
        .post<MasterScriptApiResponse>(`/projects/${projectId}/animations/generate`)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['master-script', projectId],
      });
    },
  });
}

/** Seed system presets */
export function useSeedPresets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<SeedResponse>('/animations/seed').then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animation-presets'] });
    },
  });
}
