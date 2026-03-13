import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(500).optional(),
  webflowSiteId: z.string().optional(),
  figmaFileKey: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  webflowSiteId: z.string().optional(),
  figmaFileKey: z.string().optional(),
  setupProfileId: z.string().uuid().optional(),
});

export const projectIdSchema = z.object({
  id: z.string().uuid('Invalid project ID'),
});

export const updateNotesSchema = z.object({
  notes: z.string().max(10000),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
