import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import { prisma } from '../../db/client.js';
import { favoritesQuerySchema, toggleFavoriteSchema, checkFavoriteSchema } from './schemas.js';
import { ValidationError } from '../../utils/errors.js';

export async function favoriteRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/favorites
  app.get('/', async (request, reply) => {
    const parsed = favoritesQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.flatten().fieldErrors);
    }

    const where = {
      userId: request.user.userId,
      ...(parsed.data.type ? { type: parsed.data.type } : {}),
    };

    const favorites = await prisma.favorite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ data: favorites });
  });

  // GET /api/favorites/check
  app.get('/check', async (request, reply) => {
    const parsed = checkFavoriteSchema.safeParse(request.query);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.flatten().fieldErrors);
    }

    const { type, targetId } = parsed.data;
    const foreignKey = getForeignKey(type);

    const existing = await prisma.favorite.findFirst({
      where: {
        userId: request.user.userId,
        type,
        [foreignKey]: targetId,
      },
    });

    return reply.send({ data: { favorited: !!existing } });
  });

  // POST /api/favorites — toggle
  app.post('/', async (request, reply) => {
    const parsed = toggleFavoriteSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.flatten().fieldErrors);
    }

    const { type, targetId } = parsed.data;
    const foreignKey = getForeignKey(type);

    const existing = await prisma.favorite.findFirst({
      where: {
        userId: request.user.userId,
        type,
        [foreignKey]: targetId,
      },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return reply.send({ data: { favorited: false } });
    }

    await prisma.favorite.create({
      data: {
        userId: request.user.userId,
        type,
        [foreignKey]: targetId,
      },
    });

    return reply.send({ data: { favorited: true } });
  });
}

function getForeignKey(type: string): string {
  switch (type) {
    case 'project':
      return 'projectId';
    case 'template':
      return 'templateId';
    case 'preset':
      return 'presetId';
    default:
      return 'projectId';
  }
}
