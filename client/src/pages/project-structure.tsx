import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Brain, Loader2, ArrowLeft, ArrowRight, Layers,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { useProjects } from '@/hooks/use-projects';
import { useAiSuggest } from '@/hooks/use-figma';
import { useWorkflow } from '@/hooks/use-workflow';
import { StructureTree } from '@/components/modules/figma/structure-tree';
import { WebflowPreview } from '@/components/modules/figma/webflow-preview';
import { AuditPanel } from '@/components/modules/figma/audit-panel';
import { toast } from 'sonner';
import type { ParsedNode } from '@/types/figma';

export default function ProjectStructurePage() {
  usePageTitle('Structure');
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: projects } = useProjects();
  const project = projects?.find((p) => p.id === projectId) ?? null;

  const { analysis, aiSuggestions, updateStructure, setAiSuggestions } = useWorkflow();
  const aiSuggestMutation = useAiSuggest();

  const [aiEnabled, setAiEnabled] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  const handleAiSuggest = useCallback(() => {
    if (!analysis) return;
    aiSuggestMutation.mutate(analysis.id, {
      onSuccess: (result) => {
        setAiSuggestions(result as Record<string, { suggestedClass?: string; notes?: string }>);
        toast.success('AI suggestions loaded');
      },
      onError: () => toast.error('Failed to load AI suggestions'),
    });
  }, [analysis, aiSuggestMutation, setAiSuggestions]);

  const handleClassChange = useCallback(
    (nodeId: string, newClass: string) => {
      updateStructure((node) => {
        const update = (n: ParsedNode): ParsedNode => {
          if (n.id === nodeId) return { ...n, suggestedClass: newClass };
          return { ...n, children: n.children.map(update) };
        };
        return update(node);
      });
    },
    [updateStructure],
  );

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  // Redirect to import if no analysis
  if (!analysis) {
    return (
      <div>
        <PageHeader title="Structure" description="No analysis loaded." />
        <div
          className="flex flex-col items-center justify-center"
          style={{ padding: 48, gap: 12, color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}
        >
          <span>Import a Figma file first to edit structure.</span>
          <Link
            to={`/project/${projectId}/figma`}
            className="flex items-center"
            style={{
              height: 32,
              padding: '0 14px',
              gap: 6,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent)',
              color: '#fff',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              textDecoration: 'none',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <ArrowLeft size={13} />
            Go to Import
          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div>
        <PageHeader title="Structure" description="Project not found." />
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)' }}>
          <Link to="/" style={{ color: 'var(--accent-text)', textDecoration: 'none' }}>Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Structure"
        description={`Step 3 of 5 — ${project.name}`}
        actions={
          <div className="flex items-center" style={{ gap: 8 }}>
            {/* AI Assist toggle */}
            <button
              onClick={() => {
                setAiEnabled(!aiEnabled);
                if (!aiEnabled && !aiSuggestions) handleAiSuggest();
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
                fontFamily: 'var(--font-sans)',
              }}
            >
              {aiSuggestMutation.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Brain size={13} />
              )}
              AI Assist
            </button>

            {/* Preview toggle */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center cursor-pointer"
              style={{
                height: 32,
                padding: '0 10px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${showPreview ? 'var(--accent)' : 'var(--border-default)'}`,
                backgroundColor: showPreview ? 'var(--accent-subtle)' : 'transparent',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                color: showPreview ? 'var(--accent-text)' : 'var(--text-secondary)',
                gap: 6,
                fontFamily: 'var(--font-sans)',
              }}
            >
              <Layers size={13} />
              Preview
            </button>

            {/* Skip to Review */}
            <Link
              to={`/project/${projectId}/review`}
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-sans)',
                textDecoration: 'none',
                transition: 'color var(--duration-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
            >
              Skip to Review
            </Link>

            {/* Continue to Style */}
            <button
              onClick={() => navigate(`/project/${projectId}/style`)}
              className="flex items-center cursor-pointer border-none"
              style={{
                height: 32,
                padding: '0 14px',
                gap: 6,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
                transition: 'background-color var(--duration-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
            >
              Continue to Style
              <ArrowRight size={13} />
            </button>
          </div>
        }
      />

      <div
        className="flex"
        style={{
          padding: '0 24px 24px',
          gap: 12,
          height: 'calc(100vh - 140px)',
          width: '100%',
        }}
      >
        {/* Left: Structure tree */}
        <div className="flex flex-col" style={{ flex: '1 1 0', minWidth: 0 }}>
          <StructureTree
            structure={analysis.structure}
            aiSuggestions={aiEnabled ? (aiSuggestions ?? undefined) : undefined}
            onClassChange={handleClassChange}
            selectedNodeId={selectedNodeId}
            onNodeSelect={handleNodeSelect}
            title={`Figma — ${analysis.pageName ?? 'Page'}`}
          />
        </div>

        {/* Right: Webflow preview */}
        {showPreview && (
          <div className="flex flex-col" style={{ flex: '1 1 0', minWidth: 0 }}>
            <WebflowPreview structure={analysis.structure} title="Webflow Preview" />
          </div>
        )}
      </div>

      {/* Audit panel */}
      <div style={{ padding: '0 24px 24px' }}>
        <AuditPanel issues={analysis.audit} />
      </div>
    </>
  );
}
