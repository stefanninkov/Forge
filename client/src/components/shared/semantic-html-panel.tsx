import { useState, useMemo, useCallback } from 'react';
import {
  AlertTriangle, CheckCircle2, Info, Code, ChevronDown, ChevronRight,
  Accessibility, ListTree, Tag, FileCode, Copy, Check, Shield,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────

export type Severity = 'error' | 'warning' | 'info' | 'pass';
export type AuditCategory = 'semantics' | 'headings' | 'aria' | 'landmarks' | 'images' | 'forms' | 'links' | 'contrast';

export interface AuditFinding {
  id: string;
  category: AuditCategory;
  severity: Severity;
  title: string;
  description: string;
  element?: string;
  selector?: string;
  suggestion?: string;
  codeSnippet?: string;
  wcagCriteria?: string;
}

export interface SemanticHtmlPanelProps {
  findings: AuditFinding[];
  onApplyFix?: (finding: AuditFinding) => void;
  isLoading?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────

const CATEGORY_META: Record<AuditCategory, { label: string; icon: typeof Tag }> = {
  semantics: { label: 'Semantic Elements', icon: Code },
  headings: { label: 'Heading Hierarchy', icon: ListTree },
  aria: { label: 'ARIA Attributes', icon: Accessibility },
  landmarks: { label: 'Landmarks', icon: Tag },
  images: { label: 'Images', icon: FileCode },
  forms: { label: 'Forms', icon: FileCode },
  links: { label: 'Links', icon: FileCode },
  contrast: { label: 'Color Contrast', icon: Shield },
};

const SEVERITY_COLORS: Record<Severity, { bg: string; border: string; text: string; icon: string }> = {
  error: { bg: 'var(--status-error-bg, rgba(239,68,68,0.08))', border: 'var(--status-error-border, rgba(239,68,68,0.2))', text: 'var(--status-error, #ef4444)', icon: 'var(--status-error, #ef4444)' },
  warning: { bg: 'var(--status-warning-bg, rgba(245,158,11,0.08))', border: 'var(--status-warning-border, rgba(245,158,11,0.2))', text: 'var(--status-warning-text, #d97706)', icon: 'var(--status-warning, #f59e0b)' },
  info: { bg: 'var(--status-info-bg, rgba(59,130,246,0.08))', border: 'var(--status-info-border, rgba(59,130,246,0.2))', text: 'var(--status-info, #3b82f6)', icon: 'var(--status-info, #3b82f6)' },
  pass: { bg: 'var(--status-success-bg, rgba(16,185,129,0.08))', border: 'var(--status-success-border, rgba(16,185,129,0.2))', text: 'var(--status-success, #10b981)', icon: 'var(--status-success, #10b981)' },
};

// ─── Common Semantic Rules ───────────────────────────────────────

export const SEMANTIC_RULES = {
  // Non-semantic to semantic element mappings
  ELEMENT_SUGGESTIONS: {
    'div.header': { suggested: '<header>', reason: 'Use <header> for page/section headers for screen reader navigation.' },
    'div.footer': { suggested: '<footer>', reason: 'Use <footer> for page/section footers.' },
    'div.nav': { suggested: '<nav>', reason: 'Use <nav> for navigation sections.' },
    'div.sidebar': { suggested: '<aside>', reason: 'Use <aside> for sidebar content.' },
    'div.main': { suggested: '<main>', reason: 'Use <main> for the primary content area.' },
    'div.article': { suggested: '<article>', reason: 'Use <article> for self-contained content.' },
    'div.section': { suggested: '<section>', reason: 'Use <section> for thematic groupings.' },
    'div.button': { suggested: '<button>', reason: 'Use <button> for interactive elements. Provides keyboard access and screen reader support.' },
    'span.link': { suggested: '<a>', reason: 'Use <a> for navigation links with proper href.' },
    'div.list': { suggested: '<ul> or <ol>', reason: 'Use list elements for collections of items.' },
    'div.figure': { suggested: '<figure>', reason: 'Use <figure> for self-contained content like images with captions.' },
  } as Record<string, { suggested: string; reason: string }>,

  // Required ARIA attributes for common patterns
  ARIA_REQUIREMENTS: {
    'dialog': ['aria-label or aria-labelledby', 'role="dialog"'],
    'tabs': ['role="tablist"', 'role="tab"', 'role="tabpanel"', 'aria-selected'],
    'accordion': ['aria-expanded', 'aria-controls'],
    'dropdown': ['aria-expanded', 'aria-haspopup', 'role="menu"', 'role="menuitem"'],
    'modal': ['aria-modal="true"', 'role="dialog"', 'aria-label'],
    'slider': ['role="slider"', 'aria-valuemin', 'aria-valuemax', 'aria-valuenow'],
    'tooltip': ['role="tooltip"', 'aria-describedby'],
  } as Record<string, string[]>,

  // Heading hierarchy rules
  HEADING_RULES: [
    'Page must have exactly one <h1>.',
    'Headings must not skip levels (e.g., h1 → h3 without h2).',
    'Headings should be used for structure, not for styling.',
    'Each section should have its own heading.',
  ],
};

// ─── Component ───────────────────────────────────────────────────

export function SemanticHtmlPanel({ findings, onApplyFix, isLoading }: SemanticHtmlPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<AuditCategory>>(new Set(['semantics', 'headings', 'aria']));
  const [filter, setFilter] = useState<Severity | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleCategory = useCallback((cat: AuditCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const filteredFindings = useMemo(() => {
    if (filter === 'all') return findings;
    return findings.filter((f) => f.severity === filter);
  }, [findings, filter]);

  const groupedFindings = useMemo(() => {
    const groups: Record<AuditCategory, AuditFinding[]> = {
      semantics: [], headings: [], aria: [], landmarks: [],
      images: [], forms: [], links: [], contrast: [],
    };
    for (const f of filteredFindings) {
      groups[f.category].push(f);
    }
    return groups;
  }, [filteredFindings]);

  const counts = useMemo(() => {
    const c = { error: 0, warning: 0, info: 0, pass: 0 };
    for (const f of findings) c[f.severity]++;
    return c;
  }, [findings]);

  const score = useMemo(() => {
    if (findings.length === 0) return 100;
    const total = findings.length;
    const passed = counts.pass;
    return Math.round((passed / total) * 100);
  }, [findings, counts]);

  const handleCopySnippet = useCallback((id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Score Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <div
          style={{
            width: 48, height: 48, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--text-lg)', fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: score >= 80 ? 'var(--status-success)' : score >= 50 ? 'var(--status-warning)' : 'var(--status-error)',
            border: `3px solid ${score >= 80 ? 'var(--status-success)' : score >= 50 ? 'var(--status-warning)' : 'var(--status-error)'}`,
          }}
        >
          {score}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
            Accessibility Score
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            {([['error', counts.error], ['warning', counts.warning], ['info', counts.info], ['pass', counts.pass]] as const).map(([sev, count]) => (
              <span
                key={sev}
                style={{
                  fontSize: 'var(--text-xs)', color: SEVERITY_COLORS[sev].text,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {count} {sev === 'pass' ? '✓' : sev === 'error' ? '✕' : sev === 'warning' ? '⚠' : 'ℹ'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex', padding: '0 12px', gap: 2,
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        {(['all', 'error', 'warning', 'info', 'pass'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 10px', border: 'none', cursor: 'pointer',
              fontSize: 'var(--text-xs)', fontWeight: filter === f ? 600 : 400,
              color: filter === f ? 'var(--text-primary)' : 'var(--text-tertiary)',
              backgroundColor: 'transparent',
              borderBottom: filter === f ? '2px solid var(--accent)' : '2px solid transparent',
              fontFamily: 'var(--font-sans)',
              textTransform: 'capitalize',
              transition: 'all var(--duration-fast)',
            }}
          >
            {f === 'all' ? 'All' : f}
            {f !== 'all' && ` (${counts[f]})`}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{ padding: '32px 16px', textAlign: 'center' }}>
          <div
            style={{
              width: 20, height: 20, margin: '0 auto',
              border: '2px solid var(--border-default)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <div style={{ marginTop: 8, fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
            Analyzing HTML structure...
          </div>
        </div>
      )}

      {/* Findings List */}
      {!isLoading && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {Object.entries(groupedFindings).map(([category, items]) => {
            if (items.length === 0) return null;
            const cat = category as AuditCategory;
            const meta = CATEGORY_META[cat];
            const Icon = meta.icon;
            const isExpanded = expandedCategories.has(cat);

            return (
              <div key={cat} style={{ marginBottom: 4 }}>
                <button
                  onClick={() => toggleCategory(cat)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    width: '100%', padding: '6px 8px',
                    border: 'none', borderRadius: 4,
                    backgroundColor: 'transparent', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {isExpanded ? <ChevronDown size={12} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronRight size={12} style={{ color: 'var(--text-tertiary)' }} />}
                  <Icon size={12} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{ flex: 1, textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {meta.label}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                    {items.length}
                  </span>
                </button>

                {isExpanded && (
                  <div style={{ paddingLeft: 8 }}>
                    {items.map((finding) => (
                      <FindingCard
                        key={finding.id}
                        finding={finding}
                        onApplyFix={onApplyFix}
                        copiedId={copiedId}
                        onCopy={handleCopySnippet}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {filteredFindings.length === 0 && !isLoading && (
            <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
              {filter === 'all' ? 'No findings. Run an audit to check your HTML structure.' : `No ${filter} findings.`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Finding Card ────────────────────────────────────────────────

interface FindingCardProps {
  finding: AuditFinding;
  onApplyFix?: (finding: AuditFinding) => void;
  copiedId: string | null;
  onCopy: (id: string, code: string) => void;
}

function FindingCard({ finding, onApplyFix, copiedId, onCopy }: FindingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const colors = SEVERITY_COLORS[finding.severity];
  const SeverityIcon = finding.severity === 'error' ? AlertTriangle
    : finding.severity === 'warning' ? AlertTriangle
    : finding.severity === 'pass' ? CheckCircle2
    : Info;

  return (
    <div
      style={{
        margin: '4px 0', padding: '8px 10px',
        border: `1px solid ${colors.border}`,
        borderRadius: 6, backgroundColor: colors.bg,
        cursor: 'pointer',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <SeverityIcon size={14} style={{ color: colors.icon, flexShrink: 0, marginTop: 1 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
            {finding.title}
          </div>
          {finding.element && (
            <code
              style={{
                fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
                color: 'var(--text-tertiary)', marginTop: 2, display: 'block',
              }}
            >
              {finding.element}
            </code>
          )}
        </div>
        {finding.wcagCriteria && (
          <span
            style={{
              fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600,
              color: 'var(--text-tertiary)', padding: '1px 4px',
              border: '1px solid var(--border-default)', borderRadius: 3,
              flexShrink: 0,
            }}
          >
            {finding.wcagCriteria}
          </span>
        )}
      </div>

      {expanded && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            {finding.description}
          </p>

          {finding.suggestion && (
            <div
              style={{
                marginTop: 8, padding: '6px 8px',
                borderRadius: 4, backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                Suggestion
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {finding.suggestion}
              </div>
            </div>
          )}

          {finding.codeSnippet && (
            <div style={{ marginTop: 8, position: 'relative' }}>
              <pre
                style={{
                  padding: '8px 10px', borderRadius: 4,
                  backgroundColor: 'var(--bg-inset)',
                  border: '1px solid var(--border-default)',
                  fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)', lineHeight: 1.5,
                  overflow: 'auto', margin: 0,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                }}
              >
                {finding.codeSnippet}
              </pre>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy(finding.id, finding.codeSnippet!);
                }}
                style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 24, height: 24, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  border: 'none', borderRadius: 4,
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-tertiary)', cursor: 'pointer',
                }}
              >
                {copiedId === finding.id ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          )}

          {onApplyFix && finding.severity !== 'pass' && finding.suggestion && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApplyFix(finding);
              }}
              style={{
                marginTop: 8, height: 28, padding: '0 12px',
                border: '1px solid var(--accent)', borderRadius: 4,
                backgroundColor: 'transparent',
                fontSize: 'var(--text-xs)', fontWeight: 500,
                color: 'var(--accent)', cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Apply Fix
            </button>
          )}
        </div>
      )}
    </div>
  );
}
