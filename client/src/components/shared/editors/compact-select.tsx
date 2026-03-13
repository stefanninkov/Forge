import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface CompactSelectProps {
  value: string;
  options: { value: string; label: string }[];
  label?: string;
  compact?: boolean;
  mono?: boolean;
  onChange: (value: string) => void;
}

export function CompactSelect({
  value,
  options,
  label,
  compact = true,
  mono = false,
  onChange,
}: CompactSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const height = compact ? 28 : 36;
  const font = mono ? 'var(--font-mono)' : 'var(--font-sans)';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
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
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height,
          padding: '0 8px',
          border: '1px solid var(--border-default)',
          borderRadius: compact ? 4 : 6,
          backgroundColor: 'transparent',
          color: 'var(--text-primary)',
          fontSize: compact ? 'var(--text-sm)' : 'var(--text-base)',
          fontFamily: font,
          cursor: 'pointer',
          gap: 4,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected?.label || value}
        </span>
        <ChevronDown
          size={12}
          style={{
            color: 'var(--text-tertiary)',
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--duration-fast)',
          }}
        />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 6,
            boxShadow: 'var(--shadow-elevated)',
            zIndex: 100,
            maxHeight: 200,
            overflowY: 'auto',
            padding: 4,
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                height: 28,
                padding: '0 8px',
                border: 'none',
                borderRadius: 4,
                backgroundColor: option.value === value ? 'var(--accent-subtle)' : 'transparent',
                color: option.value === value ? 'var(--accent-text)' : 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                fontFamily: font,
                cursor: 'pointer',
                transition: 'background-color var(--duration-fast)',
              }}
              onMouseEnter={(e) => {
                if (option.value !== value) {
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  option.value === value ? 'var(--accent-subtle)' : 'transparent';
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
