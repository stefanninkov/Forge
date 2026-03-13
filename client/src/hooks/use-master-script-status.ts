import { useActiveProject } from './use-active-project';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface MasterScriptStatus {
  hasAnimations: boolean;
  scriptStatus: 'none' | 'outdated' | 'generated' | 'pushed';
  scalingStatus: 'not_configured' | 'configured' | 'pushed';
  lastGenerated: string | null;
  code: string | null;
}

export function useMasterScriptStatus() {
  const { activeProjectId } = useActiveProject();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['master-script', activeProjectId],
    queryFn: async (): Promise<MasterScriptStatus> => {
      return {
        hasAnimations: false,
        scriptStatus: 'none',
        scalingStatus: 'not_configured',
        lastGenerated: null,
        code: null,
      };
    },
    enabled: !!activeProjectId,
  });

  const generateScript = useMutation({
    mutationFn: async () => {
      toast.info('Master script generation is not yet available.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-script', activeProjectId] });
    },
  });

  const pushScript = useMutation({
    mutationFn: async () => {
      toast.info('Connect Webflow Designer to push scripts.', {
        description: 'Open your project in the Webflow Designer with the MCP Companion App running.',
        duration: 5000,
      });
    },
  });

  return {
    hasAnimations: data?.hasAnimations ?? false,
    scriptStatus: data?.scriptStatus ?? 'none',
    scalingStatus: data?.scalingStatus ?? 'not_configured',
    lastGenerated: data?.lastGenerated ?? null,
    code: data?.code ?? null,
    generateScript: generateScript.mutate,
    pushScript: pushScript.mutate,
    isGenerating: generateScript.isPending,
    isPushing: pushScript.isPending,
  };
}
