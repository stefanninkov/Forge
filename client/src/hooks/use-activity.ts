import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ActivityLog, ActivityAction } from '@/types/project';

interface ActivityFilters {
  action?: ActivityAction;
  projectId?: string;
  limit?: number;
  offset?: number;
}

interface ActivityResponse {
  data: ActivityLog[];
  total: number;
}

export function useActivityLog(filters: ActivityFilters = {}) {
  const params = new URLSearchParams();
  if (filters.action) params.set('action', filters.action);
  if (filters.projectId) params.set('projectId', filters.projectId);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.offset) params.set('offset', String(filters.offset));

  const queryString = params.toString();
  const path = `/activity${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: ['activity', filters],
    queryFn: () => api.get<ActivityResponse>(path),
  });
}
