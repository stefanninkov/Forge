import { onCall } from 'firebase-functions/v2/https';
import { requireAuth, getDb, getUserToken, callClaudeJson } from './utils';

// ── Types ──

interface SpeedFinding {
  category: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  recommendation: string;
  savingsMs?: number;
  savingsBytes?: number;
}

interface SeoFinding {
  category: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  element?: string;
  recommendation: string;
}

interface PageSpeedResponse {
  lighthouseResult: {
    categories: { performance: { score: number } };
    audits: Record<string, {
      id: string; title: string; description: string; score: number | null;
      displayValue?: string;
      details?: { type: string; items?: Array<Record<string, unknown>>; overallSavingsMs?: number; overallSavingsBytes?: number };
    }>;
  };
}

const CATEGORY_MAP: Record<string, string> = {
  'render-blocking-resources': 'scripts', 'uses-responsive-images': 'images', 'offscreen-images': 'images',
  'unminified-css': 'scripts', 'unminified-javascript': 'scripts', 'unused-css-rules': 'webflow-overhead',
  'unused-javascript': 'webflow-overhead', 'uses-optimized-images': 'images', 'modern-image-formats': 'images',
  'uses-text-compression': 'scripts', 'server-response-time': 'scripts', 'font-display': 'fonts',
  'largest-contentful-paint': 'core-web-vitals', 'cumulative-layout-shift': 'core-web-vitals',
  'interaction-to-next-paint': 'core-web-vitals', 'first-contentful-paint': 'core-web-vitals',
  'speed-index': 'core-web-vitals', 'total-blocking-time': 'core-web-vitals', 'dom-size': 'webflow-overhead',
  'total-byte-weight': 'webflow-overhead',
};

function auditSeverity(score: number | null): SpeedFinding['severity'] {
  if (score === null) return 'info';
  if (score >= 0.9) return 'success';
  if (score >= 0.5) return 'warning';
  return 'error';
}

function parsePageSpeedResults(data: PageSpeedResponse, strategy: string) {
  const { lighthouseResult } = data;
  const performanceScore = Math.round((lighthouseResult.categories.performance.score ?? 0) * 100);
  const audits = lighthouseResult.audits;

  const lcp = audits['largest-contentful-paint'];
  const cls = audits['cumulative-layout-shift'];
  const inp = audits['interaction-to-next-paint'] ?? audits['max-potential-fid'];
  const fcp = audits['first-contentful-paint'];

  const coreWebVitals = {
    lcp: { value: lcp?.displayValue ?? 'N/A', score: lcp?.score ?? 0 },
    cls: { value: cls?.displayValue ?? 'N/A', score: cls?.score ?? 0 },
    inp: { value: inp?.displayValue ?? 'N/A', score: inp?.score ?? 0 },
    fcp: { value: fcp?.displayValue ?? 'N/A', score: fcp?.score ?? 0 },
  };

  const findings: SpeedFinding[] = [];
  for (const [auditId, audit] of Object.entries(audits)) {
    if (audit.score === null || audit.score >= 0.9) continue;
    if (!audit.details?.items?.length && !audit.details?.overallSavingsMs) continue;
    findings.push({
      category: CATEGORY_MAP[auditId] ?? 'scripts',
      severity: auditSeverity(audit.score),
      title: audit.title,
      description: audit.description.replace(/\[.*?\]\(.*?\)/g, '').trim(),
      recommendation: audit.displayValue ?? '',
      savingsMs: audit.details?.overallSavingsMs,
      savingsBytes: audit.details?.overallSavingsBytes,
    });
  }

  findings.sort((a, b) => {
    const order = { error: 0, warning: 1, info: 2, success: 3 };
    return order[a.severity] - order[b.severity];
  });

  const categories: Record<string, number> = {};
  for (const f of findings) categories[f.category] = (categories[f.category] ?? 0) + 1;

  return { performanceScore, strategy, coreWebVitals, categories, findings };
}

// ── Speed Audit ──

