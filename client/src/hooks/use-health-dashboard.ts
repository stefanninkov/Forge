import { useQuery } from '@tanstack/react-query';
import { queryUserDocs, querySubcollection, orderBy, where } from '@/lib/firestore';

interface HealthOverviewData {
  projectCount: number;
  speed: { score: number; lastChecked: string } | null;
  seo: { score: number; lastChecked: string } | null;
  aeo: { score: number; lastChecked: string } | null;
  recentAlerts: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    projectId: string;
    createdAt: string;
    read: boolean;
    project: { id: string; name: string };
  }>;
}

interface HealthOverviewResponse {
  data: HealthOverviewData;
}

interface TrendPoint {
  type: string;
  score: number;
  createdAt: string;
}

interface TrendsResponse {
  data: TrendPoint[];
}

interface GroupedTrends {
  speed: Array<{ score: number; date: string }>;
  seo: Array<{ score: number; date: string }>;
  aeo: Array<{ score: number; date: string }>;
}

export function useHealthOverview() {
  return useQuery({
    queryKey: ['health-overview'],
    queryFn: async (): Promise<HealthOverviewData> => {
      const projects = await queryUserDocs<{ name: string }>('projects', [where('isArchived', '==', false)]);
      // For now return basic counts — full dashboard aggregation needs more logic
      return {
        projectCount: projects.length,
        speed: null,
        seo: null,
        aeo: null,
        recentAlerts: [],
      };
    },
  });
}

export function useProjectTrends(projectId: string | null) {
  return useQuery({
    queryKey: ['health-trends', projectId],
    queryFn: async () => {
      const audits = await querySubcollection<TrendPoint>(
        'projects', projectId!, 'audits',
        [orderBy('createdAt', 'asc')],
      );
      const grouped: GroupedTrends = { speed: [], seo: [], aeo: [] };
      for (const point of audits) {
        const key = point.type.toLowerCase() as keyof GroupedTrends;
        if (key in grouped) {
          grouped[key].push({ score: point.score, date: point.createdAt });
        }
      }
      return grouped;
    },
    enabled: !!projectId,
  });
}
