import type { FastifyInstance } from 'fastify';
import { prisma } from '../../db/client.js';
import { requireAuth } from '../../middleware/auth.js';

export async function exportRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/export — full data export
  app.get('/', async (request, reply) => {
    const userId = request.user.userId;

    const [projects, templates, sections, scalingConfigs, notificationPrefs, integrations] = await Promise.all([
      prisma.project.findMany({
        where: { userId },
        include: {
          setupProgress: true,
          audits: { orderBy: { createdAt: 'desc' }, take: 50 },
        },
      }),
      prisma.template.findMany({ where: { userId, isPreset: false } }),
      prisma.capturedSection.findMany({ where: { userId } }),
      prisma.scalingConfig.findMany({ where: { userId } }),
      prisma.notificationPreference.findMany({ where: { userId } }),
      prisma.userIntegration.findMany({
        where: { userId },
        select: { provider: true, createdAt: true },
      }),
    ]);

    return reply.send({
      data: {
        exportedAt: new Date().toISOString(),
        projects,
        templates,
        sections,
        scalingConfigs,
        notificationPreferences: notificationPrefs,
        integrations,
      },
    });
  });

  // GET /api/export/projects
  app.get('/projects', async (request, reply) => {
    const userId = request.user.userId;

    const projects = await prisma.project.findMany({
      where: { userId },
      include: { setupProgress: true },
    });

    return reply.send({
      exportedAt: new Date().toISOString(),
      type: 'projects',
      data: projects,
    });
  });

  // GET /api/export/templates
  app.get('/templates', async (request, reply) => {
    const userId = request.user.userId;

    const templates = await prisma.template.findMany({
      where: { userId, isPreset: false },
    });

    return reply.send({
      exportedAt: new Date().toISOString(),
      type: 'templates',
      data: templates,
    });
  });

  // GET /api/export/audits
  app.get('/audits', async (request, reply) => {
    const userId = request.user.userId;

    const projects = await prisma.project.findMany({
      where: { userId },
      select: { id: true },
    });

    const audits = await prisma.audit.findMany({
      where: { projectId: { in: projects.map((p) => p.id) } },
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    return reply.send({
      exportedAt: new Date().toISOString(),
      type: 'audits',
      data: audits,
    });
  });
}
