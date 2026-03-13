import { X } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  loading = false,
  destructive = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-overlay)' }}
      onClick={onCancel}
    >
      <div
        style={{
          width: 400,
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          padding: 24,
          animation: 'fadeIn 200ms ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <h2
            style={{
              fontSize: 'var(--text-md)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onCancel}
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
            marginBottom: 24,
          }}
        >
          {description}
        </p>

        <div className="flex justify-end" style={{ gap: 8 }}>
          <button
            onClick={onCancel}
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
            onClick={onConfirm}
            disabled={loading}
            style={{
              height: 36,
              padding: '0 14px',
              border: destructive ? '1px solid var(--error)' : 'none',
              borderRadius: 'var(--radius-md)',
              backgroundColor: destructive ? 'transparent' : 'var(--accent)',
              color: destructive ? 'var(--error)' : '#fff',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                if (destructive) {
                  e.currentTarget.style.backgroundColor = 'var(--error)';
                  e.currentTarget.style.color = '#fff';
                } else {
                  e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                }
              }
            }}
            onMouseLeave={(e) => {
              if (destructive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--error)';
              } else {
                e.currentTarget.style.backgroundColor = 'var(--accent)';
              }
            }}
          >
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
