import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface WebflowSite {
  id: string;
  displayName: string;
  shortName: string;
  previewUrl: string;
}

interface WebflowPage {
  id: string;
  siteId: string;
  title: string;
  slug: string;
}

interface PushResult {
  success: boolean;
  elementsCreated: number;
  message: string;
}

interface PushToWebflowParams {
  siteId: string;
  pageId: string;
  parentNodeId?: string;
}

// ─── Site & Page Queries ───────────────────────────────────────────────────────

export function useWebflowSites() {
  return useQuery({
    queryKey: ['webflow', 'sites'],
    queryFn: async () => {
      const fn = httpsCallable<void, { data: WebflowSite[] }>(functions, 'getWebflowSites');
      const result = await fn();
      return result.data.data;
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useWebflowPages(siteId: string | null) {
  return useQuery({
    queryKey: ['webflow', 'pages', siteId],
    queryFn: async () => {
      const fn = httpsCallable<{ siteId: string }, { data: WebflowPage[] }>(functions, 'getWebflowPages');
      const result = await fn({ siteId: siteId! });
      return result.data.data;
    },
    enabled: !!siteId,
    staleTime: 60_000,
    retry: false,
  });
}

// ─── Push Mutations ────────────────────────────────────────────────────────────

export function usePushFigmaAnalysis(analysisId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: PushToWebflowParams) => {
      const fn = httpsCallable<PushToWebflowParams & { analysisId: string }, PushResult>(
        functions,
        'pushFigmaToWebflow',
      );
      const result = await fn({ ...params, analysisId });
      return result.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['figma'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to push to Webflow');
    },
  });
}

export function usePushTemplate(templateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: PushToWebflowParams) => {
      const fn = httpsCallable<PushToWebflowParams & { templateId: string }, PushResult>(
        functions,
        'pushTemplateToWebflow',
      );
      const result = await fn({ ...params, templateId });
      return result.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to push template to Webflow');
    },
  });
}

export function usePushMasterScript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { projectId: string; siteId: string; scriptContent: string; location?: 'header' | 'footer' }) => {
      const fn = httpsCallable<typeof params, PushResult>(functions, 'pushMasterScript');
      const result = await fn(params);
      return result.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['masterScript'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to push master script');
    },
  });
}

export function usePushScalingCss() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { projectId: string; siteId: string; scalingCss: string }) => {
      const fn = httpsCallable<typeof params, PushResult>(functions, 'pushScalingCss');
      const result = await fn(params);
      return result.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['scaling'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to push scaling CSS');
    },
  });
}

export function useExecuteSetupItem(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { itemKey: string; siteId: string }) => {
      const fn = httpsCallable<{ projectId: string; itemKey: string; siteId: string }, PushResult>(
        functions,
        'executeSetupItem',
      );
      const result = await fn({ projectId, ...params });
      return result.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['setup', projectId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to execute setup item');
    },
  });
}

export type { WebflowSite, WebflowPage, PushResult, PushToWebflowParams };
