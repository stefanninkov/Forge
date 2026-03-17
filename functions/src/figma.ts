import { onCall } from 'firebase-functions/v2/https';
import { requireAuth, getDb, getProjectToken, callClaudeJson } from './utils';

// ── Types ──

interface FigmaColor { r: number; g: number; b: number; a: number }

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  layoutMode?: string;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  layoutGrow?: number;
  layoutWrap?: string;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  itemSpacing?: number;
  counterAxisSpacing?: number;
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  fills?: Array<{ type: string; visible?: boolean; color?: FigmaColor; opacity?: number; gradientStops?: Array<{ color: FigmaColor; position: number }>; imageRef?: string; scaleMode?: string }>;
  strokes?: Array<{ type: string; color?: FigmaColor; opacity?: number }>;
  strokeWeight?: number;
  individualStrokeWeights?: { top: number; right: number; bottom: number; left: number };
  cornerRadius?: number;
  rectangleCornerRadii?: [number, number, number, number];
  effects?: Array<{ type: string; visible?: boolean; color?: FigmaColor; offset?: { x: number; y: number }; radius?: number; spread?: number }>;
  characters?: string;
  style?: { fontFamily?: string; fontSize?: number; fontWeight?: number; letterSpacing?: number; lineHeightPx?: number; textAlignHorizontal?: string; textDecoration?: string; textCase?: string; italic?: boolean; [key: string]: unknown };
  opacity?: number;
  clipsContent?: boolean;
  visible?: boolean;
  componentId?: string;
}

interface ParsedNode {
  id: string;
  name: string;
  type: string;
  figmaType: string;
  suggestedClass: string;
  semanticTag: string;
  semanticConfidence: 'high' | 'medium' | 'low';
  ariaLabel?: string;
  children: ParsedNode[];
  properties: Record<string, unknown>;
}

interface ParseContext {
  depth: number;
  index: number;
  parentClass: string;
  sectionName: string;
}

interface AuditIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  nodeId: string;
  nodeName: string;
}

// ── Helpers ──

function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[\s_/]+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function isBreakpointFrame(node: FigmaNode): boolean {
  const name = node.name.trim();
  return /^(1920|1440|1280|1024|991|768|767|550|480|479|390|375|360|320)$/.test(name);
}

function selectPrimaryFrame(rootChildren: FigmaNode[]): FigmaNode | null {
  const breakpoints = rootChildren.filter(isBreakpointFrame);
  if (breakpoints.length > 0) {
    const sorted = [...breakpoints].sort((a, b) => (parseInt(b.name) || 0) - (parseInt(a.name) || 0));
    return sorted[0];
  }
  return null;
}

