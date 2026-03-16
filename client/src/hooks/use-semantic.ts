import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

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

interface AnalyzeResponse {
  data: SemanticAnalysisResult;
}

/** Analyze a structure tree for semantic HTML suggestions */
export function useSemanticAnalysis() {
  return useMutation({
    mutationFn: (nodes: ParsedNode[]) =>
      api.post<AnalyzeResponse>('/semantic/analyze', { nodes }).then((r) => r.data),
  });
}
