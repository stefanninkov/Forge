import { useState, useMemo } from 'react';
import { Image, CheckCircle2, AlertTriangle, Download, ExternalLink, Check } from 'lucide-react';
import type { AuditFinding } from '@/types/audit';

interface ImageChecklistProps {
  findings: AuditFinding[];
}

interface ImageItem {
  url: string;
  filename: string;
  issue: string;
  severity: 'warning' | 'error';
  recommendation: string;
  checked: boolean;
}

export function ImageChecklist({ findings }: ImageChecklistProps) {
  const imageFindings = useMemo(() => {
    return findings.filter(
      (f) => f.category === 'images' && f.severity !== 'success',
    );
  }, [findings]);

  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const imageItems = useMemo<ImageItem[]>(() => {
    return imageFindings.map((f, i) => {
      // Extract URL from affected URLs if available
      const url = f.affectedUrls?.[0] ?? '';
      const filename = url ? url.split('/').pop() ?? 'image' : f.title;

      return {
        url,
        filename,
        issue: f.title,
        severity: f.severity as 'warning' | 'error',
        recommendation: f.recommendation ?? f.description,
        checked: checkedItems.has(i),
      };
    });
  }, [imageFindings, checkedItems]);

  const toggleItem = (idx: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const completedCount = checkedItems.size;
  const totalCount = imageItems.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (imageItems.length === 0) return null;

  const handleExportChecklist = () => {
    const lines = imageItems.map(
      (item, i) =>
        `${checkedItems.has(i) ? '[x]' : '[ ]'} ${item.issue}\n    ${item.recommendation}${item.url ? `\n    URL: ${item.url}` : ''}`,
    );
    const content = `# Image Optimization Checklist\n# ${completedCount}/${totalCount} completed\n\n${lines.join('\n\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'image-optimization-checklist.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <div className="flex items-center" style={{ gap: 8 }}>
          <Image size={14} style={{ color: 'var(--text-tertiary)' }} />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
            Image Optimization Checklist
          </span>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-tertiary)',
            }}
          >
            {completedCount}/{totalCount}
          </span>
        </div>
        <button
          onClick={handleExportChecklist}
          className="flex items-center border-none bg-transparent cursor-pointer"
          style={{
            gap: 4,
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-sans)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <Download size={12} />
          Export
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, backgroundColor: 'var(--border-subtle)' }}>
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: 'var(--accent)',
            transition: 'width 200ms ease',
          }}
        />
      </div>

      {/* Items */}
      <div>
        {imageItems.map((item, i) => (
          <div
            key={i}
            className="flex items-start"
            style={{
              padding: '10px 12px',
              gap: 10,
              borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none',
              opacity: item.checked ? 0.5 : 1,
              transition: 'opacity 200ms ease',
            }}
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleItem(i)}
              className="flex items-center justify-center border-none cursor-pointer shrink-0"
              style={{
                width: 18,
                height: 18,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: item.checked ? 'var(--accent)' : 'transparent',
                border: item.checked ? 'none' : '1.5px solid var(--border-strong)',
                marginTop: 1,
              }}
            >
              {item.checked && <Check size={12} style={{ color: '#fff' }} />}
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="flex items-center"
                style={{ gap: 6, marginBottom: 2 }}
              >
                {item.severity === 'error' ? (
                  <AlertTriangle size={12} style={{ color: 'var(--error)', flexShrink: 0 }} />
                ) : (
                  <AlertTriangle size={12} style={{ color: '#f59e0b', flexShrink: 0 }} />
                )}
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    color: item.checked ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    textDecoration: item.checked ? 'line-through' : 'none',
                  }}
                >
                  {item.issue}
                </span>
              </div>
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)',
                  margin: 0,
                  lineHeight: 'var(--leading-normal)',
                }}
              >
                {item.recommendation}
              </p>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                  style={{
                    gap: 4,
                    marginTop: 4,
                    fontSize: 'var(--text-xs)',
                    color: 'var(--accent-text)',
                    textDecoration: 'none',
                    fontFamily: 'var(--font-mono)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={10} />
                  {item.filename}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
