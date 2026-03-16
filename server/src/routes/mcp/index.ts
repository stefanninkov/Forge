import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import * as mcpService from '../../services/mcp-service.js';
import { z } from 'zod';
import { ValidationError } from '../../utils/errors.js';

const siteIdParam = z.object({ siteId: z.string().min(1) });

const pushScriptSchema = z.object({
  siteId: z.string().min(1),
  scriptContent: z.string().min(1),
  location: z.enum(['header', 'footer']).default('footer'),
});

const pushScalingSchema = z.object({
  siteId: z.string().min(1),
  scalingCss: z.string().min(1),
});

export async function mcpRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/mcp/status — Check Webflow connection status
  app.get('/status', async (request, reply) => {
    const result = await mcpService.checkConnection(request.user.userId);
    return reply.send({
      data: {
        connected: result.connected,
        site: result.site ?? null,
      },
    });
  });

  // POST /api/mcp/reconnect — Attempt reconnection (re-checks token)
  app.post('/reconnect', async (request, reply) => {
    const result = await mcpService.checkConnection(request.user.userId);
    return reply.send({
      data: {
        status: result.connected ? 'connected' : 'disconnected',
        message: result.connected
          ? 'Connected to Webflow successfully.'
          : 'Connection failed. Verify your Webflow API token in Settings → Integrations.',
        site: result.site ?? null,
      },
    });
  });

  // GET /api/mcp/sites — List accessible Webflow sites
  app.get('/sites', async (request, reply) => {
    const sites = await mcpService.listSites(request.user.userId);
    return reply.send({ data: sites });
  });

  // GET /api/mcp/sites/:siteId/pages — List pages for a site
  app.get('/sites/:siteId/pages', async (request, reply) => {
    const params = siteIdParam.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const pages = await mcpService.listPages(request.user.userId, params.data.siteId);
    return reply.send({ data: pages });
  });

  // POST /api/mcp/push/script — Push master animation script to site
  app.post('/push/script', async (request, reply) => {
    const body = pushScriptSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const projectId = (request.body as Record<string, string>).projectId;
    if (!projectId) throw new ValidationError({ projectId: ['Project ID is required'] });

    const result = await mcpService.pushMasterScript({
      userId: request.user.userId,
      projectId,
      siteId: body.data.siteId,
      scriptContent: body.data.scriptContent,
      location: body.data.location,
    });
    return reply.send({ data: result });
  });

  // POST /api/mcp/push/scaling — Push scaling CSS to site
  app.post('/push/scaling', async (request, reply) => {
    const body = pushScalingSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const projectId = (request.body as Record<string, string>).projectId;
    if (!projectId) throw new ValidationError({ projectId: ['Project ID is required'] });

    const result = await mcpService.pushScalingCss({
      userId: request.user.userId,
      projectId,
      siteId: body.data.siteId,
      scalingCss: body.data.scalingCss,
    });
    return reply.send({ data: result });
  });
}
