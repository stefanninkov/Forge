import { z } from 'zod';

export const runAuditSchema = z.object({
  url: z.string().url('Must be a valid URL'),
});

export const auditFiltersSchema = z.object({
  type: z.enum(['SPEED', 'SEO', 'AEO']).optional(),
});

export const auditHistorySchema = z.object({
  type: z.enum(['SPEED', 'SEO', 'AEO']),
});

export const projectIdSchema = z.object({
  id: z.string().uuid(),
});

export const auditIdSchema = z.object({
  id: z.string().uuid(),
});

export const alertIdSchema = z.object({
  id: z.string().uuid(),
});

export type RunAuditInput = z.infer<typeof runAuditSchema>;
export type AuditFiltersInput = z.infer<typeof auditFiltersSchema>;
export type AuditHistoryInput = z.infer<typeof auditHistorySchema>;
