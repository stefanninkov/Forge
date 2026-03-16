import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

interface WebflowRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: Record<string, unknown>;
  token?: string;
}

interface WebflowSite {
  id: string;
  displayName: string;
  shortName: string;
  previewUrl: string;
  createdOn: string;
  lastPublished: string | null;
}

interface WebflowPage {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  parentId: string | null;
  createdOn: string;
  lastUpdated: string;
}

interface WebflowDomNode {
  nodeId?: string;
  type: string;
  tag?: string;
  attributes?: Record<string, string>;
  styles?: WebflowStyleEntry[];
  children?: WebflowDomNode[];
  text?: string;
}

interface WebflowStyleEntry {
  property: string;
  value: string;
}

interface WebflowCustomCode {
  scripts: Array<{
    id?: string;
    location: 'header' | 'footer';
    version: string;
    attributes: Record<string, string>;
    type: 'hosted' | 'inline';
    sourceUrl?: string;
    inlineCode?: string;
  }>;
}

interface CreateElementPayload {
  siteId: string;
  pageId: string;
  parentNodeId?: string;
  nodes: WebflowDomNode[];
}

interface SetAttributePayload {
  siteId: string;
  pageId: string;
  nodeId: string;
  attributes: Record<string, string>;
}

interface AddCustomCodePayload {
  siteId: string;
  location: 'header' | 'footer';
  type: 'hosted' | 'inline';
  sourceUrl?: string;
  inlineCode?: string;
  version?: string;
}

interface PublishPayload {
  siteId: string;
  domains?: string[];
}

const WEBFLOW_API_BASE = 'https://api.webflow.com/v2';

function getToken(userToken?: string): string {
  const token = userToken ?? env.WEBFLOW_MCP_TOKEN;
  if (!token) {
    throw new AppError(
      400,
      'WEBFLOW_NOT_CONFIGURED',
      'Webflow API token is not configured. Add your token in Settings → Integrations.',
    );
  }
  return token;
}