export const runSpeedAudit = onCall({ region: 'europe-west1', timeoutSeconds: 120 }, async (request) => {
  const uid = requireAuth(request);
  const { projectId, url } = request.data as { projectId: string; url: string };

  if (!projectId || !url) throw new Error('projectId and url are required');
  try { new URL(url); } catch { throw new Error('Invalid URL'); }

  const db = getDb();
  const projectDoc = await db.collection('projects').doc(projectId).get();
  if (!projectDoc.exists || projectDoc.data()?.userId !== uid) throw new Error('Project not found');

  const apiUrl = (strategy: string) => {
    const u = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    u.searchParams.set('url', url);
    u.searchParams.set('strategy', strategy);
    u.searchParams.set('category', 'performance');
    return u.toString();
  };

  const [mobileRes, desktopRes] = await Promise.all([
    fetch(apiUrl('mobile')).then((r) => r.json() as Promise<PageSpeedResponse>),
    fetch(apiUrl('desktop')).then((r) => r.json() as Promise<PageSpeedResponse>),
  ]);

  const mobile = parsePageSpeedResults(mobileRes, 'mobile');
  const desktop = parsePageSpeedResults(desktopRes, 'desktop');
  const score = mobile.performanceScore;

  const auditRef = await db.collection('projects').doc(projectId).collection('audits').add({
    type: 'SPEED',
    urlAudited: url,
    score,
    results: { mobile, desktop },
    createdAt: new Date().toISOString(),
  });

  return { id: auditRef.id, type: 'SPEED', score, results: { mobile, desktop } };
});

// ── SEO Audit ──

export const runSeoAudit = onCall({ region: 'europe-west1', timeoutSeconds: 120 }, async (request) => {
  const uid = requireAuth(request);
  const { projectId, url } = request.data as { projectId: string; url: string };

  if (!projectId || !url) throw new Error('projectId and url are required');
  try { new URL(url); } catch { throw new Error('Invalid URL'); }

  const db = getDb();
  const projectDoc = await db.collection('projects').doc(projectId).get();
  if (!projectDoc.exists || projectDoc.data()?.userId !== uid) throw new Error('Project not found');

  const html = await fetch(url, { headers: { 'User-Agent': 'Forge-SEO-Audit/1.0' }, redirect: 'follow' }).then((r) => r.text());

  // Simple HTML parsing using regex (no node-html-parser in Cloud Functions to keep bundle small)
  const findings: SeoFinding[] = [];

  // Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const titleText = titleMatch?.[1]?.trim() ?? '';
  if (!titleText) findings.push({ category: 'meta', severity: 'error', title: 'Missing page title', description: 'No <title> tag found.', recommendation: 'Add a descriptive title (30-60 characters).' });
  else if (titleText.length < 30) findings.push({ category: 'meta', severity: 'warning', title: 'Title too short', description: `${titleText.length} characters.`, recommendation: 'Aim for 30-60 characters.' });
  else if (titleText.length > 60) findings.push({ category: 'meta', severity: 'warning', title: 'Title too long', description: `${titleText.length} characters.`, recommendation: 'Keep under 60 characters.' });
  else findings.push({ category: 'meta', severity: 'success', title: 'Title length is good', description: `${titleText.length} characters.`, recommendation: '' });

  // Meta description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i);
  const descText = descMatch?.[1]?.trim() ?? '';
  if (!descText) findings.push({ category: 'meta', severity: 'error', title: 'Missing meta description', description: '', recommendation: 'Add meta description (120-160 characters).' });
  else if (descText.length < 120) findings.push({ category: 'meta', severity: 'warning', title: 'Meta description too short', description: `${descText.length} chars.`, recommendation: 'Aim for 120-160 characters.' });
  else if (descText.length > 160) findings.push({ category: 'meta', severity: 'warning', title: 'Meta description too long', description: `${descText.length} chars.`, recommendation: 'Keep under 160 characters.' });
  else findings.push({ category: 'meta', severity: 'success', title: 'Meta description length is good', description: '', recommendation: '' });

  // H1 count
  const h1s = html.match(/<h1[\s>]/gi) ?? [];
  if (h1s.length === 0) findings.push({ category: 'headings', severity: 'error', title: 'Missing H1', description: '', recommendation: 'Add exactly one H1.' });
  else if (h1s.length > 1) findings.push({ category: 'headings', severity: 'warning', title: 'Multiple H1 tags', description: `Found ${h1s.length}.`, recommendation: 'Use a single H1 per page.' });
  else findings.push({ category: 'headings', severity: 'success', title: 'Single H1 present', description: '', recommendation: '' });

  // Images without alt
  const imgs = html.match(/<img\s[^>]*>/gi) ?? [];
  let missingAlt = 0;
  for (const img of imgs) {
    if (!img.includes('alt=')) missingAlt++;
  }
  if (missingAlt > 0) findings.push({ category: 'images', severity: 'error', title: `${missingAlt} images missing alt`, description: '', recommendation: 'Add alt text to all images.' });
  else if (imgs.length > 0) findings.push({ category: 'images', severity: 'success', title: 'All images have alt', description: '', recommendation: '' });

  // OG tags
  const missingOg = [];
  if (!html.includes('og:title')) missingOg.push('og:title');
  if (!html.includes('og:description')) missingOg.push('og:description');
  if (!html.includes('og:image')) missingOg.push('og:image');
  if (missingOg.length) findings.push({ category: 'technical', severity: 'warning', title: 'Missing Open Graph tags', description: missingOg.join(', '), recommendation: 'Add OG tags for social sharing.' });

  // Canonical
  if (!html.includes('rel="canonical"') && !html.includes("rel='canonical'")) {
    findings.push({ category: 'technical', severity: 'warning', title: 'Missing canonical tag', description: '', recommendation: 'Add a canonical URL.' });
  }

  // Schema
  if (!html.includes('application/ld+json')) {
    findings.push({ category: 'schema', severity: 'warning', title: 'No structured data', description: '', recommendation: 'Add JSON-LD schema markup.' });
  }

  let score = 100;
  for (const f of findings) { if (f.severity === 'error') score -= 10; else if (f.severity === 'warning') score -= 3; }
  score = Math.max(0, Math.min(100, score));

  const categories: Record<string, number> = {};
  for (const f of findings) categories[f.category] = (categories[f.category] ?? 0) + 1;

  const auditRef = await db.collection('projects').doc(projectId).collection('audits').add({
    type: 'SEO',
    urlAudited: url,
    score,
    results: { categories, findings },
    createdAt: new Date().toISOString(),
  });

  return { id: auditRef.id, type: 'SEO', score, results: { categories, findings } };
});

