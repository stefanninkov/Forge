import { useState, useCallback } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { FigmaInputPanel } from '@/components/modules/figma/figma-input-panel';
import { StructureTree } from '@/components/modules/figma/structure-tree';
import { AuditPanel } from '@/components/modules/figma/audit-panel';
import { useAnalyzeFigma, useAiSuggest } from '@/hooks/use-figma';
import { useProjects } from '@/hooks/use-projects';
import {
  Brain, Loader2, ChevronDown, Upload, X, AlertTriangle,
  Check, Layers, FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import type { FigmaAnalysis } from '@/types/figma';
import { useActiveProject } from '@/hooks/use-active-project';
import type { Project } from '@/types/project';

export default function FigmaPage() {
  usePageTitle('Figma Translator');
  const [analysis, setAnalysis] = useState<FigmaAnalysis | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, { suggestedClass?: string; notes?: string }> | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [pushDialogOpen, setPushDialogOpen] = useState(false);

  const analyzeMutation = useAnalyzeFigma();
  const aiSuggestMutation = useAiSuggest();
  const { data: projects } = useProjects();
  const { activeProjectId, setActiveProjectId } = useActiveProject();

  // Use the global active project from sidebar
  const activeProject = projects?.find((p) => p.id === activeProjectId) ?? projects?.[0] ?? null;

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
          <div className="flex items-center" style={{ gap: 8 }}>
            {/* Project selector */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                className="flex items-center cursor-pointer"
                style={{
                  height: 32,
                  padding: '0 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-primary)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  gap: 6,
                  fontFamily: 'var(--font-sans)',
                  minWidth: 140,
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 120,
                  }}
                >
                  {activeProject ? activeProject.name : 'Select project'}
                </span>
                <ChevronDown size={12} style={{ flexShrink: 0, opacity: 0.5 }} />
              </button>

              {projectDropdownOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    onClick={() => setProjectDropdownOpen(false)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 36,
                      right: 0,
                      width: 220,
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-elevated)',
                      zIndex: 50,
                      overflow: 'hidden',
                      padding: '4px 0',
                      maxHeight: 240,
                      overflowY: 'auto',
                    }}
                  >
                    <div
                      style={{
                        padding: '6px 12px',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        color: 'var(--text-tertiary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Forge Project
                    </div>
                    {projects?.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActiveProjectId(p.id);
                          setProjectDropdownOpen(false);
                        }}
                        className="flex items-center w-full border-none bg-transparent cursor-pointer"
                        style={{
                          height: 32,
                          padding: '0 12px',
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
                        {p.id === activeProject?.id && <Check size={12} />}
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
                      <div
                        style={{
                          padding: '8px 12px',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        No projects. Create one from Dashboard.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {analysis && (
              <>
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

                {/* Push to Webflow */}
                <button
                  onClick={() => setPushDialogOpen(true)}
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
                    gap: 6,
                    fontFamily: 'var(--font-sans)',
                    transition: 'background-color var(--duration-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--accent)';
                  }}
                >
                  <Upload size={13} />
                  Push to Webflow
                </button>
              </>
            )}
          </div>
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
        {/* Active project indicator */}
        {activeProject && (
          <div
            className="flex items-center"
            style={{
              gap: 6,
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
            }}
          >
            <Layers size={12} />
            <span>Project: <strong style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{activeProject.name}</strong></span>
            {activeProject.webflowSiteId && (
              <span
                className="flex items-center"
                style={{
                  gap: 4,
                  marginLeft: 8,
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  color: 'var(--accent)',
                  fontSize: 'var(--text-xs)',
                }}
              >
                <Check size={10} />
                Webflow linked
              </span>
            )}
            {!activeProject.webflowSiteId && (
              <span
                className="flex items-center"
                style={{
                  gap: 4,
                  marginLeft: 8,
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  color: '#f59e0b',
                  fontSize: 'var(--text-xs)',
                }}
              >
                <AlertTriangle size={10} />
                No Webflow site linked
              </span>
            )}
          </div>
        )}

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

      {/* Push to Webflow Dialog */}
      {pushDialogOpen && analysis && activeProject && (
        <PushToWebflowDialog
          analysis={analysis}
          project={activeProject}
          onClose={() => setPushDialogOpen(false)}
        />
      )}
    </>
  );
}

function PushToWebflowDialog({
  analysis,
  project,
  onClose,
}: {
  analysis: FigmaAnalysis;
  project: Project;
  onClose: () => void;
}) {
  const [targetPage, setTargetPage] = useState('new');
  const [newPageName, setNewPageName] = useState(analysis.pageName ?? 'Home');
  const [includeStyles, setIncludeStyles] = useState(true);
  const [includeText, setIncludeText] = useState(true);
  const [includeAnimations, setIncludeAnimations] = useState(false);
  const mcpConnected = false; // Will be replaced with useMCPConnection() hook

  const countNodes = (node: FigmaAnalysis['structure']): number => {
    return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
  };

  const elementCount = analysis ? countNodes(analysis.structure) : 0;

  const handlePush = () => {
    if (!mcpConnected) {
      toast.error('Webflow Designer must be open with MCP connected');
      return;
    }
    // Push logic will use MCP when available
    toast.info('Push to Webflow will be available when MCP is connected');
  };

  return (
    <div
      className="flex items-center justify-center"
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          width: 520,
          maxWidth: '90vw',
          maxHeight: '85vh',
          overflow: 'auto',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Push to Webflow
            </h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
              Review and configure before pushing
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center border-none bg-transparent cursor-pointer"
            style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* MCP Connection Status */}
          {!mcpConnected && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(245, 158, 11, 0.06)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
              }}
            >
              <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
                <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: '#f59e0b' }}>
                  Designer not connected
                </span>
              </div>
              <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  Open your Webflow project in the Designer
                </li>
                <li style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  Ensure the MCP Companion App is running
                </li>
                <li style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  Forge will auto-connect when ready
                </li>
              </ol>
            </div>
          )}

          {/* Push Summary */}
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
              Push Summary
            </label>
            <div
              style={{
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              <SummaryRow label="Forge Project" value={project.name} />
              <SummaryRow label="Elements" value={`${elementCount} elements`} />
              <SummaryRow label="Figma Page" value={analysis.pageName ?? 'Unknown'} />
              <SummaryRow
                label="Webflow Site"
                value={project.webflowSiteId ?? 'Not linked'}
                warning={!project.webflowSiteId}
              />
            </div>
          </div>

          {/* Target Page */}
          <div>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
              Target Webflow Page
            </label>
            <div className="flex" style={{ gap: 8 }}>
              <select
                value={targetPage}
                onChange={(e) => setTargetPage(e.target.value)}
                style={{
                  flex: 1,
                  height: 36,
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                }}
              >
                <option value="new">Create new page</option>
                {/* Existing pages would be loaded from MCP when connected */}
              </select>
            </div>
            {targetPage === 'new' && (
              <input
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value)}
                placeholder="Page name"
                style={{
                  width: '100%',
                  height: 36,
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  fontFamily: 'var(--font-sans)',
                  marginTop: 8,
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>

          {/* Push Options */}
          <div>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
              Include
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ToggleOption
                checked={true}
                disabled
                label="Structure & Classes"
                description="Element hierarchy and Client-First class names"
              />
              <ToggleOption
                checked={includeStyles}
                onChange={setIncludeStyles}
                label="Styles from Figma"
                description="Colors, fonts, spacing extracted from the design"
              />
              <ToggleOption
                checked={includeText}
                onChange={setIncludeText}
                label="Text content"
                description="Headings, paragraphs, and button labels from Figma"
              />
              <ToggleOption
                checked={includeAnimations}
                onChange={setIncludeAnimations}
                label="Animation attributes"
                description="Data attributes for scroll and interaction animations"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between"
          style={{ padding: '12px 20px', borderTop: '1px solid var(--border-default)' }}
        >
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            {mcpConnected ? 'Ready to push' : 'Requires MCP connection'}
          </span>
          <div className="flex" style={{ gap: 8 }}>
            <button
              onClick={onClose}
              className="border-none cursor-pointer"
              style={{
                height: 36,
                padding: '0 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-hover)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handlePush}
              disabled={!mcpConnected}
              className="flex items-center border-none cursor-pointer"
              style={{
                height: 36,
                padding: '0 14px',
                gap: 6,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
                opacity: !mcpConnected ? 0.5 : 1,
              }}
            >
              <Upload size={14} />
              Push to Webflow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border-default)',
        fontSize: 'var(--text-sm)',
      }}
    >
      <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <span style={{ color: warning ? '#f59e0b' : 'var(--text-primary)', fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

function ToggleOption({
  checked,
  onChange,
  disabled,
  label,
  description,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  description: string;
}) {
  return (
    <label
      className="flex items-center cursor-pointer"
      style={{
        gap: 10,
        padding: '6px 8px',
        borderRadius: 'var(--radius-md)',
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
      />
      <div>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
          {label}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          {description}
        </div>
      </div>
    </label>
  );
}
