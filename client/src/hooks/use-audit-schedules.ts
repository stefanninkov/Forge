import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  querySubcollection,
  createSubDocument,
  updateDocument,
  removeDocument,
  orderBy,
} from '@/lib/firestore';

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

export function useAuditSchedules(projectId: string | null) {
  return useQuery({
    queryKey: ['audit-schedules', projectId],
    queryFn: () =>
      querySubcollection<AuditSchedule>('projects', projectId!, 'schedules', [orderBy('createdAt', 'desc')]),
    enabled: !!projectId,
  });
}

export function useCreateAuditSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      type,
      url,
      frequency,
    }: {
      projectId: string;
      type: 'SPEED' | 'SEO' | 'AEO';
      url: string;
      frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
    }) => {
      await createSubDocument('projects', projectId, 'schedules', {
        type, url, frequency, enabled: true, lastRunAt: null, nextRunAt: null, projectId,
      });
    },
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
    mutationFn: async ({
      scheduleId,
      ...data
    }: {
      scheduleId: string;
      frequency?: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
      url?: string;
      enabled?: boolean;
    }) => {
      await updateDocument('schedules', scheduleId, data);
    },
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
    mutationFn: (scheduleId: string) => removeDocument('schedules', scheduleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit-schedules'] });
      toast.success('Schedule deleted');
    },
    onError: () => toast.error('Failed to delete schedule'),
  });
}

export type { AuditSchedule };
