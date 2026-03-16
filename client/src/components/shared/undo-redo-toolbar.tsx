import { Undo2, Redo2 } from 'lucide-react';
import { useStore, type StoreApi } from 'zustand';
import type { UndoRedoState } from '@/hooks/use-undo-redo';

interface UndoRedoToolbarProps<T> {
  store: StoreApi<UndoRedoState<T>>;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
const modKey = isMac ? '\u2318' : 'Ctrl+';

const toolbarStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2px',
  padding: '2px',
  borderRadius: 'var(--radius, 6px)',
  border: '1px solid var(--border, #e5e7eb)',
  background: 'var(--bg-surface, #fff)',
};

const buttonBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  height: '28px',
  padding: '0 8px',
  border: 'none',
  borderRadius: 'calc(var(--radius, 6px) - 2px)',
  background: 'transparent',
  color: 'var(--text-secondary, #6b7280)',
  fontSize: '0.6875rem',
  fontFamily: 'var(--font-sans, Geist, sans-serif)',
  lineHeight: 1,
  cursor: 'pointer',
  transition: 'background 120ms ease, color 120ms ease',
  whiteSpace: 'nowrap',
};

const buttonDisabled: React.CSSProperties = {
  opacity: 0.35,
  cursor: 'default',
  pointerEvents: 'none',
};

const kbdStyle: React.CSSProperties = {
  fontSize: '0.625rem',
  color: 'var(--text-tertiary, #9ca3af)',
  fontFamily: 'var(--font-mono, Geist Mono, monospace)',
};

export function UndoRedoToolbar<T>({ store }: UndoRedoToolbarProps<T>) {
  const { canUndo, canRedo, undoLabel, redoLabel, undo, redo } = useStore(store);

  return (
    <div style={toolbarStyle} role="toolbar" aria-label="Undo and redo">
      <button
        type="button"
        style={{ ...buttonBase, ...(canUndo ? {} : buttonDisabled) }}
        onClick={undo}
        disabled={!canUndo}
        title={undoLabel ? `Undo: ${undoLabel}` : 'Undo'}
        aria-label={undoLabel ? `Undo: ${undoLabel}` : 'Undo'}
        onMouseEnter={(e) => {
          if (canUndo) e.currentTarget.style.background = 'var(--bg-hover, #f3f4f6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <Undo2 size={14} />
        <span style={kbdStyle}>{modKey}Z</span>
      </button>

      <div
        style={{
          width: '1px',
          height: '16px',
          background: 'var(--border, #e5e7eb)',
          flexShrink: 0,
        }}
        aria-hidden="true"
      />

      <button
        type="button"
        style={{ ...buttonBase, ...(canRedo ? {} : buttonDisabled) }}
        onClick={redo}
        disabled={!canRedo}
        title={redoLabel ? `Redo: ${redoLabel}` : 'Redo'}
        aria-label={redoLabel ? `Redo: ${redoLabel}` : 'Redo'}
        onMouseEnter={(e) => {
          if (canRedo) e.currentTarget.style.background = 'var(--bg-hover, #f3f4f6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <Redo2 size={14} />
        <span style={kbdStyle}>{modKey}\u21E7Z</span>
      </button>
    </div>
  );
}
