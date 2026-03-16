import { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, TrendingDown, AlertCircle, X, Check } from 'lucide-react';
import { useAlerts, useMarkAlertRead } from '@/hooks/use-audits';
import { useActiveProject } from '@/hooks/use-active-project';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { activeProjectId } = useActiveProject();
  const { data: alerts } = useAlerts(activeProjectId);
  const markRead = useMarkAlertRead();

  const unreadCount = alerts?.filter((a) => !a.read).length ?? 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const SEVERITY_ICONS = {
    CRITICAL: AlertCircle,
    WARNING: AlertTriangle,
    INFO: TrendingDown,
  } as const;

  const SEVERITY_COLORS = {
    CRITICAL: 'var(--error)',
    WARNING: '#f59e0b',
    INFO: 'var(--text-tertiary)',
  } as const;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center border-none cursor-pointer"
        style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-md)',
          backgroundColor: open ? 'var(--surface-hover)' : 'transparent',
          color: 'var(--text-tertiary)',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'var(--error)',
              border: '2px solid var(--bg-primary)',
            }}
          />
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            width: 320,
            maxHeight: 400,
            overflow: 'auto',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-primary)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 50,
            animation: 'fadeIn 150ms ease-out',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between"
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--border-default)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              Notifications
            </span>
            <button
              onClick={() => setOpen(false)}
              className="flex items-center justify-center border-none bg-transparent cursor-pointer"
              style={{
                width: 24,
                height: 24,
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-tertiary)',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Alerts list */}
          {alerts && alerts.length > 0 ? (
            alerts.slice(0, 20).map((alert) => {
              const SeverityIcon = SEVERITY_ICONS[alert.severity as keyof typeof SEVERITY_ICONS] ?? AlertTriangle;
              const color = SEVERITY_COLORS[alert.severity as keyof typeof SEVERITY_COLORS] ?? 'var(--text-tertiary)';

              return (
                <div
                  key={alert.id}
                  className="flex"
                  style={{
                    padding: '10px 14px',
                    gap: 10,
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: alert.read ? 'transparent' : 'var(--accent-subtle)',
                    cursor: 'pointer',
                    transition: 'background-color var(--duration-fast)',
                  }}
                  onClick={() => {
                    if (!alert.read) markRead.mutate(alert.id);
                  }}
                  onMouseEnter={(e) => {
                    if (alert.read) e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (alert.read) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <SeverityIcon size={14} style={{ color, flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-primary)',
                        fontWeight: alert.read ? 400 : 500,
                        lineHeight: 'var(--leading-normal)',
                        margin: 0,
                      }}
                    >
                      {alert.message}
                    </p>
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      {new Date(alert.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {!alert.read && (
                    <Check size={12} style={{ color: 'var(--accent-text)', flexShrink: 0, marginTop: 2 }} />
                  )}
                </div>
              );
            })
          ) : (
            <div
              style={{
                padding: '24px 14px',
                textAlign: 'center',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-tertiary)',
              }}
            >
              {activeProjectId ? 'No notifications yet.' : 'Select a project to see notifications.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
