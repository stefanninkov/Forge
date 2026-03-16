import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import {
  getDocument,
  updateDocument,
  querySubcollection,
  orderBy,
} from '@/lib/firestore';
import type { FigmaAnalysis } from '@/types/figma';

/** Analyze a Figma file — calls Cloud Function */
export function useAnalyzeFigma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { projectId: string; figmaUrl: string; pageName?: string }) => {
      const fn = httpsCallable<typeof data, FigmaAnalysis>(functions, 'analyzeFigma');
      const result = await fn(data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['figma-analyses'] });
    },
  });
}

/** Run AI suggestions on an analysis — calls Cloud Function */
export function useAiSuggest() {
  return useMutation({
    mutationFn: async (analysisId: string) => {
      const fn = httpsCallable<{ analysisId: string }, Record<string, unknown>>(functions, 'suggestClassNames');
      const result = await fn({ analysisId });
      return result.data;
    },
  });
}

/** Get a single analysis */
export function useFigmaAnalysis(analysisId: string | null) {
  return useQuery({
    queryKey: ['figma-analysis', analysisId],
    queryFn: () => getDocument<FigmaAnalysis>('figmaAnalyses', analysisId!),
    enabled: !!analysisId,
  });
}

/** Update an analysis (save edited structure) */
export function useUpdateAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, finalStructure }: { id: string; finalStructure: Record<string, unknown> }) =>
      updateDocument('figmaAnalyses', id, { finalStructure }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['figma-analyses'] });
    },
  });
}
