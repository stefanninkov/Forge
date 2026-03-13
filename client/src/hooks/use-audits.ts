import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { Audit, AuditAlert, AuditHistoryPoint, AuditType } from '@/types/audit';

interface AuditsResponse {
  data: Audit[];
}

interface AuditResponse {
  data: Audit;
}

interface HistoryResponse {
  data: AuditHistoryPoint[];
}

interface AlertsResponse {
  data: AuditAlert[];
}

interface AlertResponse {
  data: AuditAlert;
}

/** List audits for a project, optionally filtered by type */
export function useAudits(projectId: string | null, type?: AuditType) {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  const qs = params.toString();

  return useQuery({
    queryKey: ['audits', 'list', projectId, type],
    queryFn: () =>
      api
        .get<AuditsResponse>(`/projects/${projectId}/audits${qs ? `?${qs}` : ''}`)
        .then((r) => r.data),
    enabled: !!projectId,
  });
}

/** Get a single audit by ID */
export function useAudit(auditId: string | null) {
  return useQuery({
    queryKey: ['audits', 'detail', auditId],
    queryFn: () => api.get<AuditResponse>(`/audits/${auditId}`).then((r) => r.data),
    enabled: !!auditId,
  });
}

/** Get score history for trend chart */
export function useAuditHistory(projectId: string | null, type: AuditType) {
  return useQuery({
    queryKey: ['audits', 'history', projectId, type],
    queryFn: () =>
      api
        .get<HistoryResponse>(`/projects/${projectId}/audits/history?type=${type}`)
        .then((r) => r.data),
    enabled: !!projectId,
  });
}

/** Run speed audit */
export function useRunSpeedAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, url }: { projectId: string; url: string }) =>
      api.post<AuditResponse>(`/projects/${projectId}/audits/speed`, { url }).then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['audits', 'list', vars.projectId, 'SPEED'] });
      qc.invalidateQueries({ queryKey: ['audits', 'history', vars.projectId, 'SPEED'] });
      toast.success('Speed audit complete');
    },
    onError: () => toast.error('Speed audit failed'),
  });
}

/** Run SEO audit */
export function useRunSeoAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, url }: { projectId: string; url: string }) =>
      api.post<AuditResponse>(`/projects/${projectId}/audits/seo`, { url }).then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['audits', 'list', vars.projectId, 'SEO'] });
      qc.invalidateQueries({ queryKey: ['audits', 'history', vars.projectId, 'SEO'] });
      toast.success('SEO audit complete');
    },
    onError: () => toast.error('SEO audit failed'),
  });
}

/** Run AEO audit */
export function useRunAeoAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, url }: { projectId: string; url: string }) =>
      api.post<AuditResponse>(`/projects/${projectId}/audits/aeo`, { url }).then((r) => r.data),
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
    mutationFn: (id: string) => api.delete(`/audits/${id}`),
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
    queryFn: () => api.get<AlertsResponse>(`/projects/${projectId}/alerts`).then((r) => r.data),
    enabled: !!projectId,
  });
}

/** Mark alert as read */
export function useMarkAlertRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put<AlertResponse>(`/alerts/${id}/read`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
