import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import { requireAuth } from '../../middleware/auth.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';

const projectIdParamSchema = z.object({
  id: z.string().uuid(),
});

export async function healthDashboardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/health-dashboard/overview
  // Returns aggregated health data across all user projects:
  //   - Average speed/seo/aeo scores (from latest audit per project)
  //   - Project count
  //   - Recent alerts (unread, score < 60 or critical findings)
  app.get('/overview', async (request, reply) => {
    const userId = request.user.userId;

    const projects = await prisma.project.findMany({
      where: { userId },
      select: { id: true, name: true },
    });

    const projectIds = projects.map((p) => p.id);

    if (projectIds.length === 0) {
      return reply.send({
        data: {
          projectCount: 0,
          speed: null,
          seo: null,
          aeo: null,
          recentAlerts: [],
        },
      });
    }

    // For each audit type, get the latest audit per project, then average.
    // We use raw queries via Prisma to get "latest per project" efficiently.
    const [speedScores, seoScores, aeoScores, recentAlerts] = await Promise.all([
      getLatestScoresPerProject(projectIds, 'SPEED'),
      getLatestScoresPerProject(projectIds, 'SEO'),
      getLatestScoresPerProject(projectIds, 'AEO'),
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
        speed: computeAggregateScore(speedScores),
        seo: computeAggregateScore(seoScores),
        aeo: computeAggregateScore(aeoScores),
        recentAlerts,
      },
    });
  });

  // GET /api/health-dashboard/projects/:id/trends
  // Returns trend data for a specific project:
  //   - Last 10 audits per type (speed, seo, aeo), each with score + createdAt
  app.get('/projects/:id/trends', async (request, reply) => {
    const userId = request.user.userId;
    const params = projectIdParamSchema.safeParse(request.params);
    if (!params.success) {
      throw new ValidationError(params.error.flatten().fieldErrors);
    }

    const project = await prisma.project.findFirst({
      where: { id: params.data.id, userId },
      select: { id: true },
    });
    if (!project) {
      throw new NotFoundError('Project');
    }

    // Get last 10 audits per type, ordered ascending (oldest first) for charting
    const [speedTrends, seoTrends, aeoTrends] = await Promise.all([
      prisma.audit.findMany({
        where: { projectId: params.data.id, type: 'SPEED' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { type: true, score: true, createdAt: true },
      }),
      prisma.audit.findMany({
        where: { projectId: params.data.id, type: 'SEO' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { type: true, score: true, createdAt: true },
      }),
      prisma.audit.findMany({
        where: { projectId: params.data.id, type: 'AEO' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { type: true, score: true, createdAt: true },
      }),
    ]);

    // Reverse to ascending order for timeline display
    const allTrends = [
      ...speedTrends.reverse(),
      ...seoTrends.reverse(),
      ...aeoTrends.reverse(),
    ];

    return reply.send({ data: allTrends });
  });
}

// ─── Helpers ────────────────────────────────────────────────────────

interface LatestAuditScore {
  score: number;
  createdAt: Date;
}

/** Get the latest audit score per project for a given audit type. */
async function getLatestScoresPerProject(
  projectIds: string[],
  type: 'SPEED' | 'SEO' | 'AEO',
): Promise<LatestAuditScore[]> {
  if (projectIds.length === 0) return [];

  // For each project, find the most recent audit of the given type.
  // Using a subquery approach via Prisma — get one audit per project.
  const results = await Promise.all(
    projectIds.map((projectId) =>
      prisma.audit.findFirst({
        where: { projectId, type },
        orderBy: { createdAt: 'desc' },
        select: { score: true, createdAt: true },
      }),
    ),
  );

  return results.filter((r): r is LatestAuditScore => r !== null);
}

/** Compute the average score and most recent check time from a list of scores. */
function computeAggregateScore(
  scores: LatestAuditScore[],
): { score: number; lastChecked: Date } | null {
  const first = scores[0];
  if (!first) return null;

  const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  const lastChecked = scores.reduce(
    (latest, s) => (s.createdAt > latest ? s.createdAt : latest),
    first.createdAt,
  );

  return {
    score: Math.round(avgScore * 100) / 100,
    lastChecked,
  };
}
