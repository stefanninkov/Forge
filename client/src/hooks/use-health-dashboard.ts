import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

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
    queryFn: () =>
      api.get<HealthOverviewResponse>('/health-dashboard/overview').then((r) => r.data),
  });
}

export function useProjectTrends(projectId: string | null) {
  return useQuery({
    queryKey: ['health-trends', projectId],
    queryFn: () =>
      api
        .get<TrendsResponse>(`/health-dashboard/projects/${projectId}/trends`)
        .then((r) => {
          const grouped: GroupedTrends = { speed: [], seo: [], aeo: [] };
          for (const point of r.data) {
            const key = point.type.toLowerCase() as keyof GroupedTrends;
            if (key in grouped) {
              grouped[key].push({ score: point.score, date: point.createdAt });
            }
          }
          return grouped;
        }),
    enabled: !!projectId,
  });
}
