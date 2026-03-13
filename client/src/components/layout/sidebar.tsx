import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings2,
  Layers,
  LayoutTemplate,
  Sparkles,
  Gauge,
  Search,
  Bot,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { useSidebar } from '@/hooks/use-sidebar';
import { useAuth } from '@/hooks/use-auth';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: ComponentType<LucideProps>;
}

interface NavSection {
  header: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    header: 'Overview',
    items: [
      { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    ],
  },
  {
    header: 'Develop',
    items: [
      { label: 'Project Setup', path: '/setup', icon: Settings2 },
      { label: 'Figma Translator', path: '/figma', icon: Layers },
      { label: 'Templates', path: '/templates', icon: LayoutTemplate },
      { label: 'Animations', path: '/animations', icon: Sparkles },
    ],
  },
  {
    header: 'Optimize',
    items: [
      { label: 'Page Speed', path: '/speed', icon: Gauge },
      { label: 'SEO Audit', path: '/seo', icon: Search },
      { label: 'AEO', path: '/aeo', icon: Bot },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { collapsed, toggleCollapsed } = useSidebar();
  const { user, clearAuth } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        'flex flex-col shrink-0 border-r select-none',
        'transition-[width] duration-200 ease-in-out',
      )}
      style={{
        width: collapsed ? 60 : 240,
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-default)',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Logo area */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{
          height: 56,
          padding: collapsed ? '0 12px' : '0 16px',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        {!collapsed && (
          <Link
            to="/"
            className="flex items-center gap-2 no-underline"
            style={{ color: 'var(--text-primary)' }}
          >
            <div
              className="flex items-center justify-center rounded"
              style={{
                width: 28,
                height: 28,
                backgroundColor: 'var(--accent)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span
                className="font-bold"
                style={{
                  color: '#ffffff',
                  fontSize: 'var(--text-sm)',
                  lineHeight: 1,
                }}
              >
                F
              </span>
            </div>
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--text-base)',
                letterSpacing: 'var(--tracking-tight)',
              }}
            >
              Forge
            </span>
          </Link>
        )}

        {collapsed && (
          <Link
            to="/"
            className="flex items-center justify-center no-underline mx-auto"
          >
            <div
              className="flex items-center justify-center rounded"
              style={{
                width: 28,
                height: 28,
                backgroundColor: 'var(--accent)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span
                className="font-bold"
                style={{
                  color: '#ffffff',
                  fontSize: 'var(--text-sm)',
                  lineHeight: 1,
                }}
              >
                F
              </span>
            </div>
          </Link>
        )}

        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            className="flex items-center justify-center cursor-pointer border-none bg-transparent"
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-tertiary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ padding: collapsed ? '8px 6px' : '8px 12px' }}
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.header} style={{ marginBottom: 16 }}>
            {/* Section header */}
            {!collapsed && (
              <div
                className="uppercase font-medium"
                style={{
                  fontSize: 'var(--text-xs)',
                  letterSpacing: '0.05em',
                  color: 'var(--text-tertiary)',
                  padding: '8px 12px 4px',
                  lineHeight: 'var(--leading-normal)',
                }}
              >
                {section.header}
              </div>
            )}

            {/* Nav items */}
            <div className="flex flex-col" style={{ gap: 2 }}>
              {section.items.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center no-underline transition-colors',
                      collapsed && 'justify-center',
                    )}
                    style={{
                      height: 36,
                      padding: collapsed ? '0 8px' : '0 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 500,
                      gap: 10,
                      color: active
                        ? 'var(--accent-text)'
                        : 'var(--text-secondary)',
                      backgroundColor: active
                        ? 'var(--accent-subtle)'
                        : 'transparent',
                      transitionDuration: 'var(--duration-fast)',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor =
                          'var(--surface-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        className="shrink-0"
        style={{
          borderTop: '1px solid var(--border-default)',
          padding: collapsed ? '8px 6px' : '8px 12px',
        }}
      >
        {/* Collapse button when collapsed */}
        {collapsed && (
          <button
            onClick={toggleCollapsed}
            className="flex items-center justify-center cursor-pointer border-none bg-transparent w-full"
            style={{
              height: 36,
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-tertiary)',
              marginBottom: 4,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
            aria-label="Expand sidebar"
          >
            <ChevronRight size={16} />
          </button>
        )}

        {/* Settings */}
        <Link
          to="/settings"
          className={cn(
            'flex items-center no-underline',
            collapsed && 'justify-center',
          )}
          style={{
            height: 36,
            padding: collapsed ? '0 8px' : '0 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            gap: 10,
            color: isActive('/settings')
              ? 'var(--accent-text)'
              : 'var(--text-secondary)',
            backgroundColor: isActive('/settings')
              ? 'var(--accent-subtle)'
              : 'transparent',
          }}
          onMouseEnter={(e) => {
            if (!isActive('/settings')) {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive('/settings')) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Settings</span>}
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'flex items-center cursor-pointer border-none bg-transparent w-full',
            collapsed && 'justify-center',
          )}
          style={{
            height: 36,
            padding: collapsed ? '0 8px' : '0 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            gap: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title={collapsed ? (theme === 'light' ? 'Dark mode' : 'Light mode') : undefined}
        >
          {theme === 'light' ? (
            <Moon size={18} style={{ flexShrink: 0 }} />
          ) : (
            <Sun size={18} style={{ flexShrink: 0 }} />
          )}
          {!collapsed && (
            <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
          )}
        </button>

        {/* User area */}
        {user && (
          <button
            onClick={clearAuth}
            className={cn(
              'flex items-center cursor-pointer border-none bg-transparent w-full',
              collapsed && 'justify-center',
            )}
            style={{
              height: 36,
              padding: collapsed ? '0 8px' : '0 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              gap: 10,
              marginTop: 2,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            title={collapsed ? 'Sign out' : undefined}
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Sign out</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
