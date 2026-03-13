import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  CheckCircle2, Zap, Search, Bot, Globe, Clock,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { useProjects } from '@/hooks/use-projects';
interface HealthMetric {
  label: string;
  value: number | string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  status: 'good' | 'warning' | 'critical';
  icon: typeof Zap;
}

function getStatusColor(status: 'good' | 'warning' | 'critical') {
  switch (status) {
    case 'good': return 'var(--accent)';
    case 'warning': return '#f59e0b';
    case 'critical': return 'var(--error)';
  }
}

function getTrendIcon(trend: 'up' | 'down' | 'neutral') {
  switch (trend) {
    case 'up': return TrendingUp;
    case 'down': return TrendingDown;
    case 'neutral': return Minus;
  }
}

function getScoreStatus(score: number): 'good' | 'warning' | 'critical' {
  if (score >= 80) return 'good';
  if (score >= 60) return 'warning';
  return 'critical';
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case 'CRITICAL': return { icon: AlertTriangle, color: 'var(--error)' };
    case 'WARNING': return { icon: AlertTriangle, color: '#f59e0b' };
    default: return { icon: CheckCircle2, color: 'var(--accent)' };
  }
}

export default function HealthPage() {
  usePageTitle('Site Health');
  const navigate = useNavigate();
  const { data: projects } = useProjects();
  const projectCount = projects?.length ?? 0;

  // Aggregate latest audit scores across all projects
  const metrics: HealthMetric[] = useMemo(() => [
    {
      label: 'Speed Score',
      value: '—',
      trend: 'neutral' as const,
      trendValue: 'Run audit to measure',
      status: 'good' as const,
      icon: Zap,
    },
    {
      label: 'SEO Score',
      value: '—',
      trend: 'neutral' as const,
      trendValue: 'Run audit to measure',
      status: 'good' as const,
      icon: Search,
    },
    {
      label: 'AEO Score',
      value: '—',
      trend: 'neutral' as const,
      trendValue: 'Run audit to measure',
      status: 'good' as const,
      icon: Bot,
    },
    {
      label: 'Active Projects',
      value: projectCount,
      trend: 'neutral' as const,
      trendValue: '',
      status: 'good' as const,
      icon: Globe,
    },
  ], [projectCount]);

  // Alerts will be populated when health dashboard backend route is available
  const recentAlerts: Array<{ id: string; severity: string; message: string; createdAt: string }> = [];

  return (
    <>
      <PageHeader
        title="Site Health"
        description="Overview of your projects' performance and health."
      />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
        {/* Metric cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16,
            marginBottom: 32,
            animation: 'fadeIn 200ms ease-out',
          }}
        >
          {metrics.map((metric) => {
            const TrendIcon = getTrendIcon(metric.trend);
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 20,
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 500,
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {metric.label}
                  </span>
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--surface-hover)',
                    }}
                  >
                    <Icon size={14} style={{ color: getStatusColor(metric.status) }} />
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    lineHeight: 1,
                    marginBottom: 8,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {metric.value}
                </div>

                {metric.trendValue && (
                  <div
                    className="flex items-center"
                    style={{
                      gap: 4,
                      fontSize: 'var(--text-xs)',
                      color: metric.trend === 'up'
                        ? 'var(--accent)'
                        : metric.trend === 'down'
                          ? 'var(--error)'
                          : 'var(--text-tertiary)',
                    }}
                  >
                    <TrendIcon size={12} />
                    <span>{metric.trendValue}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Recent alerts section */}
        <div style={{ marginBottom: 32 }}>
          <h3
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: '0 0 12px',
            }}
          >
            Recent Alerts
          </h3>

          {recentAlerts.length === 0 ? (
            <div
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: '40px 20px',
                textAlign: 'center',
              }}
            >
              <CheckCircle2
                size={32}
                style={{ color: 'var(--accent)', marginBottom: 8 }}
                strokeWidth={1.5}
              />
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                No alerts. Run an audit to check your site health.
              </p>
            </div>
          ) : (
            <div
              style={{
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}
            >
              {recentAlerts.map((alert, i) => {
                const sev = getSeverityIcon(alert.severity);
                const SevIcon = sev.icon;
                return (
                  <div
                    key={alert.id}
                    className="flex items-center"
                    style={{
                      padding: '12px 16px',
                      gap: 12,
                      backgroundColor: 'var(--bg-primary)',
                      borderBottom: i < recentAlerts.length - 1 ? '1px solid var(--border-default)' : undefined,
                    }}
                  >
                    <SevIcon size={14} style={{ color: sev.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                        {alert.message}
                      </div>
                    </div>
                    <span className="flex items-center" style={{ gap: 4, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                      <Clock size={11} />
                      {new Date(alert.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h3
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: '0 0 12px',
            }}
          >
            Quick Actions
          </h3>
          <div className="flex" style={{ gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Run Speed Audit', icon: Zap, path: '/speed' },
              { label: 'Run SEO Audit', icon: Search, path: '/seo' },
              { label: 'Run AEO Audit', icon: Bot, path: '/aeo' },
            ].map((action) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="flex items-center border-none cursor-pointer"
                  style={{
                    height: 36,
                    padding: '0 14px',
                    gap: 8,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    fontFamily: 'var(--font-sans)',
                    transition: 'border-color var(--duration-fast), color var(--duration-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-strong)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <ActionIcon size={14} />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
