import * as admin from 'firebase-admin';
import { type CallableRequest } from 'firebase-functions/v2/https';

/** Get authenticated user ID from callable request, or throw */
export function requireAuth(request: CallableRequest): string {
  if (!request.auth?.uid) {
    throw new Error('Authentication required');
  }
  return request.auth.uid;
}

/** Get Firestore instance */
export function getDb() {
  return admin.firestore();
}

/** Get user's integration access token from Firestore (legacy flat format) */
export async function getUserToken(uid: string, provider: string): Promise<string | null> {
  const db = getDb();
  const userDoc = await db.collection('users').doc(uid).get();
  const data = userDoc.data();
  // Try vault first, fall back to legacy
  const vault = data?.tokenVault?.[provider];
  if (Array.isArray(vault) && vault.length > 0) {
    return vault[0].token ?? null;
  }
  return data?.integrations?.[provider]?.accessToken ?? null;
}

/**
 * Resolve a token for a specific project from the vault.
 * Reads the project's configured tokenId, then looks it up in the user's vault.
 */
export async function getProjectToken(
  uid: string,
  projectId: string,
  provider: 'figma' | 'webflow' | 'anthropic',
): Promise<string> {
  const firestore = getDb();
  const projectDoc = await firestore.collection('projects').doc(projectId).get();
  const projectData = projectDoc.data();
  const tokenId = projectData?.[`${provider}TokenId`] as string | undefined;

  if (!tokenId) {
    // Fall back to first token in vault
    const fallback = await getUserToken(uid, provider);
    if (!fallback) {
      throw new Error(`No ${provider} token configured. Add one in Settings → Integrations.`);
    }
    return fallback;
  }

  const userDoc = await firestore.collection('users').doc(uid).get();
  const userData = userDoc.data();
  const vault = userData?.tokenVault?.[provider];
  if (!Array.isArray(vault)) {
    throw new Error(`No ${provider} tokens found. Add one in Settings → Integrations.`);
  }

  const entry = vault.find((t: { id: string; token: string }) => t.id === tokenId);
  if (!entry) {
    // Token was deleted — fall back to first available
    if (vault.length > 0) return vault[0].token;
    throw new Error(`${provider} token was removed. Add a new one in Settings → Integrations.`);
  }

  return entry.token;
}

// ── Claude API Client ──

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
  usage: { input_tokens: number; output_tokens: number };
}

interface ClaudeOptions {
  apiKey: string;
  system?: string;
  messages: ClaudeMessage[];
  maxTokens?: number;
  temperature?: number;
}

export async function callClaude(options: ClaudeOptions): Promise<string> {
  const { apiKey, system, messages, maxTokens = 4096, temperature = 0.3 } = options;

  const body: Record<string, unknown> = {
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    temperature,
    messages,
  };
  if (system) body.system = system;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API error (${res.status}): ${text}`);
  }

  const data = (await res.json()) as ClaudeResponse;
  return data.content.filter((c) => c.type === 'text').map((c) => c.text).join('');
}

export async function callClaudeJson<T>(options: ClaudeOptions): Promise<T> {
  const text = await callClaude(options);
  let jsonStr = text.trim();
  const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match?.[1]) jsonStr = match[1].trim();
  return JSON.parse(jsonStr) as T;
}
