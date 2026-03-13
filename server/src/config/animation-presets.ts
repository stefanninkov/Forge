/**
 * System animation presets — the default library of animations shipped with Forge.
 * Each preset defines its engine (CSS or GSAP), trigger, and full config for generating
 * the appropriate data-attributes on Webflow elements.
 */

export interface AnimationPresetConfig {
  /** The data-anim or data-gsap value */
  animationType: string;
  duration: number;
  delay: number;
  ease: string;
  /** Intersection threshold for scroll triggers */
  threshold?: number;
  /** Distance in px for movement animations */
  distance?: number;
  /** Scale factor for scale animations */
  scale?: number;
  /** Blur amount in px */
  blur?: number;
  /** Rotation degrees */
  rotate?: number;
  /** GSAP-specific: ScrollTrigger start */
  gsapStart?: string;
  /** GSAP-specific: ScrollTrigger end */
  gsapEnd?: string;
  /** GSAP-specific: scrub setting */
  gsapScrub?: boolean | number;
  /** GSAP-specific: stagger delay between children */
  gsapStagger?: number;
  /** GSAP-specific: pin section */
  gsapPin?: boolean;
  /** GSAP-specific: SplitText mode */
  gsapSplit?: 'chars' | 'words' | 'lines';
}

export interface SystemPreset {
  name: string;
  description: string;
  category: string;
  engine: 'CSS' | 'GSAP';
  trigger: 'SCROLL' | 'HOVER' | 'CLICK' | 'LOAD';
  config: AnimationPresetConfig;
  tags: string[];
  previewHtml: string;
}

/** Generate a simple preview element for CSS animations */
function cssPreviewBox(label: string): string {
  return `<div style="width:80px;height:60px;background:var(--accent,#059669);border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:500">${label}</div>`;
}

function gsapPreviewBox(label: string): string {
  return `<div style="width:80px;height:60px;background:var(--forge-800,#065f46);border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:500">${label}</div>`;
}

