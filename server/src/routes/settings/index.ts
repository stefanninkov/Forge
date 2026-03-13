import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import { requireAuth } from '../../middleware/auth.js';

const updateNotificationsSchema = z.object({
  preferences: z.array(z.object({
    channel: z.enum(['email', 'in_app']),
    event: z.string(),
    enabled: z.boolean(),
  })),
});

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/settings/notifications
  app.get('/notifications', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId as string;

    const prefs = await prisma.notificationPreference.findMany({
      where: { userId },
    });

    return reply.send({ data: prefs });
  });

  // PUT /api/settings/notifications
  app.put('/notifications', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId as string;
    const body = updateNotificationsSchema.parse(request.body);

    const results = await Promise.all(
      body.preferences.map((pref) =>
        prisma.notificationPreference.upsert({
          where: {
            userId_channel_event: {
              userId,
              channel: pref.channel,
              event: pref.event,
            },
          },
          update: { enabled: pref.enabled },
          create: {
            userId,
            channel: pref.channel,
            event: pref.event,
            enabled: pref.enabled,
          },
        }),
      ),
    );

    return reply.send({ data: results });
  });

  // GET /api/settings/sessions - list active sessions (refresh tokens)
  app.get('/sessions', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId as string;

    const tokens = await prisma.refreshToken.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({
      data: tokens.map((t) => ({
        id: t.id,
        createdAt: t.createdAt,
        expiresAt: t.expiresAt,
      })),
    });
  });

  // DELETE /api/settings/sessions/:id - revoke specific session
  app.delete('/sessions/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId as string;
    const { id } = request.params as { id: string };

    const token = await prisma.refreshToken.findFirst({
      where: { id, userId },
    });

    if (!token) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Session not found' } });
    }

    await prisma.refreshToken.delete({ where: { id } });

    return reply.send({ data: { success: true } });
  });
}
