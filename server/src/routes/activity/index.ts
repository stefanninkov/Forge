import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import { prisma } from '../../db/client.js';
import { activityQuerySchema } from './schemas.js';
import { ValidationError } from '../../utils/errors.js';

export async function activityRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/activity
  app.get('/', async (request, reply) => {
    const parsed = activityQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.flatten().fieldErrors);
    }

    const { action, projectId, limit, offset } = parsed.data;

    const where = {
      userId: request.user.userId,
      ...(action ? { action } : {}),
      ...(projectId ? { projectId } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          project: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return reply.send({ data, total });
  });
}
