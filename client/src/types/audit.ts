export type AuditType = 'SPEED' | 'SEO' | 'AEO';

export type FindingSeverity = 'error' | 'warning' | 'info' | 'success';

export interface AuditFinding {
  category: string;
  severity: FindingSeverity;
  title: string;
  description: string;
  element?: string;
  recommendation: string;
  savingsMs?: number;
  savingsBytes?: number;
}

export interface CoreWebVitalMetric {
  value: string;
  score: number;
}

export interface SpeedStrategyResults {
  performanceScore: number;
  strategy: string;
  coreWebVitals: {
    lcp: CoreWebVitalMetric;
    cls: CoreWebVitalMetric;
    inp: CoreWebVitalMetric;
    fcp: CoreWebVitalMetric;
  };
  categories: Record<string, number>;
  findings: AuditFinding[];
}

export interface SpeedResults {
  mobile: SpeedStrategyResults;
  desktop: SpeedStrategyResults;
}

export interface SeoResults {
  categories: Record<string, number>;
  findings: AuditFinding[];
}

export interface AeoResults {
  categories: Record<string, number>;
  findings: AuditFinding[];
}

export interface Audit {
  id: string;
  projectId: string;
  type: AuditType;
  urlAudited: string;
  results: SpeedResults | SeoResults | AeoResults;
  score: number;
  createdAt: string;
}

export interface AuditAlert {
  id: string;
  auditId: string;
  projectId: string;
  type: 'SCORE_DROP' | 'ISSUE_FOUND' | 'NEW_ERROR';
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  read: boolean;
  createdAt: string;
}

export interface AuditHistoryPoint {
  score: number;
  createdAt: string;
}

export const SPEED_CATEGORIES = ['images', 'fonts', 'scripts', 'webflow-overhead', 'core-web-vitals'] as const;
export const SEO_CATEGORIES = ['meta', 'headings', 'schema', 'links', 'images', 'technical'] as const;
export const AEO_CATEGORIES = ['faq-schema', 'qa-structure', 'answer-optimization', 'headings', 'entity-coverage', 'freshness'] as const;

export const SPEED_CATEGORY_LABELS: Record<string, string> = {
  'images': 'Images',
  'fonts': 'Fonts',
  'scripts': 'Scripts',
  'webflow-overhead': 'Webflow Overhead',
  'core-web-vitals': 'Core Web Vitals',
};

export const SEO_CATEGORY_LABELS: Record<string, string> = {
  'meta': 'Meta',
  'headings': 'Headings',
  'schema': 'Schema',
  'links': 'Links',
  'images': 'Images',
  'technical': 'Technical',
};

export const AEO_CATEGORY_LABELS: Record<string, string> = {
  'faq-schema': 'FAQ Schema',
  'qa-structure': 'Q&A Structure',
  'answer-optimization': 'Answers',
  'headings': 'Headings',
  'entity-coverage': 'Entities',
  'freshness': 'Freshness',
};
