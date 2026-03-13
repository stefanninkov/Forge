import { prisma } from '../db/client.js';
import { NotFoundError } from '../utils/errors.js';
import * as integrationService from './integration-service.js';
import type { Prisma } from '@prisma/client';

// ── Types ──

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  layoutMode?: string;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  itemSpacing?: number;
  fills?: Array<{ type: string; color?: { r: number; g: number; b: number; a: number } }>;
  characters?: string;
  style?: Record<string, unknown>;
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
}

interface ParsedNode {
  id: string;
  name: string;
  type: string;
  figmaType: string;
  suggestedClass: string;
  children: ParsedNode[];
  properties: Record<string, unknown>;
}

interface AuditIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  nodeId: string;
  nodeName: string;
}

// ── Figma File Key Extraction ──

export function extractFileKey(figmaUrl: string): string {
  // Supports: https://www.figma.com/design/FILE_KEY/...
  //           https://www.figma.com/file/FILE_KEY/...
  const match = figmaUrl.match(/figma\.com\/(?:design|file)\/([a-zA-Z0-9]+)/);
  if (!match?.[1]) {
    throw new Error('Invalid Figma URL. Expected format: https://www.figma.com/design/FILE_KEY/...');
  }
  return match[1];
}

// ── Figma API Client ──

async function fetchFigmaFile(fileKey: string, accessToken: string): Promise<FigmaNode> {
  const res = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: { 'X-Figma-Token': accessToken },
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 403) throw new Error('Figma access denied. Check your access token.');
    if (res.status === 404) throw new Error('Figma file not found. Check the URL.');
    throw new Error(`Figma API error (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { document: FigmaNode };
  return data.document;
}

// ── Parser: Figma → Structured Tree ──

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_/]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function suggestClassName(name: string, type: string): string {
  const kebab = toKebabCase(name);
  if (!kebab) return type.toLowerCase();

  // Client-First naming: section_[name], [name]_component, [name]_wrapper, etc.
  const lowerName = name.toLowerCase();
  if (lowerName.includes('section') || type === 'SECTION') {
    return `section_${kebab.replace(/section[-_]?/i, '')}` || 'section';
  }
  if (lowerName.includes('nav') || lowerName.includes('header')) {
    return `${kebab}_component`;
  }
  if (lowerName.includes('wrapper') || lowerName.includes('container')) {
    return `${kebab}_wrapper`;
  }
  if (lowerName.includes('grid') || lowerName.includes('list')) {
    return `${kebab}_list`;
  }

  return kebab;
}

function mapFigmaType(figmaType: string): string {
  const typeMap: Record<string, string> = {
    FRAME: 'div',
    GROUP: 'div',
    COMPONENT: 'div',
    COMPONENT_SET: 'div',
    INSTANCE: 'div',
    TEXT: 'text',
    RECTANGLE: 'div',
    ELLIPSE: 'div',
    VECTOR: 'svg',
    LINE: 'hr',
    SECTION: 'section',
    BOOLEAN_OPERATION: 'svg',
  };
  return typeMap[figmaType] ?? 'div';
}

function parseFigmaNode(node: FigmaNode, depth = 0): ParsedNode {
  const properties: Record<string, unknown> = {};

  if (node.layoutMode) {
    properties.display = 'flex';
    properties.flexDirection = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column';
  }
  if (node.primaryAxisAlignItems) properties.justifyContent = node.primaryAxisAlignItems;
  if (node.counterAxisAlignItems) properties.alignItems = node.counterAxisAlignItems;
  if (node.itemSpacing) properties.gap = `${node.itemSpacing}px`;
  if (node.paddingTop || node.paddingRight || node.paddingBottom || node.paddingLeft) {
    properties.padding = `${node.paddingTop ?? 0}px ${node.paddingRight ?? 0}px ${node.paddingBottom ?? 0}px ${node.paddingLeft ?? 0}px`;
  }
  if (node.absoluteBoundingBox) {
    properties.width = node.absoluteBoundingBox.width;
    properties.height = node.absoluteBoundingBox.height;
  }
  if (node.characters) {
    properties.text = node.characters;
  }

  return {
    id: node.id,
    name: node.name,
    type: mapFigmaType(node.type),
    figmaType: node.type,
    suggestedClass: suggestClassName(node.name, node.type),
    children: (node.children ?? [])
      .filter((child) => child.type !== 'VECTOR' || depth < 3)
      .map((child) => parseFigmaNode(child, depth + 1)),
    properties,
  };
}

// ── Audit Engine ──

function auditNode(node: ParsedNode, issues: AuditIssue[], depth = 0): void {
  // Check naming
  if (/^(Frame|Group|Rectangle)\s*\d*$/i.test(node.name)) {
    issues.push({
      severity: 'warning',
      category: 'naming',
      message: `Generic layer name "${node.name}" — rename for clearer structure`,
      nodeId: node.id,
      nodeName: node.name,
    });
  }

  // Check deep nesting
  if (depth > 6) {
    issues.push({
      severity: 'warning',
      category: 'nesting',
      message: `Deep nesting (${depth} levels) — consider flattening`,
      nodeId: node.id,
      nodeName: node.name,
    });
  }

  // Check auto-layout
  if (node.figmaType === 'FRAME' && !node.properties.display) {
    issues.push({
      severity: 'info',
      category: 'layout',
      message: 'Frame without auto-layout — may need manual CSS positioning',
      nodeId: node.id,
      nodeName: node.name,
    });
  }

  // Check empty containers
  if (
    ['FRAME', 'GROUP', 'COMPONENT'].includes(node.figmaType) &&
    node.children.length === 0 &&
    !node.properties.text
  ) {
    issues.push({
      severity: 'info',
      category: 'structure',
      message: 'Empty container — may be unnecessary in Webflow',
      nodeId: node.id,
      nodeName: node.name,
    });
  }

  for (const child of node.children) {
    auditNode(child, issues, depth + 1);
  }
}

export function auditStructure(structure: ParsedNode): AuditIssue[] {
  const issues: AuditIssue[] = [];
  auditNode(structure, issues);
  return issues;
}

// ── AI Suggestions (Claude API) ──

export async function getAiSuggestions(
  structure: ParsedNode,
  anthropicKey: string,
): Promise<Record<string, unknown>> {
  const simplifiedTree = simplifyForAi(structure);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: `You are a Webflow development expert specializing in Client-First naming conventions.
Analyze Figma structures and suggest optimal Webflow class names following Client-First methodology.
Rules:
- Section wrappers: section_[name]
- Component roots: [name]_component
- Layout wrappers: [name]_wrapper
- Content containers: [name]_content
- Grid/list parents: [name]_list
- Individual items: [name]_item
- Text elements: use semantic names like heading-style-h2, text-size-medium
- Utility classes: margin-top, padding-section-large, etc.

Return JSON with nodeId as keys and objects with: suggestedClass, elementType (section/div/heading/text/link/image), notes (brief explanation).`,
      messages: [
        {
          role: 'user',
          content: `Analyze this Figma structure and suggest Client-First Webflow classes:\n\n${JSON.stringify(simplifiedTree, null, 2)}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { content?: Array<{ text?: string }> };
  const content = data.content?.[0]?.text ?? '{}';

  // Extract JSON from response (may be wrapped in markdown code block)
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, content];
  try {
    return JSON.parse(jsonMatch[1]?.trim() ?? '{}');
  } catch {
    return { raw: content };
  }
}

