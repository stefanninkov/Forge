import { z } from 'zod';

export const activityQuerySchema = z.object({
  action: z
    .enum([
      'PROJECT_CREATED',
      'PROJECT_UPDATED',
      'PROJECT_DELETED',
      'AUDIT_RUN',
      'TEMPLATE_CREATED',
      'TEMPLATE_PUSHED',
      'ANIMATION_APPLIED',
      'SCRIPT_DEPLOYED',
      'SECTION_CAPTURED',
      'FIGMA_ANALYZED',
      'SETTINGS_UPDATED',
    ])
    .optional(),
  projectId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