// ── AEO Audit ──

export const runAeoAudit = onCall({ region: 'europe-west1', timeoutSeconds: 120 }, async (request) => {
  const uid = requireAuth(request);
  const { projectId, url } = request.data as { projectId: string; url: string };

  if (!projectId || !url) throw new Error('projectId and url are required');
  try { new URL(url); } catch { throw new Error('Invalid URL'); }

  const db = getDb();
  const projectDoc = await db.collection('projects').doc(projectId).get();
  if (!projectDoc.exists || projectDoc.data()?.userId !== uid) throw new Error('Project not found');

  const html = await fetch(url, { headers: { 'User-Agent': 'Forge-AEO-Audit/1.0' }, redirect: 'follow' }).then((r) => r.text());

  const findings: SeoFinding[] = [];

  // FAQ schema
  if (!html.includes('FAQPage')) {
    findings.push({ category: 'faq-schema', severity: 'warning', title: 'No FAQ schema found', description: '', recommendation: 'Add FAQPage schema for AI engines.' });
  } else {
    findings.push({ category: 'faq-schema', severity: 'success', title: 'FAQ schema detected', description: '', recommendation: '' });
  }

  // Q&A headings
  const questionHeadings = (html.match(/<h[23][^>]*>[^<]*\?[^<]*<\/h[23]>/gi) ?? []).length;
  if (questionHeadings >= 3) findings.push({ category: 'qa-structure', severity: 'success', title: 'Good Q&A structure', description: `${questionHeadings} question headings.`, recommendation: '' });
  else if (questionHeadings > 0) findings.push({ category: 'qa-structure', severity: 'info', title: 'Some Q&A content', description: `${questionHeadings} question headings.`, recommendation: 'Add more question-format headings.' });
  else findings.push({ category: 'qa-structure', severity: 'warning', title: 'No Q&A structure', description: '', recommendation: 'Add question-format H2/H3 headings.' });

  // Bold/strong for entity emphasis
  const strongCount = (html.match(/<(strong|b)[\s>]/gi) ?? []).length;
  if (strongCount >= 5) findings.push({ category: 'entity-coverage', severity: 'success', title: 'Good entity emphasis', description: `${strongCount} bold elements.`, recommendation: '' });
  else findings.push({ category: 'entity-coverage', severity: 'warning', title: 'Weak entity emphasis', description: '', recommendation: 'Use <strong> to highlight key terms.' });

  // Lists
  const listCount = (html.match(/<(ul|ol)[\s>]/gi) ?? []).length;
  if (listCount >= 2) findings.push({ category: 'entity-coverage', severity: 'success', title: 'Good use of lists', description: `${listCount} lists.`, recommendation: '' });
  else if (listCount === 0) findings.push({ category: 'entity-coverage', severity: 'info', title: 'No lists found', description: '', recommendation: 'Add lists for structured content.' });

  // Freshness signals
  if (html.includes('<time') || html.includes('datePublished')) {
    findings.push({ category: 'freshness', severity: 'success', title: 'Date signals present', description: '', recommendation: '' });
  } else {
    findings.push({ category: 'freshness', severity: 'warning', title: 'No date signals', description: '', recommendation: 'Add <time> elements or datePublished schema.' });
  }

  let score = 100;
  for (const f of findings) { if (f.severity === 'error') score -= 12; else if (f.severity === 'warning') score -= 5; }
  score = Math.max(0, Math.min(100, score));

  const categories: Record<string, number> = {};
  for (const f of findings) categories[f.category] = (categories[f.category] ?? 0) + 1;

  const auditRef = await db.collection('projects').doc(projectId).collection('audits').add({
    type: 'AEO',
    urlAudited: url,
    score,
    results: { categories, findings },
    createdAt: new Date().toISOString(),
  });

  return { id: auditRef.id, type: 'AEO', score, results: { categories, findings } };
});

