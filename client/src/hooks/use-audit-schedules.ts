import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface AuditSchedule {
  id: string;
  projectId: string;
  type: 'SPEED' | 'SEO' | 'AEO';
  url: string;
  frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
}

interface SchedulesResponse {
  data: AuditSchedule[];
}

interface ScheduleResponse {
  data: AuditSchedule;
}

export function useAuditSchedules(projectId: string | null) {
  return useQuery({
    queryKey: ['audit-schedules', projectId],
    queryFn: () =>
      api.get<SchedulesResponse>(`/projects/${projectId}/schedules`).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function useCreateAuditSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      type,
      url,
      frequency,
    }: {
      projectId: string;
      type: 'SPEED' | 'SEO' | 'AEO';
      url: string;
      frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
    }) =>
      api
        .post<ScheduleResponse>(`/projects/${projectId}/schedules`, { type, url, frequency })
        .then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['audit-schedules', vars.projectId] });
      toast.success('Audit schedule created');
    },
    onError: () => toast.error('Failed to create schedule'),
  });
}

export function useUpdateAuditSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      scheduleId,
      ...data
    }: {
      scheduleId: string;
      frequency?: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
      url?: string;
      enabled?: boolean;
    }) => api.put<ScheduleResponse>(`/schedules/${scheduleId}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit-schedules'] });
      toast.success('Schedule updated');
    },
    onError: () => toast.error('Failed to update schedule'),
  });
}

export function useDeleteAuditSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (scheduleId: string) => api.delete(`/schedules/${scheduleId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit-schedules'] });
      toast.success('Schedule deleted');
    },
    onError: () => toast.error('Failed to delete schedule'),
  });
}

export type { AuditSchedule };
