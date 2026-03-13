import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { authMiddleware } from './middleware/auth.js';
import { authRoutes } from './routes/auth/index.js';
import { projectRoutes } from './routes/projects/index.js';
import { setupRoutes, setupProfileRoutes } from './routes/setup/index.js';
import { animationRoutes, projectAnimationRoutes } from './routes/animations/index.js';
import { integrationRoutes } from './routes/integrations/index.js';
import { figmaRoutes } from './routes/figma/index.js';
import { templateRoutes } from './routes/templates/index.js';

const isDev = env.NODE_ENV === 'development';

const app = Fastify({
  logger: {
    level: isDev ? 'info' : 'warn',
    ...(isDev ? { transport: { target: 'pino-pretty', options: { colorize: true } } } : {}),
  },
});

async function start() {
  // Error handler
  app.setErrorHandler(errorHandler);

  // Plugins
  await app.register(cors, {
    origin: env.FRONTEND_URL.split(',').map((u) => u.trim()),
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Auth middleware (decorates request with user property)
  await app.register(authMiddleware);

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(projectRoutes, { prefix: '/api/projects' });
  await app.register(setupRoutes, { prefix: '/api/projects' });
  await app.register(setupProfileRoutes, { prefix: '/api/setup-profiles' });
  await app.register(animationRoutes, { prefix: '/api/animations' });
  await app.register(projectAnimationRoutes, { prefix: '/api/projects' });
  await app.register(integrationRoutes, { prefix: '/api/integrations' });
  await app.register(figmaRoutes, { prefix: '/api/figma' });
  await app.register(templateRoutes, { prefix: '/api/templates' });

  // Health check
  app.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Start
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`Server running on port ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
