import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import * as reportService from '../../services/report-service.js';
import { ValidationError } from '../../utils/errors.js';
import {
  reportIdSchema,
  createReportSchema,
  updateReportSchema,
  shareTokenSchema,
} from './schemas.js';

export async function reportRoutes(app: FastifyInstance) {
  // Public route: get report by share token (no auth required)
  app.get('/shared/:token', async (request, reply) => {
    const params = shareTokenSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const report = await reportService.getReportByShareToken(params.data.token);
    return reply.send({ data: report });
  });

  // All other routes require authentication
  app.register(async (authApp) => {
    authApp.addHook('preHandler', requireAuth);

    // GET /api/reports
    authApp.get('/', async (request, reply) => {
      const reports = await reportService.listReports(request.user.userId);
      return reply.send({ data: reports });
    });

    // GET /api/reports/:id
    authApp.get('/:id', async (request, reply) => {
      const params = reportIdSchema.safeParse(request.params);
      if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

      const report = await reportService.getReport(params.data.id, request.user.userId);
      return reply.send({ data: report });
    });

    // POST /api/reports
    authApp.post('/', async (request, reply) => {
      const body = createReportSchema.safeParse(request.body);
      if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

      const report = await reportService.createReport(request.user.userId, body.data);
      return reply.status(201).send({ data: report });
    });

    // PUT /api/reports/:id
    authApp.put('/:id', async (request, reply) => {
      const params = reportIdSchema.safeParse(request.params);
      if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

      const body = updateReportSchema.safeParse(request.body);
      if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

      const report = await reportService.updateReport(
        params.data.id,
        request.user.userId,
        body.data,
      );
      return reply.send({ data: report });
    });

    // DELETE /api/reports/:id
    authApp.delete('/:id', async (request, reply) => {
      const params = reportIdSchema.safeParse(request.params);
      if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

      await reportService.deleteReport(params.data.id, request.user.userId);
      return reply.status(204).send();
    });

    // POST /api/reports/:id/share — Generate share token
    authApp.post('/:id/share', async (request, reply) => {
      const params = reportIdSchema.safeParse(request.params);
      if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

      const report = await reportService.generateShareToken(
        params.data.id,
        request.user.userId,
      );
      return reply.send({ data: report });
    });
  });
}
