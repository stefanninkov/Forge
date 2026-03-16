import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import { createProjectSchema, updateProjectSchema, projectIdSchema, updateNotesSchema } from './schemas.js';
import * as projectService from '../../services/project-service.js';
import { ValidationError } from '../../utils/errors.js';
import { logActivity } from '../../utils/activity-logger.js';
import { prisma } from '../../db/client.js';

export async function projectRoutes(app: FastifyInstance) {
  // All project routes require authentication
  app.addHook('preHandler', requireAuth);

  // GET /api/projects
  app.get('/', async (request, reply) => {
    const projects = await projectService.listProjects(request.user.userId);
    return reply.send({ data: projects });
  });

  // GET /api/projects/:id
  app.get('/:id', async (request, reply) => {
    const params = projectIdSchema.safeParse(request.params);
    if (!params.success) {
      throw new ValidationError(params.error.flatten().fieldErrors);
    }

    const project = await projectService.getProject(params.data.id, request.user.userId);
    return reply.send({ data: project });
  });

  // POST /api/projects
  app.post('/', async (request, reply) => {
    const parsed = createProjectSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.flatten().fieldErrors);
    }

    const project = await projectService.createProject(request.user.userId, parsed.data);
    await logActivity({ userId: request.user.userId, projectId: project.id, action: 'PROJECT_CREATED', details: { name: project.name } });
    return reply.status(201).send({ data: project });
  });

  // PUT /api/projects/:id
  app.put('/:id', async (request, reply) => {
    const params = projectIdSchema.safeParse(request.params);
    if (!params.success) {
      throw new ValidationError(params.error.flatten().fieldErrors);
    }

    const parsed = updateProjectSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.flatten().fieldErrors);
    }

    const project = await projectService.updateProject(
      params.data.id,
      request.user.userId,
      parsed.data,
    );
    await logActivity({ userId: request.user.userId, projectId: project.id, action: 'PROJECT_UPDATED', details: parsed.data });
    return reply.send({ data: project });
  });

  // DELETE /api/projects/:id
  app.delete('/:id', async (request, reply) => {
    const params = projectIdSchema.safeParse(request.params);
    if (!params.success) {
      throw new ValidationError(params.error.flatten().fieldErrors);
    }

    await logActivity({ userId: request.user.userId, projectId: params.data.id, action: 'PROJECT_DELETED' });
    await projectService.deleteProject(params.data.id, request.user.userId);
    return reply.status(204).send();
  });

  // POST /api/projects/:id/duplicate
  app.post('/:id/duplicate', async (request, reply) => {
    const params = projectIdSchema.safeParse(request.params);
    if (!params.success) {
      throw new ValidationError(params.error.flatten().fieldErrors);
    }

    const project = await projectService.duplicateProject(params.data.id, request.user.userId);
    await logActivity({
      userId: request.user.userId,
      projectId: project.id,
      action: 'PROJECT_CREATED',
      details: { duplicatedFrom: params.data.id, name: project.name },
    });
    return reply.status(201).send({ data: project });
  });

  // GET /api/projects/:id/notes
  app.get('/:id/notes', async (request, reply) => {
    const params = projectIdSchema.safeParse(request.params);
    if (!params.success) {
      throw new ValidationError(params.error.flatten().fieldErrors);
    }

    const project = await projectService.getProject(params.data.id, request.user.userId);
    return reply.send({ data: { notes: project.notes ?? '' } });
  });

  // PUT /api/projects/:id/notes
  app.put('/:id/notes', async (request, reply) => {
    const params = projectIdSchema.safeParse(request.params);
    if (!params.success) {
      throw new ValidationError(params.error.flatten().fieldErrors);
    }

    const parsed = updateNotesSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.flatten().fieldErrors);
    }

    const project = await projectService.updateProjectNotes(
      params.data.id,
      request.user.userId,
      parsed.data.notes,
    );
    return reply.send({ data: { notes: project.notes ?? '' } });
  });

  // GET /api/projects/:id/scores — latest audit scores for a project
  app.get('/:id/scores', async (request, reply) => {
    const params = projectIdSchema.safeParse(request.params);
    if (!params.success) {
      throw new ValidationError(params.error.flatten().fieldErrors);
    }

    // Verify ownership
    await projectService.getProject(params.data.id, request.user.userId);

    // Get latest audit of each type
    const [speed, seo, aeo] = await Promise.all([
      prisma.audit.findFirst({
        where: { projectId: params.data.id, type: 'SPEED' },
        orderBy: { createdAt: 'desc' },
        select: { score: true },
      }),
      prisma.audit.findFirst({
        where: { projectId: params.data.id, type: 'SEO' },
        orderBy: { createdAt: 'desc' },
        select: { score: true },
      }),
      prisma.audit.findFirst({
        where: { projectId: params.data.id, type: 'AEO' },
        orderBy: { createdAt: 'desc' },
        select: { score: true },
      }),
    ]);

    return reply.send({
      data: {
        speed: speed?.score ?? null,
        seo: seo?.score ?? null,
        aeo: aeo?.score ?? null,
      },
    });
  });
}
