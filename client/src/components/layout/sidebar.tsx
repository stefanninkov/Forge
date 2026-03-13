import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings2,
  Layers,
  LayoutTemplate,
  Sparkles,
  Gauge,
  Search,
  Bot,
  Activity,
  FileText,
  HeartPulse,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
  Settings,
  BookOpen,
  FolderOpen,
  Check,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { useSidebar } from '@/hooks/use-sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useProjects } from '@/hooks/use-projects';
import { useActiveProject } from '@/hooks/use-active-project';
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
      { label: 'Activity', path: '/activity', icon: Activity },
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
      { label: 'Site Health', path: '/health', icon: HeartPulse },
    ],
  },
  {
    header: 'Deliver',
    items: [
      { label: 'Reports', path: '/reports', icon: FileText },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { collapsed, toggleCollapsed } = useSidebar();
  const { user, clearAuth } = useAuth();
  const { data: projects } = useProjects();
  const { activeProjectId, setActiveProjectId } = useActiveProject();
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  const activeProject = projects?.find((p) => p.id === activeProjectId) ?? projects?.[0] ?? null;

  // Auto-set active project if none selected
  if (projects && projects.length > 0 && !activeProjectId) {
    setActiveProjectId(projects[0].id);
  }

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

      {/* Active project selector */}
      {!collapsed && (
        <div
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid var(--border-default)',
            position: 'relative',
          }}
        >
          <button
            onClick={() => setProjectMenuOpen(!projectMenuOpen)}
            className="flex items-center w-full cursor-pointer border-none bg-transparent"
            style={{
              padding: '6px 8px',
              borderRadius: 'var(--radius-md)',
              gap: 8,
              transition: 'background-color var(--duration-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 24,
                height: 24,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: activeProject ? 'var(--accent-subtle)' : 'var(--surface-hover)',
                flexShrink: 0,
              }}
            >
              <FolderOpen size={13} style={{ color: activeProject ? 'var(--accent)' : 'var(--text-tertiary)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)',
                  lineHeight: 1,
                  marginBottom: 2,
                }}
              >
                Project
              </div>
              <div
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                }}
              >
                {activeProject?.name ?? 'No project'}
              </div>
            </div>
            <ChevronDown
              size={12}
              style={{
                color: 'var(--text-tertiary)',
                flexShrink: 0,
                transform: projectMenuOpen ? 'rotate(180deg)' : undefined,
                transition: 'transform var(--duration-fast)',
              }}
            />
          </button>

          {/* Webflow connection status */}
          {activeProject && (
            <div
              className="flex items-center"
              style={{
                padding: '2px 8px',
                gap: 6,
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
              }}
            >
              {activeProject.webflowSiteId ? (
                <>
                  <Wifi size={10} style={{ color: 'var(--accent)' }} />
                  <span style={{ color: 'var(--accent)' }}>Webflow connected</span>
                </>
              ) : (
                <>
                  <WifiOff size={10} />
                  <span>No Webflow site</span>
                </>
              )}
            </div>
          )}

          {/* Project dropdown */}
          {projectMenuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setProjectMenuOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 12,
                  right: 12,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-elevated)',
                  zIndex: 50,
                  overflow: 'hidden',
                  padding: '4px 0',
                  maxHeight: 280,
                  overflowY: 'auto',
                }}
              >
                {projects?.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveProjectId(p.id);
                      setProjectMenuOpen(false);
                    }}
                    className="flex items-center w-full border-none bg-transparent cursor-pointer"
                    style={{
                      height: 34,
                      padding: '0 10px',
                      gap: 8,
                      fontSize: 'var(--text-sm)',
                      color: p.id === activeProject?.id ? 'var(--accent-text)' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: p.id === activeProject?.id ? 500 : 400,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {p.id === activeProject?.id ? (
                      <Check size={12} style={{ flexShrink: 0 }} />
                    ) : (
                      <span style={{ width: 12, flexShrink: 0 }} />
                    )}
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.name}
                    </span>
                  </button>
                ))}
                {(!projects || projects.length === 0) && (
                  <div style={{ padding: '8px 10px', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    No projects yet
                  </div>
                )}
                <div style={{ borderTop: '1px solid var(--border-default)', margin: '4px 0' }} />
                <button
                  onClick={() => {
                    setProjectMenuOpen(false);
                    navigate('/');
                  }}
                  className="flex items-center w-full border-none bg-transparent cursor-pointer"
                  style={{
                    height: 34,
                    padding: '0 10px',
                    gap: 8,
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-sans)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-tertiary)';
                  }}
                >
                  <LayoutDashboard size={12} style={{ flexShrink: 0 }} />
                  <span>All projects</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Collapsed project indicator */}
      {collapsed && activeProject && (
        <div
          className="flex items-center justify-center"
          style={{
            padding: '8px 0',
            borderBottom: '1px solid var(--border-default)',
          }}
          title={`Project: ${activeProject.name}`}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-subtle)',
            }}
          >
            <FolderOpen size={14} style={{ color: 'var(--accent)' }} />
          </div>
        </div>
      )}

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

        {/* Guide */}
        <Link
          to="/guide"
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
            color: isActive('/guide')
              ? 'var(--accent-text)'
              : 'var(--text-secondary)',
            backgroundColor: isActive('/guide')
              ? 'var(--accent-subtle)'
              : 'transparent',
          }}
          onMouseEnter={(e) => {
            if (!isActive('/guide')) {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive('/guide')) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
          title={collapsed ? 'Guide' : undefined}
        >
          <BookOpen size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Guide</span>}
        </Link>

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
