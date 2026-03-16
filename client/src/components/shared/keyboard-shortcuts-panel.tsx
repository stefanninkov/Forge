import { Keyboard } from 'lucide-react';

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Global',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['⌘', '`'], description: 'Toggle dark mode' },
      { keys: ['⌘', ','], description: 'Open settings' },
    ],
  },
  {
    title: 'Editor',
    shortcuts: [
      { keys: ['⌘', 'Z'], description: 'Undo' },
      { keys: ['⌘', '⇧', 'Z'], description: 'Redo' },
      { keys: ['⌘', 'S'], description: 'Save changes' },
      { keys: ['⌘', 'C'], description: 'Copy' },
      { keys: ['⌘', 'V'], description: 'Paste' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['⌘', '1'], description: 'Go to Dashboard' },
      { keys: ['⌘', '2'], description: 'Go to Setup' },
      { keys: ['⌘', '3'], description: 'Go to Figma' },
      { keys: ['Esc'], description: 'Close dialog / panel' },
    ],
  },
  {
    title: 'Figma Translator',
    shortcuts: [
      { keys: ['↑', '↓'], description: 'Navigate tree nodes' },
      { keys: ['Enter'], description: 'Select node' },
      { keys: ['Tab'], description: 'Switch editor tabs' },
      { keys: ['Delete'], description: 'Remove selected node' },
    ],
  },
  {
    title: 'Animation Playground',
    shortcuts: [
      { keys: ['Space'], description: 'Play / pause preview' },
      { keys: ['R'], description: 'Reset animation' },
    ],
  },
];

export function KeyboardShortcutsPanel() {
  return (
    <div>
      <div className="flex items-center" style={{ gap: 8, marginBottom: 16 }}>
        <Keyboard size={14} style={{ color: 'var(--text-tertiary)' }} />
        <span
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          Keyboard Shortcuts
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.title}>
            <h4
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 8,
              }}
            >
              {group.title}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {group.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.description}
                  className="flex items-center justify-between"
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {shortcut.description}
                  </span>
                  <div className="flex items-center" style={{ gap: 3 }}>
                    {shortcut.keys.map((key, i) => (
                      <span key={i}>
                        <kbd
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 22,
                            height: 22,
                            padding: '0 5px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-default)',
                            backgroundColor: 'var(--bg-secondary)',
                            fontSize: 'var(--text-xs)',
                            fontFamily: 'var(--font-sans)',
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                            boxShadow: '0 1px 0 var(--border-default)',
                          }}
                        >
                          {key}
                        </kbd>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
