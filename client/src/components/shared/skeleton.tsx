import type { CSSProperties } from 'react';

/* ─── Base Skeleton ─── */

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number | string;
  style?: CSSProperties;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 6, style }: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--surface-hover)',
        animation: 'skeletonPulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

/* ─── Composed Skeletons ─── */

export function SkeletonText({ lines = 3, lastLineWidth = '60%' }: { lines?: number; lastLineWidth?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          width={i === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 8,
        padding: 16,
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Skeleton width={32} height={32} borderRadius={6} />
        <Skeleton width={140} height={16} />
      </div>
      <SkeletonText lines={2} />
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Skeleton width={60} height={22} borderRadius={4} />
        <Skeleton width={60} height={22} borderRadius={4} />
      </div>
    </div>
  );
}

export function SkeletonProjectGrid({ count = 6 }: { count?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 16,
        animation: 'fadeIn 200ms ease-out',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 8,
        overflow: 'hidden',
        animation: 'fadeIn 200ms ease-out',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 16,
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height={12} width={i === 0 ? '70%' : '50%'} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 16,
            padding: '12px 16px',
            borderBottom: rowIdx < rows - 1 ? '1px solid var(--border-subtle)' : 'none',
          }}
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={colIdx} height={14} width={colIdx === 0 ? '80%' : '60%'} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonAuditPage() {
  return (
    <div style={{ padding: '0 24px 24px', animation: 'fadeIn 200ms ease-out' }}>
      {/* Score cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: 16,
              backgroundColor: 'var(--bg-primary)',
            }}
          >
            <Skeleton width={60} height={12} style={{ marginBottom: 8 }} />
            <Skeleton width={48} height={32} style={{ marginBottom: 8 }} />
            <Skeleton width={80} height={12} />
          </div>
        ))}
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width={80} height={32} borderRadius={6} />
        ))}
      </div>

      {/* Findings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Skeleton width={24} height={24} borderRadius="50%" />
            <div style={{ flex: 1 }}>
              <Skeleton width="70%" height={14} style={{ marginBottom: 6 }} />
              <Skeleton width="40%" height={12} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonSetupPage() {
  return (
    <div style={{ padding: '0 24px 24px', animation: 'fadeIn 200ms ease-out' }}>
      {/* Progress bar */}
      <Skeleton width="100%" height={8} borderRadius={4} style={{ marginBottom: 24 }} />

      {/* Category sections */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Skeleton width={180} height={16} />
            <Skeleton width={40} height={14} borderRadius={4} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  border: '1px solid var(--border-default)',
                  borderRadius: 6,
                }}
              >
                <Skeleton width={18} height={18} borderRadius={4} />
                <Skeleton width="60%" height={14} />
                <div style={{ flex: 1 }} />
                <Skeleton width={48} height={20} borderRadius={4} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonActivityPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 24, animation: 'fadeIn 200ms ease-out' }}>
      {/* Date group */}
      <Skeleton width={160} height={12} style={{ marginBottom: 16 }} />
      <div
        style={{
          border: '1px solid var(--border-default)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderBottom: i < 4 ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            <Skeleton width={32} height={32} borderRadius={6} />
            <div style={{ flex: 1 }}>
              <Skeleton width="50%" height={14} style={{ marginBottom: 4 }} />
              <Skeleton width="30%" height={12} />
            </div>
            <Skeleton width={48} height={12} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonFigmaPage() {
  return (
    <div style={{ padding: '0 24px 24px', animation: 'fadeIn 200ms ease-out' }}>
      {/* Input area */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <Skeleton height={36} style={{ flex: 1 }} />
        <Skeleton width={100} height={36} />
      </div>

      {/* Split pane */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Tree */}
        <div style={{ border: '1px solid var(--border-default)', borderRadius: 8, padding: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 0',
                paddingLeft: (i % 3) * 16,
              }}
            >
              <Skeleton width={14} height={14} borderRadius={3} />
              <Skeleton width={120 - (i % 3) * 20} height={14} />
            </div>
          ))}
        </div>
        {/* Preview */}
        <Skeleton height={300} borderRadius={8} />
      </div>
    </div>
  );
}

export function SkeletonTemplateGrid({ count = 8 }: { count?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 16,
        animation: 'fadeIn 200ms ease-out',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          <Skeleton height={140} borderRadius={0} />
          <div style={{ padding: 12 }}>
            <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <Skeleton width={56} height={20} borderRadius={4} />
              <Skeleton width={48} height={20} borderRadius={4} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonAnimationGrid({ count = 12 }: { count?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 12,
        animation: 'fadeIn 200ms ease-out',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          <Skeleton height={120} borderRadius={0} />
          <div style={{ padding: 10 }}>
            <Skeleton width="50%" height={12} style={{ marginBottom: 6 }} />
            <div style={{ display: 'flex', gap: 4 }}>
              <Skeleton width={40} height={18} borderRadius={4} />
              <Skeleton width={40} height={18} borderRadius={4} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
