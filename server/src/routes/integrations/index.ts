import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import * as integrationService from '../../services/integration-service.js';
import { ValidationError } from '../../utils/errors.js';
import { upsertIntegrationSchema, providerParamSchema } from './schemas.js';

export async function integrationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/integrations — List user's connected integrations
  app.get('/', async (request, reply) => {
    const integrations = await integrationService.listIntegrations(request.user.userId);
    return reply.send({ data: integrations });
  });

  // POST /api/integrations — Store/update an integration
  app.post('/', async (request, reply) => {
    const body = upsertIntegrationSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const integration = await integrationService.upsertIntegration(
      request.user.userId,
      {
        ...body.data,
        expiresAt: body.data.expiresAt ? new Date(body.data.expiresAt) : undefined,
      },
    );
    return reply.status(201).send({ data: integration });
  });

  // DELETE /api/integrations/:provider — Disconnect an integration
  app.delete('/:provider', async (request, reply) => {
    const params = providerParamSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    await integrationService.deleteIntegration(request.user.userId, params.data.provider);
    return reply.status(204).send();
  });
}
