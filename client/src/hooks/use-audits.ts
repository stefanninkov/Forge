import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import {
  querySubcollection,
  getDocument,
  removeDocument,
  updateDocument,
  orderBy,
  where,
} from '@/lib/firestore';
import type { Audit, AuditAlert, AuditHistoryPoint, AuditType } from '@/types/audit';

/** List audits for a project, optionally filtered by type */
export function useAudits(projectId: string | null, type?: AuditType) {
  return useQuery({
    queryKey: ['audits', 'list', projectId, type],
    queryFn: async () => {
      const constraints = [orderBy('createdAt', 'desc')];
      if (type) constraints.unshift(where('type', '==', type));
      return querySubcollection<Audit>('projects', projectId!, 'audits', constraints);
    },
    enabled: !!projectId,
  });
}

/** Get a single audit by ID — looks in top-level audits or subcollection */
export function useAudit(auditId: string | null) {
  return useQuery({
    queryKey: ['audits', 'detail', auditId],
    queryFn: () => getDocument<Audit>('audits', auditId!),
    enabled: !!auditId,
  });
}

/** Get score history for trend chart */
export function useAuditHistory(projectId: string | null, type: AuditType) {
  return useQuery({
    queryKey: ['audits', 'history', projectId, type],
    queryFn: async () => {
      const audits = await querySubcollection<Audit>(
        'projects', projectId!, 'audits',
        [where('type', '==', type), orderBy('createdAt', 'asc')],
      );
      return audits.map((a) => ({
        date: a.createdAt,
        score: a.score ?? 0,
      })) as AuditHistoryPoint[];
    },
    enabled: !!projectId,
  });
}

/** Run speed audit — calls Cloud Function */
export function useRunSpeedAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, url }: { projectId: string; url: string }) => {
      const fn = httpsCallable<{ projectId: string; url: string }, Audit>(functions, 'runSpeedAudit');
      const result = await fn({ projectId, url });
      return result.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['audits', 'list', vars.projectId, 'SPEED'] });
      qc.invalidateQueries({ queryKey: ['audits', 'history', vars.projectId, 'SPEED'] });
      toast.success('Speed audit complete');
    },
    onError: () => toast.error('Speed audit failed'),
  });
}

/** Run SEO audit — calls Cloud Function */
export function useRunSeoAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, url }: { projectId: string; url: string }) => {
      const fn = httpsCallable<{ projectId: string; url: string }, Audit>(functions, 'runSeoAudit');
      const result = await fn({ projectId, url });
      return result.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['audits', 'list', vars.projectId, 'SEO'] });
      qc.invalidateQueries({ queryKey: ['audits', 'history', vars.projectId, 'SEO'] });
      toast.success('SEO audit complete');
    },
    onError: () => toast.error('SEO audit failed'),
  });
}

/** Run AEO audit — calls Cloud Function */
export function useRunAeoAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, url }: { projectId: string; url: string }) => {
      const fn = httpsCallable<{ projectId: string; url: string }, Audit>(functions, 'runAeoAudit');
      const result = await fn({ projectId, url });
      return result.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['audits', 'list', vars.projectId, 'AEO'] });
      qc.invalidateQueries({ queryKey: ['audits', 'history', vars.projectId, 'AEO'] });
      toast.success('AEO audit complete');
    },
    onError: () => toast.error('AEO audit failed'),
  });
}

/** Delete an audit */
export function useDeleteAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeDocument('audits', id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audits'] });
      toast.success('Audit deleted');
    },
    onError: () => toast.error('Failed to delete audit'),
  });
}

/** List alerts for a project */
export function useAlerts(projectId: string | null) {
  return useQuery({
    queryKey: ['alerts', projectId],
    queryFn: () =>
      querySubcollection<AuditAlert>('projects', projectId!, 'alerts', [orderBy('createdAt', 'desc')]),
    enabled: !!projectId,
  });
}

/** Mark alert as read */
export function useMarkAlertRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => updateDocument('alerts', id, { read: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

/** AI-powered recommendations for an audit */
interface AiRecommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentValue?: string;
  suggestedValue?: string;
  affectedUrls?: string[];
}

export function useAiRecommendations() {
  return useMutation({
    mutationFn: async (auditId: string) => {
      const fn = httpsCallable<{ auditId: string }, AiRecommendation[]>(functions, 'getAiRecommendations');
      const result = await fn({ auditId });
      return result.data;
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to generate AI recommendations');
    },
  });
}

export type { AiRecommendation };
