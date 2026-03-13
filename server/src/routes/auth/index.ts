import { FastifyInstance } from 'fastify';
import { registerSchema, loginSchema, refreshSchema, logoutSchema, updateAccountSchema, changePasswordSchema } from './schemas.js';
import * as authService from '../../services/auth-service.js';
import { requireAuth } from '../../middleware/auth.js';
import { ValidationError } from '../../utils/errors.js';

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/register
  app.post('/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.flatten().fieldErrors);
    }

    const result = await authService.register(
      parsed.data.email,
      parsed.data.password,
      parsed.data.name,
    );

    return reply.status(201).send(result);
  });

  // POST /api/auth/login
  app.post('/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.flatten().fieldErrors);
    }

    const result = await authService.login(parsed.data.email, parsed.data.password);
    return reply.send(result);
  });

  // POST /api/auth/refresh
  app.post('/refresh', async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.flatten().fieldErrors);
    }

    const tokens = await authService.refreshAccessToken(parsed.data.refreshToken);
    return reply.send(tokens);
  });

  // POST /api/auth/logout
  app.post('/logout', { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = logoutSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.flatten().fieldErrors);
    }

    await authService.revokeRefreshToken(parsed.data.refreshToken);
    return reply.send({ success: true });
  });

  // GET /api/auth/me
  app.get('/me', { preHandler: [requireAuth] }, async (request, reply) => {
    const { prisma } = await import('../../db/client.js');
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      select: { id: true, email: true, name: true, avatarUrl: true, plan: true },
    });

    if (!user) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    return reply.send({ user });
  });

  // PUT /api/auth/account — update name/email
  app.put('/account', { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = updateAccountSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.flatten().fieldErrors);
    }

    const user = await authService.updateAccount(request.user.userId, parsed.data);
    return reply.send({ data: user });
  });

  // PUT /api/auth/password — change password
  app.put('/password', { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = changePasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.flatten().fieldErrors);
    }

    await authService.changePassword(
      request.user.userId,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );
    return reply.send({ success: true });
  });

  // Google OAuth stubs
  app.get('/google', async (_request, reply) => {
    return reply.status(501).send({
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      },
    });
  });

  app.get('/google/callback', async (_request, reply) => {
    return reply.status(501).send({
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Google OAuth not configured.',
      },
    });
  });
}
