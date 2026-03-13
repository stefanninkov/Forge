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
import { auditRoutes } from './routes/audits/index.js';
import { activityRoutes } from './routes/activity/index.js';
import { favoriteRoutes } from './routes/favorites/index.js';
import { reportRoutes } from './routes/reports/index.js';
import { settingsRoutes } from './routes/settings/index.js';
import { sectionRoutes } from './routes/sections/index.js';
import { scalingRoutes } from './routes/scaling/index.js';
import { healthDashboardRoutes } from './routes/health-dashboard/index.js';
import { exportRoutes } from './routes/export/index.js';
import { mcpRoutes } from './routes/mcp/index.js';

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
  await app.register(auditRoutes, { prefix: '/api' });
  await app.register(activityRoutes, { prefix: '/api/activity' });
  await app.register(favoriteRoutes, { prefix: '/api/favorites' });
  await app.register(reportRoutes, { prefix: '/api/reports' });
  await app.register(settingsRoutes, { prefix: '/api/settings' });
  await app.register(sectionRoutes, { prefix: '/api/sections' });
  await app.register(scalingRoutes, { prefix: '/api/projects' });
  await app.register(healthDashboardRoutes, { prefix: '/api/health-dashboard' });
  await app.register(exportRoutes, { prefix: '/api/export' });
  await app.register(mcpRoutes, { prefix: '/api/mcp' });

  // Health check
  app.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Start
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`Server running on port ${env.PORT}`);

    // Keep-alive: ping own health endpoint every 13 minutes to prevent
    // Render free-tier spin-down (which causes 30-50s cold starts).
    if (env.NODE_ENV === 'production') {
      const KEEP_ALIVE_INTERVAL = 13 * 60 * 1000; // 13 minutes
      const selfUrl = env.API_URL || `http://localhost:${env.PORT}`;
      setInterval(async () => {
        try {
          await fetch(`${selfUrl}/api/health`);
        } catch {
          // Silently ignore — this is just a keep-alive ping
        }
      }, KEEP_ALIVE_INTERVAL);
      app.log.info('Keep-alive ping enabled (every 13 minutes)');
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
