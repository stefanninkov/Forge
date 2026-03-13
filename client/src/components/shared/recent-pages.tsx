import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Wrench, Figma, LayoutTemplate, Sparkles, Gauge,
  SearchCheck, Brain, Settings, Activity, FileText, HeartPulse,
  BookOpen, Clock, Trash2,
} from 'lucide-react';
import { useRecentPages, type RecentPage } from '@/hooks/use-recent-pages';

type LucideIcon = typeof Clock;

const PATH_ICON_MAP: Record<string, LucideIcon> = {
  '/': LayoutDashboard,
  '/setup': Wrench,
  '/figma': Figma,
  '/templates': LayoutTemplate,
  '/animations': Sparkles,
  '/speed': Gauge,
  '/seo': SearchCheck,
  '/aeo': Brain,
  '/health': HeartPulse,
  '/activity': Activity,
  '/reports': FileText,
  '/settings': Settings,
  '/guide': BookOpen,
};

function getIconForPath(path: string): LucideIcon {
  if (PATH_ICON_MAP[path]) return PATH_ICON_MAP[path];
  const prefix = Object.keys(PATH_ICON_MAP).find(
    (key) => key !== '/' && path.startsWith(key),
  );
  return prefix ? PATH_ICON_MAP[prefix] : Clock;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.floor(diffDay / 7);
  return `${diffWeek}w ago`;
}

export interface RecentPagesListProps {
  maxItems?: number;
  onNavigate?: () => void;
}

export function RecentPagesList({ maxItems, onNavigate }: RecentPagesListProps) {
  const { pages, clearHistory } = useRecentPages();
  const navigate = useNavigate();

  const visiblePages = maxItems ? pages.slice(0, maxItems) : pages;

  if (visiblePages.length === 0) {
    return (
      <div
        style={{
          padding: '16px 8px',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-tertiary)',
          textAlign: 'center',
        }}
      >
        No recent pages.
      </div>
    );
  }

  const handleClick = (page: RecentPage) => {
    navigate(page.path);
    onNavigate?.();
  };

  return (
    <div>
      {visiblePages.map((page) => {
        const Icon = getIconForPath(page.path);
        return (
          <button
            key={page.path}
            onClick={() => handleClick(page)}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              height: 36,
              padding: '0 8px',
              gap: 10,
              border: 'none',
              borderRadius: 6,
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'background-color 120ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            <Icon
              size={16}
              style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}
            />
            <span
              style={{
                flex: 1,
                textAlign: 'left',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {page.label}
            </span>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                flexShrink: 0,
              }}
            >
              {formatRelativeTime(page.timestamp)}
            </span>
          </button>
        );
      })}
      <button
        onClick={clearHistory}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '8px 8px 4px',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-sans)',
          transition: 'color 120ms ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)';
        }}
      >
        <Trash2 size={12} />
        Clear history
      </button>
    </div>
  );
}
