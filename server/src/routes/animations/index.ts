import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import * as animationService from '../../services/animation-service.js';
import { ValidationError } from '../../utils/errors.js';
import {
  presetFiltersSchema,
  createPresetSchema,
  updatePresetSchema,
  updateAnimationConfigSchema,
  presetIdSchema,
  projectIdSchema,
} from './schemas.js';

export async function animationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/animations/presets — List all presets (system + user)
  app.get('/presets', async (request, reply) => {
    const query = presetFiltersSchema.safeParse(request.query);
    if (!query.success) throw new ValidationError(query.error.flatten().fieldErrors);

    const presets = await animationService.listPresets(request.user.userId, query.data);
    return reply.send({ data: presets });
  });

  // GET /api/animations/presets/:id — Get single preset
  app.get('/presets/:id', async (request, reply) => {
    const params = presetIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const preset = await animationService.getPreset(params.data.id, request.user.userId);
    return reply.send({ data: preset });
  });

  // POST /api/animations/presets — Create custom preset
  app.post('/presets', async (request, reply) => {
    const body = createPresetSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const preset = await animationService.createPreset(request.user.userId, body.data);
    return reply.status(201).send({ data: preset });
  });

  // PUT /api/animations/presets/:id — Update custom preset
  app.put('/presets/:id', async (request, reply) => {
    const params = presetIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const body = updatePresetSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const preset = await animationService.updatePreset(
      params.data.id,
      request.user.userId,
      body.data,
    );
    return reply.send({ data: preset });
  });

  // DELETE /api/animations/presets/:id — Delete custom preset
  app.delete('/presets/:id', async (request, reply) => {
    const params = presetIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    await animationService.deletePreset(params.data.id, request.user.userId);
    return reply.status(204).send();
  });

  // POST /api/animations/seed — Seed system presets (admin/dev utility)
  app.post('/seed', async (_request, reply) => {
    const result = await animationService.seedSystemPresets();
    return reply.send({ data: result });
  });
}

export async function projectAnimationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/projects/:id/animations — Get project animation config
  app.get('/:id/animations', async (request, reply) => {
    const params = projectIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const config = await animationService.getProjectAnimationConfig(
      params.data.id,
      request.user.userId,
    );
    return reply.send({ data: config });
  });

  // PUT /api/projects/:id/animations — Update project animation config
  app.put('/:id/animations', async (request, reply) => {
    const params = projectIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const body = updateAnimationConfigSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const result = await animationService.updateProjectAnimationConfig(
      params.data.id,
      request.user.userId,
      body.data,
    );
    return reply.send({ data: result });
  });

  // POST /api/projects/:id/animations/generate — Generate master script
  app.post('/:id/animations/generate', async (request, reply) => {
    const params = projectIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const result = await animationService.generateMasterScript(
      params.data.id,
      request.user.userId,
    );
    return reply.send({ data: result });
  });
}
