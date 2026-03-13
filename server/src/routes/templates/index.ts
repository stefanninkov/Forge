import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import * as templateService from '../../services/template-service.js';
import { ValidationError } from '../../utils/errors.js';
import { logActivity } from '../../utils/activity-logger.js';
import {
  templateFiltersSchema,
  createTemplateSchema,
  updateTemplateSchema,
  templateIdSchema,
} from './schemas.js';

export async function templateRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/templates — List all templates (presets + user's custom)
  app.get('/', async (request, reply) => {
    const query = templateFiltersSchema.safeParse(request.query);
    if (!query.success) throw new ValidationError(query.error.flatten().fieldErrors);

    const templates = await templateService.listTemplates(request.user.userId, query.data);
    return reply.send({ data: templates });
  });

  // GET /api/templates/:id — Get single template with full structure
  app.get('/:id', async (request, reply) => {
    const params = templateIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const template = await templateService.getTemplate(params.data.id, request.user.userId);
    return reply.send({ data: template });
  });

  // POST /api/templates — Create custom template
  app.post('/', async (request, reply) => {
    const body = createTemplateSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const template = await templateService.createTemplate(request.user.userId, body.data);
    await logActivity({ userId: request.user.userId, action: 'TEMPLATE_CREATED', details: { name: template.name, category: template.category } });
    return reply.status(201).send({ data: template });
  });

  // PUT /api/templates/:id — Update custom template
  app.put('/:id', async (request, reply) => {
    const params = templateIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const body = updateTemplateSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const template = await templateService.updateTemplate(
      params.data.id,
      request.user.userId,
      body.data,
    );
    return reply.send({ data: template });
  });

  // DELETE /api/templates/:id — Delete custom template
  app.delete('/:id', async (request, reply) => {
    const params = templateIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    await templateService.deleteTemplate(params.data.id, request.user.userId);
    return reply.status(204).send();
  });

  // POST /api/templates/:id/duplicate — Duplicate a template
  app.post('/:id/duplicate', async (request, reply) => {
    const params = templateIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const template = await templateService.duplicateTemplate(params.data.id, request.user.userId);
    return reply.status(201).send({ data: template });
  });

  // POST /api/templates/:id/push — Push to Webflow via MCP (stub)
  app.post('/:id/push', async (_request, reply) => {
    return reply.status(501).send({
      error: { code: 'NOT_IMPLEMENTED', message: 'Push to Webflow requires MCP connection.' },
    });
  });

  // POST /api/templates/seed — Seed preset templates (dev utility)
  app.post('/seed', async (_request, reply) => {
    const result = await templateService.seedPresetTemplates();
    return reply.send({ data: result });
  });
}
