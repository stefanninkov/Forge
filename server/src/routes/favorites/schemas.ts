import { z } from 'zod';

export const favoritesQuerySchema = z.object({
  type: z.enum(['project', 'template', 'preset']).optional(),
});

export const toggleFavoriteSchema = z.object({
  type: z.enum(['project', 'template', 'preset']),
  targetId: z.string().uuid(),
});

export const checkFavoriteSchema = z.object({
  type: z.enum(['project', 'template', 'preset']),
  targetId: z.string().uuid(),
});
