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

export const createScheduleSchema = z.object({
  type: z.enum(['SPEED', 'SEO', 'AEO']),
  url: z.string().url('Must be a valid URL'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']),
});

export const updateScheduleSchema = z.object({
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']).optional(),
  url: z.string().url().optional(),
  enabled: z.boolean().optional(),
});

export const scheduleIdSchema = z.object({
  scheduleId: z.string().uuid(),
});

export type RunAuditInput = z.infer<typeof runAuditSchema>;
export type AuditFiltersInput = z.infer<typeof auditFiltersSchema>;
export type AuditHistoryInput = z.infer<typeof auditHistorySchema>;
