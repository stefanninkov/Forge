import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  queryDocs,
  queryUserDocs,
  getDocument,
  createDocument,
  updateDocument,
  requireUid,
  orderBy,
  where,
} from '@/lib/firestore';

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

/* ─── Template Hooks ─── */

export function useCommunityTemplates(filters: TemplateBrowseFilters = {}) {
  return useQuery({
    queryKey: ['community', 'templates', filters],
    queryFn: async () => {
      let results = await queryDocs<CommunityTemplate>('templates', [
        where('isPublished', '==', true),
        orderBy('createdAt', 'desc'),
      ]);
      if (filters.category) results = results.filter((r) => r.category === filters.category);
      if (filters.type) results = results.filter((r) => r.type === filters.type);
      if (filters.search) {
        const s = filters.search.toLowerCase();
        results = results.filter((r) => r.name.toLowerCase().includes(s));
      }
      return results;
    },
  });
}

export function useCommunityTemplate(id: string | null) {
  return useQuery({
    queryKey: ['community', 'template', id],
    queryFn: () => getDocument<CommunityTemplate>('templates', id!),
    enabled: !!id,
  });
}

export function usePublishTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      await updateDocument('templates', templateId, { isPublished: true, publishedAt: new Date().toISOString() });
    },
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
    mutationFn: async (templateId: string) => {
      await updateDocument('templates', templateId, { isPublished: false });
    },
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
    mutationFn: async (templateId: string) => {
      const template = await getDocument<Record<string, unknown>>('templates', templateId);
      if (!template) throw new Error('Template not found');
      const { id: _id, userId: _uid, isPublished: _ip, ...data } = template;
      await createDocument('templates', { ...data, isPublished: false, isPreset: false });
    },
    onSuccess: () => {
      toast.success('Template installed to your library');
      qc.invalidateQueries({ queryKey: ['community'] });
      qc.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

/* ─── Preset Hooks ─── */

export function useCommunityPresets(filters: PresetBrowseFilters = {}) {
  return useQuery({
    queryKey: ['community', 'presets', filters],
    queryFn: async () => {
      let results = await queryDocs<CommunityPreset>('animationPresets', [
        where('isPublished', '==', true),
        orderBy('createdAt', 'desc'),
      ]);
      if (filters.engine) results = results.filter((r) => r.engine === filters.engine);
      if (filters.trigger) results = results.filter((r) => r.trigger === filters.trigger);
      if (filters.search) {
        const s = filters.search.toLowerCase();
        results = results.filter((r) => r.name.toLowerCase().includes(s));
      }
      return results;
    },
  });
}

export function usePublishPreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (presetId: string) => {
      await updateDocument('animationPresets', presetId, { isPublished: true, publishedAt: new Date().toISOString() });
    },
    onSuccess: () => {
      toast.success('Preset published to community');
      qc.invalidateQueries({ queryKey: ['community'] });
      qc.invalidateQueries({ queryKey: ['animation-presets'] });
    },
  });
}

export function useUnpublishPreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (presetId: string) => {
      await updateDocument('animationPresets', presetId, { isPublished: false });
    },
    onSuccess: () => {
      toast.success('Preset unpublished');
      qc.invalidateQueries({ queryKey: ['community'] });
      qc.invalidateQueries({ queryKey: ['animation-presets'] });
    },
  });
}

export function useInstallPreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (presetId: string) => {
      const preset = await getDocument<Record<string, unknown>>('animationPresets', presetId);
      if (!preset) throw new Error('Preset not found');
      const { id: _id, userId: _uid, isPublished: _ip, isSystem: _is, ...data } = preset;
      await createDocument('animationPresets', { ...data, isPublished: false, isSystem: false });
    },
    onSuccess: () => {
      toast.success('Animation preset installed');
      qc.invalidateQueries({ queryKey: ['community'] });
      qc.invalidateQueries({ queryKey: ['animation-presets'] });
    },
  });
}

/* ─── Utility Hooks ─── */

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_communityId: string) => {
      // Likes stored on template doc — toggle in community_likes subcollection
      toast.info('Like feature coming soon');
      return { liked: false };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community'] });
    },
  });
}

export function useMyPublished() {
  return useQuery({
    queryKey: ['community', 'mine'],
    queryFn: () => queryUserDocs<{ name: string; category: string; downloads: number; likes: number; publishedAt: string }>(
      'templates', [where('isPublished', '==', true)],
    ),
  });
}

export type { CommunityTemplate, CommunityPreset, TemplateBrowseFilters, PresetBrowseFilters };
