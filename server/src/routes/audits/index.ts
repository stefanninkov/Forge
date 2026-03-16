import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { ValidationError } from '../../utils/errors.js';
import * as auditService from '../../services/audit-service.js';
import { runSpeedAudit } from '../../services/speed-service.js';
import { runSeoAudit } from '../../services/seo-service.js';
import { runAeoAudit } from '../../services/aeo-service.js';
import { getAiSeoRecommendations, getAeoRecommendations } from '../../services/ai-service.js';
import * as integrationService from '../../services/integration-service.js';
import {
  runAuditSchema,
  auditFiltersSchema,
  auditHistorySchema,
  projectIdSchema,
  auditIdSchema,
  alertIdSchema,
  createScheduleSchema,
  updateScheduleSchema,
  scheduleIdSchema,
} from './schemas.js';
import * as scheduleService from '../../services/audit-schedule-service.js';
import { logActivity } from '../../utils/activity-logger.js';

export async function auditRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // POST /api/projects/:id/audits/speed — Run speed audit
  app.post('/projects/:id/audits/speed', async (request, reply) => {
    const params = projectIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const body = runAuditSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const audit = await runSpeedAudit(params.data.id, body.data.url, request.user.userId);
    logActivity({ userId: request.user.userId, projectId: params.data.id, action: 'AUDIT_RUN', details: { type: 'speed', url: body.data.url } });
    return reply.status(201).send({ data: audit });
  });

  // POST /api/projects/:id/audits/seo — Run SEO audit
  app.post('/projects/:id/audits/seo', async (request, reply) => {
    const params = projectIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const body = runAuditSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const audit = await runSeoAudit(params.data.id, body.data.url, request.user.userId);
    logActivity({ userId: request.user.userId, projectId: params.data.id, action: 'AUDIT_RUN', details: { type: 'seo', url: body.data.url } });
    return reply.status(201).send({ data: audit });
  });

  // POST /api/projects/:id/audits/aeo — Run AEO audit
  app.post('/projects/:id/audits/aeo', async (request, reply) => {
    const params = projectIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const body = runAuditSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const audit = await runAeoAudit(params.data.id, body.data.url, request.user.userId);
    logActivity({ userId: request.user.userId, projectId: params.data.id, action: 'AUDIT_RUN', details: { type: 'aeo', url: body.data.url } });
    return reply.status(201).send({ data: audit });
  });

  // GET /api/projects/:id/audits — List audits for project
  app.get('/projects/:id/audits', async (request, reply) => {
    const params = projectIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const query = auditFiltersSchema.safeParse(request.query);
    if (!query.success) throw new ValidationError(query.error.flatten().fieldErrors);

    const audits = await auditService.listAudits(params.data.id, query.data.type);
    return reply.send({ data: audits });
  });

  // GET /api/projects/:id/audits/history — Score history
  app.get('/projects/:id/audits/history', async (request, reply) => {
    const params = projectIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const query = auditHistorySchema.safeParse(request.query);
    if (!query.success) throw new ValidationError(query.error.flatten().fieldErrors);

    const history = await auditService.getAuditHistory(params.data.id, query.data.type);
    return reply.send({ data: history });
  });

  // GET /api/audits/:id — Audit detail
  app.get('/audits/:id', async (request, reply) => {
    const params = auditIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const audit = await auditService.getAudit(params.data.id);
    return reply.send({ data: audit });
  });

  // DELETE /api/audits/:id — Delete audit
  app.delete('/audits/:id', async (request, reply) => {
    const params = auditIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    await auditService.deleteAudit(params.data.id, request.user.userId);
    return reply.status(204).send();
  });

  // GET /api/projects/:id/alerts — List alerts
  app.get('/projects/:id/alerts', async (request, reply) => {
    const params = projectIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const alerts = await auditService.listAlerts(params.data.id);
    return reply.send({ data: alerts });
  });

  // PUT /api/alerts/:id/read — Mark alert as read
  app.put('/alerts/:id/read', async (request, reply) => {
    const params = alertIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const alert = await auditService.markAlertRead(params.data.id);
    return reply.send({ data: alert });
  });

  // POST /api/audits/:id/ai-recommendations — Get AI-powered recommendations for an audit
  const aiRecommendationsSchema = z.object({ id: z.string().uuid() });
  app.post('/audits/:id/ai-recommendations', async (request, reply) => {
    const params = aiRecommendationsSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const anthropicKey = await integrationService.getAccessToken(request.user.userId, 'anthropic');
    if (!anthropicKey) {
      return reply.status(400).send({
        error: {
          code: 'MISSING_API_KEY',
          message: 'Anthropic API key not configured. Go to Settings → Integrations to add it.',
        },
      });
    }

    const audit = await auditService.getAudit(params.data.id);

    const results = audit.results as Record<string, unknown> ?? {};
    const findings = (results.findings as Array<{ title: string; description: string; severity: string; category: string }>) ?? [];
    const url = audit.urlAudited ?? '';

    let recommendations;
    if (audit.type === 'AEO') {
      recommendations = await getAeoRecommendations(
        anthropicKey,
        findings.map((f) => f.description).join('\n'),
        findings.map((f) => f.title),
      );
    } else {
      recommendations = await getAiSeoRecommendations(anthropicKey, findings, url);
    }

    return reply.send({ data: recommendations });
  });

  // ── Audit Schedules ──────────────────────────────────────────────

  // GET /api/projects/:id/schedules — List schedules for project
  app.get('/projects/:id/schedules', async (request, reply) => {
    const params = projectIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const schedules = await scheduleService.listSchedules(params.data.id);
    return reply.send({ data: schedules });
  });

  // POST /api/projects/:id/schedules — Create/upsert schedule
  app.post('/projects/:id/schedules', async (request, reply) => {
    const params = projectIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const body = createScheduleSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const schedule = await scheduleService.createSchedule({
      userId: request.user.userId,
      projectId: params.data.id,
      type: body.data.type as 'SPEED' | 'SEO' | 'AEO',
      url: body.data.url,
      frequency: body.data.frequency as 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
    });
    return reply.status(201).send({ data: schedule });
  });

  // PUT /api/schedules/:scheduleId — Update schedule
  app.put('/schedules/:scheduleId', async (request, reply) => {
    const params = scheduleIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const body = updateScheduleSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const schedule = await scheduleService.updateSchedule(params.data.scheduleId, request.user.userId, body.data);
    return reply.send({ data: schedule });
  });

  // DELETE /api/schedules/:scheduleId — Delete schedule
  app.delete('/schedules/:scheduleId', async (request, reply) => {
    const params = scheduleIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    await scheduleService.deleteSchedule(params.data.scheduleId, request.user.userId);
    return reply.status(204).send();
  });
}
