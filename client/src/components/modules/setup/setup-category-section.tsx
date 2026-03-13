import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SetupItemRow } from './setup-item-row';
import type { SetupCategory } from '@/types/setup';

export interface SetupCategorySectionProps {
  category: SetupCategory;
  onToggleItem: (itemKey: string, status: 'COMPLETED' | 'PENDING') => void;
  loading?: boolean;
}

export function SetupCategorySection({ category, onToggleItem, loading = false }: SetupCategorySectionProps) {
  const [expanded, setExpanded] = useState(true);

  const completedCount = category.items.filter((i) => i.status === 'COMPLETED').length;
  const totalCount = category.items.filter((i) => i.status !== 'SKIPPED').length;
  const allDone = totalCount > 0 && completedCount === totalCount;

  return (
    <div
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Category header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center w-full border-none cursor-pointer"
        style={{
          padding: '12px 16px',
          gap: 10,
          backgroundColor: 'var(--bg-secondary)',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          textAlign: 'left',
          transition: 'background-color var(--duration-fast)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
        }}
      >
        {expanded ? (
          <ChevronDown size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
        ) : (
          <ChevronRight size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
        )}
        <span className="flex-1">{category.title}</span>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            color: allDone ? 'var(--success)' : 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {completedCount}/{totalCount}
        </span>
      </button>

      {/* Items */}
      {expanded && (
        <div style={{ backgroundColor: 'var(--bg-primary)' }}>
          {category.items
            .filter((item) => item.status !== 'SKIPPED')
            .map((item) => (
              <SetupItemRow
                key={item.key}
                item={item}
                onToggle={onToggleItem}
                loading={loading}
              />
            ))}
        </div>
      )}
    </div>
  );
}
