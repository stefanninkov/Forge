// ── Types ──

export interface ParsedNode {
  id: string;
  name: string;
  type: string;
  figmaType?: string;
  suggestedClass?: string;
  children?: ParsedNode[];
  properties?: {
    fontSize?: number;
    fontWeight?: number;
    textContent?: string;
    backgroundImage?: boolean;
    [key: string]: unknown;
  };
}

export type Confidence = 'high' | 'medium' | 'low';

export type Severity = 'error' | 'warning' | 'info';

export interface SemanticSuggestion {
  nodeId: string;
  currentTag: string;
  suggestedTag: string;
  reason: string;
  confidence: Confidence;
}

export interface HierarchyIssue {
  message: string;
  severity: Severity;
  nodeIds: string[];
}

export interface SemanticAnalysisResult {
  suggestions: SemanticSuggestion[];
  hierarchyIssues: HierarchyIssue[];
}

// ── Name matching helpers ──

function nameContains(name: string, ...terms: string[]): boolean {
  const lower = name.toLowerCase();
  return terms.some((t) => lower.includes(t));
}

function nameEquals(name: string, ...terms: string[]): boolean {
  const lower = name.toLowerCase().trim();
  return terms.some((t) => lower === t);
}

// ── Suggestion rules ──

function inferTagForTextNode(node: ParsedNode): SemanticSuggestion | null {
  const props = node.properties;
  const fontSize = props?.fontSize ?? 0;
  const fontWeight = props?.fontWeight ?? 400;
  const textContent = props?.textContent ?? '';

  if (fontSize >= 32) {
    return {
      nodeId: node.id,
      currentTag: 'div',
      suggestedTag: 'h1',
      reason: `Font size ${fontSize}px suggests a primary heading`,
      confidence: 'high',
    };
  }

  if (fontSize >= 24) {
    return {
      nodeId: node.id,
      currentTag: 'div',
      suggestedTag: 'h2',
      reason: `Font size ${fontSize}px suggests a secondary heading`,
      confidence: 'high',
    };
  }

  if (fontSize >= 20) {
    return {
      nodeId: node.id,
      currentTag: 'div',
      suggestedTag: 'h3',
      reason: `Font size ${fontSize}px suggests a tertiary heading`,
      confidence: 'medium',
    };
  }

  if (fontSize >= 16 && fontWeight >= 600) {
    return {
      nodeId: node.id,
      currentTag: 'div',
      suggestedTag: 'h4',
      reason: `Font size ${fontSize}px with bold weight suggests a sub-heading`,
      confidence: 'medium',
    };
  }

  // All other text nodes are paragraphs
  const isShort = textContent.length > 0 && textContent.length < 100;
  return {
    nodeId: node.id,
    currentTag: 'div',
    suggestedTag: 'p',
    reason: isShort
      ? 'Short text content is best wrapped in a paragraph'
      : 'Text content should use a paragraph element',
    confidence: 'medium',
  };
}

