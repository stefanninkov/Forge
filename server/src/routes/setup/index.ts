import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import { updateSetupItemSchema, createProfileSchema, applyProfileSchema } from './schemas.js';
import * as setupService from '../../services/setup-service.js';
import { ValidationError } from '../../utils/errors.js';
import { SETUP_CHECKLIST } from '../../config/setup-checklist.js';
import { z } from 'zod';

const projectIdParam = z.object({ id: z.string().uuid() });
const itemKeyParam = z.object({ id: z.string().uuid(), item: z.string().min(1) });
const profileIdParam = z.object({ profileId: z.string().uuid() });

export async function setupRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/projects/:id/setup — Get setup progress
  app.get('/:id/setup', async (request, reply) => {
    const params = projectIdParam.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const data = await setupService.getSetupProgress(params.data.id, request.user.userId);
    return reply.send({ data });
  });

  // PUT /api/projects/:id/setup/:item — Update item status
  app.put('/:id/setup/:item', async (request, reply) => {
    const params = itemKeyParam.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const body = updateSetupItemSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const result = await setupService.updateSetupItem(
      params.data.id,
      request.user.userId,
      params.data.item,
      body.data.status,
    );
    return reply.send({ data: result });
  });

  // POST /api/projects/:id/setup/apply-profile — Apply a profile
  app.post('/:id/setup/apply-profile', async (request, reply) => {
    const params = projectIdParam.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const body = applyProfileSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const result = await setupService.applyProfile(
      params.data.id,
      request.user.userId,
      body.data.profileId,
    );
    return reply.send({ data: result });
  });

  // POST /api/projects/:id/setup/reset — Reset all progress
  app.post('/:id/setup/reset', async (request, reply) => {
    const params = projectIdParam.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    await setupService.resetSetupProgress(params.data.id, request.user.userId);
    return reply.send({ success: true });
  });

  // POST /api/projects/:id/setup/execute/:item — Auto-execute via MCP (stub)
  app.post('/:id/setup/execute/:item', async (request, reply) => {
    const params = itemKeyParam.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    // MCP execution is a future feature — for now, return stub
    return reply.status(501).send({
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'MCP auto-execution is not yet available. Mark the item as completed manually.',
      },
    });
  });
}

export async function setupProfileRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/setup-profiles — List profiles
  app.get('/', async (request, reply) => {
    const profiles = await setupService.listProfiles(request.user.userId);
    return reply.send({ data: profiles });
  });

  // POST /api/setup-profiles — Create profile
  app.post('/', async (request, reply) => {
    const body = createProfileSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const profile = await setupService.createProfile(
      request.user.userId,
      body.data.name,
      body.data.checklistConfig,
    );
    return reply.status(201).send({ data: profile });
  });

  // DELETE /api/setup-profiles/:profileId — Delete profile
  app.delete('/:profileId', async (request, reply) => {
    const params = profileIdParam.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    await setupService.deleteProfile(params.data.profileId, request.user.userId);
    return reply.status(204).send();
  });

  // GET /api/setup-checklist — Get the full checklist definition (no auth needed in theory, but keeping consistent)
  app.get('/checklist', async (_request, reply) => {
    return reply.send({ data: SETUP_CHECKLIST });
  });
}