function simplifyForAi(node: ParsedNode, depth = 0): Record<string, unknown> {
  if (depth > 4) return { id: node.id, name: node.name, type: node.figmaType };

  return {
    id: node.id,
    name: node.name,
    type: node.figmaType,
    hasAutoLayout: !!node.properties.display,
    hasText: !!node.properties.text,
    childCount: node.children.length,
    children: node.children.map((c) => simplifyForAi(c, depth + 1)),
  };
}

// ── Service Functions ──

export async function analyzeFigmaFile(
  userId: string,
  projectId: string,
  figmaUrl: string,
  pageName?: string,
) {
  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) throw new NotFoundError('Project');

  // Get user's Figma token
  const figmaToken = await integrationService.getAccessToken(userId, 'figma');
  if (!figmaToken) {
    throw new Error('Figma not connected. Go to Settings → Integrations to connect your Figma account.');
  }

  const fileKey = extractFileKey(figmaUrl);
  const document = await fetchFigmaFile(fileKey, figmaToken);

  // Find the target page
  let targetPage = document.children?.[0];
  if (pageName && document.children) {
    const found = document.children.find(
      (p) => p.name.toLowerCase() === pageName.toLowerCase(),
    );
    if (found) targetPage = found;
  }

  if (!targetPage) {
    throw new Error('No pages found in Figma file');
  }

  const rawStructure = parseFigmaNode(targetPage);
  const auditResults = auditStructure(rawStructure);

  // Save analysis
  const analysis = await prisma.figmaAnalysis.create({
    data: {
      projectId,
      figmaFileKey: fileKey,
      figmaPageName: pageName ?? targetPage.name,
      rawStructure: rawStructure as unknown as Prisma.InputJsonValue,
      auditResults: auditResults as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    id: analysis.id,
    figmaFileKey: fileKey,
    pageName: analysis.figmaPageName,
    structure: rawStructure,
    audit: auditResults,
    pages: document.children?.map((p) => p.name) ?? [],
  };
}

export async function runAiSuggestions(userId: string, analysisId: string) {
  const analysis = await prisma.figmaAnalysis.findFirst({
    where: { id: analysisId },
    include: { project: { select: { userId: true } } },
  });
  if (!analysis || analysis.project.userId !== userId) {
    throw new NotFoundError('Analysis');
  }

  const anthropicKey = await integrationService.getAccessToken(userId, 'anthropic');
  if (!anthropicKey) {
    throw new Error('Anthropic API key not set. Go to Settings → Integrations to add it.');
  }

  const structure = analysis.rawStructure as unknown as ParsedNode;
  const suggestions = await getAiSuggestions(structure, anthropicKey);

  await prisma.figmaAnalysis.update({
    where: { id: analysisId },
    data: { aiSuggestions: suggestions as unknown as Prisma.InputJsonValue },
  });

  return suggestions;
}

export async function updateAnalysis(
  userId: string,
  analysisId: string,
  finalStructure: Record<string, unknown>,
) {
  const analysis = await prisma.figmaAnalysis.findFirst({
    where: { id: analysisId },
    include: { project: { select: { userId: true } } },
  });
  if (!analysis || analysis.project.userId !== userId) {
    throw new NotFoundError('Analysis');
  }

  return prisma.figmaAnalysis.update({
    where: { id: analysisId },
    data: { finalStructure: finalStructure as Prisma.InputJsonValue },
  });
}

export async function getAnalysis(userId: string, analysisId: string) {
  const analysis = await prisma.figmaAnalysis.findFirst({
    where: { id: analysisId },
    include: { project: { select: { userId: true } } },
  });
  if (!analysis || analysis.project.userId !== userId) {
    throw new NotFoundError('Analysis');
  }
  return analysis;
}

export async function listAnalyses(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) throw new NotFoundError('Project');

  return prisma.figmaAnalysis.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      figmaFileKey: true,
      figmaPageName: true,
      pushedToWebflow: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
