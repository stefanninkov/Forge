import { useQuery } from '@tanstack/react-query';
import { querySubcollection, orderBy, where, limit } from '@/lib/firestore';

interface ProjectScores {
  speed: number | null;
  seo: number | null;
  aeo: number | null;
}

interface AuditDoc {
  type: string;
  score: number;
  createdAt: string;
}

export function useProjectScores(projectId: string) {
  return useQuery({
    queryKey: ['project-scores', projectId],
    queryFn: async (): Promise<ProjectScores> => {
      const scores: ProjectScores = { speed: null, seo: null, aeo: null };
      const types = ['SPEED', 'SEO', 'AEO'] as const;
      for (const type of types) {
        const audits = await querySubcollection<AuditDoc>(
          'projects', projectId, 'audits',
          [where('type', '==', type), orderBy('createdAt', 'desc'), limit(1)],
        );
        if (audits.length > 0) {
          scores[type.toLowerCase() as keyof ProjectScores] = audits[0].score;
        }
      }
      return scores;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}
