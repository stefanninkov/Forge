import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ScriptVersionSummary {
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
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/animations/script-history`);
      return (res as { data: ScriptHistory }).data;
    },
    enabled: !!projectId,
  });
}

export function useScriptVersion(projectId: string, version: number | null) {
  return useQuery({
    queryKey: ['script-version', projectId, version],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/animations/script-version/${version}`);
      return (res as { data: ScriptVersionFull }).data;
    },
    enabled: !!projectId && version !== null,
  });
}
