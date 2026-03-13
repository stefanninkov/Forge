import { z } from 'zod';

export const templateFiltersSchema = z.object({
  category: z.string().min(1).optional(),
  type: z.enum(['SKELETON', 'STYLED']).optional(),
  search: z.string().min(1).optional(),
  presetOnly: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.string().min(1).max(50),
  type: z.enum(['SKELETON', 'STYLED']),
  structure: z.record(z.unknown()),
  styles: z.record(z.unknown()).optional(),
  animationAttrs: z.record(z.unknown()).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  sourceProjectId: z.string().uuid().optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  category: z.string().min(1).max(50).optional(),
  type: z.enum(['SKELETON', 'STYLED']).optional(),
  structure: z.record(z.unknown()).optional(),
  styles: z.record(z.unknown()).optional(),
  animationAttrs: z.record(z.unknown()).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

export const templateIdSchema = z.object({ id: z.string().uuid() });
