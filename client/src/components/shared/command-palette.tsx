import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, LayoutDashboard, Settings, Wrench, Figma, LayoutTemplate,
  Sparkles, Gauge, SearchCheck, Brain, Zap, Plus, Moon, Sun, PanelLeftClose,
  PanelLeft, Keyboard, Activity, FileText, HeartPulse, Clock, BookOpen,
  Users, Globe,
} from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { useSidebar } from '@/hooks/use-sidebar';
import { useRecentPages } from '@/hooks/use-recent-pages';

/**
 * Fuzzy match: checks if all characters of the pattern appear in the target
 * in order (not necessarily contiguous). Returns a score (lower = better match)
 * or -1 if no match. Consecutive character matches and matches at word
 * boundaries are scored higher (lower number).
 */
function fuzzyMatch(pattern: string, target: string): number {
  const p = pattern.toLowerCase();
  const t = target.toLowerCase();

  if (p.length === 0) return 0;
  if (p.length > t.length) return -1;

  // Fast path: exact substring match
  if (t.includes(p)) return 0;

  let score = 0;
  let pi = 0;
  let lastMatchIndex = -1;

  for (let ti = 0; ti < t.length && pi < p.length; ti++) {
    if (t[ti] === p[pi]) {
      // Bonus for consecutive matches
      if (lastMatchIndex === ti - 1) {
        score += 1;
      } else {
        score += 5;
      }
      // Bonus for word boundary matches (after space, hyphen, slash)
      if (ti === 0 || t[ti - 1] === ' ' || t[ti - 1] === '-' || t[ti - 1] === '/') {
        score -= 3;
      }
      lastMatchIndex = ti;
      pi++;
    }
  }

  // All pattern characters matched?
  return pi === p.length ? score : -1;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: typeof Search;
  category: 'recent' | 'navigation' | 'actions' | 'search';
  shortcut?: string;
  action: () => void;
}

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { collapsed, setCollapsed } = useSidebar();

  const commands = useMemo<CommandItem[]>(() => {
    const nav = (path: string) => () => { navigate(path); onClose(); };
    return [
      // Navigation
      { id: 'nav-dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, category: 'navigation', action: nav('/') },
      { id: 'nav-setup', label: 'Go to Project Setup', icon: Wrench, category: 'navigation', action: nav('/setup') },
      { id: 'nav-figma', label: 'Go to Figma Translator', icon: Figma, category: 'navigation', action: nav('/figma') },
      { id: 'nav-templates', label: 'Go to Templates', icon: LayoutTemplate, category: 'navigation', action: nav('/templates') },
      { id: 'nav-animations', label: 'Go to Animations', icon: Sparkles, category: 'navigation', action: nav('/animations') },
      { id: 'nav-speed', label: 'Go to Page Speed', icon: Gauge, category: 'navigation', action: nav('/speed') },
      { id: 'nav-seo', label: 'Go to SEO Audit', icon: SearchCheck, category: 'navigation', action: nav('/seo') },
      { id: 'nav-aeo', label: 'Go to AEO', icon: Brain, category: 'navigation', action: nav('/aeo') },
      { id: 'nav-health', label: 'Go to Site Health', icon: HeartPulse, category: 'navigation', action: nav('/health') },
      { id: 'nav-activity', label: 'Go to Activity', icon: Activity, category: 'navigation', action: nav('/activity') },
      { id: 'nav-reports', label: 'Go to Reports', icon: FileText, category: 'navigation', action: nav('/reports') },
      { id: 'nav-settings', label: 'Go to Settings', icon: Settings, category: 'navigation', shortcut: '⌘,', action: nav('/settings') },
      { id: 'nav-guide', label: 'Go to Guide', icon: BookOpen, category: 'navigation', action: nav('/guide') },
      { id: 'nav-teams', label: 'Go to Teams', icon: Users, category: 'navigation', action: nav('/teams') },
      { id: 'nav-community', label: 'Go to Community Library', icon: Globe, category: 'navigation', action: nav('/community') },
      // Actions
      { id: 'act-new-project', label: 'Create New Project', icon: Plus, category: 'actions', shortcut: '⌘N', action: () => { navigate('/'); onClose(); } },
      {
        id: 'act-toggle-theme', label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
        icon: theme === 'dark' ? Sun : Moon, category: 'actions', shortcut: '⌘`',
        action: () => { setTheme(theme === 'dark' ? 'light' : 'dark'); onClose(); },
      },
      {
        id: 'act-toggle-sidebar', label: `${collapsed ? 'Expand' : 'Collapse'} Sidebar`,
        icon: collapsed ? PanelLeft : PanelLeftClose, category: 'actions', shortcut: '⌘B',
        action: () => { setCollapsed(!collapsed); onClose(); },
      },
    ];
  }, [navigate, onClose, theme, setTheme, collapsed, setCollapsed]);

  const recentPages = useRecentPages((s) => s.pages);

  const recentItems = useMemo<CommandItem[]>(() => {
    if (query.trim()) return [];
    const nav = (path: string) => () => { navigate(path); onClose(); };
    return recentPages.slice(0, 5).map((page, i) => ({
      id: `recent-${i}`,
      label: page.label,
      icon: Clock,
      category: 'recent' as const,
      action: nav(page.path),
    }));
  }, [recentPages, query, navigate, onClose]);

  const filtered = useMemo(() => {
    if (!query.trim()) return [...recentItems, ...commands];
    const q = query.trim();

    const scored = commands
      .map((cmd) => {
        // Try matching against label, description, and category
        const labelScore = fuzzyMatch(q, cmd.label);
        const descScore = cmd.description ? fuzzyMatch(q, cmd.description) : -1;
        const catScore = fuzzyMatch(q, cmd.category);
        // Take the best (lowest non-negative) score
        const scores = [labelScore, descScore, catScore].filter((s) => s >= 0);
        const bestScore = scores.length > 0 ? Math.min(...scores) : -1;
        return { cmd, score: bestScore };
      })
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => a.score - b.score)
      .map((entry) => entry.cmd);

    return scored;
  }, [commands, recentItems, query]);

  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filtered]);

  const flatItems = useMemo(() => filtered, [filtered]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          flatItems[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [flatItems, selectedIndex, onClose],
  );

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  const CATEGORY_LABELS: Record<string, string> = {
    recent: 'Recent',
    navigation: 'Navigate',
    actions: 'Actions',
    search: 'Search',
  };

  let flatIndex = -1;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'var(--bg-overlay)',
          zIndex: 9998,
          animation: 'fadeIn 100ms ease-out',
        }}
      />
      {/* Palette */}
      <div
        style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 560,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: '60vh',
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 150ms ease-out',
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <Search size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: 'var(--text-base)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
            }}
          />
          <kbd
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-secondary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 8,
          }}
        >
          {flatItems.length === 0 && (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-tertiary)',
              }}
            >
              No results found.
            </div>
          )}
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div
                style={{
                  padding: '6px 8px 4px',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {CATEGORY_LABELS[category] || category}
              </div>
              {items.map((item) => {
                flatIndex++;
                const idx = flatIndex;
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    data-index={idx}
                    onClick={() => item.action()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      height: 36,
                      padding: '0 8px',
                      gap: 10,
                      border: 'none',
                      borderRadius: 6,
                      backgroundColor: isSelected ? 'var(--surface-hover)' : 'transparent',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <Icon
                      size={16}
                      style={{
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-tertiary)',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        textAlign: 'left',
                        fontSize: 'var(--text-sm)',
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: 500,
                      }}
                    >
                      {item.label}
                    </span>
                    {item.shortcut && (
                      <kbd
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-tertiary)',
                          padding: '1px 5px',
                          borderRadius: 4,
                          border: '1px solid var(--border-default)',
                          backgroundColor: 'var(--bg-secondary)',
                        }}
                      >
                        {item.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 16px',
            borderTop: '1px solid var(--border-default)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
          }}
        >
          <div style={{ display: 'flex', gap: 12 }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Keyboard size={12} />
            <span>⌘/</span>
          </div>
        </div>
      </div>
    </>
  );
}