async function webflowRequest<T = unknown>(options: WebflowRequestOptions): Promise<T> {
  const token = getToken(options.token);

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  const url = `${WEBFLOW_API_BASE}${options.path}`;
  const fetchOptions: RequestInit = {
    method: options.method,
    headers,
  };

  if (options.body && options.method !== 'GET') {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `Webflow API error (${response.status})`;
    try {
      const parsed = JSON.parse(errorBody);
      errorMessage = parsed.message || parsed.msg || errorMessage;
    } catch {
      if (errorBody) errorMessage = errorBody;
    }
    throw new AppError(response.status, 'WEBFLOW_API_ERROR', errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

// ─── Site Operations ───────────────────────────────────────────────────────────

export async function listSites(token?: string): Promise<WebflowSite[]> {
  const result = await webflowRequest<{ sites: WebflowSite[] }>({
    method: 'GET',
    path: '/sites',
    token,
  });
  return result.sites;
}

export async function getSite(siteId: string, token?: string): Promise<WebflowSite> {
  return webflowRequest<WebflowSite>({
    method: 'GET',
    path: `/sites/${siteId}`,
    token,
  });
}

// ─── Page Operations ───────────────────────────────────────────────────────────

export async function listPages(siteId: string, token?: string): Promise<WebflowPage[]> {
  const result = await webflowRequest<{ pages: WebflowPage[] }>({
    method: 'GET',
    path: `/sites/${siteId}/pages`,
    token,
  });
  return result.pages;
}

export async function getPage(pageId: string, token?: string): Promise<WebflowPage> {
  return webflowRequest<WebflowPage>({
    method: 'GET',
    path: `/pages/${pageId}`,
    token,
  });
}

// ─── DOM Operations ────────────────────────────────────────────────────────────

export async function getPageDom(pageId: string, token?: string): Promise<{ nodes: WebflowDomNode[] }> {
  return webflowRequest<{ nodes: WebflowDomNode[] }>({
    method: 'GET',
    path: `/pages/${pageId}/dom`,
    token,
  });
}

export async function updatePageDom(
  pageId: string,
  nodes: WebflowDomNode[],
  token?: string,
): Promise<void> {
  await webflowRequest({
    method: 'PUT',
    path: `/pages/${pageId}/dom`,
    body: { nodes } as unknown as Record<string, unknown>,
    token,
  });
}

export async function createElements(payload: CreateElementPayload, token?: string): Promise<{ nodes: WebflowDomNode[] }> {
  return webflowRequest<{ nodes: WebflowDomNode[] }>({
    method: 'POST',
    path: `/pages/${payload.pageId}/dom`,
    body: {
      nodes: payload.nodes,
      parentNodeId: payload.parentNodeId,
    } as unknown as Record<string, unknown>,
    token,
  });
}

// ─── Attribute Operations ──────────────────────────────────────────────────────

export async function setElementAttributes(payload: SetAttributePayload, token?: string): Promise<void> {
  await webflowRequest({
    method: 'PATCH',
    path: `/pages/${payload.pageId}/dom/${payload.nodeId}`,
    body: {
      attributes: payload.attributes,
    } as unknown as Record<string, unknown>,
    token,
  });
}

// ─── Custom Code Operations ────────────────────────────────────────────────────

export async function getCustomCode(siteId: string, token?: string): Promise<WebflowCustomCode> {
  return webflowRequest<WebflowCustomCode>({
    method: 'GET',
    path: `/sites/${siteId}/custom_code`,
    token,
  });
}

export async function addCustomCode(payload: AddCustomCodePayload, token?: string): Promise<void> {
  const script: Record<string, unknown> = {
    location: payload.location,
    type: payload.type,
    version: payload.version ?? '1.0.0',
    attributes: {},
  };

  if (payload.type === 'hosted' && payload.sourceUrl) {
    script.sourceUrl = payload.sourceUrl;
  } else if (payload.type === 'inline' && payload.inlineCode) {
    script.inlineCode = payload.inlineCode;
  }

  await webflowRequest({
    method: 'POST',
    path: `/sites/${payload.siteId}/custom_code`,
    body: { scripts: [script] },
    token,
  });
}

export async function upsertPageCustomCode(
  pageId: string,
  location: 'header' | 'footer',
  code: string,
  token?: string,
): Promise<void> {
  await webflowRequest({
    method: 'PUT',
    path: `/pages/${pageId}/custom_code`,
    body: {
      scripts: [{
        location,
        type: 'inline',
        version: '1.0.0',
        attributes: {},
        inlineCode: code,
      }],
    },
    token,
  });
}

// ─── Publish Operations ────────────────────────────────────────────────────────

export async function publishSite(payload: PublishPayload, token?: string): Promise<void> {
  await webflowRequest({
    method: 'POST',
    path: `/sites/${payload.siteId}/publish`,
    body: payload.domains ? { domains: payload.domains } as unknown as Record<string, unknown> : {},
    token,
  });
}

// ─── Helper: Convert Forge structure to Webflow DOM nodes ──────────────────────

interface ForgeNode {
  tag: string;
  className?: string;
  text?: string;
  styles?: Record<string, string>;
  attributes?: Record<string, string>;
  children?: ForgeNode[];
}

export function forgeNodeToWebflowDom(node: ForgeNode): WebflowDomNode {
  const wfNode: WebflowDomNode = {
    type: node.text && !node.children?.length ? 'Text' : 'Block',
    tag: node.tag || 'div',
  };

  const attrs: Record<string, string> = {};
  if (node.className) {
    attrs['class'] = node.className;
  }
  if (node.attributes) {
    Object.assign(attrs, node.attributes);
  }
  if (Object.keys(attrs).length > 0) {
    wfNode.attributes = attrs;
  }

  if (node.styles && Object.keys(node.styles).length > 0) {
    wfNode.styles = Object.entries(node.styles).map(([property, value]) => ({
      property,
      value,
    }));
  }

  if (node.text && !node.children?.length) {
    wfNode.text = node.text;
  }

  if (node.children && node.children.length > 0) {
    wfNode.children = node.children.map(forgeNodeToWebflowDom);
  }

  return wfNode;
}

// ─── Types Export ──────────────────────────────────────────────────────────────

export type {
  WebflowSite,
  WebflowPage,
  WebflowDomNode,
  WebflowCustomCode,
  ForgeNode,
  CreateElementPayload,
  SetAttributePayload,
  AddCustomCodePayload,
  PublishPayload,
};
