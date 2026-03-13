import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import { ValidationError } from '../../utils/errors.js';
import * as auditService from '../../services/audit-service.js';
import { runSpeedAudit } from '../../services/speed-service.js';
import { runSeoAudit } from '../../services/seo-service.js';
import { runAeoAudit } from '../../services/aeo-service.js';
import {
  runAuditSchema,
  auditFiltersSchema,
  auditHistorySchema,
  projectIdSchema,
  auditIdSchema,
  alertIdSchema,
} from './schemas.js';

export async function auditRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // POST /api/projects/:id/audits/speed — Run speed audit
  app.post('/projects/:id/audits/speed', async (request, reply) => {
    const params = projectIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const body = runAuditSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const audit = await runSpeedAudit(params.data.id, body.data.url, request.user.userId);
    return reply.status(201).send({ data: audit });
  });

  // POST /api/projects/:id/audits/seo — Run SEO audit
  app.post('/projects/:id/audits/seo', async (request, reply) => {
    const params = projectIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const body = runAuditSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const audit = await runSeoAudit(params.data.id, body.data.url, request.user.userId);
    return reply.status(201).send({ data: audit });
  });

  // POST /api/projects/:id/audits/aeo — Run AEO audit
  app.post('/projects/:id/audits/aeo', async (request, reply) => {
    const params = projectIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const body = runAuditSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const audit = await runAeoAudit(params.data.id, body.data.url, request.user.userId);
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
}
