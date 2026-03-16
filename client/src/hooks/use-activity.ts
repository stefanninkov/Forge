import { useQuery } from '@tanstack/react-query';
import {
  queryUserDocs,
  querySubcollection,
  orderBy,
  where,
  limit as fsLimit,
} from '@/lib/firestore';
import type { ActivityLog, ActivityAction } from '@/types/project';

interface ActivityFilters {
  action?: ActivityAction;
  projectId?: string;
  limit?: number;
  offset?: number;
}

export function useActivityLog(filters: ActivityFilters = {}) {
  return useQuery({
    queryKey: ['activity', filters],
    queryFn: async () => {
      if (filters.projectId) {
        // Activity for a specific project (subcollection)
        const constraints = [orderBy('createdAt', 'desc')];
        if (filters.action) constraints.unshift(where('actionType', '==', filters.action));
        if (filters.limit) constraints.push(fsLimit(filters.limit));
        const data = await querySubcollection<ActivityLog>(
          'projects', filters.projectId, 'activityLog', constraints,
        );
        return { data, total: data.length };
      }
      // Global activity (top-level collection)
      const constraints = [orderBy('createdAt', 'desc')];
      if (filters.action) constraints.unshift(where('actionType', '==', filters.action));
      if (filters.limit) constraints.push(fsLimit(filters.limit));
      const data = await queryUserDocs<ActivityLog>('activityLog', constraints);
      return { data, total: data.length };
    },
  });
}
