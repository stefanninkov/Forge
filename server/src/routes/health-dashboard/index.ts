import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../db/client.js';
import { requireAuth } from '../../middleware/auth.js';

export async function healthDashboardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/health-dashboard/overview
  app.get('/overview', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId as string;

    // Get all user's projects
    const projects = await prisma.project.findMany({
      where: { userId },
      select: { id: true, name: true },
    });

    const projectIds = projects.map((p) => p.id);

    // Get latest audit for each type across all projects
    const [latestSpeed, latestSeo, latestAeo, recentAlerts] = await Promise.all([
      prisma.audit.findFirst({
        where: { projectId: { in: projectIds }, type: 'SPEED' },
        orderBy: { createdAt: 'desc' },
        select: { score: true, createdAt: true, projectId: true },
      }),
      prisma.audit.findFirst({
        where: { projectId: { in: projectIds }, type: 'SEO' },
        orderBy: { createdAt: 'desc' },
        select: { score: true, createdAt: true, projectId: true },
      }),
      prisma.audit.findFirst({
        where: { projectId: { in: projectIds }, type: 'AEO' },
        orderBy: { createdAt: 'desc' },
        select: { score: true, createdAt: true, projectId: true },
      }),
      prisma.auditAlert.findMany({
        where: { projectId: { in: projectIds }, read: false },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          project: { select: { id: true, name: true } },
        },
      }),
    ]);

    return reply.send({
      data: {
        projectCount: projects.length,
        speed: latestSpeed ? { score: latestSpeed.score, lastChecked: latestSpeed.createdAt } : null,
        seo: latestSeo ? { score: latestSeo.score, lastChecked: latestSeo.createdAt } : null,
        aeo: latestAeo ? { score: latestAeo.score, lastChecked: latestAeo.createdAt } : null,
        recentAlerts,
      },
    });
  });

  // GET /api/health-dashboard/projects/:id/trends
  app.get('/projects/:id/trends', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId as string;
    const { id } = request.params as { id: string };

    const project = await prisma.project.findFirst({ where: { id, userId } });
    if (!project) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }

    const audits = await prisma.audit.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' },
      select: { type: true, score: true, createdAt: true },
    });

    return reply.send({ data: audits });
  });
}
