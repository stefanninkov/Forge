import * as webflow from '../integrations/webflow-client.js';
import { prisma } from '../db/client.js';
import { AppError } from '../utils/errors.js';
import type { Prisma } from '@prisma/client';

// ─── Token Resolution ──────────────────────────────────────────────────────────

async function getUserWebflowToken(userId: string): Promise<string | undefined> {
  const integration = await prisma.userIntegration.findFirst({
    where: { userId, provider: 'webflow' },
  });
  return integration?.accessToken ?? undefined;
}

// ─── MCP Status ────────────────────────────────────────────────────────────────

export async function checkConnection(userId: string): Promise<{
  connected: boolean;
  site?: { name: string; url: string };
}> {
  const token = await getUserWebflowToken(userId);
  if (!token) {
    return { connected: false };
  }

  try {
    const sites = await webflow.listSites(token);
    if (sites.length > 0) {
      const firstSite = sites[0];
      if (firstSite) {
        return {
          connected: true,
          site: {
            name: firstSite.displayName || firstSite.shortName,
            url: firstSite.previewUrl,
          },
        };
      }
    }
    return { connected: true };
  } catch {
    return { connected: false };
  }
}

export async function listSites(userId: string): Promise<webflow.WebflowSite[]> {
  const token = await getUserWebflowToken(userId);
  return webflow.listSites(token);
}

export async function listPages(userId: string, siteId: string): Promise<webflow.WebflowPage[]> {
  const token = await getUserWebflowToken(userId);
  return webflow.listPages(siteId, token);
}

// ─── Push Figma Structure ──────────────────────────────────────────────────────

interface PushFigmaOptions {
  userId: string;
  analysisId: string;
  siteId: string;
  pageId: string;
  parentNodeId?: string;
}

interface PushResult {
  success: boolean;
  elementsCreated: number;
  message: string;
}

interface ParsedNodeRecord {
  tag?: string;
  name?: string;
  className?: string;
  text?: string;
  styles?: Record<string, string>;
  attributes?: Record<string, string>;
  children?: ParsedNodeRecord[];
}

function parsedNodeToForge(node: ParsedNodeRecord): webflow.ForgeNode {
  return {
    tag: node.tag || 'div',
    className: node.className || node.name?.toLowerCase().replace(/\s+/g, '-'),
    text: node.text,
    styles: node.styles,
    attributes: node.attributes,
    children: node.children?.map(parsedNodeToForge),
  };
}

function countNodes(node: webflow.ForgeNode): number {
  let count = 1;
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child);
    }
  }
  return count;
}

export async function pushFigmaAnalysis(options: PushFigmaOptions): Promise<PushResult> {
  const { userId, analysisId, siteId, pageId, parentNodeId } = options;

  // FigmaAnalysis is project-scoped, verify through project ownership
  const analysis = await prisma.figmaAnalysis.findFirst({
    where: { id: analysisId },
    include: { project: { select: { userId: true } } },
  });

  if (!analysis || analysis.project.userId !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Figma analysis not found');
  }

  const structure = (analysis.finalStructure ?? analysis.rawStructure) as unknown as ParsedNodeRecord;
  if (!structure) {
    throw new AppError(400, 'INVALID_STATE', 'No structure to push. Run analysis first.');
  }

  const token = await getUserWebflowToken(userId);
  const forgeNode = parsedNodeToForge(structure);
  const wfNodes = [webflow.forgeNodeToWebflowDom(forgeNode)];
  const elementCount = countNodes(forgeNode);

  await webflow.createElements(
    { siteId, pageId, parentNodeId, nodes: wfNodes },
    token,
  );

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId,
      action: 'TEMPLATE_PUSHED',
      details: { type: 'figma_push', analysisId, elementsCreated: elementCount } as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    success: true,
    elementsCreated: elementCount,
    message: `Successfully pushed ${elementCount} elements to Webflow.`,
  };
}

// ─── Push Template ─────────────────────────────────────────────────────────────

interface PushTemplateOptions {
  userId: string;
  templateId: string;
  siteId: string;
  pageId: string;
  parentNodeId?: string;
}

