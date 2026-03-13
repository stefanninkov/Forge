import { z } from 'zod';

export const analyzeFigmaSchema = z.object({
  projectId: z.string().uuid(),
  figmaUrl: z.string().min(1),
  pageName: z.string().optional(),
});

export const aiSuggestSchema = z.object({
  analysisId: z.string().uuid(),
});

export const updateAnalysisSchema = z.object({
  finalStructure: z.record(z.unknown()),
});

export const analysisIdSchema = z.object({ id: z.string().uuid() });

export const pushToWebflowSchema = z.object({
  analysisId: z.string().uuid(),
});
