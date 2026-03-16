import { onCall } from 'firebase-functions/v2/https';
import { requireAuth, getUserToken, callClaudeJson } from './utils';

interface CodeReviewResult {
  issues: Array<{
    severity: 'error' | 'warning' | 'info';
    category: string;
    title: string;
    description: string;
    line?: number;
    suggestion?: string;
  }>;
  summary: string;
  score: number;
}

export const aiCodeReview = onCall({ region: 'europe-west1', timeoutSeconds: 60 }, async (request) => {
  const uid = requireAuth(request);
  const { code, codeType } = request.data as { code: string; codeType: 'html' | 'css' | 'javascript' };

  if (!code?.trim()) throw new Error('Code is required');

  const apiKey = await getUserToken(uid, 'anthropic');
  if (!apiKey) throw new Error('Anthropic API key not set. Go to Settings → Integrations.');

  const result = await callClaudeJson<CodeReviewResult>({
    apiKey,
    system: `You are a web development code reviewer specializing in Webflow custom embeds. Review for performance, security, compatibility, accessibility, and best practices. Score 0-100. Output valid JSON only.`,
    messages: [{
      role: 'user',
      content: `Review this ${codeType} for Webflow:\n\n\`\`\`${codeType}\n${code.slice(0, 5000)}\n\`\`\`\n\nReturn JSON: { "issues": [...], "summary": "...", "score": 75 }`,
    }],
    maxTokens: 2048,
    temperature: 0.2,
  });

  return result;
});
