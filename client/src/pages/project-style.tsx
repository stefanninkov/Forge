import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, PanelLeftClose, PanelLeft,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { useProjects } from '@/hooks/use-projects';
import { useWorkflow } from '@/hooks/use-workflow';
import { StructureTree } from '@/components/modules/figma/structure-tree';
import { WebflowPreview } from '@/components/modules/figma/webflow-preview';
import { FigmaEditorPanel } from '@/components/modules/figma/figma-editor-panel';
import type { NodeAnimationState } from '@/components/modules/figma/figma-editor-panel';
import {
  generateAttributes,
  attributesToString,
} from '@/components/shared/editors';
import type { CSSStyles, AnimationConfig, AnimationEngine, AnimationTrigger, AnimationPreset } from '@/components/shared/editors';
import { createUndoRedoStore, useUndoRedo } from '@/hooks/use-undo-redo';
import { toast } from 'sonner';
import type { ParsedNode } from '@/types/figma';

type EditorTab = 'styles' | 'animation' | 'semantic';

interface StyleSnapshot {
  nodeStyleOverrides: Record<string, CSSStyles>;
  nodeAnimations: Record<string, NodeAnimationState>;
}

const editorUndoStore = createUndoRedoStore<StyleSnapshot>(50);

const DEFAULT_ANIM_CONFIG: AnimationConfig = {
  duration: 0.6,
  delay: 0,
  ease: 'ease-out',
  opacity: 0,
  translateY: 30,
};

function findNodeById(node: ParsedNode, id: string): ParsedNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

function extractStyles(node: ParsedNode): CSSStyles {
  const raw = (node.properties._styles as Record<string, string>) ?? {};
  return { ...raw };
}

