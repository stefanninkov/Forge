import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { useProjectNotes, useUpdateProjectNotes } from '@/hooks/use-projects';

export interface ProjectNotesPanelProps {
  projectId: string | null;
  projectName: string;
  open: boolean;
  onClose: () => void;
}

export function ProjectNotesPanel({ projectId, projectName, open, onClose }: ProjectNotesPanelProps) {
  const { data: savedNotes, isLoading } = useProjectNotes(projectId);
  const updateNotes = useUpdateProjectNotes();
  const [localNotes, setLocalNotes] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync local state when saved notes load
  useEffect(() => {
    if (savedNotes !== undefined) {
      setLocalNotes(savedNotes);
    }
  }, [savedNotes]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (open && textareaRef.current) {
      const timeout = setTimeout(() => textareaRef.current?.focus(), 150);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  const saveNotes = useCallback(
    (notes: string) => {
      if (!projectId) return;
      updateNotes.mutate({ id: projectId, notes });
    },
    [projectId, updateNotes],
  );

  function handleChange(value: string) {
    setLocalNotes(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      saveNotes(value);
    }, 1000);
  }

  function handleBlur() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (projectId && localNotes !== savedNotes) {
      saveNotes(localNotes);
    }
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 998,
          animation: 'fadeIn 150ms ease-out',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 420,
          maxWidth: '100vw',
          backgroundColor: 'var(--bg-primary)',
          borderLeft: '1px solid var(--border-default)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 200ms ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-default)',
            flexShrink: 0,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              Notes
            </h2>
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                margin: '2px 0 0',
              }}
            >
              {projectName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center border-none bg-transparent cursor-pointer"
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-tertiary)',
              transition: 'color var(--duration-fast), background-color var(--duration-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-active)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
            aria-label="Close notes panel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {isLoading ? (
            <div
              className="flex items-center justify-center"
              style={{ flex: 1, opacity: 0, animation: 'fadeIn 200ms ease-out 200ms forwards' }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  border: '2px solid var(--border-default)',
                  borderTopColor: 'var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={localNotes}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              placeholder="Add notes about this project..."
              style={{
                flex: 1,
                width: '100%',
                resize: 'none',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-sans)',
                lineHeight: 'var(--leading-relaxed)',
                padding: 12,
                outline: 'none',
                transition: 'border-color var(--duration-fast)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onBlurCapture={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
            }}
          >
            {localNotes.length.toLocaleString()} / 10,000 characters
          </span>
          {updateNotes.isPending && (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
              }}
            >
              Saving...
            </span>
          )}
          {!updateNotes.isPending && updateNotes.isSuccess && (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--accent-text)',
              }}
            >
              Saved
            </span>
          )}
        </div>
      </div>
    </>
  );
}
