import { onCall } from 'firebase-functions/v2/https';
import { requireAuth } from './utils';

// ── Types ──

interface ParsedNode {
  id: string;
  name: string;
  type: string;
  figmaType?: string;
  children?: ParsedNode[];
  properties?: {
    fontSize?: number;
    fontWeight?: number;
    textContent?: string;
    backgroundImage?: boolean;
    [key: string]: unknown;
  };
}

type Confidence = 'high' | 'medium' | 'low';

interface SemanticSuggestion {
  nodeId: string;
  currentTag: string;
  suggestedTag: string;
  reason: string;
  confidence: Confidence;
}

interface HierarchyIssue {
  message: string;
  severity: 'error' | 'warning' | 'info';
  nodeIds: string[];
}

// ── Helpers ──

function nameContains(name: string, ...terms: string[]): boolean {
  const lower = name.toLowerCase();
  return terms.some((t) => lower.includes(t));
}

function inferTagForText(node: ParsedNode): SemanticSuggestion | null {
  const fontSize = node.properties?.fontSize ?? 0;
  const fontWeight = node.properties?.fontWeight ?? 400;

  if (fontSize >= 32) return { nodeId: node.id, currentTag: 'div', suggestedTag: 'h1', reason: `Font size ${fontSize}px suggests primary heading`, confidence: 'high' };
  if (fontSize >= 24) return { nodeId: node.id, currentTag: 'div', suggestedTag: 'h2', reason: `Font size ${fontSize}px suggests secondary heading`, confidence: 'high' };
  if (fontSize >= 20) return { nodeId: node.id, currentTag: 'div', suggestedTag: 'h3', reason: `Font size ${fontSize}px suggests tertiary heading`, confidence: 'medium' };
  if (fontSize >= 16 && fontWeight >= 600) return { nodeId: node.id, currentTag: 'div', suggestedTag: 'h4', reason: `Bold text at ${fontSize}px suggests sub-heading`, confidence: 'medium' };
  return { nodeId: node.id, currentTag: 'div', suggestedTag: 'p', reason: 'Text content should use a paragraph element', confidence: 'medium' };
}

function inferTagByName(node: ParsedNode): SemanticSuggestion | null {
  const name = node.name;
  if (nameContains(name, 'nav', 'navigation')) return { nodeId: node.id, currentTag: 'div', suggestedTag: 'nav', reason: `"${name}" indicates navigation`, confidence: 'high' };
  if (nameContains(name, 'header')) return { nodeId: node.id, currentTag: 'div', suggestedTag: 'header', reason: `"${name}" indicates header`, confidence: 'high' };
  if (nameContains(name, 'footer')) return { nodeId: node.id, currentTag: 'div', suggestedTag: 'footer', reason: `"${name}" indicates footer`, confidence: 'high' };
  if (nameContains(name, 'card', 'article')) return { nodeId: node.id, currentTag: 'div', suggestedTag: 'article', reason: `"${name}" indicates self-contained content`, confidence: 'medium' };
  if (nameContains(name, 'sidebar', 'aside')) return { nodeId: node.id, currentTag: 'div', suggestedTag: 'aside', reason: `"${name}" indicates tangential content`, confidence: 'medium' };
  if (nameContains(name, 'list', 'grid')) return { nodeId: node.id, currentTag: 'div', suggestedTag: 'ul', reason: `"${name}" indicates a list`, confidence: 'medium' };
  if (nameContains(name, 'button', 'cta')) return { nodeId: node.id, currentTag: 'div', suggestedTag: 'button', reason: `"${name}" indicates interactive control`, confidence: 'high' };
  if (nameContains(name, 'link')) return { nodeId: node.id, currentTag: 'div', suggestedTag: 'a', reason: `"${name}" indicates hyperlink`, confidence: 'medium' };
  if (nameContains(name, 'image', 'img', 'photo')) return { nodeId: node.id, currentTag: 'div', suggestedTag: 'img', reason: `"${name}" indicates image`, confidence: 'high' };
  if (nameContains(name, 'form')) return { nodeId: node.id, currentTag: 'div', suggestedTag: 'form', reason: `"${name}" indicates form`, confidence: 'high' };
  return null;
}

function collectSuggestions(node: ParsedNode, isTopLevel: boolean, parentTag: string | null): SemanticSuggestion[] {
  const suggestions: SemanticSuggestion[] = [];
  const isText = node.type === 'TEXT' || node.figmaType === 'TEXT' || (node.properties?.textContent != null);

  if (isText) {
    const s = inferTagForText(node);
    if (s) suggestions.push(s);
  } else {
    const s = inferTagByName(node);
    if (s) {
      suggestions.push(s);
      if (s.suggestedTag === 'ul' && node.children) {
        for (const child of node.children) {
          suggestions.push({ nodeId: child.id, currentTag: 'div', suggestedTag: 'li', reason: 'Child of list', confidence: 'medium' });
        }
      }
    } else if (isTopLevel && (node.type === 'FRAME' || node.figmaType === 'FRAME')) {
      suggestions.push({ nodeId: node.id, currentTag: 'div', suggestedTag: 'section', reason: 'Top-level frame → section', confidence: 'low' });
    }
  }

  if (parentTag === 'ul' && !suggestions.some((s) => s.nodeId === node.id)) {
    suggestions.push({ nodeId: node.id, currentTag: 'div', suggestedTag: 'li', reason: 'Child of list', confidence: 'medium' });
  }

  if (node.children) {
    const currentTag = suggestions.find((s) => s.nodeId === node.id)?.suggestedTag ?? null;
    for (const child of node.children) {
      suggestions.push(...collectSuggestions(child, false, currentTag));
    }
  }

  return suggestions;
}

function validateHeadings(nodes: ParsedNode[], suggestions: SemanticSuggestion[]): HierarchyIssue[] {
  const issues: HierarchyIssue[] = [];
  const headings: { nodeId: string; level: number }[] = [];

  function collect(node: ParsedNode) {
    const s = suggestions.find((s) => s.nodeId === node.id);
    if (s?.suggestedTag && /^h[1-6]$/.test(s.suggestedTag)) {
      headings.push({ nodeId: node.id, level: parseInt(s.suggestedTag[1]) });
    }
    node.children?.forEach(collect);
  }
  nodes.forEach(collect);

  if (headings.length === 0) return issues;

  if (headings[0] && headings[0].level !== 1) {
    issues.push({ message: `First heading is h${headings[0].level} — should be h1`, severity: 'error', nodeIds: [headings[0].nodeId] });
  }

  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1]!;
    const curr = headings[i]!;
    if (curr.level > prev.level + 1) {
      issues.push({ message: `h${curr.level} follows h${prev.level} — skipped h${prev.level + 1}`, severity: 'warning', nodeIds: [curr.nodeId] });
    }
  }

  const h1s = headings.filter((h) => h.level === 1);
  if (h1s.length > 1) {
    issues.push({ message: `${h1s.length} h1 elements — should have exactly one`, severity: 'warning', nodeIds: h1s.map((h) => h.nodeId) });
  }

  return issues;
}

// ── Cloud Function ──

export const analyzeSemanticHtml = onCall({ region: 'europe-west1' }, async (request) => {
  requireAuth(request);
  const { nodes } = request.data as { nodes: ParsedNode[] };

  if (!nodes?.length) throw new Error('nodes array is required');

  const suggestions: SemanticSuggestion[] = [];
  for (const node of nodes) {
    suggestions.push(...collectSuggestions(node, true, null));
  }

  const hierarchyIssues = validateHeadings(nodes, suggestions);

  return { suggestions, hierarchyIssues };
});
