import { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { AuditHeader } from '@/components/modules/audit/audit-header';
import { ScoreCard } from '@/components/modules/audit/score-card';
import { CategoryTabs } from '@/components/modules/audit/category-tabs';
import { FindingRow } from '@/components/modules/audit/finding-row';
import { ScoreHistoryChart } from '@/components/modules/audit/score-history-chart';
import { useAudits, useRunSeoAudit, useAuditHistory } from '@/hooks/use-audits';
import type { SeoResults, AuditFinding } from '@/types/audit';
import { SEO_CATEGORIES, SEO_CATEGORY_LABELS } from '@/types/audit';

export default function SeoPage() {
  usePageTitle('SEO Audit');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showHistory, setShowHistory] = useState(false);

  const { data: audits } = useAudits(projectId, 'SEO');
  const { data: history } = useAuditHistory(projectId, 'SEO');
  const runAudit = useRunSeoAudit();

  const latestAudit = useMemo(() => (audits && audits.length > 0 ? audits[0] : null), [audits]);
  const previousAudit = useMemo(() => (audits && audits.length > 1 ? audits[1] : null), [audits]);

  const results = useMemo<SeoResults | null>(() => {
    if (!latestAudit) return null;
    return latestAudit.results as SeoResults;
  }, [latestAudit]);

  const filteredFindings = useMemo<AuditFinding[]>(() => {
    if (!results) return [];
    if (activeCategory === 'all') return results.findings;
    return results.findings.filter((f) => f.category === activeCategory);
  }, [results, activeCategory]);

  const categoryCounts = useMemo<Record<string, number>>(() => {
    if (!results) return {};
    const counts: Record<string, number> = {};
    for (const f of results.findings) {
      if (f.severity !== 'success') {
        counts[f.category] = (counts[f.category] ?? 0) + 1;
      }
    }
    return counts;
  }, [results]);

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
        title="SEO Audit"
        description="Review and fix SEO issues across your Webflow site."
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 40px' }}>
        <AuditHeader
          projectId={projectId}
          onProjectChange={setProjectId}
          onRunAudit={handleRunAudit}
          isRunning={runAudit.isPending}
          lastAuditedAt={latestAudit?.createdAt}
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
            Select a project to run SEO audits.
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
            Enter a URL and run your first SEO audit.
          </div>
        )}

        {results && (
          <div className="flex flex-col" style={{ gap: 20 }}>
            {/* Score card */}
            <div className="flex" style={{ gap: 12, maxWidth: 240 }}>
              <ScoreCard
                label="SEO Score"
                score={latestAudit!.score}
                previousScore={previousAudit?.score}
              />
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
                categories={SEO_CATEGORIES}
                labels={SEO_CATEGORY_LABELS}
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
