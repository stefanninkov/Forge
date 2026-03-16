import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import type { Audit, AuditFinding } from '@/types/audit';

interface AuditComparisonProps {
  previous: Audit;
  current: Audit;
}

export function AuditComparison({ previous, current }: AuditComparisonProps) {
  const scoreDiff = current.score - previous.score;
  const scoreColor = scoreDiff > 0
    ? 'var(--accent)'
    : scoreDiff < 0
      ? 'var(--error)'
      : 'var(--text-tertiary)';

  const ScoreIcon = scoreDiff > 0 ? TrendingUp : scoreDiff < 0 ? TrendingDown : Minus;

  const { newIssues, resolvedIssues, persistentIssues } = useMemo(() => {
    const prevFindings = (previous.findings ?? []) as AuditFinding[];
    const currFindings = (current.findings ?? []) as AuditFinding[];

    const prevTitles = new Set(prevFindings.map((f) => f.title));
    const currTitles = new Set(currFindings.map((f) => f.title));

    return {
      newIssues: currFindings.filter((f) => !prevTitles.has(f.title)),
      resolvedIssues: prevFindings.filter((f) => !currTitles.has(f.title)),
      persistentIssues: currFindings.filter((f) => prevTitles.has(f.title)),
    };
  }, [previous, current]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Score comparison */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: 20,
          border: '1px solid var(--border-default)',
          borderRadius: 8,
          backgroundColor: 'var(--bg-primary)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 4 }}>
            Previous
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: previous.score >= 80 ? 'var(--accent)' : previous.score >= 50 ? '#f59e0b' : 'var(--error)',
            }}
          >
            {previous.score}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
            {new Date(previous.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>

        <ArrowRight size={20} style={{ color: 'var(--text-tertiary)' }} />

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 4 }}>
            Current
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: current.score >= 80 ? 'var(--accent)' : current.score >= 50 ? '#f59e0b' : 'var(--error)',
            }}
          >
            {current.score}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
            {new Date(current.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            borderRadius: 6,
            backgroundColor: scoreDiff > 0
              ? 'var(--accent-subtle)'
              : scoreDiff < 0
                ? 'rgba(239,68,68,0.1)'
                : 'var(--surface-hover)',
          }}
        >
          <ScoreIcon size={16} style={{ color: scoreColor }} />
          <span
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: scoreColor,
            }}
          >
            {scoreDiff > 0 ? '+' : ''}{scoreDiff}
          </span>
        </div>
      </div>

      {/* Issue changes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <IssueGroup
          label="Resolved"
          count={resolvedIssues.length}
          items={resolvedIssues}
          color="var(--accent)"
          bgColor="var(--accent-subtle)"
        />
        <IssueGroup
          label="New Issues"
          count={newIssues.length}
          items={newIssues}
          color="var(--error)"
          bgColor="rgba(239,68,68,0.08)"
        />
        <IssueGroup
          label="Persistent"
          count={persistentIssues.length}
          items={persistentIssues}
          color="var(--text-secondary)"
          bgColor="var(--surface-hover)"
        />
      </div>
    </div>
  );
}

function IssueGroup({
  label,
  count,
  items,
  color,
  bgColor,
}: {
  label: string;
  count: number;
  items: AuditFinding[];
  color: string;
  bgColor: string;
}) {
  return (
    <div
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          backgroundColor: bgColor,
        }}
      >
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color }}>{label}</span>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color,
            padding: '2px 8px',
            borderRadius: 4,
            backgroundColor: 'rgba(255,255,255,0.5)',
          }}
        >
          {count}
        </span>
      </div>
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {items.length === 0 ? (
          <div style={{ padding: '16px 14px', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            None
          </div>
        ) : (
          items.slice(0, 10).map((item, i) => (
            <div
              key={i}
              style={{
                padding: '8px 14px',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none',
                lineHeight: 1.4,
              }}
            >
              {item.title}
            </div>
          ))
        )}
        {items.length > 10 && (
          <div style={{ padding: '6px 14px', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center', borderTop: '1px solid var(--border-subtle)' }}>
            +{items.length - 10} more
          </div>
        )}
      </div>
    </div>
  );
}
