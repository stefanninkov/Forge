import { useMutation } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

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
    mutationFn: async ({ elements, methodology }: ClassNameRequest) => {
      const fn = httpsCallable<ClassNameRequest, ClassNameResponse>(functions, 'suggestClassNames');
      const result = await fn({ elements, methodology });
      return result.data.suggestions;
    },
  });
}

export type { ClassNameSuggestion };
