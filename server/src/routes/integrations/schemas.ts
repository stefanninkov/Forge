import { z } from 'zod';

export const upsertIntegrationSchema = z.object({
  provider: z.enum(['figma', 'anthropic', 'webflow']),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const providerParamSchema = z.object({
  provider: z.enum(['figma', 'anthropic', 'webflow']),
});
