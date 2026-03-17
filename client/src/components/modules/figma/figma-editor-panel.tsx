import { useCallback } from 'react';
import {
  X, Paintbrush, Zap, ChevronRight, Code,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  StylePanel,
  AnimationEditor,
  ANIMATION_PRESETS,
} from '@/components/shared/editors';
import type { CSSStyles, AnimationConfig, AnimationEngine, AnimationTrigger, AnimationPreset } from '@/components/shared/editors';
import type { ParsedNode } from '@/types/figma';
import type { FigmaAnalysis } from '@/types/figma';
import { ClassNameReview } from './class-name-review';

type EditorTab = 'styles' | 'animation' | 'semantic';

export interface NodeAnimationState {
  config: AnimationConfig;
  engine: AnimationEngine;
  trigger: AnimationTrigger;
  presetId?: string;
}

export interface FigmaEditorPanelProps {
  selectedNode: ParsedNode;
  selectedNodeId: string;
  selectedNodeStyles: CSSStyles;
  selectedNodeAnim: NodeAnimationState | undefined;
  editorTab: EditorTab;
  analysis: FigmaAnalysis;
  canUndo: boolean;
  canRedo: boolean;
  onEditorTabChange: (tab: EditorTab) => void;
  onClose: () => void;
  onStyleChange: (property: string, value: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onAnimConfigChange: (config: AnimationConfig) => void;
  onAnimEngineChange: (engine: AnimationEngine) => void;
  onAnimTriggerChange: (trigger: AnimationTrigger) => void;
  onApplyPreset: (preset: AnimationPreset) => void;
  onCopyAnimAttrs: () => void;
  onRemoveAnimation: () => void;
}

export function FigmaEditorPanel({
  selectedNode,
  selectedNodeStyles,
  selectedNodeAnim,
  editorTab,
  analysis,
  canUndo,
  canRedo,
  onEditorTabChange,
  onClose,
  onStyleChange,
  onUndo,
  onRedo,
  onAnimConfigChange,
  onAnimEngineChange,
  onAnimTriggerChange,
  onApplyPreset,
  onCopyAnimAttrs,
  onRemoveAnimation,
}: FigmaEditorPanelProps) {
  const collectNodes = useCallback((node: ParsedNode, parentName?: string): Array<{ id: string; name: string; type: string; parentName?: string }> => {
    const result: Array<{ id: string; name: string; type: string; parentName?: string }> = [
      { id: node.id, name: node.name, type: node.type, parentName },
    ];
    for (const child of node.children) {
      result.push(...collectNodes(child, node.name));
    }
    return result;
  }, []);

  return (
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
          onClick={onClose}
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
            onClick={() => onEditorTabChange(key)}
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
            onStyleChange={onStyleChange}
            onUndo={onUndo}
            onRedo={onRedo}
            canUndo={canUndo}
            canRedo={canRedo}
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
                      onClick={() => onApplyPreset(preset)}
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
                      onApplyPreset(ANIMATION_PRESETS[0]);
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
                    onClick={onRemoveAnimation}
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
                  onChange={onAnimConfigChange}
                  onEngineChange={onAnimEngineChange}
                  onTriggerChange={onAnimTriggerChange}
                  onCopyAttributes={onCopyAnimAttrs}
                  onApply={() => {
                    toast.success('Animation applied to element');
                  }}
                />
              </>
            )}
          </div>
        )}

        {editorTab === 'semantic' && (
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
              nodes={collectNodes(analysis.structure)}
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
  );
}
