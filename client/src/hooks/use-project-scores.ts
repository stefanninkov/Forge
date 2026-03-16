import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ProjectScores {
  speed: number | null;
  seo: number | null;
  aeo: number | null;
}

export function useProjectScores(projectId: string) {
  return useQuery({
    queryKey: ['project-scores', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/scores`);
      return (res as { data: ProjectScores }).data;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
