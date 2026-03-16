import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  queryUserDocs,
  queryDocs,
  getDocument,
  createDocument,
  updateDocument,
  removeDocument,
  orderBy,
  where,
} from '@/lib/firestore';

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
    queryFn: () => queryUserDocs<HandoffReport>('handoffReports', [orderBy('createdAt', 'desc')]),
  });
}

export function useReport(id: string | null) {
  return useQuery({
    queryKey: ['reports', id],
    queryFn: () => getDocument<HandoffReport>('handoffReports', id!),
    enabled: !!id,
  });
}

export function useSharedReport(token: string | null) {
  return useQuery({
    queryKey: ['reports', 'shared', token],
    queryFn: async () => {
      const results = await queryDocs<HandoffReport>('handoffReports', [
        where('shareToken', '==', token),
        where('isPublic', '==', true),
      ]);
      return results[0] ?? null;
    },
    enabled: !!token,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateReportInput) => {
      const shareToken = crypto.randomUUID().slice(0, 8);
      const id = await createDocument('handoffReports', {
        projectId: data.projectId,
        title: data.title,
        sections: data.sections,
        branding: data.branding || null,
        isPublic: data.isPublic ?? false,
        shareToken,
      });
      return { id, title: data.title } as HandoffReport;
    },
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      toast.success(`Report "${report.title}" created`);
    },
    onError: () => toast.error('Failed to create report'),
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateReportInput }) => {
      await updateDocument('handoffReports', id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Report updated');
    },
    onError: () => toast.error('Failed to update report'),
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeDocument('handoffReports', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      toast.success('Report deleted');
    },
    onError: () => toast.error('Failed to delete report'),
  });
}

export function useShareReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const shareToken = crypto.randomUUID().slice(0, 8);
      await updateDocument('handoffReports', id, { isPublic: true, shareToken });
      return { shareToken };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Share link generated');
    },
    onError: () => toast.error('Failed to generate share link'),
  });
}
