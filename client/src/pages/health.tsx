import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  CheckCircle2, Zap, Search, Bot, Globe, Clock,
  ChevronDown, Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { useProjects } from '@/hooks/use-projects';
import { useHealthOverview, useProjectTrends } from '@/hooks/use-health-dashboard';

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

function getScoreStatus(score: number | null): 'good' | 'warning' | 'critical' {
  if (score === null) return 'good';
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

function computeTrend(
  points: Array<{ score: number }>,
): { trend: 'up' | 'down' | 'neutral'; trendValue: string } {
  if (points.length < 2) return { trend: 'neutral', trendValue: '' };
  const last = points[points.length - 1].score;
  const prev = points[points.length - 2].score;
  const diff = last - prev;
  if (Math.abs(diff) < 1) return { trend: 'neutral', trendValue: 'No change' };
  const sign = diff > 0 ? '+' : '';
  return {
    trend: diff > 0 ? 'up' : 'down',
    trendValue: `${sign}${Math.round(diff)} from last audit`,
  };
}

/** Sparkline SVG for trend data — renders inline in a metric card. */
function Sparkline({
  data,
  color,
  width = 100,
  height = 32,
}: {
  data: Array<{ score: number }>;
  color: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;

  const pad = 2;
  const scores = data.slice(-10).map((d) => d.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;

  const points = scores.map((s, i) => {
    const x = pad + (i / (scores.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (s - min) / range) * (height - pad * 2);
    return { x, y };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Gradient fill beneath the line
  const fillD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={`spark-fill-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={fillD}
        fill={`url(#spark-fill-${color.replace(/[^a-z0-9]/gi, '')})`}
      />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dot on last point */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2.5}
        fill={color}
      />
    </svg>
  );
}

interface MetricCardData {
  label: string;
  value: number | string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  status: 'good' | 'warning' | 'critical';
  icon: typeof Zap;
  sparklineData: Array<{ score: number }>;
  sparklineColor: string;
}

export default function HealthPage() {
  usePageTitle('Site Health');
  const navigate = useNavigate();
  const { data: projects } = useProjects();
  const { data: overview, isLoading, error } = useHealthOverview();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { data: trends } = useProjectTrends(selectedProjectId);

  const projectCount = overview?.projectCount ?? projects?.length ?? 0;

  const metrics: MetricCardData[] = useMemo(() => {
    const speedScore = overview?.speed?.score ?? null;
    const seoScore = overview?.seo?.score ?? null;
    const aeoScore = overview?.aeo?.score ?? null;

    const speedTrend = trends?.speed ? computeTrend(trends.speed) : { trend: 'neutral' as const, trendValue: speedScore !== null ? '' : 'Run audit to measure' };
    const seoTrend = trends?.seo ? computeTrend(trends.seo) : { trend: 'neutral' as const, trendValue: seoScore !== null ? '' : 'Run audit to measure' };
    const aeoTrend = trends?.aeo ? computeTrend(trends.aeo) : { trend: 'neutral' as const, trendValue: aeoScore !== null ? '' : 'Run audit to measure' };

    return [
      {
        label: 'Speed Score',
        value: speedScore !== null ? Math.round(speedScore) : '\u2014',
        ...speedTrend,
        status: getScoreStatus(speedScore),
        icon: Zap,
        sparklineData: trends?.speed ?? [],
        sparklineColor: getStatusColor(getScoreStatus(speedScore)),
      },
      {
        label: 'SEO Score',
        value: seoScore !== null ? Math.round(seoScore) : '\u2014',
        ...seoTrend,
        status: getScoreStatus(seoScore),
        icon: Search,
        sparklineData: trends?.seo ?? [],
        sparklineColor: getStatusColor(getScoreStatus(seoScore)),
      },
      {
        label: 'AEO Score',
        value: aeoScore !== null ? Math.round(aeoScore) : '\u2014',
        ...aeoTrend,
        status: getScoreStatus(aeoScore),
        icon: Bot,
        sparklineData: trends?.aeo ?? [],
        sparklineColor: getStatusColor(getScoreStatus(aeoScore)),
      },
      {
        label: 'Active Projects',
        value: projectCount,
        trend: 'neutral',
        trendValue: '',
        status: 'good',
        icon: Globe,
        sparklineData: [],
        sparklineColor: 'var(--accent)',
      },
    ];
  }, [overview, trends, projectCount]);

  const recentAlerts = overview?.recentAlerts ?? [];

  return (
    <>
      <PageHeader
        title="Site Health"
        description="Overview of your projects' performance and health."
      />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
        {/* Project selector for trends */}
        {projects && projects.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <select
                value={selectedProjectId ?? ''}
                onChange={(e) => setSelectedProjectId(e.target.value || null)}
                style={{
                  appearance: 'none',
                  height: 36,
                  padding: '0 32px 0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                }}
              >
                <option value="">All projects (overview)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown
                size={14}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div style={{ animation: 'fadeIn 200ms ease-out' }}>
            {/* Score card skeletons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    border: '1px solid var(--border-default)',
                    borderRadius: 8,
                    padding: 16,
                    backgroundColor: 'var(--bg-primary)',
                  }}
                >
                  <div style={{ width: 80, height: 12, borderRadius: 4, backgroundColor: 'var(--surface-hover)', animation: 'skeletonPulse 1.5s ease-in-out infinite', marginBottom: 12 }} />
                  <div style={{ width: 48, height: 28, borderRadius: 6, backgroundColor: 'var(--surface-hover)', animation: 'skeletonPulse 1.5s ease-in-out infinite', animationDelay: '0.1s', marginBottom: 8 }} />
                  <div style={{ width: 100, height: 12, borderRadius: 4, backgroundColor: 'var(--surface-hover)', animation: 'skeletonPulse 1.5s ease-in-out infinite', animationDelay: '0.2s' }} />
                </div>
              ))}
            </div>
            {/* Chart skeleton */}
            <div style={{ border: '1px solid var(--border-default)', borderRadius: 8, padding: 16, backgroundColor: 'var(--bg-primary)', marginBottom: 24 }}>
              <div style={{ width: 120, height: 14, borderRadius: 4, backgroundColor: 'var(--surface-hover)', animation: 'skeletonPulse 1.5s ease-in-out infinite', marginBottom: 16 }} />
              <div style={{ width: '100%', height: 180, borderRadius: 6, backgroundColor: 'var(--surface-hover)', animation: 'skeletonPulse 1.5s ease-in-out infinite', animationDelay: '0.15s' }} />
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--error)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px 20px',
              textAlign: 'center',
              marginBottom: 32,
            }}
          >
            <AlertTriangle size={24} style={{ color: 'var(--error)', marginBottom: 8 }} />
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
              Failed to load health dashboard. Check your connection and try again.
            </p>
          </div>
        )}

        {/* Metric cards */}
        {!isLoading && (
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

                  <div className="flex items-end justify-between" style={{ gap: 12 }}>
                    <div>
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

                    {metric.sparklineData.length >= 2 && (
                      <Sparkline
                        data={metric.sparklineData}
                        color={metric.sparklineColor}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent alerts section */}
        {!isLoading && (
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
                        {alert.project && (
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                            {alert.project.name}
                          </div>
                        )}
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
        )}

        {/* Quick actions */}
        {!isLoading && (
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
        )}
      </div>
    </>
  );
}
