import { createClaudeClient } from '../integrations/claude-client.js';

interface CodeReviewIssue {
  severity: 'error' | 'warning' | 'info';
  category: 'performance' | 'security' | 'compatibility' | 'accessibility' | 'best-practice';
  title: string;
  description: string;
  line?: number;
  suggestion?: string;
}

interface CodeReviewResult {
  issues: CodeReviewIssue[];
  summary: string;
  score: number;
}

export async function reviewCustomCode(
  apiKey: string,
  code: string,
  codeType: 'html' | 'css' | 'javascript',
  context: string = 'webflow-embed',
): Promise<CodeReviewResult> {
  const client = createClaudeClient(apiKey);

  const { data, usage } = await client.completeJson<CodeReviewResult>({
    system: `You are a web development code reviewer specializing in Webflow custom embeds and custom code. You review code for: performance impact (blocking scripts, large payloads, layout thrashing), security issues (XSS, data exposure, unsafe eval), Webflow compatibility (conflicts with Webflow runtime, jQuery version conflicts, class name collisions), accessibility violations, and general best practices. Score from 0-100 where 100 is perfect. Output valid JSON only.`,
    messages: [
      {
        role: 'user',
        content: `Review this ${codeType} code intended for a Webflow ${context}. Identify issues and provide specific fixes.

Code:
\`\`\`${codeType}
${code.slice(0, 5000)}
\`\`\`

Return JSON with this shape:
{
  "issues": [
    {
      "severity": "error",
      "category": "performance",
      "title": "Render-blocking script",
      "description": "This script blocks page rendering. Add async or defer attribute.",
      "line": 5,
      "suggestion": "<script src='...' defer>"
    }
  ],
  "summary": "Brief overall assessment",
  "score": 75
}`,
      },
    ],
    maxTokens: 2048,
    temperature: 0.2,
  });

  console.info('Code review completed', { usage });
  return data;
}
