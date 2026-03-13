import { useState } from 'react';
import { Check, ChevronDown, ChevronRight, ExternalLink, Zap, HelpCircle, Hand } from 'lucide-react';
import type { SetupItem } from '@/types/setup';

export interface SetupItemRowProps {
  item: SetupItem;
  onToggle: (itemKey: string, status: 'COMPLETED' | 'PENDING') => void;
  loading?: boolean;
}

const AUTOMATION_LABELS: Record<string, { label: string; icon: typeof Zap; color: string; bg: string }> = {
  auto: { label: 'Auto', icon: Zap, color: 'var(--accent-text)', bg: 'var(--accent-subtle)' },
  semi: { label: 'Semi', icon: HelpCircle, color: 'var(--warning)', bg: 'rgba(217, 119, 6, 0.08)' },
  manual: { label: 'Manual', icon: Hand, color: 'var(--text-tertiary)', bg: 'var(--surface-hover)' },
};

export function SetupItemRow({ item, onToggle, loading = false }: SetupItemRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = item.status === 'COMPLETED';
  const isSkipped = item.status === 'SKIPPED';
  const automation = AUTOMATION_LABELS[item.automationLevel];
  const AutoIcon = automation.icon;

  return (
    <div
      style={{
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Main row */}
      <div
        className="flex items-center"
        style={{
          padding: '10px 16px',
          gap: 12,
        }}
      >
        {/* Checkbox */}
        <button
          onClick={() => {
            if (isSkipped) return;
            onToggle(item.key, isCompleted ? 'PENDING' : 'COMPLETED');
          }}
          disabled={loading || isSkipped}
          className="flex items-center justify-center shrink-0 border-none cursor-pointer"
          style={{
            width: 20,
            height: 20,
            borderRadius: 'var(--radius-sm)',
            border: isCompleted
              ? 'none'
              : isSkipped
                ? '1.5px solid var(--border-default)'
                : '1.5px solid var(--border-strong)',
            backgroundColor: isCompleted
              ? 'var(--accent)'
              : 'transparent',
            color: isCompleted ? '#fff' : 'transparent',
            opacity: loading ? 0.5 : isSkipped ? 0.4 : 1,
            cursor: loading || isSkipped ? 'not-allowed' : 'pointer',
            transition: 'all var(--duration-fast)',
          }}
          aria-label={isCompleted ? `Mark "${item.title}" as incomplete` : `Mark "${item.title}" as complete`}
        >
          {isCompleted && <Check size={14} strokeWidth={2.5} />}
        </button>

        {/* Title + expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center flex-1 border-none bg-transparent cursor-pointer"
          style={{
            padding: 0,
            gap: 8,
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: isCompleted || isSkipped
              ? 'var(--text-tertiary)'
              : 'var(--text-primary)',
            textDecoration: isCompleted ? 'line-through' : 'none',
            textAlign: 'left',
            minWidth: 0,
          }}
        >
          {expanded ? (
            <ChevronDown size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          ) : (
            <ChevronRight size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.title}
          </span>
        </button>

        {/* Automation badge */}
        <span
          className="flex items-center shrink-0"
          style={{
            height: 22,
            padding: '0 8px',
            gap: 4,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: automation.bg,
            color: automation.color,
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            fontFamily: 'var(--font-sans)',
          }}
        >
          <AutoIcon size={12} />
          {automation.label}
        </span>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div
          style={{
            padding: '0 16px 14px 48px',
            animation: 'fadeIn 150ms ease-out',
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              lineHeight: 'var(--leading-relaxed)',
              marginBottom: 8,
            }}
          >
            {item.description}
          </p>
          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              lineHeight: 'var(--leading-relaxed)',
              marginBottom: item.link ? 10 : 0,
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {item.instructions}
          </p>
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center no-underline"
              style={{
                gap: 4,
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                color: 'var(--accent-text)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              <ExternalLink size={12} />
              Learn more
            </a>
          )}
        </div>
      )}
    </div>
  );
}
