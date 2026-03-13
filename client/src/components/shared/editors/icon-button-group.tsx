import type { LucideIcon } from 'lucide-react';

export interface IconButtonGroupOption {
  value: string;
  icon: LucideIcon;
  tooltip?: string;
}

export interface IconButtonGroupProps {
  value: string;
  options: IconButtonGroupOption[];
  label?: string;
  onChange: (value: string) => void;
}

export function IconButtonGroup({ value, options, label, onChange }: IconButtonGroupProps) {
  return (
    <div>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            color: 'var(--text-tertiary)',
            marginBottom: 4,
          }}
        >
          {label}
        </label>
      )}
      <div
        style={{
          display: 'flex',
          border: '1px solid var(--border-default)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {options.map((option, idx) => {
          const Icon = option.icon;
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              title={option.tooltip}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                border: 'none',
                borderLeft: idx > 0 ? '1px solid var(--border-default)' : 'none',
                backgroundColor: isActive ? 'var(--accent-subtle)' : 'transparent',
                color: isActive ? 'var(--accent-text)' : 'var(--text-tertiary)',
                cursor: 'pointer',
                transition: 'all var(--duration-fast)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-tertiary)';
                }
              }}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
