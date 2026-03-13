import { Search, X } from 'lucide-react';
import type { AnimationEngine, AnimationTrigger, PresetFilters } from '@/types/animation';

const ENGINE_OPTIONS: { value: AnimationEngine | ''; label: string }[] = [
  { value: '', label: 'All engines' },
  { value: 'CSS', label: 'CSS' },
  { value: 'GSAP', label: 'GSAP' },
];

const TRIGGER_OPTIONS: { value: AnimationTrigger | ''; label: string }[] = [
  { value: '', label: 'All triggers' },
  { value: 'SCROLL', label: 'Scroll' },
  { value: 'HOVER', label: 'Hover' },
  { value: 'CLICK', label: 'Click' },
  { value: 'LOAD', label: 'Load' },
];

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All categories' },
  { value: 'fade', label: 'Fade' },
  { value: 'scale', label: 'Scale' },
  { value: 'slide', label: 'Slide' },
  { value: 'special', label: 'Special' },
  { value: 'hover', label: 'Hover' },
  { value: 'load', label: 'Load' },
  { value: 'parallax', label: 'Parallax' },
  { value: 'text', label: 'Text' },
  { value: 'stagger', label: 'Stagger' },
  { value: 'scroll', label: 'Scroll' },
];

export interface PresetFiltersBarProps {
  filters: PresetFilters;
  onChange: (filters: PresetFilters) => void;
  resultCount?: number;
}

const selectStyle: React.CSSProperties = {
  height: 32,
  padding: '0 28px 0 8px',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  fontSize: 'var(--text-xs)',
  fontFamily: 'var(--font-sans)',
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
};

export function PresetFiltersBar({ filters, onChange, resultCount }: PresetFiltersBarProps) {
  const hasActiveFilters = filters.engine || filters.trigger || filters.category || filters.search;

  return (
    <div className="flex items-center" style={{ gap: 8, flexWrap: 'wrap' }}>
      {/* Search */}
      <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-tertiary)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          value={filters.search ?? ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
          placeholder="Search animations..."
          style={{
            width: '100%',
            height: 32,
            padding: '0 8px 0 30px',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
          }}
        />
      </div>

      {/* Engine filter */}
      <select
        value={filters.engine ?? ''}
        onChange={(e) =>
          onChange({
            ...filters,
            engine: (e.target.value as AnimationEngine) || undefined,
          })
        }
        style={selectStyle}
      >
        {ENGINE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Trigger filter */}
      <select
        value={filters.trigger ?? ''}
        onChange={(e) =>
          onChange({
            ...filters,
            trigger: (e.target.value as AnimationTrigger) || undefined,
          })
        }
        style={selectStyle}
      >
        {TRIGGER_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Category filter */}
      <select
        value={filters.category ?? ''}
        onChange={(e) =>
          onChange({ ...filters, category: e.target.value || undefined })
        }
        style={selectStyle}
      >
        {CATEGORY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={() => onChange({})}
          className="flex items-center border-none bg-transparent cursor-pointer"
          style={{
            gap: 4,
            height: 32,
            padding: '0 8px',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-sans)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-tertiary)';
          }}
        >
          <X size={12} />
          Clear
        </button>
      )}

      {/* Result count */}
      {resultCount !== undefined && (
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)',
            marginLeft: 'auto',
          }}
        >
          {resultCount} preset{resultCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
