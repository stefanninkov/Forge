import { prisma } from '../db/client.js';
import { NotFoundError } from '../utils/errors.js';
import { SYSTEM_PRESETS } from '../config/animation-presets.js';
import type { AnimationEngine, AnimationTrigger, Prisma } from '@prisma/client';

interface PresetFilters {
  engine?: AnimationEngine;
  trigger?: AnimationTrigger;
  category?: string;
  search?: string;
}

/** List all presets (system + user's custom) with optional filters */
export async function listPresets(userId: string, filters: PresetFilters = {}) {
  const where: Record<string, unknown> = {
    OR: [{ isSystem: true }, { userId }],
  };

  if (filters.engine) {
    where.engine = filters.engine;
  }
  if (filters.trigger) {
    where.trigger = filters.trigger;
  }
  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.search) {
    where.AND = [
      where.AND ?? {},
      {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { tags: { has: filters.search.toLowerCase() } },
        ],
      },
    ];
  }

  return prisma.animationPreset.findMany({
    where,
    orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      engine: true,
      trigger: true,
      config: true,
      previewHtml: true,
      isSystem: true,
      isPublished: true,
      tags: true,
      createdAt: true,
    },
  });
}

/** Get a single preset by ID */
export async function getPreset(presetId: string, userId: string) {
  const preset = await prisma.animationPreset.findFirst({
    where: {
      id: presetId,
      OR: [{ isSystem: true }, { userId }],
    },
  });
  if (!preset) throw new NotFoundError('Animation preset');
  return preset;
}

/** Create a custom user preset */
export async function createPreset(
  userId: string,
  data: {
    name: string;
    description?: string;
    category: string;
    engine: AnimationEngine;
    trigger: AnimationTrigger;
    config: Record<string, unknown>;
    previewHtml?: string;
    tags?: string[];
  },
) {
  return prisma.animationPreset.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
      category: data.category,
      engine: data.engine,
      trigger: data.trigger,
      config: data.config as Prisma.InputJsonValue,
      previewHtml: data.previewHtml,
      tags: data.tags ?? [],
      isSystem: false,
      isPublished: false,
    },
  });
}

/** Update a user's custom preset */
export async function updatePreset(
  presetId: string,
  userId: string,
  data: {
    name?: string;
    description?: string;
    category?: string;
    engine?: AnimationEngine;
    trigger?: AnimationTrigger;
    config?: Record<string, unknown>;
    previewHtml?: string;
    tags?: string[];
  },
) {
  const preset = await prisma.animationPreset.findFirst({
    where: { id: presetId, userId, isSystem: false },
  });
  if (!preset) throw new NotFoundError('Animation preset');

  return prisma.animationPreset.update({
    where: { id: presetId },
    data: {
      name: data.name,
      description: data.description,
      category: data.category,
      engine: data.engine,
      trigger: data.trigger,
      previewHtml: data.previewHtml,
      tags: data.tags,
      ...(data.config !== undefined && { config: data.config as Prisma.InputJsonValue }),
    },
  });
}

/** Delete a user's custom preset */
export async function deletePreset(presetId: string, userId: string) {
  const preset = await prisma.animationPreset.findFirst({
    where: { id: presetId, userId, isSystem: false },
  });
  if (!preset) throw new NotFoundError('Animation preset');

  await prisma.animationPreset.delete({ where: { id: presetId } });
}

/** Get project animation config */
export async function getProjectAnimationConfig(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true, animationConfig: true },
  });
  if (!project) throw new NotFoundError('Project');
  return project.animationConfig ?? { useLenis: false, embedMode: 'inline' };
}

/** Update project animation config */
export async function updateProjectAnimationConfig(
  projectId: string,
  userId: string,
  config: Record<string, unknown>,
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!project) throw new NotFoundError('Project');

  return prisma.project.update({
    where: { id: projectId },
    data: { animationConfig: config as Prisma.InputJsonValue },
    select: { id: true, animationConfig: true },
  });
}

