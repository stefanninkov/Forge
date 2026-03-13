interface CategoryTabsProps {
  categories: readonly string[];
  labels: Record<string, string>;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  counts?: Record<string, number>;
}

export function CategoryTabs({
  categories,
  labels,
  activeCategory,
  onCategoryChange,
  counts,
}: CategoryTabsProps) {
  return (
    <div
      className="flex items-center"
      style={{
        gap: 2,
        borderBottom: '1px solid var(--border-default)',
        overflowX: 'auto',
      }}
    >
      <button
        onClick={() => onCategoryChange('all')}
        className="border-none bg-transparent cursor-pointer shrink-0"
        style={{
          padding: '8px 12px',
          fontSize: 'var(--text-xs)',
          fontWeight: 500,
          fontFamily: 'var(--font-sans)',
          color: activeCategory === 'all' ? 'var(--accent-text)' : 'var(--text-tertiary)',
          borderBottom: activeCategory === 'all' ? '2px solid var(--accent)' : '2px solid transparent',
          marginBottom: -1,
          transition: 'color 100ms ease',
        }}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onCategoryChange(cat)}
          className="flex items-center border-none bg-transparent cursor-pointer shrink-0"
          style={{
            gap: 5,
            padding: '8px 12px',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            fontFamily: 'var(--font-sans)',
            color: activeCategory === cat ? 'var(--accent-text)' : 'var(--text-tertiary)',
            borderBottom: activeCategory === cat ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1,
            transition: 'color 100ms ease',
          }}
        >
          {labels[cat] ?? cat}
          {counts?.[cat] !== undefined && counts[cat] > 0 && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                backgroundColor: activeCategory === cat ? 'var(--accent-subtle)' : 'var(--surface-hover)',
                color: activeCategory === cat ? 'var(--accent-text)' : 'var(--text-tertiary)',
                padding: '1px 5px',
                borderRadius: 'var(--radius-sm)',
                lineHeight: '14px',
              }}
            >
              {counts[cat]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
