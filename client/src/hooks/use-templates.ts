import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  queryUserDocs,
  queryDocs,
  getDocument,
  createDocument,
  updateDocument,
  removeDocument,
  requireUid,
  orderBy,
  where,
} from '@/lib/firestore';
import type { TemplateSummary, Template, TemplateFilters } from '@/types/template';

const COLLECTION = 'templates';

const KEYS = {
  all: ['templates'] as const,
  list: (filters: TemplateFilters) => [...KEYS.all, 'list', filters] as const,
  detail: (id: string) => [...KEYS.all, 'detail', id] as const,
};

export function useTemplates(filters: TemplateFilters = {}) {
  return useQuery({
    queryKey: KEYS.list(filters),
    queryFn: async () => {
      const [userTemplates, presets] = await Promise.all([
        queryUserDocs<TemplateSummary>(COLLECTION, [
          orderBy('createdAt', 'desc'),
        ]),
        queryDocs<TemplateSummary>(COLLECTION, [
          where('isPreset', '==', true),
          orderBy('createdAt', 'desc'),
        ]),
      ]);

      // Deduplicate in case user somehow owns a preset
      const seen = new Set<string>();
      const combined: (TemplateSummary & { id: string })[] = [];
      for (const t of [...userTemplates, ...presets]) {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          combined.push(t);
        }
      }

      // Client-side filtering
      let results = combined;

      if (filters.category) {
        results = results.filter((t) => t.category === filters.category);
      }

      if (filters.type) {
        results = results.filter((t) => t.type === filters.type);
      }

      if (filters.search) {
        const term = filters.search.toLowerCase();
        results = results.filter(
          (t) =>
            t.name.toLowerCase().includes(term) ||
            t.description?.toLowerCase().includes(term) ||
            t.tags?.some((tag) => tag.toLowerCase().includes(term)),
        );
      }

      return results;
    },
  });
}

export function useTemplate(id: string | null) {
  return useQuery({
    queryKey: KEYS.detail(id ?? ''),
    queryFn: async () => {
      const template = await getDocument<Template>(COLLECTION, id!);
      if (!template) throw new Error('Template not found');
      return template;
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
      const docId = await createDocument(COLLECTION, {
        ...data,
        isPreset: false,
        isPublished: false,
        html: null,
        css: null,
        javascript: null,
        folderId: null,
        thumbnailUrl: null,
        description: data.description ?? null,
        styles: data.styles ?? null,
        animationAttrs: data.animationAttrs ?? null,
        tags: data.tags ?? [],
      });
      const template = await getDocument<Template>(COLLECTION, docId);
      if (!template) throw new Error('Failed to read created template');
      return template;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Template created');
    },
    onError: () => toast.error('Failed to create template'),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      description?: string;
      category?: string;
      type?: 'SKELETON' | 'STYLED';
      structure?: Record<string, unknown>;
      tags?: string[];
    }) => {
      await updateDocument(COLLECTION, id, data);
      const template = await getDocument<Template>(COLLECTION, id);
      if (!template) throw new Error('Template not found after update');
      return template;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Template updated');
    },
    onError: () => toast.error('Failed to update template'),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await removeDocument(COLLECTION, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Template deleted');
    },
    onError: () => toast.error('Failed to delete template'),
  });
}

export function useDuplicateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const source = await getDocument<Template>(COLLECTION, id);
      if (!source) throw new Error('Template not found');

      const { id: _id, createdAt: _ca, ...rest } = source;
      const docId = await createDocument(COLLECTION, {
        ...rest,
        name: `${source.name} (copy)`,
        isPreset: false,
        isPublished: false,
      });
      const template = await getDocument<Template>(COLLECTION, docId);
      if (!template) throw new Error('Failed to read duplicated template');
      return template;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Template duplicated');
    },
    onError: () => toast.error('Failed to duplicate template'),
  });
}

export function useSeedTemplates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Seeding is handled separately; this just invalidates the cache
      return { data: { seeded: true, count: 0 } };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Templates refreshed');
    },
    onError: () => toast.error('Failed to refresh templates'),
  });
}
