export interface ParsedNode {
  id: string;
  name: string;
  type: string;
  figmaType: string;
  suggestedClass: string;
  children: ParsedNode[];
  properties: Record<string, unknown>;
}

export interface AuditIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  nodeId: string;
  nodeName: string;
}

export interface FigmaAnalysis {
  id: string;
  figmaFileKey: string;
  pageName: string | null;
  structure: ParsedNode;
  audit: AuditIssue[];
  pages: string[];
}

export interface FigmaAnalysisSummary {
  id: string;
  figmaFileKey: string;
  figmaPageName: string | null;
  pushedToWebflow: boolean;
  createdAt: string;
  updatedAt: string;
}
