import { useState, useEffect, useMemo } from 'react';
import { X, Copy, Trash2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { useClipboardHistory } from '@/hooks/use-clipboard-history';
import type { ClipboardEntry } from '@/hooks/use-clipboard-history';

interface ClipboardHistoryPanelProps {
  open: boolean;
  onClose: () => void;
}

const TYPE_FILTERS: { label: string; value: ClipboardEntry['type'] | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Animation', value: 'animation-attrs' },
  { label: 'CSS', value: 'css' },
  { label: 'Script', value: 'script' },
  { label: 'HTML', value: 'html' },
  { label: 'Class', value: 'class-name' },
];

const TYPE_COLORS: Record<ClipboardEntry['type'], { color: string; bg: string }> = {
  'animation-attrs': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  css: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  script: { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)' },
  html: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  'class-name': { color: 'var(--accent)', bg: 'var(--accent-subtle)' },
  other: { color: 'var(--text-tertiary)', bg: 'var(--surface-hover)' },
};

const TYPE_LABELS: Record<ClipboardEntry['type'], string> = {
  'animation-attrs': 'Animation',
  css: 'CSS',
  script: 'Script',
  html: 'HTML',
  'class-name': 'Class',
  other: 'Other',
};

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ClipboardHistoryPanel({ open, onClose }: ClipboardHistoryPanelProps) {
  const { entries, removeEntry, clearHistory } = useClipboardHistory();
  const [activeFilter, setActiveFilter] = useState<ClipboardEntry['type'] | 'all'>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return entries;
    return entries.filter((e) => e.type === activeFilter);
  }, [entries, activeFilter]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleCopy = async (entry: ClipboardEntry) => {
    try {
      await navigator.clipboard.writeText(entry.content);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 90,
            transition: 'opacity 200ms ease',
          }}
        />
      )}

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '380px',
          maxWidth: '100vw',
          backgroundColor: 'var(--bg-primary)',
          borderLeft: '1px solid var(--border-default)',
          zIndex: 100,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 200ms ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            height: 48,
            padding: '0 16px',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <span
            className="font-medium"
            style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
          >
            Clipboard History
          </span>
          <button
            onClick={onClose}
            className="flex items-center justify-center border-none bg-transparent cursor-pointer"
            style={{ width: 28, height: 28, color: 'var(--text-tertiary)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter pills */}
        <div
          className="flex items-center shrink-0"
          style={{
            padding: '8px 16px',
            gap: 4,
            borderBottom: '1px solid var(--border-default)',
            flexWrap: 'wrap',
          }}
        >
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className="flex items-center justify-center border-none cursor-pointer"
              style={{
                height: 26,
                padding: '0 10px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
                color:
                  activeFilter === f.value
                    ? 'var(--accent-text)'
                    : 'var(--text-tertiary)',
                backgroundColor:
                  activeFilter === f.value
                    ? 'var(--accent-subtle)'
                    : 'transparent',
                transition: 'all var(--duration-fast)',
              }}
              onMouseEnter={(e) => {
                if (activeFilter !== f.value) {
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeFilter !== f.value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-tertiary)';
                }
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto" style={{ padding: '8px 12px' }}>
          {filtered.length === 0 && (
            <div
              className="flex flex-col items-center justify-center"
              style={{
                height: 200,
                gap: 8,
                color: 'var(--text-tertiary)',
              }}
            >
              <ClipboardList size={24} />
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--text-sm)',
                  textAlign: 'center',
                  maxWidth: 240,
                  lineHeight: 1.5,
                }}
              >
                No clipboard history yet. Items copied from Forge will appear here.
              </p>
            </div>
          )}

          <div className="flex flex-col" style={{ gap: 4 }}>
            {filtered.map((entry) => {
              const typeStyle = TYPE_COLORS[entry.type];
              const isHovered = hoveredId === entry.id;

              return (
                <div
                  key={entry.id}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: isHovered ? 'var(--surface-hover)' : 'transparent',
                    transition: 'background-color var(--duration-fast)',
                  }}
                  onMouseEnter={() => setHoveredId(entry.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Top row: badge + label + actions */}
                  <div
                    className="flex items-center"
                    style={{ gap: 6, marginBottom: 4 }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        color: typeStyle.color,
                        backgroundColor: typeStyle.bg,
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-sm)',
                        textTransform: 'uppercase',
                        flexShrink: 0,
                      }}
                    >
                      {TYPE_LABELS[entry.type]}
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {entry.label}
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-tertiary)',
                        flexShrink: 0,
                      }}
                    >
                      {formatRelativeTime(entry.timestamp)}
                    </span>

                    {/* Actions */}
                    <button
                      onClick={() => handleCopy(entry)}
                      className="flex items-center justify-center border-none bg-transparent cursor-pointer"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-tertiary)',
                        flexShrink: 0,
                        transition: 'all var(--duration-fast)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--accent-subtle)';
                        e.currentTarget.style.color = 'var(--accent)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-tertiary)';
                      }}
                      title="Copy to clipboard"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className="flex items-center justify-center border-none bg-transparent cursor-pointer"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-tertiary)',
                        flexShrink: 0,
                        opacity: isHovered ? 1 : 0,
                        transition: 'all var(--duration-fast)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.color = '#ef4444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-tertiary)';
                      }}
                      title="Remove"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Content preview */}
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 6px',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {entry.content}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        {entries.length > 0 && (
          <div
            className="flex items-center justify-end shrink-0"
            style={{
              height: 48,
              padding: '0 16px',
              borderTop: '1px solid var(--border-default)',
            }}
          >
            <button
              onClick={() => {
                clearHistory();
                toast.success('Clipboard history cleared');
              }}
              className="flex items-center cursor-pointer border-none bg-transparent"
              style={{
                height: 30,
                padding: '0 10px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-sans)',
                transition: 'all var(--duration-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </>
  );
}
