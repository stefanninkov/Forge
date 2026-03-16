import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
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
    queryFn: () => api.get<{ data: WebflowSite[] }>('/mcp/sites').then((r) => r.data),
    staleTime: 60_000,
    retry: false,
  });
}

export function useWebflowPages(siteId: string | null) {
  return useQuery({
    queryKey: ['webflow', 'pages', siteId],
    queryFn: () =>
      api.get<{ data: WebflowPage[] }>(`/mcp/sites/${siteId}/pages`).then((r) => r.data),
    enabled: !!siteId,
    staleTime: 60_000,
    retry: false,
  });
}

// ─── Push Mutations ────────────────────────────────────────────────────────────

export function usePushFigmaAnalysis(analysisId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: PushToWebflowParams) =>
      api
        .post<{ data: PushResult }>(`/figma/analyses/${analysisId}/push`, params)
        .then((r) => r.data),
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
    mutationFn: (params: PushToWebflowParams) =>
      api
        .post<{ data: PushResult }>(`/templates/${templateId}/push`, params)
        .then((r) => r.data),
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
    mutationFn: (params: { projectId: string; siteId: string; scriptContent: string; location?: 'header' | 'footer' }) =>
      api
        .post<{ data: PushResult }>('/mcp/push/script', params)
        .then((r) => r.data),
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
    mutationFn: (params: { projectId: string; siteId: string; scalingCss: string }) =>
      api
        .post<{ data: PushResult }>('/mcp/push/scaling', params)
        .then((r) => r.data),
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
    mutationFn: (params: { itemKey: string; siteId: string }) =>
      api
        .post<{ data: PushResult }>(`/projects/${projectId}/setup/execute/${params.itemKey}`, {
          siteId: params.siteId,
        })
        .then((r) => r.data),
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
