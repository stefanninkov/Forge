export type AnimationEngine = 'CSS' | 'GSAP';
export type AnimationTrigger = 'SCROLL' | 'HOVER' | 'CLICK' | 'LOAD';

export interface AnimationPresetConfig {
  animationType: string;
  duration: number;
  delay: number;
  ease: string;
  threshold?: number;
  distance?: number;
  scale?: number;
  blur?: number;
  rotate?: number;
  gsapStart?: string;
  gsapEnd?: string;
  gsapScrub?: boolean | number;
  gsapStagger?: number;
  gsapPin?: boolean;
  gsapSplit?: 'chars' | 'words' | 'lines';
}

export interface AnimationPreset {
  id: string;
  name: string;
  description: string | null;
  category: string;
  engine: AnimationEngine;
  trigger: AnimationTrigger;
  config: AnimationPresetConfig;
  previewHtml: string | null;
  isSystem: boolean;
  isPublished: boolean;
  tags: string[];
  createdAt: string;
}

export interface AnimationConfig {
  useLenis: boolean;
  embedMode: 'inline' | 'cdn';
}

export interface MasterScriptResponse {
  script: string;
  stats: {
    cssAnimations: number;
    gsapAnimations: number;
    totalSize: string;
  };
}

export interface PresetFilters {
  engine?: AnimationEngine;
  trigger?: AnimationTrigger;
  category?: string;
  search?: string;
}