/** Generate the master animation script for a project */
export async function generateMasterScript(
  projectId: string,
  userId: string,
): Promise<{ script: string; stats: { cssAnimations: number; gsapAnimations: number; totalSize: string } }> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true, animationConfig: true },
  });
  if (!project) throw new NotFoundError('Project');

  const config = (project.animationConfig as Record<string, unknown>) ?? {};
  const useLenis = config.useLenis === true;

  const script = buildMasterScript(useLenis);
  const sizeKB = (new TextEncoder().encode(script).length / 1024).toFixed(1);

  return {
    script,
    stats: {
      cssAnimations: 14,
      gsapAnimations: 7,
      totalSize: `${sizeKB} KB`,
    },
  };
}

/** Seed system presets into the database (idempotent) */
export async function seedSystemPresets() {
  const existing = await prisma.animationPreset.count({ where: { isSystem: true } });
  if (existing > 0) return { seeded: false, count: existing };

  await prisma.animationPreset.createMany({
    data: SYSTEM_PRESETS.map((preset) => ({
      name: preset.name,
      description: preset.description,
      category: preset.category,
      engine: preset.engine as AnimationEngine,
      trigger: preset.trigger as AnimationTrigger,
      config: preset.config as unknown as Prisma.InputJsonValue,
      previewHtml: preset.previewHtml,
      isSystem: true,
      isPublished: false,
      tags: preset.tags,
    })),
  });

  return { seeded: true, count: SYSTEM_PRESETS.length };
}

// ── Master Script Builder ──

