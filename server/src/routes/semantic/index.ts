import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import { analyzeSemanticSchema } from './schemas.js';
import { analyzeSemanticHtml } from '../../services/semantic-html-service.js';
import { ValidationError } from '../../utils/errors.js';
import type { ParsedNode } from '../../services/semantic-html-service.js';

export async function semanticRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // POST /api/semantic/analyze
  app.post('/analyze', async (request, reply) => {
    const parsed = analyzeSemanticSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.flatten().fieldErrors);
    }

    const result = analyzeSemanticHtml(parsed.data.nodes as ParsedNode[]);
    return reply.send({ data: result });
  });
}
