import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  queryUserDocs,
  queryDocs,
  getDocument,
  createDocument,
  updateDocument,
  removeDocument,
  requireUid,
  where,
} from '@/lib/firestore';
import type {
  AnimationPreset,
  AnimationConfig,
  MasterScriptResponse,
  PresetFilters,
  AnimationEngine,
  AnimationTrigger,
} from '@/types/animation';

const PRESETS_COLLECTION = 'animationPresets';
const PROJECTS_COLLECTION = 'projects';

function applyClientFilters(
  presets: AnimationPreset[],
  filters: PresetFilters,
): AnimationPreset[] {
  let result = presets;

  if (filters.engine) {
    result = result.filter((p) => p.engine === filters.engine);
  }
  if (filters.trigger) {
    result = result.filter((p) => p.trigger === filters.trigger);
  }
  if (filters.category) {
    result = result.filter((p) => p.category === filters.category);
  }
  if (filters.search) {
    const term = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.tags.some((t) => t.toLowerCase().includes(term)),
    );
  }

  return result;
}

/** Fetch all animation presets with optional filters */
export function useAnimationPresets(filters: PresetFilters = {}) {
  return useQuery({
    queryKey: ['animation-presets', filters],
    queryFn: async () => {
      const [userPresets, systemPresets] = await Promise.all([
        queryUserDocs<AnimationPreset>(PRESETS_COLLECTION),
        queryDocs<AnimationPreset>(PRESETS_COLLECTION, [
          where('isSystem', '==', true),
        ]),
      ]);

      // Deduplicate: system presets that also match user query
      const userIds = new Set(userPresets.map((p) => p.id));
      const combined = [
        ...userPresets,
        ...systemPresets.filter((p) => !userIds.has(p.id)),
      ];

      return applyClientFilters(combined, filters);
    },
  });
}

/** Fetch a single animation preset */
export function useAnimationPreset(presetId: string | null) {
  return useQuery({
    queryKey: ['animation-preset', presetId],
    queryFn: () =>
      getDocument<AnimationPreset>(PRESETS_COLLECTION, presetId!),
    enabled: !!presetId,
  });
}

/** Create a custom animation preset */
export function useCreateAnimationPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      category: string;
      engine: AnimationEngine;
      trigger: AnimationTrigger;
      config: Record<string, unknown>;
      previewHtml?: string;
      tags?: string[];
    }) => {
      const id = await createDocument(PRESETS_COLLECTION, {
        name: data.name,
        description: data.description ?? null,
        category: data.category,
        engine: data.engine,
        trigger: data.trigger,
        config: data.config,
        previewHtml: data.previewHtml ?? null,
        isSystem: false,
        isPublished: false,
        tags: data.tags ?? [],
      });
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animation-presets'] });
    },
  });
}

/** Update a custom animation preset */
export function useUpdateAnimationPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
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
    }) => {
      await updateDocument(PRESETS_COLLECTION, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animation-presets'] });
    },
  });
}

/** Delete a custom animation preset */
export function useDeleteAnimationPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeDocument(PRESETS_COLLECTION, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animation-presets'] });
    },
  });
}

/** Get project animation config */
export function useProjectAnimationConfig(projectId: string | null) {
  return useQuery({
    queryKey: ['project-animation-config', projectId],
    queryFn: async () => {
      const project = await getDocument<{ animationConfig?: AnimationConfig }>(
        PROJECTS_COLLECTION,
        projectId!,
      );
      return project?.animationConfig ?? null;
    },
    enabled: !!projectId,
  });
}

/** Update project animation config */
export function useUpdateProjectAnimationConfig(projectId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: Record<string, unknown>) => {
      if (!projectId) throw new Error('Project ID is required');
      await updateDocument(PROJECTS_COLLECTION, projectId, {
        animationConfig: config,
      });
    },
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
    mutationFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      // Real generation will be a Cloud Function later.
      // For now, mark the project's script status as generated.
      await updateDocument(PROJECTS_COLLECTION, projectId, {
        scriptStatus: 'generated',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['master-script', projectId],
      });
    },
  });
}

/** Seed system presets (no-op — system presets are managed in Firestore directly) */
export function useSeedPresets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // No-op: system presets with isSystem=true are managed outside the client.
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animation-presets'] });
    },
  });
}