function buildMasterScript(useLenis: boolean): string {
  const parts: string[] = [];

  parts.push(`// Forge Animation Master Script
// Generated by Forge — https://forge.dev
// Auto-detects data-anim, data-gsap, data-hover, data-click, data-load attributes
(function() {
  'use strict';

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    document.querySelectorAll('[data-anim],[data-gsap],[data-load]').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.filter = 'none';
    });
    return;
  }
`);

  // CSS Animation Observer
  parts.push(`
  // ── CSS Animations (IntersectionObserver) ──
  const cssAnimElements = document.querySelectorAll('[data-anim]');
  if (cssAnimElements.length > 0) {
    const cssObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const anim = el.getAttribute('data-anim');
          const duration = parseFloat(el.getAttribute('data-anim-duration') || '0.6');
          const delay = parseFloat(el.getAttribute('data-anim-delay') || '0');
          const ease = el.getAttribute('data-anim-ease') || 'ease-out';

          el.style.willChange = 'opacity, transform, filter';
          el.style.transition = \`opacity \${duration}s \${ease} \${delay}s, transform \${duration}s \${ease} \${delay}s, filter \${duration}s \${ease} \${delay}s\`;
          el.style.opacity = '1';
          el.style.transform = 'none';
          el.style.filter = 'none';

          // Clean up will-change after animation
          setTimeout(() => {
            el.style.willChange = 'auto';
          }, (duration + delay) * 1000 + 100);

          cssObserver.unobserve(el);
        }
      });
    }, { threshold: 0.2 });

    cssAnimElements.forEach(el => {
      const anim = el.getAttribute('data-anim');
      const dist = el.getAttribute('data-anim-distance') || '24';

      // Set initial states
      el.style.opacity = '0';
      switch (anim) {
        case 'fade-up': el.style.transform = \`translateY(\${dist}px)\`; break;
        case 'fade-down': el.style.transform = \`translateY(-\${dist}px)\`; break;
        case 'fade-left': el.style.transform = \`translateX(\${dist}px)\`; break;
        case 'fade-right': el.style.transform = \`translateX(-\${dist}px)\`; break;
        case 'scale-in': el.style.transform = 'scale(0)'; break;
        case 'scale-up': el.style.transform = 'scale(0.95)'; break;
        case 'scale-down': el.style.transform = 'scale(1.05)'; break;
        case 'slide-up': el.style.transform = \`translateY(\${dist}px)\`; el.style.opacity = '1'; break;
        case 'slide-down': el.style.transform = \`translateY(-\${dist}px)\`; el.style.opacity = '1'; break;
        case 'slide-left': el.style.transform = \`translateX(\${dist}px)\`; el.style.opacity = '1'; break;
        case 'slide-right': el.style.transform = \`translateX(-\${dist}px)\`; el.style.opacity = '1'; break;
        case 'rotate-in': el.style.transform = 'rotate(-10deg)'; break;
        case 'blur-in': el.style.filter = 'blur(8px)'; break;
        case 'fade-in': default: break;
      }

      cssObserver.observe(el);
    });
  }
`);

  // Hover animations
  parts.push(`
  // ── Hover Animations ──
  document.querySelectorAll('[data-hover]').forEach(el => {
    const hover = el.getAttribute('data-hover');
    el.style.transition = 'transform 0.2s ease-out, box-shadow 0.2s ease-out';

    el.addEventListener('mouseenter', () => {
      switch (hover) {
        case 'scale-up': el.style.transform = 'scale(1.03)'; break;
        case 'lift': el.style.transform = 'translateY(-4px)'; break;
        case 'glow': el.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.3)'; break;
      }
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'none';
      el.style.boxShadow = 'none';
    });
  });
`);

  // Load animations
  parts.push(`
  // ── Load Animations ──
  document.querySelectorAll('[data-load]').forEach(el => {
    const anim = el.getAttribute('data-load');
    const duration = parseFloat(el.getAttribute('data-anim-duration') || '0.8');
    const delay = parseFloat(el.getAttribute('data-anim-delay') || '0.1');
    const ease = el.getAttribute('data-anim-ease') || 'cubic-bezier(0.16, 1, 0.3, 1)';

    el.style.opacity = '0';
    if (anim === 'fade-up') el.style.transform = 'translateY(20px)';

    requestAnimationFrame(() => {
      el.style.transition = \`opacity \${duration}s \${ease} \${delay}s, transform \${duration}s \${ease} \${delay}s\`;
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  });
`);

  // GSAP section
  parts.push(`
  // ── GSAP Animations ──
  const gsapElements = document.querySelectorAll('[data-gsap]');
  if (gsapElements.length > 0 && typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    ${useLenis ? `
    // Lenis + ScrollTrigger sync
    if (typeof Lenis !== 'undefined') {
      const lenis = new Lenis();
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }` : ''}

    gsapElements.forEach(el => {
      const type = el.getAttribute('data-gsap');
      const start = el.getAttribute('data-gsap-start') || 'top 80%';
      const end = el.getAttribute('data-gsap-end') || 'bottom 20%';
      const scrub = el.getAttribute('data-gsap-scrub');
      const stagger = parseFloat(el.getAttribute('data-gsap-stagger') || '0.1');
      const pin = el.getAttribute('data-gsap-pin') === 'true';

      switch (type) {
        case 'parallax': {
          const dist = parseFloat(el.getAttribute('data-anim-distance') || '100');
          gsap.to(el, {
            y: dist,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
          });
          break;
        }
        case 'split-text': {
          if (typeof SplitText !== 'undefined') {
            const splitType = el.getAttribute('data-gsap-split') || 'words';
            const split = new SplitText(el, { type: splitType });
            const targets = split[splitType] || split.words;
            gsap.from(targets, {
              opacity: 0, y: 20, duration: 0.8, stagger: stagger, ease: 'power3.out',
              scrollTrigger: { trigger: el, start, end }
            });
          }
          break;
        }
        case 'stagger': {
          const children = el.getAttribute('data-anim-children') || '> *';
          gsap.from(el.querySelectorAll(children), {
            opacity: 0, y: 24, duration: 0.6, stagger: stagger, ease: 'power2.out',
            scrollTrigger: { trigger: el, start, end }
          });
          break;
        }
        case 'scrub': {
          const scrubVal = scrub ? (isNaN(Number(scrub)) ? true : Number(scrub)) : 1;
          gsap.from(el, {
            opacity: 0, y: 40,
            scrollTrigger: { trigger: el, start, end, scrub: scrubVal }
          });
          break;
        }
        case 'pin': {
          ScrollTrigger.create({
            trigger: el, start, end: end || '+=100%', pin: true, pinSpacing: true
          });
          break;
        }
      }
    });
  }
`);

  // Resize handler
  parts.push(`
  // ── Resize Handler ──
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    }, 250);
  });

})();`);

  return parts.join('\n');
}
