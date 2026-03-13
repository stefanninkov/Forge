import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ScoreCardProps {
  label: string;
  score: number;
  previousScore?: number;
  suffix?: string;
}

function scoreColor(score: number): string {
  if (score >= 90) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

export function ScoreCard({ label, score, previousScore, suffix }: ScoreCardProps) {
  const color = scoreColor(score);
  const diff = previousScore !== undefined ? score - previousScore : undefined;

  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: 140,
        padding: '16px',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      <div
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          marginBottom: 8,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div className="flex items-end" style={{ gap: 8 }}>
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 1,
            color,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {Math.round(score)}
          {suffix && (
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{suffix}</span>
          )}
        </span>
        {diff !== undefined && diff !== 0 && (
          <span
            className="flex items-center"
            style={{
              gap: 2,
              fontSize: 'var(--text-xs)',
              color: diff > 0 ? '#10b981' : '#ef4444',
              fontWeight: 500,
              marginBottom: 2,
            }}
          >
            {diff > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {diff > 0 ? '+' : ''}{Math.round(diff)}
          </span>
        )}
        {diff !== undefined && diff === 0 && (
          <span
            className="flex items-center"
            style={{
              gap: 2,
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              marginBottom: 2,
            }}
          >
            <Minus size={12} />
          </span>
        )}
      </div>
    </div>
  );
}
