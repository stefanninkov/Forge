import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { requireAuth, getDb, getUserToken, getProjectToken } from './utils';

const WEBFLOW_API = 'https://api.webflow.com/v2';

async function webflowFetch(path: string, token: string, options: RequestInit = {}) {
  const res = await fetch(`${WEBFLOW_API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'accept': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new HttpsError('failed-precondition', `Webflow API error (${res.status}): ${text}`);
  }
  return res.json();
}

/**
 * Resolve Webflow token — use project token if projectId provided, otherwise first vault token.
 */
async function resolveWebflowToken(uid: string, projectId?: string): Promise<string> {
  if (projectId) {
    return getProjectToken(uid, projectId, 'webflow');
  }
  const token = await getUserToken(uid, 'webflow');
  if (!token) {
    throw new HttpsError('failed-precondition', 'No Webflow API token configured. Add one in Settings → Integrations.');
  }
  return token;
}

export const getWebflowSites = onCall({ region: 'europe-west1' }, async (request) => {
  const uid = requireAuth(request);
  const { projectId } = request.data ?? {};
  const token = await resolveWebflowToken(uid, projectId);
  const data = await webflowFetch('/sites', token);
  return { data: data.sites || [] };
});

export const getWebflowPages = onCall({ region: 'europe-west1' }, async (request) => {
  const uid = requireAuth(request);
  const { siteId, projectId } = request.data;
  if (!siteId) throw new HttpsError('invalid-argument', 'siteId required');
  const token = await resolveWebflowToken(uid, projectId);
  const data = await webflowFetch(`/sites/${siteId}/pages`, token);
  return { data: data.pages || [] };
});

export const pushFigmaToWebflow = onCall({ region: 'europe-west1', timeoutSeconds: 300 }, async (request) => {
  const uid = requireAuth(request);
  const { analysisId, siteId, pageId, parentNodeId, projectId } = request.data;
  if (!analysisId || !siteId || !pageId) {
    throw new HttpsError('invalid-argument', 'analysisId, siteId, and pageId required');
  }

  const token = await resolveWebflowToken(uid, projectId);
  const db = getDb();

  const analysisDoc = await db.collection('figmaAnalyses').doc(analysisId).get();
  if (!analysisDoc.exists) throw new HttpsError('not-found', 'Analysis not found');
  const analysis = analysisDoc.data();
  const structure = analysis?.finalStructure || analysis?.rawStructure;
  if (!structure) throw new HttpsError('not-found', 'No structure in analysis');

  let elementsCreated = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function pushNode(node: any, parentId?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const webflowNode: any = {
      type: 'Element',
      tag: node.semanticTag || node.type || 'div',
      attributes: {},
      children: [],
    };

    if (node.suggestedClass) {
      webflowNode.attributes['class'] = node.suggestedClass;
    }

    if (node.animationAttrs) {
      Object.entries(node.animationAttrs).forEach(([key, value]) => {
        webflowNode.attributes[`data-${key}`] = value;
      });
    }

    if (node.properties?.text) {
      webflowNode.children = [{ type: 'TextNode', text: node.properties.text }];
    }

    if (node.ariaLabel) {
      webflowNode.attributes['aria-label'] = node.ariaLabel;
    }

    const payload = {
      nodes: [webflowNode],
      ...(parentId ? { parentNodeId: parentId } : {}),
    };

    const result = await webflowFetch(
      `/sites/${siteId}/pages/${pageId}/dom`,
      token,
      { method: 'POST', body: JSON.stringify(payload) }
    );

    elementsCreated++;
    const createdNodeId = result?.nodes?.[0]?.nodeId;

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        await pushNode(child, createdNodeId);
      }
    }
  }

  await pushNode(structure, parentNodeId);

  await db.collection('figmaAnalyses').doc(analysisId).update({
    pushedToWebflow: true,
    pushedAt: new Date().toISOString(),
  });

  return {
    success: true,
    elementsCreated,
    message: `Pushed ${elementsCreated} elements to Webflow`,
  };
});

export const pushTemplateToWebflow = onCall({ region: 'europe-west1', timeoutSeconds: 300 }, async (request) => {
  const uid = requireAuth(request);
  const { templateId, siteId, pageId, parentNodeId, projectId } = request.data;
  if (!templateId || !siteId || !pageId) {
    throw new HttpsError('invalid-argument', 'templateId, siteId, and pageId required');
  }

  const token = await resolveWebflowToken(uid, projectId);
  const db = getDb();

  const templateDoc = await db.collection('templates').doc(templateId).get();
  if (!templateDoc.exists) throw new HttpsError('not-found', 'Template not found');
  const template = templateDoc.data();
  const structure = template?.structure;
  if (!structure) throw new HttpsError('not-found', 'No structure in template');

  let elementsCreated = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function pushNode(node: any, parentId?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const webflowNode: any = {
      type: 'Element',
      tag: node.tag || node.type || 'div',
      attributes: { ...(node.attributes || {}) },
      children: node.text ? [{ type: 'TextNode', text: node.text }] : [],
    };

    if (node.className) webflowNode.attributes['class'] = node.className;

    const payload = {
      nodes: [webflowNode],
      ...(parentId ? { parentNodeId: parentId } : {}),
    };

    const result = await webflowFetch(
      `/sites/${siteId}/pages/${pageId}/dom`,
      token,
      { method: 'POST', body: JSON.stringify(payload) }
    );

    elementsCreated++;
    const createdNodeId = result?.nodes?.[0]?.nodeId;

    if (node.children?.length > 0) {
      for (const child of node.children) {
        await pushNode(child, createdNodeId);
      }
    }
  }

  await pushNode(structure, parentNodeId);

  return {
    success: true,
    elementsCreated,
    message: `Pushed ${elementsCreated} elements from template to Webflow`,
  };
});

export const pushMasterScript = onCall({ region: 'europe-west1' }, async (request) => {
  const uid = requireAuth(request);
  const { projectId, siteId, scriptContent, location = 'footer' } = request.data;
  if (!siteId || !scriptContent) {
    throw new HttpsError('invalid-argument', 'siteId and scriptContent required');
  }

  const token = await resolveWebflowToken(uid, projectId);

  await webflowFetch(`/sites/${siteId}/registered_scripts/inline`, token, {
    method: 'POST',
    body: JSON.stringify({
      sourceCode: scriptContent,
      version: new Date().toISOString(),
      displayName: 'Forge Animation Master Script',
      hostedLocation: location === 'header' ? 'header' : 'footer',
    }),
  });

  if (projectId) {
    const db = getDb();
    await db.collection('projects').doc(projectId).update({
      scriptStatus: 'pushed',
      lastDeployedAt: new Date().toISOString(),
    });
  }

  return { success: true, elementsCreated: 0, message: 'Master script deployed to Webflow' };
});

export const pushScalingCss = onCall({ region: 'europe-west1' }, async (request) => {
  const uid = requireAuth(request);
  const { projectId, siteId, scalingCss } = request.data;
  if (!siteId || !scalingCss) {
    throw new HttpsError('invalid-argument', 'siteId and scalingCss required');
  }

  const token = await resolveWebflowToken(uid, projectId);

  await webflowFetch(`/sites/${siteId}/registered_scripts/inline`, token, {
    method: 'POST',
    body: JSON.stringify({
      sourceCode: `<style>${scalingCss}</style>`,
      version: new Date().toISOString(),
      displayName: 'Forge REM Scaling System',
      hostedLocation: 'header',
    }),
  });

  if (projectId) {
    const db = getDb();
    await db.collection('projects').doc(projectId).update({
      'scalingConfig.isPushed': true,
      'scalingConfig.lastPushedAt': new Date().toISOString(),
    });
  }

  return { success: true, elementsCreated: 0, message: 'Scaling system CSS deployed to Webflow' };
});

export const executeSetupItem = onCall({ region: 'europe-west1' }, async (request) => {
  const uid = requireAuth(request);
  const { projectId, itemKey, siteId } = request.data;
  if (!projectId || !itemKey || !siteId) {
    throw new HttpsError('invalid-argument', 'projectId, itemKey, and siteId required');
  }

  // Verify token exists
  await resolveWebflowToken(uid, projectId);

  switch (itemKey) {
    case 'remove_webflow_branding': {
      return { success: false, elementsCreated: 0, message: 'Remove branding manually in Webflow site settings' };
    }
    default: {
      return { success: false, elementsCreated: 0, message: `Auto-execution not available for "${itemKey}". Complete manually in Webflow.` };
    }
  }
});