function inferTagByName(node: ParsedNode): SemanticSuggestion | null {
  const name = node.name;

  // Navigation
  if (nameEquals(name, 'nav', 'navbar', 'navigation') || nameContains(name, 'navigation')) {
    return {
      nodeId: node.id,
      currentTag: 'div',
      suggestedTag: 'nav',
      reason: `Name "${name}" indicates a navigation landmark`,
      confidence: 'high',
    };
  }

  // Header
  if (nameEquals(name, 'header') || nameContains(name, 'header')) {
    return {
      nodeId: node.id,
      currentTag: 'div',
      suggestedTag: 'header',
      reason: `Name "${name}" indicates a header landmark`,
      confidence: 'high',
    };
  }

  // Footer
  if (nameEquals(name, 'footer') || nameContains(name, 'footer')) {
    return {
      nodeId: node.id,
      currentTag: 'div',
      suggestedTag: 'footer',
      reason: `Name "${name}" indicates a footer landmark`,
      confidence: 'high',
    };
  }

  // Article / card
  if (nameContains(name, 'card', 'article')) {
    return {
      nodeId: node.id,
      currentTag: 'div',
      suggestedTag: 'article',
      reason: `Name "${name}" indicates self-contained content`,
      confidence: 'medium',
    };
  }

  // Sidebar / aside
  if (nameContains(name, 'sidebar', 'aside')) {
    return {
      nodeId: node.id,
      currentTag: 'div',
      suggestedTag: 'aside',
      reason: `Name "${name}" indicates tangential content`,
      confidence: 'medium',
    };
  }

  // List / grid
  if (nameContains(name, 'list', 'grid')) {
    return {
      nodeId: node.id,
      currentTag: 'div',
      suggestedTag: 'ul',
      reason: `Name "${name}" indicates a list of items`,
      confidence: 'medium',
    };
  }

  // Button / CTA
  if (nameContains(name, 'button', 'cta')) {
    return {
      nodeId: node.id,
      currentTag: 'div',
      suggestedTag: 'button',
      reason: `Name "${name}" indicates an interactive control`,
      confidence: 'high',
    };
  }

  // Link
  if (nameContains(name, 'link')) {
    return {
      nodeId: node.id,
      currentTag: 'div',
      suggestedTag: 'a',
      reason: `Name "${name}" indicates a hyperlink`,
      confidence: 'medium',
    };
  }

  // Image / photo / hero with background image
  if (nameContains(name, 'image', 'img', 'photo')) {
    return {
      nodeId: node.id,
      currentTag: 'div',
      suggestedTag: 'img',
      reason: `Name "${name}" indicates an image element`,
      confidence: 'high',
    };
  }

  if (nameContains(name, 'hero') && node.properties?.backgroundImage) {
    return {
      nodeId: node.id,
      currentTag: 'div',
      suggestedTag: 'figure',
      reason: `Name "${name}" with background image indicates a figure element`,
      confidence: 'medium',
    };
  }

  // Form
  if (nameContains(name, 'form')) {
    return {
      nodeId: node.id,
      currentTag: 'div',
      suggestedTag: 'form',
      reason: `Name "${name}" indicates a form element`,
      confidence: 'high',
    };
  }

  // Input
  if (nameContains(name, 'input')) {
    return {
      nodeId: node.id,
      currentTag: 'div',
      suggestedTag: 'input',
      reason: `Name "${name}" indicates a form input`,
      confidence: 'medium',
    };
  }

  return null;
}

function isSectionLevelFrame(node: ParsedNode): boolean {
  // A section-level frame is a top-level FRAME type that is not matched by other rules
  return (
    (node.type === 'FRAME' || node.figmaType === 'FRAME') &&
    !nameContains(
      node.name,
      'nav', 'header', 'footer', 'card', 'article', 'sidebar', 'aside',
      'list', 'grid', 'button', 'cta', 'link', 'image', 'img', 'photo',
      'hero', 'form', 'input',
    )
  );
}

// ── Tree traversal and analysis ──

