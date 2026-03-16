import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { prisma } from '../../db/client.js';
import { ValidationError } from '../../utils/errors.js';

const updatePreferencesSchema = z.object({
  preferences: z.array(z.object({
    event: z.string(),
    channel: z.enum(['email', 'in_app']),
    enabled: z.boolean(),
  })),
});

export async function notificationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/notifications/preferences
  app.get('/preferences', async (request, reply) => {
    const prefs = await prisma.notificationPreference.findMany({
      where: { userId: request.user.userId },
      select: {
        event: true,
        channel: true,
        enabled: true,
      },
    });

    return reply.send({ data: prefs });
  });

  // PUT /api/notifications/preferences
  app.put('/preferences', async (request, reply) => {
    const parsed = updatePreferencesSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.flatten().fieldErrors);
    }

    const userId = request.user.userId;
    const upserts = parsed.data.preferences.map((pref) =>
      prisma.notificationPreference.upsert({
        where: {
          userId_channel_event: {
            userId,
            channel: pref.channel,
            event: pref.event,
          },
        },
        create: {
          userId,
          event: pref.event,
          channel: pref.channel,
          enabled: pref.enabled,
        },
        update: {
          enabled: pref.enabled,
        },
      }),
    );

    await Promise.all(upserts);

    const prefs = await prisma.notificationPreference.findMany({
      where: { userId },
      select: {
        event: true,
        channel: true,
        enabled: true,
      },
    });

    return reply.send({ data: prefs });
  });
}
