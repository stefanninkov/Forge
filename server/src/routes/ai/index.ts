import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { ValidationError } from '../../utils/errors.js';
import { getClassNameSuggestions } from '../../services/ai-service.js';
import { reviewCustomCode } from '../../services/code-review-service.js';
import * as integrationService from '../../services/integration-service.js';

const classNameSchema = z.object({
  elements: z
    .array(
      z.object({
        name: z.string().min(1),
        type: z.string().min(1),
        context: z.string().default(''),
      }),
    )
    .min(1)
    .max(100),
  methodology: z.string().default('client-first'),
});

export async function aiRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // POST /api/ai/class-names — Generate AI class name suggestions
  app.post('/class-names', async (request, reply) => {
    const body = classNameSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const anthropicKey = await integrationService.getAccessToken(request.user.userId, 'anthropic');
    if (!anthropicKey) {
      return reply.status(400).send({
        error: {
          code: 'MISSING_API_KEY',
          message: 'Anthropic API key not configured. Go to Settings → Integrations to add it.',
        },
      });
    }

    const suggestions = await getClassNameSuggestions(
      anthropicKey,
      body.data.elements,
      body.data.methodology,
    );

    return reply.send({ suggestions });
  });

  // POST /api/ai/code-review — Review custom embed code
  const codeReviewSchema = z.object({
    code: z.string().min(1).max(10000),
    codeType: z.enum(['html', 'css', 'javascript']),
    context: z.string().default('webflow-embed'),
  });

  app.post('/code-review', async (request, reply) => {
    const body = codeReviewSchema.safeParse(request.body);
    if (!body.success) throw new ValidationError(body.error.flatten().fieldErrors);

    const anthropicKey = await integrationService.getAccessToken(request.user.userId, 'anthropic');
    if (!anthropicKey) {
      return reply.status(400).send({
        error: {
          code: 'MISSING_API_KEY',
          message: 'Anthropic API key not configured. Go to Settings → Integrations to add it.',
        },
      });
    }

    const result = await reviewCustomCode(
      anthropicKey,
      body.data.code,
      body.data.codeType,
      body.data.context,
    );

    return reply.send({ data: result });
  });
}
