import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, ArrowRight, GitCompare } from 'lucide-react';
import { AuditComparison } from '@/components/modules/audit/audit-comparison';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { AuditHeader } from '@/components/modules/audit/audit-header';
import { ScoreCard } from '@/components/modules/audit/score-card';
import { CategoryTabs } from '@/components/modules/audit/category-tabs';
import { FindingRow } from '@/components/modules/audit/finding-row';
import { ScoreHistoryChart } from '@/components/modules/audit/score-history-chart';
import { ImageChecklist } from '@/components/modules/audit/image-checklist';
import { AiRecommendationsPanel } from '@/components/modules/audit/ai-recommendations';
import { AuditSchedulePanel } from '@/components/modules/audit/audit-schedule-panel';
import { CodeReviewPanel } from '@/components/modules/audit/code-review-panel';
import { useAudits, useRunSpeedAudit, useAuditHistory } from '@/hooks/use-audits';
import type { SpeedResults, AuditFinding } from '@/types/audit';
import { SPEED_CATEGORIES, SPEED_CATEGORY_LABELS } from '@/types/audit';

export default function SpeedPage() {
  usePageTitle('Page Speed');
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<'mobile' | 'desktop'>('mobile');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showHistory, setShowHistory] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const { data: audits } = useAudits(projectId, 'SPEED');
  const { data: history } = useAuditHistory(projectId, 'SPEED');
  const runAudit = useRunSpeedAudit();

  const latestAudit = useMemo(() => (audits && audits.length > 0 ? audits[0] : null), [audits]);
  const previousAudit = useMemo(() => (audits && audits.length > 1 ? audits[1] : null), [audits]);

  const results = useMemo<SpeedResults | null>(() => {
    if (!latestAudit) return null;
    return latestAudit.results as SpeedResults;
  }, [latestAudit]);

  const activeResults = results?.[strategy] ?? null;
  const previousResults = previousAudit ? (previousAudit.results as SpeedResults)?.[strategy] : null;

  const filteredFindings = useMemo<AuditFinding[]>(() => {
    if (!activeResults) return [];
    if (activeCategory === 'all') return activeResults.findings;
    return activeResults.findings.filter((f) => f.category === activeCategory);
  }, [activeResults, activeCategory]);

  const categoryCounts = useMemo<Record<string, number>>(() => {
    if (!activeResults) return {};
    const counts: Record<string, number> = {};
    for (const f of activeResults.findings) {
      if (f.severity !== 'success') {
        counts[f.category] = (counts[f.category] ?? 0) + 1;
      }
    }
    return counts;
  }, [activeResults]);

  const hasScriptFindings = useMemo(() => {
    if (!activeResults) return false;
    return activeResults.findings.some(
      (f) => f.category === 'scripts' && f.severity !== 'success',
    );
  }, [activeResults]);

  const handleRunAudit = useCallback(
    (url: string) => {
      if (projectId) {
        runAudit.mutate({ projectId, url });
      }
    },
    [projectId, runAudit],
  );

  return (
    <>
      <PageHeader
        title="Page Speed"
        description="Analyze performance with Google PageSpeed Insights."
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 40px' }}>
        <AuditHeader
          projectId={projectId}
          onProjectChange={setProjectId}
          onRunAudit={handleRunAudit}
          isRunning={runAudit.isPending}
          lastAuditedAt={latestAudit?.createdAt}
          findings={activeResults?.findings}
          auditType="speed"
        />

        {runAudit.isError && (
          <div
            style={{
              padding: '10px 12px',
              marginBottom: 16,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              fontSize: 'var(--text-sm)',
              color: '#ef4444',
            }}
          >
            {(runAudit.error as Error)?.message ?? 'Audit failed. Check the URL and try again.'}
          </div>
        )}

        {!projectId && (
          <div
            className="flex items-center justify-center"
            style={{
              height: 300,
              border: '1px dashed var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text-tertiary)',
              fontSize: 'var(--text-sm)',
            }}
          >
            Select a project to run speed audits.
          </div>
        )}

        {projectId && !latestAudit && !runAudit.isPending && (
          <div
            className="flex items-center justify-center"
            style={{
              height: 300,
              border: '1px dashed var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text-tertiary)',
              fontSize: 'var(--text-sm)',
            }}
          >
            Enter a URL and run your first speed audit.
          </div>
        )}

        {activeResults && (
          <div className="flex flex-col" style={{ gap: 20 }}>
            {/* Strategy toggle */}
            <div className="flex items-center" style={{ gap: 2 }}>
              {(['mobile', 'desktop'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStrategy(s)}
                  className="border-none cursor-pointer"
                  style={{
                    padding: '6px 14px',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 500,
                    fontFamily: 'var(--font-sans)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: strategy === s ? 'var(--accent-subtle)' : 'transparent',
                    color: strategy === s ? 'var(--accent-text)' : 'var(--text-tertiary)',
                    transition: 'all 100ms ease',
                    textTransform: 'capitalize',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Score cards */}
            <div className="flex" style={{ gap: 12, flexWrap: 'wrap' }}>
              <ScoreCard
                label="Performance"
                score={activeResults.performanceScore}
                previousScore={previousResults?.performanceScore}
              />
              <ScoreCard
                label="LCP"
                score={activeResults.coreWebVitals.lcp.score * 100}
              />
              <ScoreCard
                label="CLS"
                score={activeResults.coreWebVitals.cls.score * 100}
              />
              <ScoreCard
                label="INP"
                score={activeResults.coreWebVitals.inp.score * 100}
              />
            </div>

            {/* CWV values */}
            <div className="flex items-center" style={{ gap: 16 }}>
              {(['lcp', 'cls', 'inp', 'fcp'] as const).map((metric) => (
                <div
                  key={metric}
                  className="flex items-center"
                  style={{ gap: 6, fontSize: 'var(--text-xs)' }}
                >
                  <span style={{ color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {metric}
                  </span>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {activeResults.coreWebVitals[metric].value}
                  </span>
                </div>
              ))}
            </div>

            {/* Category tabs + findings */}
            <div
              style={{
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}
            >
              <CategoryTabs
                categories={SPEED_CATEGORIES}
                labels={SPEED_CATEGORY_LABELS}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                counts={categoryCounts}
              />
              <div>
                {filteredFindings.length === 0 ? (
                  <div
                    className="flex items-center justify-center"
                    style={{
                      height: 100,
                      color: 'var(--text-tertiary)',
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    No findings in this category.
                  </div>
                ) : (
                  filteredFindings.map((finding, i) => (
                    <FindingRow key={`${finding.title}-${i}`} finding={finding} />
                  ))
                )}
              </div>
            </div>

            {/* Image optimization checklist */}
            <ImageChecklist findings={activeResults.findings} />

            {/* Animation engine link */}
            {hasScriptFindings && (
              <button
                onClick={() => navigate('/animations')}
                className="flex items-center border-none cursor-pointer"
                style={{
                  padding: '10px 14px',
                  gap: 8,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent-subtle)',
                  fontFamily: 'var(--font-sans)',
                  transition: 'background-color var(--duration-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-muted)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-subtle)';
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--accent-text)',
                    fontWeight: 500,
                  }}
                >
                  Some findings relate to JavaScript and animations. Review your animation setup to optimize script loading.
                </span>
                <span
                  className="flex items-center shrink-0"
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--accent-text)',
                    fontWeight: 600,
                    gap: 4,
                  }}
                >
                  View in Animation Engine
                  <ArrowRight size={14} />
                </span>
              </button>
            )}

            {/* Comparison with previous */}
            {previousAudit && latestAudit && (
              <div
                style={{
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  marginBottom: 12,
                }}
              >
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className="flex items-center justify-between w-full border-none bg-transparent cursor-pointer"
                  style={{
                    padding: '10px 12px',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <span
                    className="flex items-center"
                    style={{
                      gap: 6,
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <GitCompare size={14} style={{ color: 'var(--accent-text)' }} />
                    Compare with Previous Run
                  </span>
                  <span style={{ color: 'var(--text-tertiary)' }}>
                    {showComparison ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </button>
                {showComparison && (
                  <div style={{ padding: '0 12px 12px' }}>
                    <AuditComparison previous={previousAudit} current={latestAudit} />
                  </div>
                )}
              </div>
            )}

            {/* AI Recommendations */}
            {latestAudit && (
              <div style={{ marginTop: 24 }}>
                <AiRecommendationsPanel auditId={latestAudit.id} />
              </div>
            )}

            {/* Scheduled Audits */}
            <div style={{ marginTop: 24 }}>
              <AuditSchedulePanel
                projectId={projectId}
                auditType="SPEED"
                defaultUrl={latestAudit?.urlAudited}
              />
            </div>

            {/* Code Review */}
            <div style={{ marginTop: 24 }}>
              <CodeReviewPanel />
            </div>

            {/* Score history */}
            <div
              style={{
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center justify-between w-full border-none bg-transparent cursor-pointer"
                style={{
                  padding: '10px 12px',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  Score History
                </span>
                <span style={{ color: 'var(--text-tertiary)' }}>
                  {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
              </button>
              {showHistory && history && (
                <div style={{ padding: '0 8px 8px' }}>
                  <ScoreHistoryChart data={history} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
