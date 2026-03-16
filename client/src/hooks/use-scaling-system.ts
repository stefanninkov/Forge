import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActiveProject } from './use-active-project';
import { getDocument, updateDocument } from '@/lib/firestore';
import { toast } from 'sonner';

export interface ScalingConfig {
  baseFontSize: number;
  minWidth: number;
  maxWidth: number;
  breakpoints: {
    label: string;
    base: number;
    min: number;
    max: number;
  }[];
  defaultUnit: 'px' | 'rem' | 'em';
}

const DEFAULT_CONFIG: ScalingConfig = {
  baseFontSize: 16,
  minWidth: 320,
  maxWidth: 1920,
  breakpoints: [
    { label: 'Desktop', base: 16, min: 992, max: 1920 },
    { label: 'Tablet', base: 15, min: 768, max: 991 },
    { label: 'Mobile L', base: 14, min: 480, max: 767 },
    { label: 'Mobile P', base: 13, min: 320, max: 479 },
  ],
  defaultUnit: 'px',
};

interface ProjectDoc {
  scalingConfig?: ScalingConfig;
}

export function useScalingSystem() {
  const { activeProjectId } = useActiveProject();
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['scaling', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return DEFAULT_CONFIG;
      const project = await getDocument<ProjectDoc>('projects', activeProjectId);
      return project?.scalingConfig ?? DEFAULT_CONFIG;
    },
    enabled: !!activeProjectId,
  });

  const updateConfig = useMutation({
    mutationFn: async (newConfig: Partial<ScalingConfig>) => {
      if (!activeProjectId) throw new Error('No active project');
      const merged = { ...(config ?? DEFAULT_CONFIG), ...newConfig };
      await updateDocument('projects', activeProjectId, { scalingConfig: merged });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scaling', activeProjectId] });
      toast.success('Scaling config updated');
    },
    onError: () => {
      toast.error('Failed to update scaling config');
    },
  });

  const pxToRem = (px: number) => {
    const base = config?.baseFontSize ?? 16;
    return px / base;
  };

  const remToPx = (rem: number) => {
    const base = config?.baseFontSize ?? 16;
    return rem * base;
  };

  return {
    config: config ?? DEFAULT_CONFIG,
    isConfigured: !!activeProjectId && !!config,
    updateConfig: updateConfig.mutate,
    isUpdating: updateConfig.isPending,
    pxToRem,
    remToPx,
  };
}
