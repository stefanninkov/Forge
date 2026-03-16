import { useQuery } from '@tanstack/react-query';
import { querySubcollection, orderBy } from '@/lib/firestore';

interface ScriptVersionSummary {
  id: string;
  version: number;
  stats: { cssAnimations: number; gsapAnimations: number; totalSize: string };
  generatedAt: string;
}

interface ScriptHistory {
  currentVersion: number;
  versions: ScriptVersionSummary[];
}

interface ScriptVersionFull extends ScriptVersionSummary {
  script: string;
}

export function useScriptHistory(projectId: string) {
  return useQuery({
    queryKey: ['script-history', projectId],
    queryFn: async (): Promise<ScriptHistory> => {
      const versions = await querySubcollection<ScriptVersionSummary>(
        'projects', projectId, 'scriptVersions',
        [orderBy('version', 'desc')],
      );
      return {
        currentVersion: versions.length > 0 ? versions[0].version : 0,
        versions,
      };
    },
    enabled: !!projectId,
  });
}

export function useScriptVersion(projectId: string, version: number | null) {
  return useQuery({
    queryKey: ['script-version', projectId, version],
    queryFn: async (): Promise<ScriptVersionFull | null> => {
      const versions = await querySubcollection<ScriptVersionFull>(
        'projects', projectId, 'scriptVersions',
      );
      return versions.find((v) => v.version === version) ?? null;
    },
    enabled: !!projectId && version !== null,
  });
}
