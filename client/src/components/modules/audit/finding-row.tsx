import { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import type { AuditFinding } from '@/types/audit';

interface FindingRowProps {
  finding: AuditFinding;
}

const SEVERITY_CONFIG = {
  error: { icon: AlertCircle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' },
  warning: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
  info: { icon: Info, color: 'var(--text-tertiary)', bg: 'var(--surface-hover)' },
  success: { icon: CheckCircle, color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
} as const;

export function FindingRow({ finding }: FindingRowProps) {
  const [expanded, setExpanded] = useState(false);
  const config = SEVERITY_CONFIG[finding.severity];
  const Icon = config.icon;
  const hasDetails = finding.description || finding.recommendation;

  return (
    <div
      style={{
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className="flex items-center w-full border-none bg-transparent text-left"
        style={{
          padding: '10px 12px',
          gap: 10,
          cursor: hasDetails ? 'pointer' : 'default',
          fontFamily: 'var(--font-sans)',
        }}
        onMouseEnter={(e) => {
          if (hasDetails) e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span
          className="flex items-center justify-center shrink-0"
          style={{
            width: 22,
            height: 22,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: config.bg,
          }}
        >
          <Icon size={13} style={{ color: config.color }} />
        </span>
        <span
          className="flex-1"
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
            fontWeight: 450,
          }}
        >
          {finding.title}
        </span>
        {finding.savingsMs && finding.savingsMs > 0 && (
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {finding.savingsMs >= 1000
              ? `${(finding.savingsMs / 1000).toFixed(1)}s`
              : `${Math.round(finding.savingsMs)}ms`}
          </span>
        )}
        {hasDetails && (
          <span style={{ color: 'var(--text-tertiary)' }}>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
      </button>

      {expanded && hasDetails && (
        <div
          style={{
            padding: '0 12px 12px 44px',
          }}
        >
          {finding.description && (
            <p
              style={{
                margin: 0,
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                marginBottom: finding.recommendation ? 8 : 0,
              }}
            >
              {finding.description}
            </p>
          )}
          {finding.recommendation && (
            <p
              style={{
                margin: 0,
                fontSize: 'var(--text-xs)',
                color: 'var(--accent-text)',
                lineHeight: 1.5,
                fontWeight: 500,
              }}
            >
              {finding.recommendation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
