import { z } from 'zod';

export const reportIdSchema = z.object({
  id: z.string().uuid(),
});

export const createReportSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(200),
  sections: z.array(
    z.object({
      title: z.string(),
      type: z.enum(['overview', 'speed', 'seo', 'aeo', 'recommendations', 'custom']),
      content: z.record(z.unknown()).optional(),
    }),
  ),
  branding: z
    .object({
      companyName: z.string().optional(),
      logoUrl: z.string().url().optional(),
      primaryColor: z.string().optional(),
    })
    .optional(),
  isPublic: z.boolean().optional(),
});

export const updateReportSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  sections: z
    .array(
      z.object({
        title: z.string(),
        type: z.enum(['overview', 'speed', 'seo', 'aeo', 'recommendations', 'custom']),
        content: z.record(z.unknown()).optional(),
      }),
    )
    .optional(),
  branding: z
    .object({
      companyName: z.string().optional(),
      logoUrl: z.string().url().optional(),
      primaryColor: z.string().optional(),
    })
    .optional(),
  isPublic: z.boolean().optional(),
});

export const shareTokenSchema = z.object({
  token: z.string().min(1),
});
