import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { AuditIssue } from '@/types/figma';

interface AuditPanelProps {
  issues: AuditIssue[];
}

const SEVERITY_CONFIG = {
  error: { icon: AlertCircle, color: 'var(--status-error)', label: 'Errors' },
  warning: { icon: AlertTriangle, color: 'var(--status-warning)', label: 'Warnings' },
  info: { icon: Info, color: 'var(--text-tertiary)', label: 'Info' },
} as const;

export function AuditPanel({ issues }: AuditPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const grouped = {
    error: issues.filter((i) => i.severity === 'error'),
    warning: issues.filter((i) => i.severity === 'warning'),
    info: issues.filter((i) => i.severity === 'info'),
  };

  const hasIssues = issues.length > 0;

  return (
    <div
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-primary)',
        overflow: 'hidden',
      }}
    >
      {/* Header (clickable) */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full border-none bg-transparent cursor-pointer"
        style={{
          height: 40,
          padding: '0 16px',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <div className="flex items-center" style={{ gap: 8 }}>
          {expanded ? (
            <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} />
          ) : (
            <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
          )}
          <span
            className="font-medium"
            style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
          >
            Audit Results
          </span>
        </div>

        {/* Summary badges */}
        <div className="flex items-center" style={{ gap: 8 }}>
          {grouped.error.length > 0 && (
            <SummaryBadge count={grouped.error.length} color="var(--status-error)" />
          )}
          {grouped.warning.length > 0 && (
            <SummaryBadge count={grouped.warning.length} color="var(--status-warning)" />
          )}
          {grouped.info.length > 0 && (
            <SummaryBadge count={grouped.info.length} color="var(--text-tertiary)" />
          )}
          {!hasIssues && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)' }}>
              No issues found
            </span>
          )}
        </div>
      </button>

      {/* Content */}
      {expanded && hasIssues && (
        <div style={{ padding: '12px 16px' }}>
          {(['error', 'warning', 'info'] as const).map((severity) => {
            const items = grouped[severity];
            if (items.length === 0) return null;
            const config = SEVERITY_CONFIG[severity];
            const SeverityIcon = config.icon;

            return (
              <div key={severity} style={{ marginBottom: 12 }}>
                <div
                  className="flex items-center"
                  style={{
                    gap: 6,
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: config.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 6,
                  }}
                >
                  <SeverityIcon size={12} />
                  {config.label} ({items.length})
                </div>

                <div className="flex flex-col" style={{ gap: 4 }}>
                  {items.map((issue, idx) => (
                    <div
                      key={`${issue.nodeId}-${idx}`}
                      className="flex items-start"
                      style={{
                        gap: 8,
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-xs)',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-tertiary)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {issue.nodeName}
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {issue.message}
                      </span>
                      <span
                        style={{
                          color: 'var(--text-tertiary)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          marginLeft: 'auto',
                        }}
                      >
                        {issue.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryBadge({ count, color }: { count: number; color: string }) {
  return (
    <span
      style={{
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        color,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        padding: '1px 6px',
        borderRadius: 'var(--radius-sm)',
        minWidth: 18,
        textAlign: 'center',
      }}
    >
      {count}
    </span>
  );
}
