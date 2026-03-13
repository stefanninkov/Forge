import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import { requireAuth } from '../../middleware/auth.js';

const scalingConfigSchema = z.object({
  name: z.string().default('Default'),
  config: z.object({
    desktop: z.object({
      baseFontSize: z.number().default(16),
      idealWidth: z.number().default(1440),
      minWidth: z.number().default(992),
      maxWidth: z.number().default(1920),
    }),
    tablet: z.object({
      idealWidth: z.number().default(834),
      minWidth: z.number().default(768),
      maxWidth: z.number().default(991),
    }),
    mobileLandscape: z.object({
      idealWidth: z.number().default(550),
      minWidth: z.number().default(480),
      maxWidth: z.number().default(767),
    }),
    mobilePortrait: z.object({
      idealWidth: z.number().default(375),
      minWidth: z.number().default(320),
      maxWidth: z.number().default(479),
    }),
  }),
  isDefault: z.boolean().default(false),
});

export async function scalingRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/projects/:projectId/scaling
  app.get('/:projectId/scaling', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId as string;
    const { projectId } = request.params as { projectId: string };

    // Verify project ownership
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }

    const config = await prisma.scalingConfig.findFirst({
      where: { projectId, userId },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ data: config });
  });

  // PUT /api/projects/:projectId/scaling
  app.put('/:projectId/scaling', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId as string;
    const { projectId } = request.params as { projectId: string };
    const body = scalingConfigSchema.parse(request.body);

    // Verify project ownership
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }

    // Upsert: update existing or create new
    const existing = await prisma.scalingConfig.findFirst({
      where: { projectId, userId },
    });

    let config;
    if (existing) {
      config = await prisma.scalingConfig.update({
        where: { id: existing.id },
        data: {
          name: body.name,
          config: body.config,
          isDefault: body.isDefault,
        },
      });
    } else {
      config = await prisma.scalingConfig.create({
        data: {
          userId,
          projectId,
          name: body.name,
          config: body.config,
          isDefault: body.isDefault,
        },
      });
    }

    return reply.send({ data: config });
  });
}
