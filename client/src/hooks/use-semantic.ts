import { useMutation } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

interface ParsedNode {
  id: string;
  name: string;
  type: string;
  figmaType?: string;
  suggestedClass?: string;
  children?: ParsedNode[];
  properties?: Record<string, unknown>;
}

type Confidence = 'high' | 'medium' | 'low';
type Severity = 'error' | 'warning' | 'info';

interface SemanticSuggestion {
  nodeId: string;
  currentTag: string;
  suggestedTag: string;
  reason: string;
  confidence: Confidence;
}

interface HierarchyIssue {
  message: string;
  severity: Severity;
  nodeIds: string[];
}

interface SemanticAnalysisResult {
  suggestions: SemanticSuggestion[];
  hierarchyIssues: HierarchyIssue[];
}

/** Analyze a structure tree for semantic HTML suggestions */
export function useSemanticAnalysis() {
  return useMutation({
    mutationFn: async (nodes: ParsedNode[]) => {
      const fn = httpsCallable<{ nodes: ParsedNode[] }, SemanticAnalysisResult>(functions, 'analyzeSemanticHtml');
      const result = await fn({ nodes });
      return result.data;
    },
  });
}
