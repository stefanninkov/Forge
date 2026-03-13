import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import { createProjectSchema, updateProjectSchema, projectIdSchema } from './schemas.js';
import * as projectService from '../../services/project-service.js';
import { ValidationError } from '../../utils/errors.js';

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
    return reply.send({ data: project });
  });

  // DELETE /api/projects/:id
  app.delete('/:id', async (request, reply) => {
    const params = projectIdSchema.safeParse(request.params);
    if (!params.success) {
      throw new ValidationError(params.error.flatten().fieldErrors);
    }

    await projectService.deleteProject(params.data.id, request.user.userId);
    return reply.status(204).send();
  });
}