// ── AI Recommendations ──

export const getAiRecommendations = onCall({ region: 'europe-west1', timeoutSeconds: 60 }, async (request) => {
  const uid = requireAuth(request);
  const { type, findings, url, siteStructure, siteType, pageContent, targetQueries } = request.data as {
    type: 'speed' | 'seo' | 'aeo' | 'animation';
    findings?: Array<{ title: string; description: string; severity: string; category: string }>;
    url?: string;
    siteStructure?: string;
    siteType?: string;
    pageContent?: string;
    targetQueries?: string[];
  };

  const apiKey = await getUserToken(uid, 'anthropic');
  if (!apiKey) throw new Error('Anthropic API key not set. Go to Settings → Integrations.');

  if (type === 'animation') {
    const result = await callClaudeJson<{ recommendations: unknown[] }>({
      apiKey,
      system: 'You are a web animation expert for Webflow. Recommend tasteful, performance-optimized animations. Output valid JSON only.',
      messages: [{ role: 'user', content: `Analyze this ${siteType ?? 'website'} structure and recommend 5-10 animations:\n\n${siteStructure ?? ''}\n\nReturn JSON: { "recommendations": [...] }` }],
      maxTokens: 2048,
      temperature: 0.4,
    });
    return result;
  }

  if (type === 'seo') {
    const summary = (findings ?? []).map((f) => `[${f.severity}] ${f.category}: ${f.title}`).join('\n');
    const result = await callClaudeJson<{ recommendations: unknown[] }>({
      apiKey,
      system: 'You are an SEO expert for Webflow sites. Provide actionable recommendations. Output valid JSON only.',
      messages: [{ role: 'user', content: `SEO findings for ${url ?? 'site'}:\n${summary}\n\nReturn JSON: { "recommendations": [...] }` }],
      maxTokens: 2048,
      temperature: 0.3,
    });
    return result;
  }

  if (type === 'aeo') {
    const result = await callClaudeJson<{ recommendations: unknown[] }>({
      apiKey,
      system: 'You are an AEO expert. Help websites appear in AI-generated answers. Output valid JSON only.',
      messages: [{ role: 'user', content: `Analyze for AEO. Queries: ${(targetQueries ?? []).join(', ')}\n\nContent:\n${(pageContent ?? '').slice(0, 3000)}\n\nReturn JSON: { "recommendations": [...] }` }],
      maxTokens: 2048,
      temperature: 0.3,
    });
    return result;
  }

  // Speed recommendations
  const summary = (findings ?? []).map((f) => `[${f.severity}] ${f.category}: ${f.title}`).join('\n');
  const result = await callClaudeJson<{ recommendations: unknown[] }>({
    apiKey,
    system: 'You are a web performance expert for Webflow. Provide actionable speed recommendations. Output valid JSON only.',
    messages: [{ role: 'user', content: `Speed audit findings:\n${summary}\n\nReturn JSON: { "recommendations": [...] }` }],
    maxTokens: 2048,
    temperature: 0.3,
  });
  return result;
});
