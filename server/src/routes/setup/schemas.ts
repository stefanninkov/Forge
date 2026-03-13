import { z } from 'zod';

export const updateSetupItemSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'SKIPPED']),
});

export const createProfileSchema = z.object({
  name: z.string().min(1, 'Profile name is required').max(100),
  checklistConfig: z.record(z.boolean()),
});

export const applyProfileSchema = z.object({
  profileId: z.string().uuid('Invalid profile ID'),
});

export type UpdateSetupItemInput = z.infer<typeof updateSetupItemSchema>;
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
