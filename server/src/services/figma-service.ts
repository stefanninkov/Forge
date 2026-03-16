import { prisma } from '../db/client.js';
import { NotFoundError } from '../utils/errors.js';
import * as integrationService from './integration-service.js';
import type { Prisma } from '@prisma/client';

// ── Types ──

interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  // Layout
  layoutMode?: string;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  layoutAlign?: string;
  layoutGrow?: number;
  layoutWrap?: string;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  itemSpacing?: number;
  counterAxisSpacing?: number;
  // Size
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  constraints?: { horizontal: string; vertical: string };
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  // Fills & Strokes
  fills?: Array<{
    type: string;
    visible?: boolean;
    color?: FigmaColor;
    opacity?: number;
    gradientStops?: Array<{ color: FigmaColor; position: number }>;
    gradientHandlePositions?: Array<{ x: number; y: number }>;
    imageRef?: string;
    scaleMode?: string;
  }>;
  strokes?: Array<{ type: string; color?: FigmaColor; opacity?: number }>;
  strokeWeight?: number;
  strokeAlign?: string;
  individualStrokeWeights?: { top: number; right: number; bottom: number; left: number };
  // Corner radius
  cornerRadius?: number;
  rectangleCornerRadii?: [number, number, number, number];
  // Effects (shadows, blurs)
  effects?: Array<{
    type: string;
    visible?: boolean;
    color?: FigmaColor;
    offset?: { x: number; y: number };
    radius?: number;
    spread?: number;
  }>;
  // Typography
  characters?: string;
  style?: {
    fontFamily?: string;
    fontPostScriptName?: string;
    fontWeight?: number;
    fontSize?: number;
    textAlignHorizontal?: string;
    textAlignVertical?: string;
    letterSpacing?: number;
    lineHeightPx?: number;
    lineHeightPercent?: number;
    lineHeightUnit?: string;
    textDecoration?: string;
    textCase?: string;
    italic?: boolean;
    [key: string]: unknown;
  };
  // Opacity & blend
  opacity?: number;
  blendMode?: string;
  // Visibility & clipping
  visible?: boolean;
  clipsContent?: boolean;
  // Component info
  componentId?: string;
  componentProperties?: Record<string, unknown>;
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

function figmaColorToRgba(color: FigmaColor, opacity?: number): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = opacity ?? color.a ?? 1;
  if (a >= 1) return `rgb(${r}, ${g}, ${b})`;
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}

