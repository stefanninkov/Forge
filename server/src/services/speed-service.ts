import { Prisma } from '@prisma/client';
import { prisma } from '../db/client.js';
import { env } from '../config/env.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { checkScoreDrop } from './audit-service.js';

interface LighthouseAudit {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
  details?: {
    type: string;
    items?: Array<Record<string, unknown>>;
    overallSavingsMs?: number;
    overallSavingsBytes?: number;
  };
}

interface PageSpeedResponse {
  lighthouseResult: {
    categories: {
      performance: { score: number };
    };
    audits: Record<string, LighthouseAudit>;
  };
}

interface SpeedFinding {
  category: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  recommendation: string;
  savingsMs?: number;
  savingsBytes?: number;
}

const CATEGORY_MAP: Record<string, string> = {
  'render-blocking-resources': 'scripts',
  'uses-responsive-images': 'images',
  'offscreen-images': 'images',
  'unminified-css': 'scripts',
  'unminified-javascript': 'scripts',
  'unused-css-rules': 'webflow-overhead',
  'unused-javascript': 'webflow-overhead',
  'uses-optimized-images': 'images',
  'modern-image-formats': 'images',
  'uses-text-compression': 'scripts',
  'uses-rel-preconnect': 'scripts',
  'server-response-time': 'scripts',
  'redirects': 'scripts',
  'uses-rel-preload': 'fonts',
  'efficient-animated-content': 'images',
  'duplicated-javascript': 'scripts',
  'legacy-javascript': 'scripts',
  'total-byte-weight': 'webflow-overhead',
  'dom-size': 'webflow-overhead',
  'font-display': 'fonts',
  'font-size': 'fonts',
  'largest-contentful-paint': 'core-web-vitals',
  'cumulative-layout-shift': 'core-web-vitals',
  'interaction-to-next-paint': 'core-web-vitals',
  'first-contentful-paint': 'core-web-vitals',
  'speed-index': 'core-web-vitals',
  'total-blocking-time': 'core-web-vitals',
  'max-potential-fid': 'core-web-vitals',
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

  // Extract Core Web Vitals
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

  // Parse opportunity and diagnostic audits into findings
  const findings: SpeedFinding[] = [];

  for (const [auditId, audit] of Object.entries(audits)) {
    // Skip metric audits (already captured in CWV) and passed audits
    if (audit.score === null || audit.score >= 0.9) continue;
    if (!audit.details?.items?.length && !audit.details?.overallSavingsMs) continue;

    const category = CATEGORY_MAP[auditId] ?? 'scripts';
    findings.push({
      category,
      severity: auditSeverity(audit.score),
      title: audit.title,
      description: audit.description.replace(/\[.*?\]\(.*?\)/g, '').trim(), // strip markdown links
      recommendation: audit.displayValue ?? '',
      savingsMs: audit.details?.overallSavingsMs,
      savingsBytes: audit.details?.overallSavingsBytes,
    });
  }

  // Sort by severity
  const severityOrder = { error: 0, warning: 1, info: 2, success: 3 };
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Group finding counts by category
  const categories: Record<string, number> = {};
  for (const f of findings) {
    categories[f.category] = (categories[f.category] ?? 0) + 1;
  }

  return {
    performanceScore,
    strategy,
    coreWebVitals,
    categories,
    findings,
  };
}

async function fetchPageSpeed(url: string, strategy: 'mobile' | 'desktop') {
  const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  apiUrl.searchParams.set('url', url);
  apiUrl.searchParams.set('strategy', strategy);
  apiUrl.searchParams.set('category', 'performance');
  if (env.PAGESPEED_API_KEY) {
    apiUrl.searchParams.set('key', env.PAGESPEED_API_KEY);
  }

  const response = await fetch(apiUrl.toString());
  if (!response.ok) {
    const text = await response.text();
    throw new ValidationError(`PageSpeed API error: ${response.status} — ${text.slice(0, 200)}`);
  }
  return response.json() as Promise<PageSpeedResponse>;
}

export async function runSpeedAudit(projectId: string, url: string, userId: string) {
  // Verify project ownership
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { userId: true } });
  if (!project) throw new NotFoundError('Project not found');
  if (project.userId !== userId) throw new NotFoundError('Project not found');

  // Validate URL
  try {
    new URL(url);
  } catch {
    throw new ValidationError('Invalid URL');
  }

  // Fetch both strategies
  const [mobileData, desktopData] = await Promise.all([
    fetchPageSpeed(url, 'mobile'),
    fetchPageSpeed(url, 'desktop'),
  ]);

  const mobileResults = parsePageSpeedResults(mobileData, 'mobile');
  const desktopResults = parsePageSpeedResults(desktopData, 'desktop');

  // Use mobile score as primary (Google uses mobile-first indexing)
  const score = mobileResults.performanceScore;

  const audit = await prisma.audit.create({
    data: {
      projectId,
      type: 'SPEED',
      urlAudited: url,
      score,
      results: { mobile: mobileResults, desktop: desktopResults } as unknown as Prisma.InputJsonValue,
    },
  });

  // Check for score drop and create alert if needed
  await checkScoreDrop(projectId, 'SPEED', score, audit.id);

  prisma.activityLog.create({
    data: { userId, projectId, action: 'AUDIT_RUN', details: { type: 'SPEED', url, score: Math.round(score) } },
  }).catch(() => {});

  return audit;
}
