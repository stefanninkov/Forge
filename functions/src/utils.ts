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

/** Get user's integration access token from Firestore */
export async function getUserToken(uid: string, provider: string): Promise<string | null> {
  const db = getDb();
  const userDoc = await db.collection('users').doc(uid).get();
  const data = userDoc.data();
  return data?.integrations?.[provider]?.accessToken ?? null;
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