function toClientFirstName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .replace(/[\s]+/g, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function suggestClientFirstClass(node: FigmaNode, ctx: ParseContext): string {
  const name = node.name.trim();
  const lower = name.toLowerCase();

  if (/^(frame|group|rectangle|ellipse|vector|instance|component|boolean)\s*\d*$/i.test(name)) {
    if (ctx.parentClass) return `${ctx.sectionName || ctx.parentClass}_item`;
    return `element-${ctx.index}`;
  }
  if (isBreakpointFrame(node)) return `_breakpoint_${name}`;

  const clean = toClientFirstName(name);

  if (ctx.depth <= 1 && node.type !== 'TEXT') {
    const sectionName = clean.replace(/[-_]?section[-_]?/g, '');
    return `section_${sectionName || 'content'}`;
  }

  if (lower.includes('nav') || lower.includes('menu') || lower.includes('navigation'))
    return `navbar_${clean.replace(/nav(bar|igation)?[-_]?/g, '') || 'component'}`;
  if (lower.includes('hero')) return `hero_${clean.replace(/hero[-_]?/g, '') || 'wrapper'}`;
  if (lower.includes('footer')) return `footer_${clean.replace(/footer[-_]?/g, '') || 'wrapper'}`;
  if (lower.includes('header') && ctx.depth <= 2) return `header_${clean.replace(/header[-_]?/g, '') || 'wrapper'}`;
  if (lower.includes('cta')) return `cta_${clean.replace(/cta[-_]?/g, '') || 'wrapper'}`;
  if (lower.includes('faq')) return `faq_${clean.replace(/faq[-_]?/g, '') || 'wrapper'}`;
  if (lower.includes('testimonial')) return `testimonial_${clean.replace(/testimonials?[-_]?/g, '') || 'wrapper'}`;
  if (lower.includes('pricing')) return `pricing_${clean.replace(/pricing[-_]?/g, '') || 'wrapper'}`;
  if (lower.includes('feature')) return `feature_${clean.replace(/features?[-_]?/g, '') || 'wrapper'}`;

  if (lower.includes('card')) return `${ctx.sectionName}_card`;
  if (lower.includes('button') || lower.includes('btn')) return `button_${clean.replace(/button|btn[-_]?/g, '') || 'primary'}`;
  if (lower.includes('icon')) return `icon_${clean.replace(/icon[-_]?/g, '') || 'wrapper'}`;
  if (lower.includes('image') || lower.includes('img') || lower.includes('photo'))
    return `${ctx.sectionName}_image`;

  if (lower.includes('wrapper') || lower.includes('wrap')) return `${clean}_wrapper`;
  if (lower.includes('container')) return `${clean}_container`;
  if (lower.includes('content')) return `${clean}_content`;
  if (lower.includes('grid') || lower.includes('list')) return `${clean}_list`;
  if (lower.includes('row')) return `${clean}_row`;
  if (lower.includes('col') || lower.includes('column')) return `${clean}_col`;

  return clean || `${ctx.sectionName}_element`;
}

function detectSemanticTag(node: FigmaNode, ctx: ParseContext): { tag: string; confidence: 'high' | 'medium' | 'low'; ariaLabel?: string } {
  const lower = node.name.toLowerCase();

  if (lower.includes('nav') || lower.includes('menu') || lower.includes('navigation'))
    return { tag: 'nav', confidence: 'high', ariaLabel: 'Main navigation' };
  if ((lower.includes('header') || lower.includes('topbar')) && ctx.depth <= 1)
    return { tag: 'header', confidence: 'high' };
  if (lower.includes('footer') && ctx.depth <= 1)
    return { tag: 'footer', confidence: 'high' };
  if (lower.includes('aside') || lower.includes('sidebar'))
    return { tag: 'aside', confidence: 'medium' };

  if (ctx.depth <= 1 && node.type !== 'TEXT')
    return { tag: 'section', confidence: 'medium' };

  if (node.type === 'TEXT' && node.style) {
    const fs = node.style.fontSize || 0;
    if (fs >= 48) return { tag: 'h1', confidence: 'medium' };
    if (fs >= 36) return { tag: 'h2', confidence: 'medium' };
    if (fs >= 24) return { tag: 'h3', confidence: 'medium' };
    if (fs >= 20) return { tag: 'h4', confidence: 'low' };
    return { tag: 'p', confidence: 'medium' };
  }

  if (lower.includes('button') || lower.includes('btn') || lower.includes('cta'))
    return { tag: 'button', confidence: 'medium' };
  if (lower.includes('link') || lower.includes('anchor'))
    return { tag: 'a', confidence: 'medium' };
  if (lower.includes('image') || lower.includes('img') || lower.includes('photo') || lower.includes('logo'))
    return { tag: 'img', confidence: 'medium' };
  if (node.type === 'RECTANGLE' && node.fills?.some((f) => f.type === 'IMAGE'))
    return { tag: 'img', confidence: 'high' };
  if (lower.includes('list') || lower.includes('items'))
    return { tag: 'ul', confidence: 'low' };
  if (lower.includes('question') || lower.includes('faq-q'))
    return { tag: 'h3', confidence: 'medium' };
  if (lower.includes('card') || lower.includes('article') || lower.includes('post'))
    return { tag: 'article', confidence: 'low' };

  return { tag: 'div', confidence: 'low' };
}

function mapFigmaType(node: FigmaNode, ctx: ParseContext): string {
  // Use semantic detection instead of simple type map
  const semantic = detectSemanticTag(node, ctx);
  return semantic.tag;
}

function rgba(c: FigmaColor, opacity?: number): string {
  const r = Math.round(c.r * 255), g = Math.round(c.g * 255), b = Math.round(c.b * 255), a = opacity ?? c.a ?? 1;
  return a >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}

function hex(c: FigmaColor): string {
  return `#${Math.round(c.r * 255).toString(16).padStart(2, '0')}${Math.round(c.g * 255).toString(16).padStart(2, '0')}${Math.round(c.b * 255).toString(16).padStart(2, '0')}`;
}

function mapAlign(a: string): string {
  const m: Record<string, string> = { MIN: 'flex-start', CENTER: 'center', MAX: 'flex-end', BASELINE: 'baseline', SPACE_BETWEEN: 'space-between' };
  return m[a] ?? a.toLowerCase();
}

function parseFigmaNode(node: FigmaNode, depth = 0, index = 0, parentClass = '', sectionName = ''): ParsedNode {
  const ctx: ParseContext = { depth, index, parentClass, sectionName };
  const properties: Record<string, unknown> = {};
  const styles: Record<string, string> = {};

  if (node.layoutMode) { styles.display = 'flex'; styles.flexDirection = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column'; properties.display = 'flex'; properties.flexDirection = styles.flexDirection; }
  if (node.primaryAxisAlignItems) { const m = mapAlign(node.primaryAxisAlignItems); styles.justifyContent = m; properties.justifyContent = m; }
  if (node.counterAxisAlignItems) { const m = mapAlign(node.counterAxisAlignItems); styles.alignItems = m; properties.alignItems = m; }
  if (node.layoutWrap === 'WRAP') styles.flexWrap = 'wrap';
  if (node.layoutGrow === 1) styles.flexGrow = '1';
  if (node.itemSpacing) { styles.gap = `${node.itemSpacing}px`; properties.gap = styles.gap; }
  if (node.counterAxisSpacing) styles.rowGap = `${node.counterAxisSpacing}px`;
  if (node.paddingTop || node.paddingRight || node.paddingBottom || node.paddingLeft) {
    const p = `${node.paddingTop ?? 0}px ${node.paddingRight ?? 0}px ${node.paddingBottom ?? 0}px ${node.paddingLeft ?? 0}px`;
    styles.padding = p; properties.padding = p;
  }
  if (node.absoluteBoundingBox) { properties.width = node.absoluteBoundingBox.width; properties.height = node.absoluteBoundingBox.height; styles.width = `${node.absoluteBoundingBox.width}px`; styles.height = `${node.absoluteBoundingBox.height}px`; }
  if (node.minWidth) styles.minWidth = `${node.minWidth}px`;
  if (node.maxWidth) styles.maxWidth = `${node.maxWidth}px`;

  const fills = (node.fills ?? []).filter((f) => f.visible !== false);
  const fill = fills[0];
  if (fill?.type === 'SOLID' && fill.color) { styles.backgroundColor = rgba(fill.color, fill.opacity); properties.backgroundColor = styles.backgroundColor; properties.backgroundColorHex = hex(fill.color); }
  else if (fill?.type === 'GRADIENT_LINEAR' && fill.gradientStops) { const s = fill.gradientStops.map((gs) => `${rgba(gs.color)} ${Math.round(gs.position * 100)}%`).join(', '); styles.background = `linear-gradient(${s})`; properties.background = styles.background; }
  else if (fill?.type === 'IMAGE') { properties.backgroundImage = true; properties.backgroundSize = fill.scaleMode === 'FILL' ? 'cover' : 'contain'; }

  const strokes = (node.strokes ?? []).filter((s) => s.color);
  if (strokes[0]?.color && node.strokeWeight) { styles.border = `${node.strokeWeight}px solid ${rgba(strokes[0].color, strokes[0].opacity)}`; properties.borderWidth = node.strokeWeight; properties.borderColor = rgba(strokes[0].color); }

  if (node.rectangleCornerRadii) { const [a, b, c, d] = node.rectangleCornerRadii; styles.borderRadius = a === b && b === c && c === d ? `${a}px` : `${a}px ${b}px ${c}px ${d}px`; properties.borderRadius = styles.borderRadius; }
  else if (node.cornerRadius) { styles.borderRadius = `${node.cornerRadius}px`; properties.borderRadius = styles.borderRadius; }

  const effects = (node.effects ?? []).filter((e) => e.visible !== false);
  const shadows = effects.filter((e) => e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW');
  if (shadows.length) { styles.boxShadow = shadows.map((s) => `${s.type === 'INNER_SHADOW' ? 'inset ' : ''}${s.offset?.x ?? 0}px ${s.offset?.y ?? 0}px ${s.radius ?? 0}px ${s.spread ?? 0}px ${s.color ? rgba(s.color) : 'rgba(0,0,0,0.25)'}`).join(', '); properties.boxShadow = styles.boxShadow; }

  if (node.style) {
    const ts = node.style;
    if (ts.fontFamily) { styles.fontFamily = ts.fontFamily; properties.fontFamily = ts.fontFamily; }
    if (ts.fontSize) { styles.fontSize = `${ts.fontSize}px`; properties.fontSize = ts.fontSize; }
    if (ts.fontWeight) { styles.fontWeight = `${ts.fontWeight}`; properties.fontWeight = ts.fontWeight; }
    if (ts.letterSpacing) { styles.letterSpacing = `${ts.letterSpacing}px`; properties.letterSpacing = ts.letterSpacing; }
    if (ts.lineHeightPx) { styles.lineHeight = `${ts.lineHeightPx}px`; properties.lineHeight = ts.lineHeightPx; }
    if (ts.textAlignHorizontal) { const m: Record<string, string> = { LEFT: 'left', CENTER: 'center', RIGHT: 'right', JUSTIFIED: 'justify' }; styles.textAlign = m[ts.textAlignHorizontal] ?? 'left'; }
    if (ts.textDecoration === 'UNDERLINE') styles.textDecoration = 'underline';
    if (ts.textCase === 'UPPER') styles.textTransform = 'uppercase';
  }

  if (node.type === 'TEXT' && fill?.type === 'SOLID' && fill.color) { styles.color = rgba(fill.color, fill.opacity); properties.color = styles.color; properties.colorHex = hex(fill.color); }
  if (node.characters) properties.text = node.characters;
  if (node.opacity !== undefined && node.opacity < 1) { styles.opacity = `${node.opacity}`; properties.opacity = node.opacity; }
  if (node.clipsContent) { styles.overflow = 'hidden'; properties.overflow = 'hidden'; }

  properties._styles = styles;

  const suggestedClass = suggestClientFirstClass(node, ctx);
  const semantic = detectSemanticTag(node, ctx);
  const currentSection = depth <= 1 ? suggestedClass.replace(/^section_/, '') : sectionName;

  return {
    id: node.id,
    name: node.name,
    type: mapFigmaType(node, ctx),
    figmaType: node.type,
    suggestedClass,
    semanticTag: semantic.tag,
    semanticConfidence: semantic.confidence,
    ariaLabel: semantic.ariaLabel,
    children: (node.children ?? []).filter((c) => c.type !== 'VECTOR' || depth < 3).map((c, i) => parseFigmaNode(c, depth + 1, i, suggestedClass, currentSection)),
    properties,
  };
}

function auditNode(node: ParsedNode, issues: AuditIssue[], depth = 0): void {
  if (/^(Frame|Group|Rectangle)\s*\d*$/i.test(node.name)) {
    issues.push({ severity: 'warning', category: 'naming', message: `Generic layer name "${node.name}" — rename for clearer structure`, nodeId: node.id, nodeName: node.name });
  }
  if (depth > 6) issues.push({ severity: 'warning', category: 'nesting', message: `Deep nesting (${depth} levels) — consider flattening`, nodeId: node.id, nodeName: node.name });
  if (node.figmaType === 'FRAME' && !node.properties.display) issues.push({ severity: 'info', category: 'layout', message: 'Frame without auto-layout — may need manual CSS positioning', nodeId: node.id, nodeName: node.name });
  if (['FRAME', 'GROUP', 'COMPONENT'].includes(node.figmaType) && node.children.length === 0 && !node.properties.text) issues.push({ severity: 'info', category: 'structure', message: 'Empty container — may be unnecessary in Webflow', nodeId: node.id, nodeName: node.name });
  for (const child of node.children) auditNode(child, issues, depth + 1);
}

// ── Cloud Functions ──

export const analyzeFigma = onCall({ region: 'europe-west1', timeoutSeconds: 120 }, async (request) => {
  const uid = requireAuth(request);
  const { projectId, figmaUrl, pageName } = request.data as { projectId: string; figmaUrl: string; pageName?: string };

  if (!projectId || !figmaUrl) throw new Error('projectId and figmaUrl are required');

  const db = getDb();

  // Verify project ownership
  const projectDoc = await db.collection('projects').doc(projectId).get();
  if (!projectDoc.exists || projectDoc.data()?.userId !== uid) throw new Error('Project not found');

  // Get Figma token from project vault
  const figmaToken = await getProjectToken(uid, projectId, 'figma');

  // Extract file key
  const match = figmaUrl.match(/figma\.com\/(?:design|file)\/([a-zA-Z0-9]+)/);
  if (!match?.[1]) throw new Error('Invalid Figma URL');
  const fileKey = match[1];

  // Fetch Figma file
  const res = await fetch(`https://api.figma.com/v1/files/${fileKey}`, { headers: { 'X-Figma-Token': figmaToken } });
  if (!res.ok) {
    if (res.status === 403) throw new Error('Figma access denied. Check your access token.');
    if (res.status === 404) throw new Error('Figma file not found.');
    throw new Error(`Figma API error (${res.status})`);
  }
  const figmaData = (await res.json()) as { document: FigmaNode };

  // Find target page
  let targetPage = figmaData.document.children?.[0];
  if (pageName && figmaData.document.children) {
    const found = figmaData.document.children.find((p) => p.name.toLowerCase() === pageName.toLowerCase());
    if (found) targetPage = found;
  }
  if (!targetPage) throw new Error('No pages found in Figma file');

  const issues: AuditIssue[] = [];

  // Detect breakpoint frames
  const primaryFrame = targetPage.children ? selectPrimaryFrame(targetPage.children) : null;
  let parseTarget = targetPage;
  if (primaryFrame) {
    const breakpoints = (targetPage.children ?? []).filter(isBreakpointFrame).map((c) => c.name).sort((a, b) => parseInt(b) - parseInt(a));
    issues.push({ severity: 'info', category: 'breakpoints', message: `Detected responsive breakpoints: ${breakpoints.join(', ')}. Parsing ${primaryFrame.name} as primary desktop layout.`, nodeId: primaryFrame.id, nodeName: primaryFrame.name });
    parseTarget = primaryFrame;
  }

  const rawStructure = parseFigmaNode(parseTarget);
  auditNode(rawStructure, issues);

  // Save analysis to Firestore
  const analysisRef = await db.collection('figmaAnalyses').add({
    projectId,
    userId: uid,
    figmaFileKey: fileKey,
    figmaPageName: pageName ?? targetPage.name,
    rawStructure,
    auditResults: issues,
    createdAt: new Date().toISOString(),
  });

  return {
    id: analysisRef.id,
    figmaFileKey: fileKey,
    pageName: pageName ?? targetPage.name,
    structure: rawStructure,
    audit: issues,
    pages: figmaData.document.children?.map((p) => p.name) ?? [],
  };
});

export const suggestClassNames = onCall({ region: 'europe-west1', timeoutSeconds: 60 }, async (request) => {
  const uid = requireAuth(request);
  const { elements, methodology, analysisId } = request.data as {
    elements?: Array<{ name: string; type: string; context: string }>;
    methodology?: string;
    analysisId?: string;
  };

  // Resolve projectId from analysisId to look up vault token
  const db = getDb();
  let projectId: string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let analysisData: Record<string, any> | undefined;
  if (analysisId) {
    const analysisDoc = await db.collection('figmaAnalyses').doc(analysisId).get();
    if (!analysisDoc.exists) throw new Error('Analysis not found');
    analysisData = analysisDoc.data();
    projectId = analysisData?.projectId;
  }
  if (!projectId) throw new Error('Could not determine project for token resolution');

  const apiKey = await getProjectToken(uid, projectId, 'anthropic');

  // If analysisId is provided, run AI suggestions on the full analysis
  if (analysisId && analysisData) {

    const structure = analysisData.rawStructure;
    const simplified = simplifyForAi(structure);

    const suggestions = await callClaudeJson<Record<string, unknown>>({
      apiKey,
      system: `You are a Webflow development expert specializing in Client-First naming conventions. Analyze Figma structures and suggest optimal Webflow class names. Return JSON with nodeId as keys and objects with: suggestedClass, elementType, notes.`,
      messages: [{ role: 'user', content: `Analyze this Figma structure:\n\n${JSON.stringify(simplified, null, 2)}` }],
    });

    await db.collection('figmaAnalyses').doc(analysisId).update({ aiSuggestions: suggestions });
    return suggestions;
  }

  // Otherwise, suggest class names for individual elements
  if (!elements?.length) throw new Error('elements array is required');

  const meth = methodology ?? 'client-first';
  const list = elements.map((e) => `- "${e.name}" (${e.type}) — context: ${e.context}`).join('\n');

  const result = await callClaudeJson<{ suggestions: Array<{ originalName: string; suggestedClass: string; htmlTag: string; reasoning: string }> }>({
    apiKey,
    system: `You are a Webflow class naming expert following the ${meth} methodology. Output valid JSON only.`,
    messages: [{
      role: 'user',
      content: `Suggest Webflow class names:\n\n${list}\n\nReturn JSON: { "suggestions": [{ "originalName": "...", "suggestedClass": "...", "htmlTag": "...", "reasoning": "..." }] }`,
    }],
    maxTokens: 2048,
    temperature: 0.2,
  });

  return result;
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function simplifyForAi(node: any, depth = 0): Record<string, unknown> {
  if (depth > 4) return { id: node.id, name: node.name, type: node.figmaType };
  return {
    id: node.id,
    name: node.name,
    type: node.figmaType,
    hasAutoLayout: !!node.properties?.display,
    hasText: !!node.properties?.text,
    childCount: node.children?.length ?? 0,
    children: (node.children ?? []).map((c: Record<string, unknown>) => simplifyForAi(c, depth + 1)),
  };
}
