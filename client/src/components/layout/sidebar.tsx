import { useState, useEffect, useCallback } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LayoutTemplate,
  Sparkles,
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
  ArrowLeft,
  Lock,
  Layers,
  PenTool,
  Palette,
  Rocket,
  CircleDot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { useSidebar } from '@/hooks/use-sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useProjects } from '@/hooks/use-projects';
import { useActiveProject } from '@/hooks/use-active-project';
import { toast } from 'sonner';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import type { Project } from '@/types/project';

/* ─── Types ─── */
interface NavItem {
  label: string;
  path: string;
  icon: ComponentType<LucideProps>;
}

interface NavSection {
  header: string;
  items: NavItem[];
}

/* ─── Route prefetch map ─── */
const ROUTE_CHUNKS: Record<string, () => Promise<unknown>> = {
  '/': () => import('@/pages/dashboard'),
  '/templates': () => import('@/pages/templates'),
  '/animations': () => import('@/pages/animations'),
  '/guide': () => import('@/pages/guide'),
  '/settings': () => import('@/pages/settings'),
};

/* ─── Dashboard mode nav ─── */
const DASHBOARD_SECTIONS: NavSection[] = [
  {
    header: '',
    items: [
      { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    ],
  },
  {
    header: 'Library',
    items: [
      { label: 'Templates', path: '/templates', icon: LayoutTemplate },
      { label: 'Animations', path: '/animations', icon: Sparkles },
    ],
  },
];

/* ─── Workflow step config ─── */
interface WorkflowStep {
  number: number;
  label: string;
  icon: ComponentType<LucideProps>;
  pathSuffix: string;
  prerequisiteLabel?: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  { number: 1, label: 'Setup', icon: Settings, pathSuffix: 'setup' },
  { number: 2, label: 'Import Figma', icon: Layers, pathSuffix: 'figma', prerequisiteLabel: 'Setup' },
  { number: 3, label: 'Edit Structure', icon: PenTool, pathSuffix: 'structure', prerequisiteLabel: 'Import Figma' },
  { number: 4, label: 'Style & Animate', icon: Palette, pathSuffix: 'style', prerequisiteLabel: 'Edit Structure' },
  { number: 5, label: 'Review & Push', icon: Rocket, pathSuffix: 'review', prerequisiteLabel: 'Style & Animate' },
];

/* ─── Step completion logic ─── */
type StepStatus = 'complete' | 'active' | 'available' | 'locked';

function getStepStatuses(project: Project | null, currentPath: string): StepStatus[] {
  if (!project) return ['available', 'locked', 'locked', 'locked', 'locked'];

  // Step 1: complete when figmaTokenId AND webflowTokenId AND webflowSiteId set
  const step1Done = !!(project.figmaTokenId && project.webflowTokenId && project.webflowSiteId);
  // Step 2: complete when project has figmaFileKey (analysis done)
  const step2Done = !!project.figmaFileKey;
  // Step 3: complete when analysis has final structure (we use figmaFileKey + webflowSiteId as proxy)
  const step3Done = step2Done; // simplified for now — will refine when structure pages exist
  // Step 4: always accessible after step 3 (optional)
  const step4Done = false; // optional step
  // Step 5: complete when pushed
  const step5Done = false; // will be set when push tracking exists

  const statuses: StepStatus[] = [
    step1Done ? 'complete' : 'available',
    step1Done ? (step2Done ? 'complete' : 'available') : 'locked',
    step2Done ? (step3Done ? 'complete' : 'available') : 'locked',
    step3Done ? (step4Done ? 'complete' : 'available') : 'locked',
    step1Done ? (step5Done ? 'complete' : 'available') : 'locked',
  ];

  // Mark current path as active
  const projectPrefix = currentPath.match(/^\/project\/[^/]+\/(.+)/)?.[1];
  WORKFLOW_STEPS.forEach((step, i) => {
    if (projectPrefix === step.pathSuffix && statuses[i] !== 'locked') {
      statuses[i] = 'active';
    }
  });

  return statuses;
}

/* ─── Shared NavLink ─── */
function NavLink({
  item,
  active,
  collapsed,
  onPrefetch,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onPrefetch: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
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
        color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
        backgroundColor: active ? 'var(--accent-subtle)' : 'transparent',
        transitionDuration: 'var(--duration-fast)',
      }}
      onMouseEnter={(e) => {
        onPrefetch();
        if (!active) {
          e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
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
}

/* ─── Footer links ─── */
function FooterLink({
  to,
  icon: Icon,
  label,
  active,
  collapsed,
}: {
  to: string;
  icon: ComponentType<LucideProps>;
  label: string;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn('flex items-center no-underline', collapsed && 'justify-center')}
      style={{
        height: 36,
        padding: collapsed ? '0 8px' : '0 12px',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-sm)',
        fontWeight: 500,
        gap: 10,
        color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
        backgroundColor: active ? 'var(--accent-subtle)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
      title={collapsed ? label : undefined}
    >
      <Icon size={18} style={{ flexShrink: 0 }} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

/* ─── Main Sidebar ─── */
export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { collapsed, toggleCollapsed } = useSidebar();
  const { user, logout } = useAuth();
  const { data: projects } = useProjects();
  const { activeProjectId, setActiveProjectId } = useActiveProject();
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  // Detect project mode from URL
  const projectMatch = location.pathname.match(/^\/project\/([^/]+)/);
  const isProjectMode = !!projectMatch;
  const projectIdFromUrl = projectMatch?.[1] ?? null;

  const activeProject = projects?.find((p) =>
    isProjectMode ? p.id === projectIdFromUrl : p.id === activeProjectId,
  ) ?? projects?.[0] ?? null;

  useEffect(() => {
    if (projects && projects.length > 0 && !activeProjectId) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId, setActiveProjectId]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const prefetchRoute = useCallback((path: string) => {
    const loader = ROUTE_CHUNKS[path];
    if (loader) loader();
  }, []);

  const stepStatuses = getStepStatuses(activeProject, location.pathname);

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
              className="flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                backgroundColor: 'var(--accent)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span className="font-bold" style={{ color: '#ffffff', fontSize: 'var(--text-sm)', lineHeight: 1 }}>
                F
              </span>
            </div>
            <span className="font-semibold" style={{ fontSize: 'var(--text-base)', letterSpacing: 'var(--tracking-tight)' }}>
              Forge
            </span>
          </Link>
        )}

        {collapsed && (
          <Link to="/" className="flex items-center justify-center no-underline mx-auto">
            <div
              className="flex items-center justify-center"
              style={{ width: 28, height: 28, backgroundColor: 'var(--accent)', borderRadius: 'var(--radius-md)' }}
            >
              <span className="font-bold" style={{ color: '#ffffff', fontSize: 'var(--text-sm)', lineHeight: 1 }}>F</span>
            </div>
          </Link>
        )}

        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            className="flex items-center justify-center cursor-pointer border-none bg-transparent"
            style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)' }}
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

      {/* ─── Project mode: Back button + project info ─── */}
      {isProjectMode && !collapsed && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default)' }}>
          <button
            onClick={() => navigate('/')}
            className="flex items-center border-none bg-transparent cursor-pointer"
            style={{
              gap: 6,
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              padding: 0,
              marginBottom: 10,
              fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
          >
            <ArrowLeft size={12} />
            Back to Dashboard
          </button>
          <div
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {activeProject?.name ?? 'Project'}
          </div>
          {activeProject?.webflowSiteId && (
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                marginTop: 2,
              }}
            >
              {activeProject.webflowSiteId}
            </div>
          )}
        </div>
      )}

      {/* ─── Dashboard mode: Project selector ─── */}
      {!isProjectMode && !collapsed && (
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
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
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
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1, marginBottom: 2 }}>
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
                    onClick={() => { setActiveProjectId(p.id); setProjectMenuOpen(false); }}
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
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {p.id === activeProject?.id ? (
                      <Check size={12} style={{ flexShrink: 0 }} />
                    ) : (
                      <span style={{ width: 12, flexShrink: 0 }} />
                    )}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                  onClick={() => { setProjectMenuOpen(false); navigate('/'); }}
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
          style={{ padding: '8px 0', borderBottom: '1px solid var(--border-default)' }}
          title={`Project: ${activeProject.name}`}
        >
          <div
            className="flex items-center justify-center"
            style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--accent-subtle)' }}
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
        {isProjectMode ? (
          /* ─── Project mode: Workflow steps ─── */
          <>
            {!collapsed && (
              <div
                className="uppercase font-medium"
                style={{
                  fontSize: 'var(--text-xs)',
                  letterSpacing: '0.05em',
                  color: 'var(--text-tertiary)',
                  padding: '8px 12px 4px',
                }}
              >
                Workflow
              </div>
            )}
            <div className="flex flex-col" style={{ gap: 2 }}>
              {WORKFLOW_STEPS.map((step, i) => {
                const status = stepStatuses[i];
                const StepIcon = step.icon;
                const projectId = projectIdFromUrl ?? activeProject?.id ?? '';
                const stepPath = `/project/${projectId}/${step.pathSuffix}`;
                const isLocked = status === 'locked';
                const isStepActive = status === 'active';
                const isComplete = status === 'complete';

                return (
                  <button
                    key={step.pathSuffix}
                    onClick={() => {
                      if (isLocked) {
                        toast.info(`Complete ${step.prerequisiteLabel} first`, {
                          action: step.prerequisiteLabel
                            ? {
                              label: `Go to ${step.prerequisiteLabel}`,
                              onClick: () => navigate(`/project/${projectId}/${WORKFLOW_STEPS[i - 1]?.pathSuffix ?? 'setup'}`),
                            }
                            : undefined,
                        });
                        return;
                      }
                      navigate(stepPath);
                    }}
                    className={cn(
                      'flex items-center w-full border-none bg-transparent',
                      isLocked ? 'cursor-default' : 'cursor-pointer',
                      collapsed && 'justify-center',
                    )}
                    style={{
                      height: 36,
                      padding: collapsed ? '0 8px' : '0 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 500,
                      gap: 10,
                      fontFamily: 'var(--font-sans)',
                      color: isStepActive
                        ? 'var(--accent-text)'
                        : isLocked
                          ? 'var(--text-tertiary)'
                          : 'var(--text-secondary)',
                      backgroundColor: isStepActive ? 'var(--accent-subtle)' : 'transparent',
                      opacity: isLocked ? 0.6 : 1,
                      transitionDuration: 'var(--duration-fast)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isStepActive && !isLocked) {
                        e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isStepActive && !isLocked) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                    title={collapsed ? step.label : undefined}
                  >
                    {/* Status icon */}
                    <span style={{ flexShrink: 0, width: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isComplete ? (
                        <Check size={16} style={{ color: 'var(--accent)' }} />
                      ) : isStepActive ? (
                        <CircleDot size={16} style={{ color: 'var(--accent-text)' }} />
                      ) : isLocked ? (
                        <Lock size={12} style={{ color: 'var(--text-tertiary)' }} />
                      ) : (
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            border: '1.5px solid var(--border-default)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            color: 'var(--text-tertiary)',
                            fontWeight: 600,
                          }}
                        >
                          {step.number}
                        </span>
                      )}
                    </span>
                    {!collapsed && <span>{step.label}</span>}
                  </button>
                );
              })}
            </div>

            {/* Tools section in project mode */}
            {!collapsed && (
              <div
                className="uppercase font-medium"
                style={{
                  fontSize: 'var(--text-xs)',
                  letterSpacing: '0.05em',
                  color: 'var(--text-tertiary)',
                  padding: '16px 12px 4px',
                }}
              >
                Tools
              </div>
            )}
            <div className="flex flex-col" style={{ gap: 2 }}>
              <NavLink
                item={{ label: 'Templates', path: '/templates', icon: LayoutTemplate }}
                active={isActive('/templates')}
                collapsed={collapsed}
                onPrefetch={() => prefetchRoute('/templates')}
              />
              <NavLink
                item={{ label: 'Animations', path: '/animations', icon: Sparkles }}
                active={isActive('/animations')}
                collapsed={collapsed}
                onPrefetch={() => prefetchRoute('/animations')}
              />
            </div>
          </>
        ) : (
          /* ─── Dashboard mode nav ─── */
          DASHBOARD_SECTIONS.map((section) => (
            <div key={section.header || 'main'} style={{ marginBottom: 16 }}>
              {!collapsed && section.header && (
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
              <div className="flex flex-col" style={{ gap: 2 }}>
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    item={item}
                    active={isActive(item.path)}
                    collapsed={collapsed}
                    onPrefetch={() => prefetchRoute(item.path)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </nav>

      {/* Footer */}
      <div
        className="shrink-0"
        style={{
          borderTop: '1px solid var(--border-default)',
          padding: collapsed ? '8px 6px' : '8px 12px',
        }}
      >
        {collapsed && (
          <button
            onClick={toggleCollapsed}
            className="flex items-center justify-center cursor-pointer border-none bg-transparent w-full"
            style={{ height: 36, borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)', marginBottom: 4 }}
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

        {isProjectMode && !collapsed && (
          <FooterLink
            to={`/project/${projectIdFromUrl}/settings`}
            icon={Settings}
            label="Project Settings"
            active={false}
            collapsed={collapsed}
          />
        )}

        {!isProjectMode && (
          <FooterLink
            to="/settings"
            icon={Settings}
            label="Settings"
            active={isActive('/settings')}
            collapsed={collapsed}
          />
        )}

        <FooterLink
          to="/guide"
          icon={BookOpen}
          label="Guide"
          active={isActive('/guide')}
          collapsed={collapsed}
        />

        <button
          onClick={toggleTheme}
          className={cn('flex items-center cursor-pointer border-none bg-transparent w-full', collapsed && 'justify-center')}
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
          {theme === 'light' ? <Moon size={18} style={{ flexShrink: 0 }} /> : <Sun size={18} style={{ flexShrink: 0 }} />}
          {!collapsed && <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>}
        </button>

        {user && (
          <button
            onClick={logout}
            className={cn('flex items-center cursor-pointer border-none bg-transparent w-full', collapsed && 'justify-center')}
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
