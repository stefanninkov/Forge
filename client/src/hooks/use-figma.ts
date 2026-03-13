import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { FigmaAnalysis } from '@/types/figma';

interface AnalyzeResponse {
  data: FigmaAnalysis;
}

interface AiSuggestResponse {
  data: Record<string, unknown>;
}

/** Analyze a Figma file */
export function useAnalyzeFigma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { projectId: string; figmaUrl: string; pageName?: string }) =>
      api.post<AnalyzeResponse>('/figma/analyze', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['figma-analyses'] });
    },
  });
}

/** Run AI suggestions on an analysis */
export function useAiSuggest() {
  return useMutation({
    mutationFn: (analysisId: string) =>
      api.post<AiSuggestResponse>('/figma/ai-suggest', { analysisId }).then((r) => r.data),
  });
}

/** Get a single analysis */
export function useFigmaAnalysis(analysisId: string | null) {
  return useQuery({
    queryKey: ['figma-analysis', analysisId],
    queryFn: () =>
      api.get<{ data: FigmaAnalysis }>(`/figma/analyses/${analysisId}`).then((r) => r.data),
    enabled: !!analysisId,
  });
}

/** Update an analysis (save edited structure) */
export function useUpdateAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, finalStructure }: { id: string; finalStructure: Record<string, unknown> }) =>
      api.put(`/figma/analyses/${id}`, { finalStructure }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['figma-analyses'] });
    },
  });
}