export const SYSTEM_PRESETS: SystemPreset[] = [
  // ── CSS Fade Animations ──
  {
    name: 'Fade In',
    description: 'Simple opacity fade from 0 to 1.',
    category: 'fade',
    engine: 'CSS',
    trigger: 'SCROLL',
    config: { animationType: 'fade-in', duration: 0.6, delay: 0, ease: 'ease-out', threshold: 0.2 },
    tags: ['fade', 'opacity', 'subtle'],
    previewHtml: cssPreviewBox('Fade'),
  },
  {
    name: 'Fade Up',
    description: 'Fade in while sliding up from below.',
    category: 'fade',
    engine: 'CSS',
    trigger: 'SCROLL',
    config: { animationType: 'fade-up', duration: 0.6, delay: 0, ease: 'ease-out', threshold: 0.2, distance: 24 },
    tags: ['fade', 'slide', 'up', 'popular'],
    previewHtml: cssPreviewBox('Fade Up'),
  },
  {
    name: 'Fade Down',
    description: 'Fade in while sliding down from above.',
    category: 'fade',
    engine: 'CSS',
    trigger: 'SCROLL',
    config: { animationType: 'fade-down', duration: 0.6, delay: 0, ease: 'ease-out', threshold: 0.2, distance: 24 },
    tags: ['fade', 'slide', 'down'],
    previewHtml: cssPreviewBox('Fade Down'),
  },
  {
    name: 'Fade Left',
    description: 'Fade in while sliding from the right.',
    category: 'fade',
    engine: 'CSS',
    trigger: 'SCROLL',
    config: { animationType: 'fade-left', duration: 0.6, delay: 0, ease: 'ease-out', threshold: 0.2, distance: 24 },
    tags: ['fade', 'slide', 'left'],
    previewHtml: cssPreviewBox('Fade Left'),
  },
  {
    name: 'Fade Right',
    description: 'Fade in while sliding from the left.',
    category: 'fade',
    engine: 'CSS',
    trigger: 'SCROLL',
    config: { animationType: 'fade-right', duration: 0.6, delay: 0, ease: 'ease-out', threshold: 0.2, distance: 24 },
    tags: ['fade', 'slide', 'right'],
    previewHtml: cssPreviewBox('Fade Right'),
  },
  // ── CSS Scale Animations ──
  {
    name: 'Scale In',
    description: 'Scale from 0 to full size with fade.',
    category: 'scale',
    engine: 'CSS',
    trigger: 'SCROLL',
    config: { animationType: 'scale-in', duration: 0.5, delay: 0, ease: 'ease-out', threshold: 0.2, scale: 0 },
    tags: ['scale', 'zoom', 'grow'],
    previewHtml: cssPreviewBox('Scale In'),
  },
  {
    name: 'Scale Up',
    description: 'Scale from 95% to 100% with subtle fade.',
    category: 'scale',
    engine: 'CSS',
    trigger: 'SCROLL',
    config: { animationType: 'scale-up', duration: 0.5, delay: 0, ease: 'ease-out', threshold: 0.2, scale: 0.95 },
    tags: ['scale', 'subtle', 'popular'],
    previewHtml: cssPreviewBox('Scale Up'),
  },
  {
    name: 'Scale Down',
    description: 'Scale from 105% to 100% with subtle fade.',
    category: 'scale',
    engine: 'CSS',
    trigger: 'SCROLL',
    config: { animationType: 'scale-down', duration: 0.5, delay: 0, ease: 'ease-out', threshold: 0.2, scale: 1.05 },
    tags: ['scale', 'shrink'],
    previewHtml: cssPreviewBox('Scale Down'),
  },
  // ── CSS Slide Animations ──
  {
    name: 'Slide Up',
    description: 'Slide up from below without fade.',
    category: 'slide',
    engine: 'CSS',
    trigger: 'SCROLL',
    config: { animationType: 'slide-up', duration: 0.5, delay: 0, ease: 'ease-out', threshold: 0.2, distance: 40 },
    tags: ['slide', 'up', 'movement'],
    previewHtml: cssPreviewBox('Slide Up'),
  },
  {
    name: 'Slide Down',
    description: 'Slide down from above without fade.',
    category: 'slide',
    engine: 'CSS',
    trigger: 'SCROLL',
    config: { animationType: 'slide-down', duration: 0.5, delay: 0, ease: 'ease-out', threshold: 0.2, distance: 40 },
    tags: ['slide', 'down', 'movement'],
    previewHtml: cssPreviewBox('Slide Down'),
  },
  {
    name: 'Slide Left',
    description: 'Slide in from the right edge.',
    category: 'slide',
    engine: 'CSS',
    trigger: 'SCROLL',
    config: { animationType: 'slide-left', duration: 0.5, delay: 0, ease: 'ease-out', threshold: 0.2, distance: 40 },
    tags: ['slide', 'left', 'movement'],
    previewHtml: cssPreviewBox('Slide Left'),
  },
  {
    name: 'Slide Right',
    description: 'Slide in from the left edge.',
    category: 'slide',
    engine: 'CSS',
    trigger: 'SCROLL',
    config: { animationType: 'slide-right', duration: 0.5, delay: 0, ease: 'ease-out', threshold: 0.2, distance: 40 },
    tags: ['slide', 'right', 'movement'],
    previewHtml: cssPreviewBox('Slide Right'),
  },
  // ── CSS Special Effects ──
  {
    name: 'Rotate In',
    description: 'Rotate from an angle to 0 degrees with fade.',
    category: 'special',
    engine: 'CSS',
    trigger: 'SCROLL',
    config: { animationType: 'rotate-in', duration: 0.6, delay: 0, ease: 'ease-out', threshold: 0.2, rotate: -10 },
    tags: ['rotate', 'spin', 'creative'],
    previewHtml: cssPreviewBox('Rotate'),
  },
  {
    name: 'Blur In',
    description: 'Fade in from a blurred state.',
    category: 'special',
    engine: 'CSS',
    trigger: 'SCROLL',
    config: { animationType: 'blur-in', duration: 0.6, delay: 0, ease: 'ease-out', threshold: 0.2, blur: 8 },
    tags: ['blur', 'focus', 'creative'],
    previewHtml: cssPreviewBox('Blur In'),
  },
  // ── CSS Hover Animations ──
  {
    name: 'Hover Scale',
    description: 'Scale up slightly on hover.',
    category: 'hover',
    engine: 'CSS',
    trigger: 'HOVER',
    config: { animationType: 'scale-up', duration: 0.2, delay: 0, ease: 'ease-out', scale: 1.03 },
    tags: ['hover', 'scale', 'interactive', 'popular'],
    previewHtml: cssPreviewBox('Hover'),
  },
  {
    name: 'Hover Lift',
    description: 'Lift element up with translateY on hover.',
    category: 'hover',
    engine: 'CSS',
    trigger: 'HOVER',
    config: { animationType: 'lift', duration: 0.2, delay: 0, ease: 'ease-out', distance: -4 },
    tags: ['hover', 'lift', 'interactive', 'popular'],
    previewHtml: cssPreviewBox('Lift'),
  },
  {
    name: 'Hover Glow',
    description: 'Add a subtle glow effect on hover.',
    category: 'hover',
    engine: 'CSS',
    trigger: 'HOVER',
    config: { animationType: 'glow', duration: 0.2, delay: 0, ease: 'ease-out' },
    tags: ['hover', 'glow', 'interactive'],
    previewHtml: cssPreviewBox('Glow'),
  },
  // ── CSS Load Animations ──
  {
    name: 'Load Fade Up',
    description: 'Fade up animation on page load.',
    category: 'load',
    engine: 'CSS',
    trigger: 'LOAD',
    config: { animationType: 'fade-up', duration: 0.8, delay: 0.1, ease: 'cubic-bezier(0.16, 1, 0.3, 1)', distance: 20 },
    tags: ['load', 'fade', 'entrance', 'popular'],
    previewHtml: cssPreviewBox('Load'),
  },
  // ── GSAP Animations ──
  {
    name: 'Parallax',
    description: 'Scroll-linked parallax movement.',
    category: 'parallax',
    engine: 'GSAP',
    trigger: 'SCROLL',
    config: {
      animationType: 'parallax',
      duration: 1,
      delay: 0,
      ease: 'none',
      distance: 100,
      gsapStart: 'top bottom',
      gsapEnd: 'bottom top',
      gsapScrub: true,
    },
    tags: ['parallax', 'scroll', 'movement', 'popular'],
    previewHtml: gsapPreviewBox('Parallax'),
  },
  {
    name: 'Text Reveal (Words)',
    description: 'Split text into words and reveal with stagger.',
    category: 'text',
    engine: 'GSAP',
    trigger: 'SCROLL',
    config: {
      animationType: 'split-text',
      duration: 0.8,
      delay: 0,
      ease: 'power3.out',
      gsapStart: 'top 80%',
      gsapEnd: 'bottom 20%',
      gsapSplit: 'words',
      gsapStagger: 0.05,
    },
    tags: ['text', 'split', 'words', 'reveal', 'popular'],
    previewHtml: gsapPreviewBox('Words'),
  },
  {
    name: 'Text Reveal (Chars)',
    description: 'Split text into characters and reveal with stagger.',
    category: 'text',
    engine: 'GSAP',
    trigger: 'SCROLL',
    config: {
      animationType: 'split-text',
      duration: 0.6,
      delay: 0,
      ease: 'power3.out',
      gsapStart: 'top 80%',
      gsapEnd: 'bottom 20%',
      gsapSplit: 'chars',
      gsapStagger: 0.02,
    },
    tags: ['text', 'split', 'chars', 'reveal'],
    previewHtml: gsapPreviewBox('Chars'),
  },
  {
    name: 'Text Reveal (Lines)',
    description: 'Split text into lines and reveal with stagger.',
    category: 'text',
    engine: 'GSAP',
    trigger: 'SCROLL',
    config: {
      animationType: 'split-text',
      duration: 0.8,
      delay: 0,
      ease: 'power3.out',
      gsapStart: 'top 80%',
      gsapEnd: 'bottom 20%',
      gsapSplit: 'lines',
      gsapStagger: 0.1,
    },
    tags: ['text', 'split', 'lines', 'reveal'],
    previewHtml: gsapPreviewBox('Lines'),
  },
  {
    name: 'Stagger Children',
    description: 'Animate child elements with staggered delay.',
    category: 'stagger',
    engine: 'GSAP',
    trigger: 'SCROLL',
    config: {
      animationType: 'stagger',
      duration: 0.6,
      delay: 0,
      ease: 'power2.out',
      gsapStart: 'top 80%',
      gsapEnd: 'bottom 20%',
      gsapStagger: 0.1,
      distance: 24,
    },
    tags: ['stagger', 'children', 'sequence', 'popular'],
    previewHtml: gsapPreviewBox('Stagger'),
  },
  {
    name: 'Scroll Scrub',
    description: 'Animation progress tied to scroll position.',
    category: 'scroll',
    engine: 'GSAP',
    trigger: 'SCROLL',
    config: {
      animationType: 'scrub',
      duration: 1,
      delay: 0,
      ease: 'none',
      gsapStart: 'top bottom',
      gsapEnd: 'top top',
      gsapScrub: 1,
      distance: 0,
    },
    tags: ['scrub', 'scroll', 'timeline'],
    previewHtml: gsapPreviewBox('Scrub'),
  },
  {
    name: 'Pin Section',
    description: 'Pin element in viewport while scrolling through content.',
    category: 'scroll',
    engine: 'GSAP',
    trigger: 'SCROLL',
    config: {
      animationType: 'pin',
      duration: 1,
      delay: 0,
      ease: 'none',
      gsapStart: 'top top',
      gsapEnd: '+=100%',
      gsapPin: true,
    },
    tags: ['pin', 'scroll', 'sticky', 'section'],
    previewHtml: gsapPreviewBox('Pin'),
  },
];

/** All unique categories from system presets */
export const PRESET_CATEGORIES = [...new Set(SYSTEM_PRESETS.map((p) => p.category))];

/** All unique tags from system presets */
export const PRESET_TAGS = [...new Set(SYSTEM_PRESETS.flatMap((p) => p.tags))];
