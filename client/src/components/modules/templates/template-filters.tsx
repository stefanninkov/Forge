import { Search, X } from 'lucide-react';
import { TEMPLATE_CATEGORIES } from '@/types/template';
import type { TemplateFilters } from '@/types/template';

interface TemplateFiltersBarProps {
  filters: TemplateFilters;
  onChange: (filters: TemplateFilters) => void;
  resultCount: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  navbar: 'Navbar',
  hero: 'Hero',
  features: 'Features',
  testimonials: 'Testimonials',
  faq: 'FAQ',
  pricing: 'Pricing',
  cta: 'CTA',
  footer: 'Footer',
  contact: 'Contact',
  'logo-strip': 'Logo Strip',
  team: 'Team',
  blog: 'Blog',
};

const selectStyle: React.CSSProperties = {
  height: 32,
  padding: '0 10px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)',
  backgroundColor: 'var(--bg-primary)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-primary)',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
};

export function TemplateFiltersBar({ filters, onChange, resultCount }: TemplateFiltersBarProps) {
  const hasFilters = !!(filters.category || filters.type || filters.search);

  return (
    <div className="flex items-center" style={{ gap: 8, flexWrap: 'wrap' }}>
      {/* Search */}
      <div
        className="flex items-center"
        style={{
          flex: 1,
          minWidth: 180,
          maxWidth: 280,
          height: 32,
          padding: '0 10px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-primary)',
          gap: 6,
        }}
      >
        <Search size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
        <input
          type="text"
          value={filters.search ?? ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
          placeholder="Search templates..."
          style={{
            flex: 1,
            border: 'none',
            background: 'none',
            outline: 'none',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
          }}
        />
      </div>

      {/* Category filter */}
      <select
        value={filters.category ?? ''}
        onChange={(e) => onChange({ ...filters, category: e.target.value || undefined })}
        style={selectStyle}
      >
        <option value="">All categories</option>
        {TEMPLATE_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {CATEGORY_LABELS[cat] ?? cat}
          </option>
        ))}
      </select>

      {/* Type filter */}
      <select
        value={filters.type ?? ''}
        onChange={(e) =>
          onChange({
            ...filters,
            type: (e.target.value || undefined) as TemplateFilters['type'],
          })
        }
        style={selectStyle}
      >
        <option value="">All types</option>
        <option value="SKELETON">Skeleton</option>
        <option value="STYLED">Styled</option>
      </select>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={() => onChange({})}
          className="flex items-center border-none bg-transparent cursor-pointer"
          style={{
            gap: 4,
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-sans)',
            padding: 0,
          }}
        >
          <X size={12} />
          Clear
        </button>
      )}

      {/* Result count */}
      <span
        style={{
          marginLeft: 'auto',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
        }}
      >
        {resultCount} template{resultCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