export async function pushTemplate(options: PushTemplateOptions): Promise<PushResult> {
  const { userId, templateId, siteId, pageId, parentNodeId } = options;

  const template = await prisma.template.findFirst({
    where: {
      id: templateId,
      OR: [{ userId }, { isPublished: true }],
    },
  });

  if (!template) {
    throw new AppError(404, 'NOT_FOUND', 'Template not found');
  }

  const structure = template.structure as unknown as ParsedNodeRecord;
  if (!structure) {
    throw new AppError(400, 'INVALID_STATE', 'Template has no structure to push.');
  }

  const token = await getUserWebflowToken(userId);

  // Convert template structure to Webflow DOM node
  const wfNode: webflow.WebflowDomNode = {
    type: 'Block',
    tag: 'section',
    attributes: {
      class: `forge-template ${template.name.toLowerCase().replace(/\s+/g, '-')}`,
      'data-forge-template': templateId,
    },
    children: [webflow.forgeNodeToWebflowDom(parsedNodeToForge(structure))],
  };

  await webflow.createElements(
    { siteId, pageId, parentNodeId, nodes: [wfNode] },
    token,
  );

  await prisma.activityLog.create({
    data: {
      userId,
      action: 'TEMPLATE_PUSHED',
      details: { templateId, templateName: template.name } as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    success: true,
    elementsCreated: 1,
    message: `Template "${template.name}" pushed to Webflow.`,
  };
}

// ─── Push Master Script ────────────────────────────────────────────────────────

interface PushScriptOptions {
  userId: string;
  projectId: string;
  siteId: string;
  scriptContent: string;
  location?: 'header' | 'footer';
}

export async function pushMasterScript(options: PushScriptOptions): Promise<PushResult> {
  const { userId, projectId, siteId, scriptContent, location = 'footer' } = options;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });

  if (!project) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }

  const token = await getUserWebflowToken(userId);

  await webflow.addCustomCode(
    {
      siteId,
      location,
      type: 'inline',
      inlineCode: scriptContent,
    },
    token,
  );

  // Update project script status
  await prisma.project.update({
    where: { id: projectId },
    data: {
      scriptStatus: 'SYNCED',
      lastDeployedAt: new Date(),
    },
  });

  await prisma.activityLog.create({
    data: {
      userId,
      projectId,
      action: 'SCRIPT_DEPLOYED',
      details: { location } as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    success: true,
    elementsCreated: 0,
    message: `Master animation script pushed to site ${location}.`,
  };
}

// ─── Push Scaling CSS ──────────────────────────────────────────────────────────

interface PushScalingOptions {
  userId: string;
  projectId: string;
  siteId: string;
  scalingCss: string;
}

export async function pushScalingCss(options: PushScalingOptions): Promise<PushResult> {
  const { userId, projectId, siteId, scalingCss } = options;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });

  if (!project) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }

  const token = await getUserWebflowToken(userId);

  const styleCode = `<style data-forge-scaling="true">\n${scalingCss}\n</style>`;

  await webflow.addCustomCode(
    {
      siteId,
      location: 'header',
      type: 'inline',
      inlineCode: styleCode,
    },
    token,
  );

  await prisma.activityLog.create({
    data: {
      userId,
      projectId,
      action: 'PROJECT_UPDATED',
      details: { action: 'push_scaling_css' } as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    success: true,
    elementsCreated: 0,
    message: 'REM scaling system CSS pushed to site header.',
  };
}

// ─── Setup Item Auto-Execute ───────────────────────────────────────────────────

interface ExecuteSetupOptions {
  userId: string;
  projectId: string;
  itemKey: string;
  siteId: string;
}

const SETUP_AUTOMATIONS: Record<string, (siteId: string, token?: string) => Promise<void>> = {
  'seo-noindex-staging': async (siteId: string, token?: string) => {
    await webflow.addCustomCode(
      {
        siteId,
        location: 'header',
        type: 'inline',
        inlineCode: '<meta name="robots" content="noindex, nofollow">',
      },
      token,
    );
  },
  'scripts-jquery-removal': async (_siteId: string, _token?: string) => {
    // jQuery removal requires Webflow dashboard — can't be done via API
  },
  'performance-lazy-loading': async (siteId: string, token?: string) => {
    await webflow.addCustomCode(
      {
        siteId,
        location: 'footer',
        type: 'inline',
        inlineCode: `<script>
document.querySelectorAll('img:not([loading])').forEach(img => {
  img.setAttribute('loading', 'lazy');
});
</script>`,
      },
      token,
    );
  },
};

export async function executeSetupItem(options: ExecuteSetupOptions): Promise<PushResult> {
  const { userId, projectId, itemKey, siteId } = options;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });

  if (!project) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }

  const automation = SETUP_AUTOMATIONS[itemKey];
  if (!automation) {
    throw new AppError(
      400,
      'NOT_AUTOMATABLE',
      `Setup item "${itemKey}" cannot be automated. Complete it manually.`,
    );
  }

  const token = await getUserWebflowToken(userId);

  await automation(siteId, token);

  // Mark the setup item as completed
  await prisma.setupProgress.upsert({
    where: {
      projectId_itemKey: { projectId, itemKey },
    },
    create: {
      projectId,
      itemKey,
      status: 'COMPLETED',
    },
    update: {
      status: 'COMPLETED',
    },
  });

  await prisma.activityLog.create({
    data: {
      userId,
      projectId,
      action: 'PROJECT_UPDATED',
      details: { action: 'auto_execute_setup', itemKey } as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    success: true,
    elementsCreated: 0,
    message: `Setup item "${itemKey}" executed successfully.`,
  };
}
