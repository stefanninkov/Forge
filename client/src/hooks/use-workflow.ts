import { create } from 'zustand';
import type { FigmaAnalysis } from '@/types/figma';
import type { CSSStyles, AnimationConfig, AnimationEngine, AnimationTrigger } from '@/components/shared/editors';

export interface NodeAnimationState {
  config: AnimationConfig;
  engine: AnimationEngine;
  trigger: AnimationTrigger;
  presetId?: string;
}

interface WorkflowState {
  /** Current analysis result from Figma import */
  analysis: FigmaAnalysis | null;
  /** AI class-name suggestions keyed by node ID */
  aiSuggestions: Record<string, { suggestedClass?: string; notes?: string }> | null;
  /** Per-node CSS style overrides */
  nodeStyleOverrides: Record<string, CSSStyles>;
  /** Per-node animation state */
  nodeAnimations: Record<string, NodeAnimationState>;

  setAnalysis: (analysis: FigmaAnalysis | null) => void;
  setAiSuggestions: (suggestions: Record<string, { suggestedClass?: string; notes?: string }> | null) => void;
  updateStructure: (updater: (structure: FigmaAnalysis['structure']) => FigmaAnalysis['structure']) => void;
  setNodeStyleOverrides: (overrides: Record<string, CSSStyles>) => void;
  updateNodeStyle: (nodeId: string, property: string, value: string) => void;
  setNodeAnimations: (anims: Record<string, NodeAnimationState>) => void;
  updateNodeAnimation: (nodeId: string, anim: NodeAnimationState) => void;
  removeNodeAnimation: (nodeId: string) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  analysis: null,
  aiSuggestions: null,
  nodeStyleOverrides: {} as Record<string, CSSStyles>,
  nodeAnimations: {} as Record<string, NodeAnimationState>,
};

export const useWorkflow = create<WorkflowState>((set) => ({
  ...INITIAL_STATE,

  setAnalysis: (analysis) => set({ analysis }),

  setAiSuggestions: (suggestions) => set({ aiSuggestions: suggestions }),

  updateStructure: (updater) =>
    set((state) => {
      if (!state.analysis) return state;
      return {
        analysis: { ...state.analysis, structure: updater(state.analysis.structure) },
      };
    }),

  setNodeStyleOverrides: (overrides) => set({ nodeStyleOverrides: overrides }),

  updateNodeStyle: (nodeId, property, value) =>
    set((state) => ({
      nodeStyleOverrides: {
        ...state.nodeStyleOverrides,
        [nodeId]: { ...(state.nodeStyleOverrides[nodeId] ?? {}), [property]: value },
      },
    })),

  setNodeAnimations: (anims) => set({ nodeAnimations: anims }),

  updateNodeAnimation: (nodeId, anim) =>
    set((state) => ({
      nodeAnimations: { ...state.nodeAnimations, [nodeId]: anim },
    })),

  removeNodeAnimation: (nodeId) =>
    set((state) => {
      const next = { ...state.nodeAnimations };
      delete next[nodeId];
      return { nodeAnimations: next };
    }),

  reset: () => set(INITIAL_STATE),
}));
