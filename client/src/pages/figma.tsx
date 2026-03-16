import { useState, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { FigmaInputPanel } from '@/components/modules/figma/figma-input-panel';
import { StructureTree } from '@/components/modules/figma/structure-tree';
import { AuditPanel } from '@/components/modules/figma/audit-panel';
import { WebflowPreview } from '@/components/modules/figma/webflow-preview';
import { useAnalyzeFigma, useAiSuggest } from '@/hooks/use-figma';
import { useProjects } from '@/hooks/use-projects';
import {
  StylePanel,
  AnimationEditor,
  ANIMATION_PRESETS,
  generateAttributes,
  attributesToString,
} from '@/components/shared/editors';
import type { CSSStyles } from '@/components/shared/editors';
import type { AnimationConfig, AnimationEngine, AnimationTrigger, AnimationPreset } from '@/components/shared/editors';
import {
  Brain, Loader2, ChevronDown, Upload, X, AlertTriangle,
  Check, Layers, PanelLeftClose, PanelLeft, Paintbrush, Zap,
  ChevronRight, Code,
} from 'lucide-react';
import { toast } from 'sonner';
import type { FigmaAnalysis, ParsedNode } from '@/types/figma';
import { useActiveProject } from '@/hooks/use-active-project';
import type { Project } from '@/types/project';
import { createUndoRedoStore, useUndoRedo } from '@/hooks/use-undo-redo';
import { ClassNameReview } from '@/components/modules/figma/class-name-review';
import { PrePushReview } from '@/components/modules/figma/pre-push-review';

type EditorTab = 'styles' | 'animation' | 'semantic';

/** Snapshot of the editor state for undo/redo */
interface FigmaEditorSnapshot {
  nodeStyleOverrides: Record<string, CSSStyles>;
  nodeAnimations: Record<string, {
    config: AnimationConfig;
    engine: AnimationEngine;
    trigger: AnimationTrigger;
    presetId?: string;
  }>;
}

// Module-level store instance (created once, persists across renders)
const editorUndoRedoStore = createUndoRedoStore<FigmaEditorSnapshot>(50);

/** Recursively find a node by ID in the analysis tree */
function findNodeById(node: ParsedNode, id: string): ParsedNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

/** Extract CSSStyles from a ParsedNode's properties._styles */
function extractStyles(node: ParsedNode): CSSStyles {
  const raw = (node.properties._styles as Record<string, string>) ?? {};
  return { ...raw };
}

/** Default animation config */
const DEFAULT_ANIM_CONFIG: AnimationConfig = {
  duration: 0.6,
  delay: 0,
  ease: 'ease-out',
  opacity: 0,
  translateY: 30,
};

export default function FigmaPage() {
  usePageTitle('Figma Translator');
  const [analysis, setAnalysis] = useState<FigmaAnalysis | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, { suggestedClass?: string; notes?: string }> | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [pushDialogOpen, setPushDialogOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editorTab, setEditorTab] = useState<EditorTab>('styles');
  // Per-node style overrides (nodeId -> CSSStyles)
  const [nodeStyleOverrides, setNodeStyleOverrides] = useState<Record<string, CSSStyles>>({});

  // Per-node animation configs (nodeId -> { config, engine, trigger, presetId })
  const [nodeAnimations, setNodeAnimations] = useState<Record<string, {
    config: AnimationConfig;
    engine: AnimationEngine;
    trigger: AnimationTrigger;
    presetId?: string;
  }>>({});

  const analyzeMutation = useAnalyzeFigma();
  const aiSuggestMutation = useAiSuggest();
  const { data: projects } = useProjects();
  const { activeProjectId, setActiveProjectId } = useActiveProject();

  // Undo/redo for style and animation edits
  const undoRedo = useUndoRedo(editorUndoRedoStore);

  // Push a snapshot to the undo/redo stack
  const pushUndoSnapshot = useCallback(
    (label: string, overrideStyles?: Record<string, CSSStyles>, overrideAnims?: typeof nodeAnimations) => {
      editorUndoRedoStore.getState().pushState({
        nodeStyleOverrides: overrideStyles ?? nodeStyleOverrides,
        nodeAnimations: overrideAnims ?? nodeAnimations,
      }, label);
    },
    [nodeStyleOverrides, nodeAnimations],
  );

  // Restore state when undo/redo happens
  const handleUndo = useCallback(() => {
    undoRedo.undo();
    const state = editorUndoRedoStore.getState();
    if (state.present) {
      setNodeStyleOverrides(state.present.state.nodeStyleOverrides);
      setNodeAnimations(state.present.state.nodeAnimations);
    }
  }, [undoRedo]);

  const handleRedo = useCallback(() => {
    undoRedo.redo();
    const state = editorUndoRedoStore.getState();
    if (state.present) {
      setNodeStyleOverrides(state.present.state.nodeStyleOverrides);
      setNodeAnimations(state.present.state.nodeAnimations);
    }
  }, [undoRedo]);

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

  // Selected node + its styles
  const selectedNode = useMemo(() => {
    if (!analysis || !selectedNodeId) return null;
    return findNodeById(analysis.structure, selectedNodeId);
  }, [analysis, selectedNodeId]);

  const selectedNodeStyles = useMemo<CSSStyles>(() => {
    if (!selectedNode) return {};
    const base = extractStyles(selectedNode);
    const overrides = selectedNodeId ? nodeStyleOverrides[selectedNodeId] : undefined;
    return overrides ? { ...base, ...overrides } : base;
  }, [selectedNode, selectedNodeId, nodeStyleOverrides]);

  const selectedNodeAnim = selectedNodeId ? nodeAnimations[selectedNodeId] : undefined;

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  const handleStyleChange = useCallback(
    (property: string, value: string) => {
      if (!selectedNodeId || !analysis) return;

      // Push current state to undo stack before change
      pushUndoSnapshot(`Style: ${property}`);

      setNodeStyleOverrides((prev) => ({
        ...prev,
        [selectedNodeId]: {
          ...(prev[selectedNodeId] ?? {}),
          [property]: value,
        },
      }));

      // Also update the analysis structure so the preview reflects changes
      const updateNode = (
        node: ParsedNode,
      ): ParsedNode => {
        if (node.id === selectedNodeId) {
          const existingStyles = (node.properties._styles as Record<string, string>) ?? {};
          return {
            ...node,
            properties: {
              ...node.properties,
              _styles: { ...existingStyles, [property]: value },
            },
          };
        }
        return { ...node, children: node.children.map(updateNode) };
      };

      setAnalysis({
        ...analysis,
        structure: updateNode(analysis.structure),
      });
    },
    [selectedNodeId, analysis, pushUndoSnapshot],
  );

  const handleAnimConfigChange = useCallback(
    (config: AnimationConfig) => {
      if (!selectedNodeId) return;
      pushUndoSnapshot('Animation config');
      setNodeAnimations((prev) => ({
        ...prev,
        [selectedNodeId]: {
          ...(prev[selectedNodeId] ?? { engine: 'css' as AnimationEngine, trigger: 'scroll' as AnimationTrigger }),
          config,
        },
      }));
    },
    [selectedNodeId, pushUndoSnapshot],
  );

  const handleAnimEngineChange = useCallback(
    (engine: AnimationEngine) => {
      if (!selectedNodeId) return;
      pushUndoSnapshot('Animation engine');
      setNodeAnimations((prev) => ({
        ...prev,
        [selectedNodeId]: {
          ...(prev[selectedNodeId] ?? { config: DEFAULT_ANIM_CONFIG, trigger: 'scroll' as AnimationTrigger }),
          engine,
        },
      }));
    },
    [selectedNodeId, pushUndoSnapshot],
  );

  const handleAnimTriggerChange = useCallback(
    (trigger: AnimationTrigger) => {
      if (!selectedNodeId) return;
      pushUndoSnapshot('Animation trigger');
      setNodeAnimations((prev) => ({
        ...prev,
        [selectedNodeId]: {
          ...(prev[selectedNodeId] ?? { config: DEFAULT_ANIM_CONFIG, engine: 'css' as AnimationEngine }),
          trigger,
        },
      }));
    },
    [selectedNodeId, pushUndoSnapshot],
  );

  const handleApplyPreset = useCallback(
    (preset: AnimationPreset) => {
      if (!selectedNodeId) return;
      pushUndoSnapshot(`Apply preset: ${preset.name}`);
      setNodeAnimations((prev) => ({
        ...prev,
        [selectedNodeId]: {
          config: { ...preset.defaults },
          engine: preset.engine,
          trigger: preset.trigger,
          presetId: preset.id,
        },
      }));
      setEditorTab('animation');
      toast.success(`Applied "${preset.name}" animation`);
    },
    [selectedNodeId, pushUndoSnapshot],
  );

  const handleCopyAnimAttrs = useCallback(() => {
    if (!selectedNodeId || !selectedNodeAnim) return;
    const attrs = generateAttributes(
      selectedNodeAnim.config,
      selectedNodeAnim.engine,
      selectedNodeAnim.trigger,
      selectedNodeAnim.presetId,
    );
    navigator.clipboard.writeText(attributesToString(attrs));
    toast.success('Animation attributes copied');
  }, [selectedNodeId, selectedNodeAnim]);

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
                {/* Split view toggle */}
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center cursor-pointer"
                  title={showPreview ? 'Hide preview' : 'Show preview'}
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
                  {showPreview ? <PanelLeftClose size={13} /> : <PanelLeft size={13} />}
                  Preview
                </button>

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
          margin: '0 auto',
          padding: 24,
          gap: 16,
          height: 'calc(100vh - 100px)',
          width: '100%',
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

        {/* Results — split screen with editor panel */}
        {analysis && (
          <>
            <div
              className="flex"
              style={{ gap: 0, flex: 1, minHeight: 0 }}
            >
              {/* Left: Structure tree */}
              <div
                className="flex flex-col"
                style={{
                  flex: '1 1 0',
                  minWidth: 0,
                  transition: 'flex 200ms ease',
                }}
              >
                <StructureTree
                  structure={analysis.structure}
                  aiSuggestions={aiEnabled ? (aiSuggestions ?? undefined) : undefined}
                  onClassChange={handleClassChange}
                  selectedNodeId={selectedNodeId}
                  onNodeSelect={handleNodeSelect}
                  title={`Figma — ${analysis.pageName ?? 'Page'}`}
                />
              </div>

              {/* Center: Webflow preview */}
              {showPreview && (
                <div
                  className="flex flex-col"
                  style={{
                    flex: '1 1 0',
                    minWidth: 0,
                    marginLeft: 12,
                  }}
                >
                  <WebflowPreview
                    structure={analysis.structure}
                    title="Webflow Preview"
                  />
                </div>
              )}

              {/* Right: Editor panel (style + animation) */}
              {selectedNode && (
                <div
                  style={{
                    width: 320,
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    borderLeft: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-primary)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Editor panel header */}
                  <div
                    className="flex items-center justify-between"
                    style={{
                      height: 40,
                      padding: '0 12px',
                      borderBottom: '1px solid var(--border-default)',
                      backgroundColor: 'var(--bg-secondary)',
                      flexShrink: 0,
                    }}
                  >
                    <div className="flex items-center" style={{ gap: 4 }}>
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 500,
                          color: 'var(--text-tertiary)',
                          maxWidth: 80,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {selectedNode.name}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--accent-text)',
                          backgroundColor: 'var(--accent-subtle)',
                          padding: '1px 5px',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        .{selectedNode.suggestedClass}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedNodeId(null)}
                      className="flex items-center justify-center border-none bg-transparent cursor-pointer"
                      style={{ width: 24, height: 24, color: 'var(--text-tertiary)' }}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Tab selector */}
                  <div
                    className="flex"
                    style={{
                      borderBottom: '1px solid var(--border-default)',
                      flexShrink: 0,
                    }}
                  >
                    {([
                      { key: 'styles' as EditorTab, label: 'Styles', icon: Paintbrush },
                      { key: 'animation' as EditorTab, label: 'Animation', icon: Zap },
                      { key: 'semantic' as EditorTab, label: 'HTML', icon: Code },
                    ]).map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setEditorTab(key)}
                        className="flex items-center justify-center cursor-pointer"
                        style={{
                          flex: 1,
                          height: 34,
                          gap: 5,
                          border: 'none',
                          backgroundColor: 'transparent',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 500,
                          fontFamily: 'var(--font-sans)',
                          color: editorTab === key ? 'var(--accent-text)' : 'var(--text-tertiary)',
                          borderBottom: editorTab === key ? '2px solid var(--accent)' : '2px solid transparent',
                          transition: 'color var(--duration-fast)',
                        }}
                      >
                        <Icon size={13} />
                        {label}
                        {key === 'animation' && selectedNodeAnim && (
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              backgroundColor: 'var(--accent)',
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {editorTab === 'styles' && (
                      <StylePanel
                        styles={selectedNodeStyles}
                        onStyleChange={handleStyleChange}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                        canUndo={undoRedo.canUndo}
                        canRedo={undoRedo.canRedo}
                      />
                    )}

                    {editorTab === 'animation' && (
                      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* Preset quick-select */}
                        {!selectedNodeAnim && (
                          <div>
                            <div
                              style={{
                                fontSize: 'var(--text-xs)',
                                fontWeight: 600,
                                color: 'var(--text-tertiary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: 8,
                              }}
                            >
                              Choose a preset
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {ANIMATION_PRESETS.slice(0, 8).map((preset) => (
                                <button
                                  key={preset.id}
                                  onClick={() => handleApplyPreset(preset)}
                                  className="flex items-center cursor-pointer"
                                  style={{
                                    gap: 8,
                                    padding: '6px 8px',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'transparent',
                                    fontSize: 'var(--text-xs)',
                                    fontFamily: 'var(--font-sans)',
                                    color: 'var(--text-primary)',
                                    textAlign: 'left',
                                    transition: 'background-color var(--duration-fast)',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <Zap size={11} style={{ color: '#f59e0b', flexShrink: 0 }} />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 500 }}>{preset.name}</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>
                                      {preset.description}
                                    </div>
                                  </div>
                                  <span
                                    style={{
                                      fontSize: 9,
                                      fontFamily: 'var(--font-mono)',
                                      fontWeight: 600,
                                      color: preset.engine === 'gsap' ? '#f59e0b' : 'var(--accent-text)',
                                      backgroundColor: preset.engine === 'gsap' ? 'rgba(245, 158, 11, 0.1)' : 'var(--accent-subtle)',
                                      padding: '1px 4px',
                                      borderRadius: 'var(--radius-sm)',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {preset.engine.toUpperCase()}
                                  </span>
                                </button>
                              ))}
                              <button
                                onClick={() => {
                                  handleApplyPreset(ANIMATION_PRESETS[0]);
                                }}
                                className="flex items-center justify-center cursor-pointer"
                                style={{
                                  gap: 4,
                                  padding: '6px 8px',
                                  border: '1px dashed var(--border-default)',
                                  borderRadius: 'var(--radius-md)',
                                  backgroundColor: 'transparent',
                                  fontSize: 'var(--text-xs)',
                                  fontFamily: 'var(--font-sans)',
                                  color: 'var(--text-tertiary)',
                                  transition: 'color var(--duration-fast)',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = 'var(--text-secondary)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = 'var(--text-tertiary)';
                                }}
                              >
                                <ChevronRight size={11} />
                                View all presets
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Animation editor (when preset is assigned) */}
                        {selectedNodeAnim && (
                          <>
                            <div className="flex items-center justify-between">
                              <span
                                style={{
                                  fontSize: 'var(--text-xs)',
                                  fontWeight: 600,
                                  color: 'var(--text-tertiary)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                }}
                              >
                                Configuration
                              </span>
                              <button
                                onClick={() => {
                                  if (!selectedNodeId) return;
                                  setNodeAnimations((prev) => {
                                    const next = { ...prev };
                                    delete next[selectedNodeId];
                                    return next;
                                  });
                                }}
                                className="flex items-center cursor-pointer"
                                style={{
                                  gap: 4,
                                  height: 22,
                                  padding: '0 6px',
                                  border: '1px solid var(--border-default)',
                                  borderRadius: 'var(--radius-sm)',
                                  backgroundColor: 'transparent',
                                  fontSize: 10,
                                  color: 'var(--text-tertiary)',
                                  fontFamily: 'var(--font-sans)',
                                }}
                              >
                                <X size={10} />
                                Remove
                              </button>
                            </div>
                            <AnimationEditor
                              config={selectedNodeAnim.config}
                              engine={selectedNodeAnim.engine}
                              trigger={selectedNodeAnim.trigger}
                              preset={selectedNodeAnim.presetId
                                ? ANIMATION_PRESETS.find((p) => p.id === selectedNodeAnim.presetId)
                                : undefined}
                              onChange={handleAnimConfigChange}
                              onEngineChange={handleAnimEngineChange}
                              onTriggerChange={handleAnimTriggerChange}
                              onCopyAttributes={handleCopyAnimAttrs}
                              onApply={() => {
                                toast.success('Animation applied to element');
                              }}
                            />
                          </>
                        )}
                      </div>
                    )}

                    {editorTab === 'semantic' && selectedNode && (
                      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {/* Current tag display */}
                        <div>
                          <div
                            style={{
                              fontSize: 'var(--text-xs)',
                              fontWeight: 600,
                              color: 'var(--text-tertiary)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginBottom: 6,
                            }}
                          >
                            Element Tag
                          </div>
                          <div className="flex items-center" style={{ gap: 8 }}>
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-sm)',
                                fontWeight: 600,
                                color: 'var(--accent-text)',
                                backgroundColor: 'var(--accent-subtle)',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-sm)',
                              }}
                            >
                              &lt;{selectedNode.type === 'section' ? 'section' : selectedNode.type === 'text' ? 'p' : 'div'}&gt;
                            </span>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                              {selectedNode.name}
                            </span>
                          </div>
                        </div>

                        {/* Suggested semantic tag */}
                        <div>
                          <div
                            style={{
                              fontSize: 'var(--text-xs)',
                              fontWeight: 600,
                              color: 'var(--text-tertiary)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginBottom: 6,
                            }}
                          >
                            Suggested Tags
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {[
                              { tag: 'section', hint: 'Thematic grouping of content' },
                              { tag: 'article', hint: 'Self-contained composition' },
                              { tag: 'aside', hint: 'Sidebar or tangential content' },
                              { tag: 'nav', hint: 'Navigation links' },
                              { tag: 'header', hint: 'Introductory content' },
                              { tag: 'footer', hint: 'Footer content' },
                              { tag: 'main', hint: 'Primary page content' },
                            ].map(({ tag, hint }) => (
                              <div
                                key={tag}
                                className="flex items-center justify-between"
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--border-default)',
                                  cursor: 'pointer',
                                  transition: 'background-color var(--duration-fast)',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <span
                                  style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 'var(--text-xs)',
                                    fontWeight: 500,
                                    color: 'var(--text-primary)',
                                  }}
                                >
                                  &lt;{tag}&gt;
                                </span>
                                <span
                                  style={{
                                    fontSize: 10,
                                    color: 'var(--text-tertiary)',
                                  }}
                                >
                                  {hint}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* ARIA attributes */}
                        <div>
                          <div
                            style={{
                              fontSize: 'var(--text-xs)',
                              fontWeight: 600,
                              color: 'var(--text-tertiary)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginBottom: 6,
                            }}
                          >
                            Accessibility
                          </div>
                          <p
                            style={{
                              fontSize: 'var(--text-xs)',
                              color: 'var(--text-secondary)',
                              lineHeight: 'var(--leading-normal)',
                              margin: 0,
                            }}
                          >
                            Use semantic HTML elements to improve screen reader navigation. Add ARIA labels to interactive elements that lack visible text labels.
                          </p>
                        </div>

                        {/* AI Class Name Review */}
                        <ClassNameReview
                          nodes={(() => {
                            const collect = (node: ParsedNode, parentName?: string): Array<{ id: string; name: string; type: string; parentName?: string }> => {
                              const result: Array<{ id: string; name: string; type: string; parentName?: string }> = [
                                { id: node.id, name: node.name, type: node.type, parentName },
                              ];
                              for (const child of node.children) {
                                result.push(...collect(child, node.name));
                              }
                              return result;
                            };
                            return collect(analysis.structure);
                          })()}
                          onApply={(_nodeId, className) => {
                            toast.success(`Applied class: ${className}`);
                          }}
                          onApplyAll={(mappings) => {
                            toast.success(`Applied ${mappings.length} class names`);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
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
  const [showClassReview, setShowClassReview] = useState(false);
  const [showPrePushReview, setShowPrePushReview] = useState(false);
  const [copied, setCopied] = useState(false);

  const countNodes = (node: FigmaAnalysis['structure']): number => {
    return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
  };

  const elementCount = analysis ? countNodes(analysis.structure) : 0;

  const collectClasses = (node: FigmaAnalysis['structure']): Array<{ name: string; tag: string; figmaName: string }> => {
    const result: Array<{ name: string; tag: string; figmaName: string }> = [];
    result.push({ name: node.suggestedClass, tag: node.type, figmaName: node.name });
    for (const child of node.children) {
      result.push(...collectClasses(child));
    }
    return result;
  };

  const classes = collectClasses(analysis.structure);

  function nodeToHtml(node: FigmaAnalysis['structure'], indent = 0): string {
    const pad = '  '.repeat(indent);
    const styles = (node.properties._styles as Record<string, string>) ?? {};
    const text = node.properties.text as string | undefined;
    const styleStr = Object.entries(styles)
      .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`)
      .join('; ');

    let tag = node.type === 'section' ? 'section' : node.type === 'text' ? 'p' : 'div';
    if (node.type === 'text') {
      const fontSize = node.properties.fontSize as number | undefined;
      if (fontSize && fontSize >= 32) tag = 'h1';
      else if (fontSize && fontSize >= 24) tag = 'h2';
      else if (fontSize && fontSize >= 20) tag = 'h3';
    }

    const attrs = `class="${node.suggestedClass}"${includeStyles && styleStr ? ` style="${styleStr}"` : ''}`;

    if (text && includeText) {
      return `${pad}<${tag} ${attrs}>${text}</${tag}>`;
    }

    if (node.children.length === 0) {
      return `${pad}<${tag} ${attrs}></${tag}>`;
    }

    const childHtml = node.children.map((c) => nodeToHtml(c, indent + 1)).join('\n');
    return `${pad}<${tag} ${attrs}>\n${childHtml}\n${pad}</${tag}>`;
  }

  async function handleCopyHtml() {
    const html = nodeToHtml(analysis.structure);
    await navigator.clipboard.writeText(html);
    setCopied(true);
    toast.success('HTML copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  function generateDesignerScript(node: FigmaAnalysis['structure'], varName = 'root', indent = 0): string {
    const pad = '  '.repeat(indent);
    const lines: string[] = [];
    let tag = node.type === 'section' ? 'section' : node.type === 'text' ? 'p' : 'div';
    if (node.type === 'text') {
      const fontSize = node.properties.fontSize as number | undefined;
      if (fontSize && fontSize >= 32) tag = 'h1';
      else if (fontSize && fontSize >= 24) tag = 'h2';
      else if (fontSize && fontSize >= 20) tag = 'h3';
    }

    lines.push(`${pad}const ${varName} = webflow.elementBuilder('${tag === 'section' ? 'Section' : tag === 'div' ? 'DivBlock' : 'TextBlock'}');`);
    lines.push(`${pad}${varName}.setTag('${tag}');`);
    lines.push(`${pad}${varName}.setAttribute('class', '${node.suggestedClass}');`);

    if (includeStyles) {
      const styles = (node.properties._styles as Record<string, string>) ?? {};
      for (const [k, v] of Object.entries(styles)) {
        lines.push(`${pad}${varName}.setStyles({ '${k.replace(/([A-Z])/g, '-$1').toLowerCase()}': '${v}' });`);
      }
    }

    if (includeText && node.properties.text) {
      lines.push(`${pad}${varName}.setTextContent('${String(node.properties.text).replace(/'/g, "\\'")}');`);
    }

    node.children.forEach((child, i) => {
      const childVar = `${varName}_c${i}`;
      lines.push('');
      lines.push(...generateDesignerScript(child, childVar, indent).split('\n'));
      lines.push(`${pad}${varName}.append(${childVar});`);
    });

    return lines.join('\n');
  }

  async function handleCopyScript() {
    const script = generateDesignerScript(analysis.structure);
    await navigator.clipboard.writeText(script);
    toast.success('Designer API script copied to clipboard');
  }

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

          {/* Class name review */}
          <div>
            <button
              onClick={() => setShowClassReview(!showClassReview)}
              className="flex items-center cursor-pointer"
              style={{
                gap: 6,
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                padding: 0,
                fontFamily: 'var(--font-sans)',
                marginBottom: showClassReview ? 8 : 0,
              }}
            >
              <ChevronDown
                size={14}
                style={{
                  transform: showClassReview ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 150ms',
                }}
              />
              Review class names ({classes.length})
            </button>
            {showClassReview && (
              <div
                style={{
                  maxHeight: 160,
                  overflowY: 'auto',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {classes.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center"
                    style={{
                      padding: '4px 10px',
                      gap: 8,
                      borderBottom: i < classes.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    }}
                  >
                    <span style={{ color: 'var(--text-tertiary)', minWidth: 32 }}>{c.tag}</span>
                    <span style={{ color: 'var(--accent-text)' }}>.{c.name}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-tertiary)', fontSize: 9 }}>{c.figmaName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pre-Push Review */}
        {showPrePushReview && (
          <div style={{ borderTop: '1px solid var(--border-default)' }}>
            <PrePushReview
              nodes={(() => {
                const convert = (node: ParsedNode): { id: string; name: string; type: string; className?: string; htmlTag?: string; children?: Array<{ id: string; name: string; type: string; className?: string; htmlTag?: string; children?: unknown[] }> } => ({
                  id: node.id,
                  name: node.name,
                  type: node.figmaType,
                  className: node.suggestedClass,
                  htmlTag: node.type === 'section' ? 'section' : node.type === 'text' ? 'p' : 'div',
                  children: node.children.map(convert),
                });
                return [convert(analysis.structure)];
              })()}
              nodeStyleOverrides={{}}
              nodeAnimations={{}}
              onPush={() => {
                toast.success('Push initiated (MCP integration required)');
                onClose();
              }}
              onCancel={() => setShowPrePushReview(false)}
            />
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between"
          style={{ padding: '12px 20px', borderTop: '1px solid var(--border-default)' }}
        >
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            {elementCount} elements · {classes.length} classes
          </span>
          <div className="flex" style={{ gap: 8 }}>
            {!showPrePushReview && (
              <button
                onClick={() => setShowPrePushReview(true)}
                className="border-none cursor-pointer"
                style={{
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--accent)',
                  backgroundColor: 'transparent',
                  color: 'var(--accent-text)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Review
              </button>
            )}
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
              onClick={handleCopyHtml}
              className="flex items-center border-none cursor-pointer"
              style={{
                height: 36,
                padding: '0 14px',
                gap: 6,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
              }}
            >
              {copied ? <Check size={14} /> : <Layers size={14} />}
              {copied ? 'Copied' : 'Copy HTML'}
            </button>
            <button
              onClick={handleCopyScript}
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
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
            >
              <Upload size={14} />
              Copy Designer Script
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
