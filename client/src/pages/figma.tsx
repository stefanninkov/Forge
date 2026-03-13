import { useState, useCallback } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { FigmaInputPanel } from '@/components/modules/figma/figma-input-panel';
import { StructureTree } from '@/components/modules/figma/structure-tree';
import { AuditPanel } from '@/components/modules/figma/audit-panel';
import { useAnalyzeFigma, useAiSuggest } from '@/hooks/use-figma';
import { useProjects } from '@/hooks/use-projects';
import { Brain, Loader2 } from 'lucide-react';
import type { FigmaAnalysis } from '@/types/figma';

export default function FigmaPage() {
  const [analysis, setAnalysis] = useState<FigmaAnalysis | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, { suggestedClass?: string; notes?: string }> | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);

  const analyzeMutation = useAnalyzeFigma();
  const aiSuggestMutation = useAiSuggest();
  const { data: projects } = useProjects();

  const activeProject = projects?.[0];

  const handleAnalyze = useCallback(
    (figmaUrl: string, pageName?: string) => {
      if (!activeProject) return;
      setAnalysis(null);
      setAiSuggestions(null);

      analyzeMutation.mutate(
        { projectId: activeProject.id, figmaUrl, pageName },
        {
          onSuccess: (result) => {
            setAnalysis(result);
          },
        },
      );
    },
    [activeProject, analyzeMutation],
  );

  const handleAiSuggest = useCallback(() => {
    if (!analysis) return;
    aiSuggestMutation.mutate(analysis.id, {
      onSuccess: (result) => {
        setAiSuggestions(result as Record<string, { suggestedClass?: string; notes?: string }>);
      },
    });
  }, [analysis, aiSuggestMutation]);

  const handleClassChange = useCallback(
    (nodeId: string, newClass: string) => {
      if (!analysis) return;

      // Update the tree in-place (local state only for now)
      const updateNode = (
        node: FigmaAnalysis['structure'],
      ): FigmaAnalysis['structure'] => {
        if (node.id === nodeId) {
          return { ...node, suggestedClass: newClass };
        }
        return { ...node, children: node.children.map(updateNode) };
      };

      setAnalysis({
        ...analysis,
        structure: updateNode(analysis.structure),
      });
    },
    [analysis],
  );

  const analyzeError = analyzeMutation.isError
    ? (analyzeMutation.error as Error).message
    : null;

  return (
    <>
      <PageHeader
        title="Figma Translator"
        description="Convert Figma designs to Webflow-ready structure."
        actions={
          analysis ? (
            <div className="flex items-center" style={{ gap: 8 }}>
              {/* AI Assist toggle */}
              <button
                onClick={() => {
                  setAiEnabled(!aiEnabled);
                  if (!aiEnabled && !aiSuggestions) {
                    handleAiSuggest();
                  }
                }}
                className="flex items-center cursor-pointer"
                style={{
                  height: 32,
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${aiEnabled ? '#8b5cf6' : 'var(--border-default)'}`,
                  backgroundColor: aiEnabled ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  color: aiEnabled ? '#8b5cf6' : 'var(--text-secondary)',
                  gap: 6,
                }}
              >
                {aiSuggestMutation.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Brain size={13} />
                )}
                AI Assist
              </button>

              {/* Push to Webflow (stub) */}
              <button
                className="flex items-center cursor-pointer"
                style={{
                  height: 32,
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: 'var(--accent)',
                  color: '#ffffff',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  opacity: 0.5,
                }}
                disabled
                title="Coming soon — requires MCP connection"
              >
                Push to Webflow
              </button>
            </div>
          ) : undefined
        }
      />

      <div
        className="flex flex-col"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: 24,
          gap: 16,
          height: 'calc(100vh - 100px)',
        }}
      >
        {/* Input panel */}
        <FigmaInputPanel
          onAnalyze={handleAnalyze}
          isLoading={analyzeMutation.isPending}
          error={analyzeError}
          pages={analysis?.pages}
        />

        {/* Results */}
        {analysis && (
          <>
            {/* Structure tree */}
            <div
              className="flex"
              style={{ gap: 16, flex: 1, minHeight: 0 }}
            >
              <StructureTree
                structure={analysis.structure}
                aiSuggestions={aiEnabled ? (aiSuggestions ?? undefined) : undefined}
                onClassChange={handleClassChange}
                title={`Figma — ${analysis.pageName ?? 'Page'}`}
              />
            </div>

            {/* Audit panel */}
            <AuditPanel issues={analysis.audit} />
          </>
        )}

        {/* Empty state */}
        {!analysis && !analyzeMutation.isPending && (
          <div
            className="flex flex-col items-center justify-center flex-1"
            style={{
              color: 'var(--text-tertiary)',
              fontSize: 'var(--text-sm)',
              gap: 8,
            }}
          >
            <span>Paste a Figma file URL above to get started.</span>
            {!activeProject && (
              <span style={{ fontSize: 'var(--text-xs)' }}>
                Create a project first from the Dashboard.
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
}
