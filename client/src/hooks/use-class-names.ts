import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ClassNameSuggestion {
  originalName: string;
  suggestedClass: string;
  htmlTag: string;
  reasoning: string;
}

interface ClassNameRequest {
  elements: Array<{ name: string; type: string; context: string }>;
  methodology?: string;
}

interface ClassNameResponse {
  suggestions: ClassNameSuggestion[];
}

export function useAiClassNames() {
  return useMutation({
    mutationFn: ({ elements, methodology }: ClassNameRequest) =>
      api
        .post<ClassNameResponse>('/ai/class-names', { elements, methodology })
        .then((r) => r.suggestions),
  });
}

export type { ClassNameSuggestion };
