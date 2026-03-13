import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../db/client.js';
import { requireAuth } from '../../middleware/auth.js';

export async function exportRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/export/projects
  app.get('/projects', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId as string;

    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        setupProgress: true,
      },
    });

    return reply.header('Content-Type', 'application/json').send({
      exportedAt: new Date().toISOString(),
      type: 'projects',
      data: projects,
    });
  });

  // GET /api/export/templates
  app.get('/templates', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId as string;

    const templates = await prisma.template.findMany({
      where: { userId, isPreset: false },
    });

    return reply.header('Content-Type', 'application/json').send({
      exportedAt: new Date().toISOString(),
      type: 'templates',
      data: templates,
    });
  });

  // GET /api/export/audits
  app.get('/audits', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId as string;

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

    return reply.header('Content-Type', 'application/json').send({
      exportedAt: new Date().toISOString(),
      type: 'audits',
      data: audits,
    });
  });
}
