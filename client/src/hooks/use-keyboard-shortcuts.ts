import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/use-theme';

/**
 * Global keyboard shortcut handler.
 * Registered once at the app level.
 *
 * Shortcuts:
 * - Cmd+B / Ctrl+B: Toggle sidebar
 * - Cmd+` / Ctrl+`: Toggle dark mode
 * - Cmd+, / Ctrl+,: Open settings
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      // Don't intercept if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case '`':
          e.preventDefault();
          setTheme(theme === 'dark' ? 'light' : 'dark');
          break;
        case ',':
          e.preventDefault();
          navigate('/settings');
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, theme, setTheme]);
}
