import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/sidebar';
import { CommandPalette } from '@/components/shared/command-palette';
import { StatusBar } from '@/components/shared/status-bar';
import { OnboardingWizard } from '@/components/shared/onboarding-wizard';
import { useProjects } from '@/hooks/use-projects';
import { useRecentPages } from '@/hooks/use-recent-pages';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

const PAGE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/setup': 'Project Setup',
  '/figma': 'Figma Translator',
  '/templates': 'Templates',
  '/animations': 'Animations',
  '/settings': 'Settings',
  '/guide': 'Guide',
};

function getLabelForPath(path: string): string {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  const prefix = Object.keys(PAGE_LABELS).find(
    (key) => key !== '/' && path.startsWith(key),
  );
  return prefix ? PAGE_LABELS[prefix] : path;
}

export function AppLayout() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const location = useLocation();
  const trackPage = useRecentPages((s) => s.trackPage);
  const { data: projects, isLoading } = useProjects();
  useKeyboardShortcuts();

  useEffect(() => {
    const label = getLabelForPath(location.pathname);
    trackPage(location.pathname, label);
  }, [location.pathname, trackPage]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCommandPaletteOpen((prev) => !prev);
    }
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault();
      setCommandPaletteOpen(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Onboarding gate: block app when user has zero projects
  if (!isLoading && (!projects || projects.length === 0)) {
    return <OnboardingWizard />;
  }

  return (
    <div className="flex" style={{ height: '100vh' }}>
      <Sidebar />
      <div className="flex flex-col flex-1" style={{ minWidth: 0 }}>
        <main
          className="flex-1 overflow-y-auto"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <Outlet />
        </main>
        <StatusBar />
      </div>
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
