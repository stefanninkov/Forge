import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ReportSection {
  title: string;
  type: 'overview' | 'speed' | 'seo' | 'aeo' | 'recommendations' | 'custom';
  content?: Record<string, unknown>;
}

interface ReportBranding {
  companyName?: string;
  logoUrl?: string;
  primaryColor?: string;
}

export interface HandoffReport {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  sections: ReportSection[];
  branding: ReportBranding | null;
  shareToken: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  project: { id: string; name: string };
}

interface CreateReportInput {
  projectId: string;
  title: string;
  sections: ReportSection[];
  branding?: ReportBranding;
  isPublic?: boolean;
}

interface UpdateReportInput {
  title?: string;
  sections?: ReportSection[];
  branding?: ReportBranding;
  isPublic?: boolean;
}

export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: () => api.get<{ data: HandoffReport[] }>('/reports').then((r) => r.data),
  });
}

export function useReport(id: string | null) {
  return useQuery({
    queryKey: ['reports', id],
    queryFn: () => api.get<{ data: HandoffReport }>(`/reports/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useSharedReport(token: string | null) {
  return useQuery({
    queryKey: ['reports', 'shared', token],
    queryFn: () => api.get<{ data: HandoffReport }>(`/reports/shared/${token}`).then((r) => r.data),
    enabled: !!token,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReportInput) =>
      api.post<{ data: HandoffReport }>('/reports', data).then((r) => r.data),
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      toast.success(`Report "${report.title}" created`);
    },
    onError: () => {
      toast.error('Failed to create report');
    },
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReportInput }) =>
      api.put<{ data: HandoffReport }>(`/reports/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Report updated');
    },
    onError: () => {
      toast.error('Failed to update report');
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/reports/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      toast.success('Report deleted');
    },
    onError: () => {
      toast.error('Failed to delete report');
    },
  });
}

export function useShareReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ data: HandoffReport }>(`/reports/${id}/share`, {}).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Share link generated');
    },
    onError: () => {
      toast.error('Failed to generate share link');
    },
  });
}