function figmaColorToHex(color: FigmaColor): string {
  const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
  const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
  const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

function mapAlignItems(figmaAlign: string): string {
  const map: Record<string, string> = {
    MIN: 'flex-start',
    CENTER: 'center',
    MAX: 'flex-end',
    BASELINE: 'baseline',
    SPACE_BETWEEN: 'space-between',
  };
  return map[figmaAlign] ?? figmaAlign.toLowerCase();
}

function parseFigmaNode(node: FigmaNode, depth = 0): ParsedNode {
  const properties: Record<string, unknown> = {};
  const styles: Record<string, string> = {};

  // ── Layout ──
  if (node.layoutMode) {
    styles.display = 'flex';
    styles.flexDirection = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column';
    properties.display = 'flex';
    properties.flexDirection = styles.flexDirection;
  }
  if (node.primaryAxisAlignItems) {
    const mapped = mapAlignItems(node.primaryAxisAlignItems);
    styles.justifyContent = mapped;
    properties.justifyContent = mapped;
  }
  if (node.counterAxisAlignItems) {
    const mapped = mapAlignItems(node.counterAxisAlignItems);
    styles.alignItems = mapped;
    properties.alignItems = mapped;
  }
  if (node.layoutWrap === 'WRAP') {
    styles.flexWrap = 'wrap';
  }
  if (node.layoutGrow === 1) {
    styles.flexGrow = '1';
  }
  if (node.itemSpacing) {
    styles.gap = `${node.itemSpacing}px`;
    properties.gap = `${node.itemSpacing}px`;
  }
  if (node.counterAxisSpacing) {
    styles.rowGap = `${node.counterAxisSpacing}px`;
  }
  if (node.paddingTop || node.paddingRight || node.paddingBottom || node.paddingLeft) {
    const pt = node.paddingTop ?? 0;
    const pr = node.paddingRight ?? 0;
    const pb = node.paddingBottom ?? 0;
    const pl = node.paddingLeft ?? 0;
    styles.padding = `${pt}px ${pr}px ${pb}px ${pl}px`;
    properties.padding = styles.padding;
  }

  // ── Dimensions ──
  if (node.absoluteBoundingBox) {
    properties.width = node.absoluteBoundingBox.width;
    properties.height = node.absoluteBoundingBox.height;
    styles.width = `${node.absoluteBoundingBox.width}px`;
    styles.height = `${node.absoluteBoundingBox.height}px`;
  }
  if (node.minWidth) styles.minWidth = `${node.minWidth}px`;
  if (node.maxWidth) styles.maxWidth = `${node.maxWidth}px`;
  if (node.minHeight) styles.minHeight = `${node.minHeight}px`;
  if (node.maxHeight) styles.maxHeight = `${node.maxHeight}px`;

  // ── Background / Fills ──
  const visibleFills = (node.fills ?? []).filter((f) => f.visible !== false);
  const firstFill = visibleFills[0];
  if (firstFill) {
    if (firstFill.type === 'SOLID' && firstFill.color) {
      const color = figmaColorToRgba(firstFill.color, firstFill.opacity);
      styles.backgroundColor = color;
      properties.backgroundColor = color;
      properties.backgroundColorHex = figmaColorToHex(firstFill.color);
    } else if (firstFill.type === 'GRADIENT_LINEAR' && firstFill.gradientStops) {
      const stops = firstFill.gradientStops
        .map((s) => `${figmaColorToRgba(s.color)} ${Math.round(s.position * 100)}%`)
        .join(', ');
      styles.background = `linear-gradient(${stops})`;
      properties.background = styles.background;
    } else if (firstFill.type === 'IMAGE') {
      properties.backgroundImage = true;
      properties.backgroundSize = firstFill.scaleMode === 'FILL' ? 'cover' : firstFill.scaleMode === 'FIT' ? 'contain' : 'cover';
      styles.backgroundSize = properties.backgroundSize as string;
    }
  }

  // ── Border / Strokes ──
  const visibleStrokes = (node.strokes ?? []).filter((s) => s.color);
  const firstStroke = visibleStrokes[0];
  if (firstStroke && firstStroke.color && node.strokeWeight) {
    const color = figmaColorToRgba(firstStroke.color, firstStroke.opacity);
    const weight = node.strokeWeight;
    styles.border = `${weight}px solid ${color}`;
    properties.borderWidth = weight;
    properties.borderColor = color;
    properties.borderColorHex = figmaColorToHex(firstStroke.color);
  }
  if (node.individualStrokeWeights) {
    const sw = node.individualStrokeWeights;
    properties.borderTopWidth = sw.top;
    properties.borderRightWidth = sw.right;
    properties.borderBottomWidth = sw.bottom;
    properties.borderLeftWidth = sw.left;
  }

  // ── Corner Radius ──
  if (node.rectangleCornerRadii) {
    const [tl, tr, br, bl] = node.rectangleCornerRadii;
    if (tl === tr && tr === br && br === bl) {
      styles.borderRadius = `${tl}px`;
    } else {
      styles.borderRadius = `${tl}px ${tr}px ${br}px ${bl}px`;
    }
    properties.borderRadius = styles.borderRadius;
  } else if (node.cornerRadius) {
    styles.borderRadius = `${node.cornerRadius}px`;
    properties.borderRadius = styles.borderRadius;
  }

  // ── Effects (Shadows, Blurs) ──
  const visibleEffects = (node.effects ?? []).filter((e) => e.visible !== false);
  const shadows = visibleEffects.filter((e) => e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW');
  if (shadows.length > 0) {
    const shadowStr = shadows.map((s) => {
      const x = s.offset?.x ?? 0;
      const y = s.offset?.y ?? 0;
      const blur = s.radius ?? 0;
      const spread = s.spread ?? 0;
      const color = s.color ? figmaColorToRgba(s.color) : 'rgba(0,0,0,0.25)';
      const inset = s.type === 'INNER_SHADOW' ? 'inset ' : '';
      return `${inset}${x}px ${y}px ${blur}px ${spread}px ${color}`;
    }).join(', ');
    styles.boxShadow = shadowStr;
    properties.boxShadow = shadowStr;
  }
  const firstBlur = visibleEffects.find((e) => e.type === 'LAYER_BLUR');
  if (firstBlur && firstBlur.radius) {
    styles.filter = `blur(${firstBlur.radius}px)`;
    properties.blur = firstBlur.radius;
  }
  const firstBgBlur = visibleEffects.find((e) => e.type === 'BACKGROUND_BLUR');
  if (firstBgBlur && firstBgBlur.radius) {
    styles.backdropFilter = `blur(${firstBgBlur.radius}px)`;
    properties.backdropBlur = firstBgBlur.radius;
  }

  // ── Typography ──
  if (node.style) {
    const ts = node.style;
    if (ts.fontFamily) {
      styles.fontFamily = ts.fontFamily;
      properties.fontFamily = ts.fontFamily;
    }
    if (ts.fontSize) {
      styles.fontSize = `${ts.fontSize}px`;
      properties.fontSize = ts.fontSize;
    }
    if (ts.fontWeight) {
      styles.fontWeight = `${ts.fontWeight}`;
      properties.fontWeight = ts.fontWeight;
    }
    if (ts.italic) {
      styles.fontStyle = 'italic';
    }
    if (ts.letterSpacing) {
      styles.letterSpacing = `${ts.letterSpacing}px`;
      properties.letterSpacing = ts.letterSpacing;
    }
    if (ts.lineHeightPx) {
      styles.lineHeight = `${ts.lineHeightPx}px`;
      properties.lineHeight = ts.lineHeightPx;
    }
    if (ts.textAlignHorizontal) {
      const alignMap: Record<string, string> = { LEFT: 'left', CENTER: 'center', RIGHT: 'right', JUSTIFIED: 'justify' };
      styles.textAlign = alignMap[ts.textAlignHorizontal] ?? 'left';
    }
    if (ts.textDecoration === 'UNDERLINE') {
      styles.textDecoration = 'underline';
    } else if (ts.textDecoration === 'STRIKETHROUGH') {
      styles.textDecoration = 'line-through';
    }
    if (ts.textCase === 'UPPER') {
      styles.textTransform = 'uppercase';
    } else if (ts.textCase === 'LOWER') {
      styles.textTransform = 'lowercase';
    } else if (ts.textCase === 'TITLE') {
      styles.textTransform = 'capitalize';
    }
  }

  // Text node color (from fills, since Figma uses fills for text color)
  if (node.type === 'TEXT' && firstFill && firstFill.type === 'SOLID' && firstFill.color) {
    styles.color = figmaColorToRgba(firstFill.color, firstFill.opacity);
    properties.color = styles.color;
    properties.colorHex = figmaColorToHex(firstFill.color);
  }

  if (node.characters) {
    properties.text = node.characters;
  }

  // ── Opacity ──
  if (node.opacity !== undefined && node.opacity < 1) {
    styles.opacity = `${node.opacity}`;
    properties.opacity = node.opacity;
  }

  // ── Overflow ──
  if (node.clipsContent) {
    styles.overflow = 'hidden';
    properties.overflow = 'hidden';
  }

  // Store computed styles for preview rendering
  properties._styles = styles;

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

  prisma.activityLog.create({
    data: { userId, projectId, action: 'FIGMA_ANALYZED', details: { fileKey } },
  }).catch(() => {});

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
