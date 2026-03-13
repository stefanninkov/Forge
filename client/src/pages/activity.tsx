import { useState, useMemo } from 'react';
import {
  Activity, FolderPlus, Pencil, Trash2, Zap, LayoutTemplate,
  ArrowUpFromLine, Sparkles, Code2, Scissors, Eye, Settings2,
  ChevronDown, Filter,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { useActivityLog } from '@/hooks/use-activity';
import type { ActivityAction } from '@/types/project';

const ACTION_CONFIG: Record<ActivityAction, { label: string; icon: typeof Activity; color: string }> = {
  PROJECT_CREATED: { label: 'Project created', icon: FolderPlus, color: 'var(--accent)' },
  PROJECT_UPDATED: { label: 'Project updated', icon: Pencil, color: 'var(--text-secondary)' },
  PROJECT_DELETED: { label: 'Project deleted', icon: Trash2, color: 'var(--error)' },
  AUDIT_RUN: { label: 'Audit completed', icon: Zap, color: '#f59e0b' },
  TEMPLATE_CREATED: { label: 'Template created', icon: LayoutTemplate, color: 'var(--accent)' },
  TEMPLATE_PUSHED: { label: 'Template pushed', icon: ArrowUpFromLine, color: '#3b82f6' },
  ANIMATION_APPLIED: { label: 'Animation applied', icon: Sparkles, color: '#8b5cf6' },
  SCRIPT_DEPLOYED: { label: 'Script deployed', icon: Code2, color: 'var(--accent)' },
  SECTION_CAPTURED: { label: 'Section captured', icon: Scissors, color: '#ec4899' },
  FIGMA_ANALYZED: { label: 'Figma analyzed', icon: Eye, color: '#06b6d4' },
  SETTINGS_UPDATED: { label: 'Settings updated', icon: Settings2, color: 'var(--text-secondary)' },
};

const FILTER_OPTIONS: { label: string; value: ActivityAction | '' }[] = [
  { label: 'All activity', value: '' },
  { label: 'Project created', value: 'PROJECT_CREATED' },
  { label: 'Project updated', value: 'PROJECT_UPDATED' },
  { label: 'Audit completed', value: 'AUDIT_RUN' },
  { label: 'Template created', value: 'TEMPLATE_CREATED' },
  { label: 'Animation applied', value: 'ANIMATION_APPLIED' },
  { label: 'Script deployed', value: 'SCRIPT_DEPLOYED' },
  { label: 'Section captured', value: 'SECTION_CAPTURED' },
  { label: 'Figma analyzed', value: 'FIGMA_ANALYZED' },
];

const PAGE_SIZE = 30;

export default function ActivityPage() {
  usePageTitle('Activity');
  const [actionFilter, setActionFilter] = useState<ActivityAction | ''>('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useActivityLog({
    action: actionFilter || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const activities = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Group activities by date
  const grouped = useMemo(() => {
    const groups: Record<string, typeof activities> = {};
    for (const item of activities) {
      const dateKey = new Date(item.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    }
    return Object.entries(groups);
  }, [activities]);

  const activeFilterLabel = FILTER_OPTIONS.find((f) => f.value === actionFilter)?.label ?? 'All activity';

  return (
    <>
      <PageHeader
        title="Activity"
        description="Recent actions across your projects."
        actions={
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center border-none cursor-pointer"
              style={{
                height: 36,
                padding: '0 12px',
                gap: 6,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-hover)',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
                transition: 'background-color var(--duration-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-active)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              }}
            >
              <Filter size={14} />
              <span>{activeFilterLabel}</span>
              <ChevronDown size={14} />
            </button>

            {filterOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 40,
                  right: 0,
                  width: 200,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-elevated)',
                  zIndex: 50,
                  overflow: 'hidden',
                  padding: '4px 0',
                }}
              >
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setActionFilter(opt.value);
                      setFilterOpen(false);
                      setPage(0);
                    }}
                    className="flex items-center w-full border-none bg-transparent cursor-pointer"
                    style={{
                      height: 32,
                      padding: '0 12px',
                      fontSize: 'var(--text-sm)',
                      color: opt.value === actionFilter ? 'var(--accent-text)' : 'var(--text-secondary)',
                      fontWeight: opt.value === actionFilter ? 600 : 400,
                      fontFamily: 'var(--font-sans)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        }
      />

      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '24px',
        }}
      >
        {/* Loading */}
        {isLoading && (
          <div
            className="flex items-center justify-center"
            style={{
              height: 300,
              opacity: 0,
              animation: 'fadeIn 200ms ease-out 200ms forwards',
            }}
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
        )}

        {/* Error */}
        {error && (
          <div
            className="flex items-center justify-center"
            style={{
              height: 300,
              color: 'var(--error)',
              fontSize: 'var(--text-sm)',
            }}
          >
            Failed to load activity log.
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && activities.length === 0 && (
          <div
            className="flex flex-col items-center justify-center"
            style={{
              height: 400,
              animation: 'fadeIn 200ms ease-out',
            }}
          >
            <Activity
              size={48}
              style={{ color: 'var(--text-tertiary)', marginBottom: 16 }}
              strokeWidth={1}
            />
            <p
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: 4,
              }}
            >
              No activity yet
            </p>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                maxWidth: 320,
                textAlign: 'center',
              }}
            >
              Actions you take across Forge will appear here.
            </p>
          </div>
        )}

        {/* Activity list */}
        {!isLoading && !error && grouped.length > 0 && (
          <div style={{ animation: 'fadeIn 200ms ease-out' }}>
            {grouped.map(([dateLabel, items]) => (
              <div key={dateLabel} style={{ marginBottom: 32 }}>
                <h3
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    margin: '0 0 12px',
                  }}
                >
                  {dateLabel}
                </h3>

                <div
                  style={{
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                  }}
                >
                  {items.map((item, i) => {
                    const config = ACTION_CONFIG[item.action];
                    const Icon = config?.icon ?? Activity;
                    const time = new Date(item.createdAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={item.id}
                        className="flex items-center"
                        style={{
                          padding: '12px 16px',
                          gap: 12,
                          borderBottom:
                            i < items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        }}
                      >
                        <div
                          className="flex items-center justify-center"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--surface-hover)',
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={14} style={{ color: config?.color ?? 'var(--text-secondary)' }} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: 'var(--text-sm)',
                              color: 'var(--text-primary)',
                              fontWeight: 500,
                              margin: 0,
                            }}
                          >
                            {config?.label ?? item.action}
                          </p>
                          {item.project && (
                            <p
                              style={{
                                fontSize: 'var(--text-xs)',
                                color: 'var(--text-tertiary)',
                                margin: '2px 0 0',
                              }}
                            >
                              {item.project.name}
                            </p>
                          )}
                        </div>

                        <span
                          style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-tertiary)',
                            flexShrink: 0,
                          }}
                        >
                          {time}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                className="flex items-center justify-center"
                style={{ gap: 8, paddingTop: 16 }}
              >
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="border-none cursor-pointer"
                  style={{
                    height: 32,
                    padding: '0 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--surface-hover)',
                    color: page === 0 ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 500,
                    fontFamily: 'var(--font-sans)',
                    opacity: page === 0 ? 0.5 : 1,
                  }}
                >
                  Previous
                </button>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-tertiary)',
                    padding: '0 8px',
                  }}
                >
                  {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="border-none cursor-pointer"
                  style={{
                    height: 32,
                    padding: '0 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--surface-hover)',
                    color: page >= totalPages - 1 ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 500,
                    fontFamily: 'var(--font-sans)',
                    opacity: page >= totalPages - 1 ? 0.5 : 1,
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
