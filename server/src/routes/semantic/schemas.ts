import { z } from 'zod';

const parsedNodeSchema: z.ZodType<{
  id: string;
  name: string;
  type: string;
  figmaType?: string;
  suggestedClass?: string;
  children?: Array<unknown>;
  properties?: Record<string, unknown>;
}> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    figmaType: z.string().optional(),
    suggestedClass: z.string().optional(),
    children: z.array(parsedNodeSchema).optional(),
    properties: z.record(z.unknown()).optional(),
  }),
);

export const analyzeSemanticSchema = z.object({
  nodes: z.array(parsedNodeSchema).min(1, 'At least one node is required'),
});
