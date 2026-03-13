import { z } from 'zod';

export const presetFiltersSchema = z.object({
  engine: z.enum(['CSS', 'GSAP']).optional(),
  trigger: z.enum(['SCROLL', 'HOVER', 'CLICK', 'LOAD']).optional(),
  category: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
});

export const createPresetSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.string().min(1).max(50),
  engine: z.enum(['CSS', 'GSAP']),
  trigger: z.enum(['SCROLL', 'HOVER', 'CLICK', 'LOAD']),
  config: z.record(z.unknown()),
  previewHtml: z.string().max(5000).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

export const updatePresetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  category: z.string().min(1).max(50).optional(),
  engine: z.enum(['CSS', 'GSAP']).optional(),
  trigger: z.enum(['SCROLL', 'HOVER', 'CLICK', 'LOAD']).optional(),
  config: z.record(z.unknown()).optional(),
  previewHtml: z.string().max(5000).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

export const updateAnimationConfigSchema = z.object({
  useLenis: z.boolean().optional(),
  embedMode: z.enum(['inline', 'cdn']).optional(),
});

export const presetIdSchema = z.object({ id: z.string().uuid() });
export const projectIdSchema = z.object({ id: z.string().uuid() });