function collectSuggestions(
  node: ParsedNode,
  isTopLevel: boolean,
  parentSuggestedTag: string | null,
): SemanticSuggestion[] {
  const suggestions: SemanticSuggestion[] = [];

  // Text node detection
  const isTextNode =
    node.type === 'TEXT' ||
    node.figmaType === 'TEXT' ||
    (node.properties?.textContent != null && String(node.properties.textContent).length > 0);

  if (isTextNode) {
    const textSuggestion = inferTagForTextNode(node);
    if (textSuggestion) {
      suggestions.push(textSuggestion);
    }
  } else {
    // Name-based inference
    const nameSuggestion = inferTagByName(node);
    if (nameSuggestion) {
      suggestions.push(nameSuggestion);

      // If parent is ul, suggest li for children
      if (nameSuggestion.suggestedTag === 'ul' && node.children) {
        for (const child of node.children) {
          suggestions.push({
            nodeId: child.id,
            currentTag: 'div',
            suggestedTag: 'li',
            reason: 'Child of a list element should be a list item',
            confidence: 'medium',
          });
        }
      }
    } else if (isSectionLevelFrame(node) && isTopLevel) {
      // Section-level frame
      suggestions.push({
        nodeId: node.id,
        currentTag: 'div',
        suggestedTag: 'section',
        reason: 'Top-level frame is best represented as a section element',
        confidence: 'low',
      });
    }
  }

  // If parent suggested ul, mark children as li (handled above in nameSuggestion block)
  if (parentSuggestedTag === 'ul' && !suggestions.some((s) => s.nodeId === node.id)) {
    suggestions.push({
      nodeId: node.id,
      currentTag: 'div',
      suggestedTag: 'li',
      reason: 'Child of a list element should be a list item',
      confidence: 'medium',
    });
  }

  // Recurse into children
  if (node.children) {
    const currentSuggested = suggestions.find((s) => s.nodeId === node.id)?.suggestedTag ?? null;
    for (const child of node.children) {
      const childSuggestions = collectSuggestions(child, false, currentSuggested);
      suggestions.push(...childSuggestions);
    }
  }

  return suggestions;
}

// ── Heading hierarchy validation ──

interface HeadingOccurrence {
  nodeId: string;
  level: number;
}

function collectHeadings(
  node: ParsedNode,
  suggestions: SemanticSuggestion[],
  headings: HeadingOccurrence[],
): void {
  const suggestion = suggestions.find((s) => s.nodeId === node.id);
  const tag = suggestion?.suggestedTag;

  if (tag && /^h[1-6]$/.test(tag)) {
    headings.push({
      nodeId: node.id,
      level: parseInt(tag.charAt(1), 10),
    });
  }

  if (node.children) {
    for (const child of node.children) {
      collectHeadings(child, suggestions, headings);
    }
  }
}

function validateHeadingHierarchy(
  roots: ParsedNode[],
  suggestions: SemanticSuggestion[],
): HierarchyIssue[] {
  const issues: HierarchyIssue[] = [];
  const headings: HeadingOccurrence[] = [];

  for (const root of roots) {
    collectHeadings(root, suggestions, headings);
  }

  if (headings.length === 0) {
    return issues;
  }

  // Check: first heading should be h1
  const firstHeading = headings[0];
  if (firstHeading && firstHeading.level !== 1) {
    issues.push({
      message: `First heading is h${firstHeading.level} — the page should start with an h1`,
      severity: 'error',
      nodeIds: [firstHeading.nodeId],
    });
  }

  // Check: no skipped heading levels (e.g. h1 → h3 without h2)
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1];
    const curr = headings[i];
    if (prev && curr && curr.level > prev.level + 1) {
      issues.push({
        message: `Heading h${curr.level} follows h${prev.level} — skipped h${prev.level + 1}`,
        severity: 'warning',
        nodeIds: [curr.nodeId, prev.nodeId],
      });
    }
  }

  // Check: multiple h1 tags
  const h1Nodes = headings.filter((h) => h.level === 1);
  if (h1Nodes.length > 1) {
    issues.push({
      message: `Found ${h1Nodes.length} h1 elements — a page should have exactly one h1`,
      severity: 'warning',
      nodeIds: h1Nodes.map((h) => h.nodeId),
    });
  }

  return issues;
}

// ── Public API ──

export function analyzeSemanticHtml(nodes: ParsedNode[]): SemanticAnalysisResult {
  const suggestions: SemanticSuggestion[] = [];

  for (const node of nodes) {
    const nodeSuggestions = collectSuggestions(node, true, null);
    suggestions.push(...nodeSuggestions);
  }

  const hierarchyIssues = validateHeadingHierarchy(nodes, suggestions);

  return { suggestions, hierarchyIssues };
}
