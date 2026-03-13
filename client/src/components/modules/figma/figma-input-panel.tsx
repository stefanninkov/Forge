import { useState } from 'react';
import { Loader2, Layers } from 'lucide-react';

interface FigmaInputPanelProps {
  onAnalyze: (figmaUrl: string, pageName?: string) => void;
  isLoading: boolean;
  error: string | null;
  pages?: string[];
}

export function FigmaInputPanel({ onAnalyze, isLoading, error, pages }: FigmaInputPanelProps) {
  const [url, setUrl] = useState('');
  const [selectedPage, setSelectedPage] = useState<string>('');

  const handleSubmit = () => {
    if (!url.trim()) return;
    onAnalyze(url.trim(), selectedPage || undefined);
  };

  return (
    <div
      className="flex flex-col"
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        backgroundColor: 'var(--bg-primary)',
        gap: 12,
      }}
    >
      <div className="flex items-center" style={{ gap: 8 }}>
        <Layers size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
        <span
          className="font-medium"
          style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
        >
          Figma File
        </span>
      </div>

      <div className="flex" style={{ gap: 8 }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.figma.com/design/..."
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          style={{
            flex: 1,
            height: 36,
            padding: '0 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-primary)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-subtle)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />

        {pages && pages.length > 1 && (
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            style={{
              height: 36,
              padding: '0 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-primary)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-primary)',
              outline: 'none',
              minWidth: 120,
            }}
          >
            <option value="">All pages</option>
            {pages.map((page) => (
              <option key={page} value={page}>
                {page}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={handleSubmit}
          disabled={!url.trim() || isLoading}
          className="flex items-center cursor-pointer"
          style={{
            height: 36,
            padding: '0 16px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor: 'var(--accent)',
            color: '#ffffff',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            gap: 6,
            opacity: !url.trim() || isLoading ? 0.5 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze'
          )}
        </button>
      </div>

      {error && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--status-error)' }}>
          {error}
        </div>
      )}
    </div>
  );
}