export default function ProjectStylePage() {
  usePageTitle('Style & Animate');
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: projects } = useProjects();
  const project = projects?.find((p) => p.id === projectId) ?? null;

  const {
    analysis, updateStructure,
    nodeStyleOverrides, nodeAnimations,
    setNodeStyleOverrides, setNodeAnimations,
    updateNodeStyle, updateNodeAnimation, removeNodeAnimation,
  } = useWorkflow();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editorTab, setEditorTab] = useState<EditorTab>('styles');
  const [showPreview, setShowPreview] = useState(true);

  const undoRedo = useUndoRedo(editorUndoStore);

  const pushUndoSnapshot = useCallback(
    (label: string) => {
      editorUndoStore.getState().pushState(
        { nodeStyleOverrides, nodeAnimations },
        label,
      );
    },
    [nodeStyleOverrides, nodeAnimations],
  );

  const handleUndo = useCallback(() => {
    undoRedo.undo();
    const state = editorUndoStore.getState();
    if (state.present) {
      setNodeStyleOverrides(state.present.state.nodeStyleOverrides);
      setNodeAnimations(state.present.state.nodeAnimations);
    }
  }, [undoRedo, setNodeStyleOverrides, setNodeAnimations]);

  const handleRedo = useCallback(() => {
    undoRedo.redo();
    const state = editorUndoStore.getState();
    if (state.present) {
      setNodeStyleOverrides(state.present.state.nodeStyleOverrides);
      setNodeAnimations(state.present.state.nodeAnimations);
    }
  }, [undoRedo, setNodeStyleOverrides, setNodeAnimations]);

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

  const handleStyleChange = useCallback(
    (property: string, value: string) => {
      if (!selectedNodeId || !analysis) return;
      pushUndoSnapshot(`Style: ${property}`);
      updateNodeStyle(selectedNodeId, property, value);
      updateStructure((node) => {
        const update = (n: ParsedNode): ParsedNode => {
          if (n.id === selectedNodeId) {
            const existingStyles = (n.properties._styles as Record<string, string>) ?? {};
            return { ...n, properties: { ...n.properties, _styles: { ...existingStyles, [property]: value } } };
          }
          return { ...n, children: n.children.map(update) };
        };
        return update(node);
      });
    },
    [selectedNodeId, analysis, pushUndoSnapshot, updateNodeStyle, updateStructure],
  );

  const handleAnimConfigChange = useCallback(
    (config: AnimationConfig) => {
      if (!selectedNodeId) return;
      pushUndoSnapshot('Animation config');
      updateNodeAnimation(selectedNodeId, {
        ...(nodeAnimations[selectedNodeId] ?? { engine: 'css' as AnimationEngine, trigger: 'scroll' as AnimationTrigger }),
        config,
      });
    },
    [selectedNodeId, pushUndoSnapshot, updateNodeAnimation, nodeAnimations],
  );

  const handleAnimEngineChange = useCallback(
    (engine: AnimationEngine) => {
      if (!selectedNodeId) return;
      pushUndoSnapshot('Animation engine');
      updateNodeAnimation(selectedNodeId, {
        ...(nodeAnimations[selectedNodeId] ?? { config: DEFAULT_ANIM_CONFIG, trigger: 'scroll' as AnimationTrigger }),
        engine,
      });
    },
    [selectedNodeId, pushUndoSnapshot, updateNodeAnimation, nodeAnimations],
  );

  const handleAnimTriggerChange = useCallback(
    (trigger: AnimationTrigger) => {
      if (!selectedNodeId) return;
      pushUndoSnapshot('Animation trigger');
      updateNodeAnimation(selectedNodeId, {
        ...(nodeAnimations[selectedNodeId] ?? { config: DEFAULT_ANIM_CONFIG, engine: 'css' as AnimationEngine }),
        trigger,
      });
    },
    [selectedNodeId, pushUndoSnapshot, updateNodeAnimation, nodeAnimations],
  );

  const handleApplyPreset = useCallback(
    (preset: AnimationPreset) => {
      if (!selectedNodeId) return;
      pushUndoSnapshot(`Apply preset: ${preset.name}`);
      updateNodeAnimation(selectedNodeId, {
        config: { ...preset.defaults },
        engine: preset.engine,
        trigger: preset.trigger,
        presetId: preset.id,
      });
      setEditorTab('animation');
      toast.success(`Applied "${preset.name}" animation`);
    },
    [selectedNodeId, pushUndoSnapshot, updateNodeAnimation],
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

  const handleRemoveAnimation = useCallback(() => {
    if (!selectedNodeId) return;
    removeNodeAnimation(selectedNodeId);
  }, [selectedNodeId, removeNodeAnimation]);

  // Redirect if no analysis
  if (!analysis) {
    return (
      <div>
        <PageHeader title="Style & Animate" description="No analysis loaded." />
        <div className="flex flex-col items-center justify-center" style={{ padding: 48, gap: 12, color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
          <span>Import a Figma file first.</span>
          <Link to={`/project/${projectId}/figma`} className="flex items-center" style={{ height: 32, padding: '0 14px', gap: 6, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--accent)', color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-sans)' }}>
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
        <PageHeader title="Style & Animate" description="Project not found." />
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)' }}>
          <Link to="/" style={{ color: 'var(--accent-text)', textDecoration: 'none' }}>Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Style & Animate"
        description={`Step 4 of 5 — ${project.name}`}
        actions={
          <div className="flex items-center" style={{ gap: 8 }}>
            <Link
              to={`/project/${projectId}/structure`}
              className="flex items-center"
              style={{
                height: 32, padding: '0 10px', gap: 6,
                borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)',
                backgroundColor: 'transparent', color: 'var(--text-secondary)',
                fontSize: 'var(--text-xs)', fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-sans)',
              }}
            >
              <ArrowLeft size={13} />
              Structure
            </Link>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center cursor-pointer"
              style={{
                height: 32, padding: '0 10px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${showPreview ? 'var(--accent)' : 'var(--border-default)'}`,
                backgroundColor: showPreview ? 'var(--accent-subtle)' : 'transparent',
                fontSize: 'var(--text-xs)', fontWeight: 500,
                color: showPreview ? 'var(--accent-text)' : 'var(--text-secondary)',
                gap: 6, fontFamily: 'var(--font-sans)',
              }}
            >
              {showPreview ? <PanelLeftClose size={13} /> : <PanelLeft size={13} />}
              Preview
            </button>

            <button
              onClick={() => navigate(`/project/${projectId}/review`)}
              className="flex items-center cursor-pointer border-none"
              style={{
                height: 32, padding: '0 14px', gap: 6,
                borderRadius: 'var(--radius-md)', backgroundColor: 'var(--accent)',
                color: '#fff', fontSize: 'var(--text-xs)', fontWeight: 500,
                fontFamily: 'var(--font-sans)', transition: 'background-color var(--duration-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
            >
              Continue to Review
              <ArrowRight size={13} />
            </button>
          </div>
        }
      />

      <div
        className="flex"
        style={{
          padding: '0 24px 24px',
          gap: 0,
          height: 'calc(100vh - 100px)',
          width: '100%',
        }}
      >
        {/* Left: Structure tree */}
        <div className="flex flex-col" style={{ flex: '1 1 0', minWidth: 0 }}>
          <StructureTree
            structure={analysis.structure}
            onClassChange={handleClassChange}
            selectedNodeId={selectedNodeId}
            onNodeSelect={handleNodeSelect}
            title={`Structure — ${analysis.pageName ?? 'Page'}`}
          />
        </div>

        {/* Center: Preview */}
        {showPreview && (
          <div className="flex flex-col" style={{ flex: '1 1 0', minWidth: 0, marginLeft: 12 }}>
            <WebflowPreview structure={analysis.structure} title="Live Preview" />
          </div>
        )}

        {/* Right: Editor panel */}
        {selectedNode && selectedNodeId && (
          <FigmaEditorPanel
            selectedNode={selectedNode}
            selectedNodeId={selectedNodeId}
            selectedNodeStyles={selectedNodeStyles}
            selectedNodeAnim={selectedNodeAnim}
            editorTab={editorTab}
            analysis={analysis}
            canUndo={undoRedo.canUndo}
            canRedo={undoRedo.canRedo}
            onEditorTabChange={setEditorTab}
            onClose={() => setSelectedNodeId(null)}
            onStyleChange={handleStyleChange}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onAnimConfigChange={handleAnimConfigChange}
            onAnimEngineChange={handleAnimEngineChange}
            onAnimTriggerChange={handleAnimTriggerChange}
            onApplyPreset={handleApplyPreset}
            onCopyAnimAttrs={handleCopyAnimAttrs}
            onRemoveAnimation={handleRemoveAnimation}
          />
        )}
      </div>
    </>
  );
}
