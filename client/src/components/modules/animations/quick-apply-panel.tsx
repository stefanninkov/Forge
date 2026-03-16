import { useState, useCallback } from 'react';
import { Copy, Check, Zap, ChevronDown, X } from 'lucide-react';

interface QuickApplyPanelProps {
  open: boolean;
  onClose: () => void;
}

interface QuickPreset {
  id: string;
  name: string;
  attrs: string;
  category: string;
}

const QUICK_PRESETS: QuickPreset[] = [
  { id: 'fade-in', name: 'Fade In', category: 'Fade', attrs: 'data-anim="fade" data-anim-duration="0.6" data-anim-ease="ease-out"' },
  { id: 'fade-up', name: 'Fade Up', category: 'Fade', attrs: 'data-anim="fade-up" data-anim-duration="0.6" data-anim-distance="20" data-anim-ease="ease-out"' },
  { id: 'fade-down', name: 'Fade Down', category: 'Fade', attrs: 'data-anim="fade-down" data-anim-duration="0.6" data-anim-distance="20"' },
  { id: 'fade-left', name: 'Fade Left', category: 'Fade', attrs: 'data-anim="fade-left" data-anim-duration="0.6" data-anim-distance="40"' },
  { id: 'fade-right', name: 'Fade Right', category: 'Fade', attrs: 'data-anim="fade-right" data-anim-duration="0.6" data-anim-distance="40"' },
  { id: 'slide-up', name: 'Slide Up', category: 'Slide', attrs: 'data-anim="slide-up" data-anim-duration="0.5" data-anim-distance="100"' },
  { id: 'slide-down', name: 'Slide Down', category: 'Slide', attrs: 'data-anim="slide-down" data-anim-duration="0.5" data-anim-distance="100"' },
  { id: 'scale-in', name: 'Scale In', category: 'Scale', attrs: 'data-anim="scale-in" data-anim-duration="0.5" data-anim-ease="ease-out"' },
  { id: 'scale-up', name: 'Scale Up', category: 'Scale', attrs: 'data-anim="scale-up" data-anim-duration="0.6" data-anim-ease="cubic-bezier(0.22,1,0.36,1)"' },
  { id: 'rotate-in', name: 'Rotate In', category: 'Rotate', attrs: 'data-anim="rotate-in" data-anim-duration="0.6" data-anim-ease="ease-out"' },
  { id: 'blur-in', name: 'Blur In', category: 'Special', attrs: 'data-anim="blur-in" data-anim-duration="0.5" data-anim-ease="ease-out"' },
  { id: 'stagger', name: 'Stagger Children', category: 'Special', attrs: 'data-anim="fade-up" data-anim-stagger="0.1" data-anim-duration="0.5"' },
];

export function QuickApplyPanel({ open, onClose }: QuickApplyPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const handleCopy = useCallback(async (preset: QuickPreset) => {
    try {
      await navigator.clipboard.writeText(preset.attrs);
      setCopiedId(preset.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard API may fail
    }
  }, []);

  if (!open) return null;

  const categories = ['all', ...Array.from(new Set(QUICK_PRESETS.map((p) => p.category)))];
  const filtered = filter === 'all' ? QUICK_PRESETS : QUICK_PRESETS.filter((p) => p.category === filter);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 48,
        right: 24,
        width: 340,
        maxHeight: 480,
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-primary)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 150ms ease-out',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border-default)',
          flexShrink: 0,
        }}
      >
        <div className="flex items-center" style={{ gap: 6 }}>
          <Zap size={13} style={{ color: 'var(--accent-text)' }} />
          <span
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            Quick Animation
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center border-none bg-transparent cursor-pointer"
          style={{
            width: 24,
            height: 24,
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-tertiary)',
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Category filter */}
      <div
        className="flex"
        style={{
          padding: '8px 14px',
          gap: 4,
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
          overflowX: 'auto',
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className="border-none cursor-pointer"
            style={{
              height: 22,
              padding: '0 8px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: filter === cat ? 'var(--accent-subtle)' : 'transparent',
              color: filter === cat ? 'var(--accent-text)' : 'var(--text-tertiary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              whiteSpace: 'nowrap',
              textTransform: 'capitalize',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Preset list */}
      <div style={{ overflow: 'auto', flex: 1 }}>
        {filtered.map((preset) => (
          <div
            key={preset.id}
            className="flex items-center justify-between"
            style={{
              padding: '8px 14px',
              borderBottom: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'background-color var(--duration-fast)',
            }}
            onClick={() => handleCopy(preset)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  marginBottom: 2,
                }}
              >
                {preset.name}
              </div>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-tertiary)',
                  maxWidth: 250,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {preset.attrs}
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              {copiedId === preset.id ? (
                <Check size={14} style={{ color: 'var(--accent-text)' }} />
              ) : (
                <Copy size={13} style={{ color: 'var(--text-tertiary)' }} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div
        style={{
          padding: '8px 14px',
          borderTop: '1px solid var(--border-default)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        Click to copy attributes to clipboard
      </div>
    </div>
  );
}
