import { useState } from 'react';
import { X } from 'lucide-react';
import type { SetupCategory } from '@/types/setup';

export interface SaveProfileDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, config: Record<string, boolean>) => void;
  categories: SetupCategory[];
  loading?: boolean;
}

export function SaveProfileDialog({
  open,
  onClose,
  onSave,
  categories,
  loading = false,
}: SaveProfileDialogProps) {
  const [name, setName] = useState('');

  if (!open) return null;

  // Build config from current state: all non-skipped items are "checked" in the profile
  function handleSave() {
    if (!name.trim()) return;
    const config: Record<string, boolean> = {};
    for (const cat of categories) {
      for (const item of cat.items) {
        config[item.key] = item.status !== 'SKIPPED';
      }
    }
    onSave(name.trim(), config);
    setName('');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-overlay)' }}
      onClick={onClose}
    >
      <div
        style={{
          width: 420,
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          padding: 24,
          animation: 'fadeIn 200ms ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <h2
            style={{
              fontSize: 'var(--text-md)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            Save setup profile
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center border-none bg-transparent cursor-pointer"
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-tertiary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--leading-normal)',
            marginBottom: 16,
          }}
        >
          Save the current checklist configuration as a reusable profile. Skipped items will remain skipped when the profile is applied.
        </p>

        <label
          style={{
            display: 'block',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            marginBottom: 6,
          }}
        >
          Profile name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Standard client setup"
          autoFocus
          style={{
            width: '100%',
            height: 36,
            padding: '0 12px',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
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
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
          }}
        />

        <div className="flex justify-end" style={{ gap: 8, marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{
              height: 36,
              padding: '0 14px',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || loading}
            style={{
              height: 36,
              padding: '0 14px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent)',
              color: '#fff',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor: !name.trim() || loading ? 'not-allowed' : 'pointer',
              opacity: !name.trim() || loading ? 0.5 : 1,
              fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={(e) => {
              if (name.trim() && !loading) {
                e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent)';
            }}
          >
            {loading ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
