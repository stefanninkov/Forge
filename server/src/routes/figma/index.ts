import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import * as figmaService from '../../services/figma-service.js';
import { ValidationError } from '../../utils/errors.js';
import {
  analyzeFigmaSchema,
  aiSuggestSchema,
  updateAnalysisSchema,
  analysisIdSchema,
} from './schemas.js';

export async function figmaRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // POST /api/figma/analyze — Parse Figma file + run audit
  app.post('/analyze', async (request, reply) => {
    const body = analyzeFigmaSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const result = await figmaService.analyzeFigmaFile(
      request.user.userId,
      body.data.projectId,
      body.data.figmaUrl,
      body.data.pageName,
    );
    return reply.status(201).send({ data: result });
  });

  // POST /api/figma/ai-suggest — Run Claude AI analysis
  app.post('/ai-suggest', async (request, reply) => {
    const body = aiSuggestSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const suggestions = await figmaService.runAiSuggestions(
      request.user.userId,
      body.data.analysisId,
    );
    return reply.send({ data: suggestions });
  });

  // GET /api/figma/analyses/:id — Get a single analysis
  app.get('/analyses/:id', async (request, reply) => {
    const params = analysisIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const analysis = await figmaService.getAnalysis(request.user.userId, params.data.id);
    return reply.send({ data: analysis });
  });

  // PUT /api/figma/analyses/:id — Save edited structure
  app.put('/analyses/:id', async (request, reply) => {
    const params = analysisIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    const body = updateAnalysisSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const analysis = await figmaService.updateAnalysis(
      request.user.userId,
      params.data.id,
      body.data.finalStructure,
    );
    return reply.send({ data: analysis });
  });

  // POST /api/figma/analyses/:id/push — Push to Webflow (stub)
  app.post('/analyses/:id/push', async (request, reply) => {
    const params = analysisIdSchema.safeParse(request.params);
    if (!params.success) throw new ValidationError(params.error.flatten().fieldErrors);

    return reply.status(501).send({
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Push to Webflow requires MCP connection. Coming soon.',
      },
    });
  });
}
