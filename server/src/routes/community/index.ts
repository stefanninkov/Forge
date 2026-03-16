import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { ValidationError } from '../../utils/errors.js';
import * as communityService from '../../services/community-service.js';

const templateFiltersSchema = z.object({
  category: z.string().optional(),
  type: z.enum(['SKELETON', 'STYLED']).optional(),
  search: z.string().optional(),
  sort: z.enum(['recent', 'popular', 'name']).optional(),
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(24),
});

const presetFiltersSchema = z.object({
  category: z.string().optional(),
  engine: z.enum(['CSS', 'GSAP']).optional(),
  trigger: z.enum(['SCROLL', 'HOVER', 'CLICK', 'LOAD']).optional(),
  search: z.string().optional(),
  sort: z.enum(['recent', 'popular', 'name']).optional(),
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(24),
});

const idParamSchema = z.object({ id: z.string().uuid() });

export async function communityRoutes(app: FastifyInstance) {
  // ── Public routes (no auth required) ──

  // GET /api/community/templates — List published templates
  app.get('/templates', async (request, reply) => {
    const query = templateFiltersSchema.safeParse(request.query);
    if (!query.success) throw new ValidationError(query.error.flatten().fieldErrors);

    const { skip, take, ...filters } = query.data;
    const result = await communityService.listPublishedTemplates({ ...filters, skip, take });

    return reply.send({ data: result.templates, total: result.total, hasMore: result.hasMore });
  });

  // GET /api/community/presets — List published presets
  app.get('/presets', async (request, reply) => {
    const query = presetFiltersSchema.safeParse(request.query);
    if (!query.success) throw new ValidationError(query.error.flatten().fieldErrors);

    const { skip, take, ...filters } = query.data;
    const result = await communityService.listPublishedPresets({ ...filters, skip, take });

    return reply.send({ data: result.presets, total: result.total, hasMore: result.hasMore });
  });

  // ── Authenticated template routes ──

  // POST /api/community/templates/:id/publish — Publish a template
  app.post('/templates/:id/publish', { preHandler: requireAuth }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const template = await communityService.publishTemplate(request.user.userId, params.data.id);
    return reply.status(200).send({ data: template });
  });

  // POST /api/community/templates/:id/unpublish — Unpublish a template
  app.post('/templates/:id/unpublish', { preHandler: requireAuth }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const template = await communityService.unpublishTemplate(request.user.userId, params.data.id);
    return reply.status(200).send({ data: template });
  });

  // POST /api/community/templates/:id/install — Install (clone) a published template
  app.post('/templates/:id/install', { preHandler: requireAuth }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const template = await communityService.installTemplate(request.user.userId, params.data.id);
    return reply.status(201).send({ data: template });
  });

  // ── Authenticated preset routes ──

  // POST /api/community/presets/:id/publish — Publish a preset
  app.post('/presets/:id/publish', { preHandler: requireAuth }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const preset = await communityService.publishPreset(request.user.userId, params.data.id);
    return reply.status(200).send({ data: preset });
  });

  // POST /api/community/presets/:id/unpublish — Unpublish a preset
  app.post('/presets/:id/unpublish', { preHandler: requireAuth }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const preset = await communityService.unpublishPreset(request.user.userId, params.data.id);
    return reply.status(200).send({ data: preset });
  });

  // POST /api/community/presets/:id/install — Install (clone) a published preset
  app.post('/presets/:id/install', { preHandler: requireAuth }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const preset = await communityService.installPreset(request.user.userId, params.data.id);
    return reply.status(201).send({ data: preset });
  });

  // ── Legacy community template routes (CommunityTemplate model) ──

  // GET /api/community/browse — Browse community templates with likes
  app.get('/browse', { preHandler: requireAuth }, async (request, reply) => {
    const browseSchema = z.object({
      category: z.string().optional(),
      type: z.enum(['SKELETON', 'STYLED']).optional(),
      search: z.string().optional(),
      sort: z.enum(['recent', 'popular', 'most-liked']).optional(),
      featured: z.coerce.boolean().optional(),
      skip: z.coerce.number().int().min(0).default(0),
      take: z.coerce.number().int().min(1).max(100).default(24),
    });

    const query = browseSchema.safeParse(request.query);
    if (!query.success) throw new ValidationError(query.error.flatten().fieldErrors);

    const { skip, take, ...filters } = query.data;
    const result = await communityService.browseTemplates(filters, skip, take);

    const likedSet = await communityService.getUserLikes(
      request.user.userId,
      result.templates.map((t) => t.id),
    );

    const data = result.templates.map((t) => ({
      ...t,
      isLiked: likedSet.has(t.id),
    }));

    return reply.send({ data, total: result.total, hasMore: result.hasMore });
  });

  // GET /api/community/browse/:id — Get single community template
  app.get('/browse/:id', { preHandler: requireAuth }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const template = await communityService.getCommunityTemplate(params.data.id);
    const likedSet = await communityService.getUserLikes(request.user.userId, [template.id]);

    return reply.send({ data: { ...template, isLiked: likedSet.has(template.id) } });
  });

  // POST /api/community/browse/:id/fork — Fork a community template
  app.post('/browse/:id/fork', { preHandler: requireAuth }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const template = await communityService.forkTemplate(params.data.id, request.user.userId);
    return reply.status(201).send({ data: template });
  });

  // POST /api/community/browse/:id/like — Toggle like
  app.post('/browse/:id/like', { preHandler: requireAuth }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const result = await communityService.toggleLike(params.data.id, request.user.userId);
    return reply.send({ data: result });
  });

  // GET /api/community/mine — User's published templates
  app.get('/mine', { preHandler: requireAuth }, async (request, reply) => {
    const published = await communityService.getUserPublished(request.user.userId);
    return reply.send({ data: published });
  });
}
