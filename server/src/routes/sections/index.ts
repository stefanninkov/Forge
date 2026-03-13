import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../db/client.js';
import { requireAuth } from '../../middleware/auth.js';
import { logActivity } from '../../utils/activity-logger.js';

const createSectionSchema = z.object({
  name: z.string().min(1).max(200),
  html: z.string(),
  css: z.string().default(''),
  attributes: z.record(z.unknown()).default({}),
  elementCount: z.number().int().default(0),
  capturedFrom: z.enum(['url_crawl', 'mcp_capture', 'manual_paste']),
  projectId: z.string().uuid().optional(),
  folderId: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
  thumbnail: z.string().optional(),
});

const updateSectionSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  html: z.string().optional(),
  css: z.string().optional(),
  attributes: z.record(z.unknown()).optional(),
  folderId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

const listSectionsQuery = z.object({
  capturedFrom: z.enum(['url_crawl', 'mcp_capture', 'manual_paste']).optional(),
  folderId: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const createFolderSchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().uuid().optional(),
});

const updateFolderSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function sectionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/sections
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId as string;
    const query = listSectionsQuery.parse(request.query);

    const where: Record<string, unknown> = { userId };
    if (query.capturedFrom) where.capturedFrom = query.capturedFrom;
    if (query.folderId) where.folderId = query.folderId;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search } },
      ];
    }

    const [sections, total] = await Promise.all([
      prisma.capturedSection.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
        include: { folder: { select: { id: true, name: true } } },
      }),
      prisma.capturedSection.count({ where }),
    ]);

    return reply.send({ data: sections, total });
  });

  // GET /api/sections/:id
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId as string;
    const { id } = request.params as { id: string };

    const section = await prisma.capturedSection.findFirst({
      where: { id, userId },
      include: { folder: { select: { id: true, name: true } } },
    });

    if (!section) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Section not found' } });
    }

    return reply.send({ data: section });
  });

  // POST /api/sections
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId as string;
    const body = createSectionSchema.parse(request.body);

    const section = await prisma.capturedSection.create({
      data: {
        userId,
        name: body.name,
        html: body.html,
        css: body.css,
        attributes: body.attributes as Prisma.InputJsonValue,
        elementCount: body.elementCount,
        capturedFrom: body.capturedFrom,
        projectId: body.projectId,
        folderId: body.folderId,
        tags: body.tags,
        thumbnail: body.thumbnail,
      },
    });

    logActivity({ userId, action: 'SECTION_CAPTURED', projectId: body.projectId, details: { name: body.name, capturedFrom: body.capturedFrom } });
    return reply.status(201).send({ data: section });
  });

  // PUT /api/sections/:id
  app.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId as string;
    const { id } = request.params as { id: string };
    const body = updateSectionSchema.parse(request.body);

    const existing = await prisma.capturedSection.findFirst({ where: { id, userId } });
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Section not found' } });
    }

    const updateData: Prisma.CapturedSectionUpdateInput = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.html !== undefined) updateData.html = body.html;
    if (body.css !== undefined) updateData.css = body.css;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.attributes !== undefined) updateData.attributes = body.attributes as Prisma.InputJsonValue;
    if (body.folderId !== undefined) {
      updateData.folder = body.folderId ? { connect: { id: body.folderId } } : { disconnect: true };
    }

    const section = await prisma.capturedSection.update({
      where: { id },
      data: updateData,
    });

    return reply.send({ data: section });
  });

  // DELETE /api/sections/:id
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId as string;
    const { id } = request.params as { id: string };

    const existing = await prisma.capturedSection.findFirst({ where: { id, userId } });
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Section not found' } });
    }

    await prisma.capturedSection.delete({ where: { id } });
    return reply.send({ data: { success: true } });
  });

  // --- Folders ---

  // GET /api/sections/folders
  app.get('/folders', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId as string;

    const folders = await prisma.sectionFolder.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { sections: true } } },
    });

    return reply.send({ data: folders });
  });

  // POST /api/sections/folders
  app.post('/folders', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId as string;
    const body = createFolderSchema.parse(request.body);

    const folder = await prisma.sectionFolder.create({
      data: {
        userId,
        name: body.name,
        parentId: body.parentId,
      },
    });

    return reply.status(201).send({ data: folder });
  });

  // PUT /api/sections/folders/:id
  app.put('/folders/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId as string;
    const { id } = request.params as { id: string };
    const body = updateFolderSchema.parse(request.body);

    const existing = await prisma.sectionFolder.findFirst({ where: { id, userId } });
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Folder not found' } });
    }

    const folder = await prisma.sectionFolder.update({
      where: { id },
      data: { name: body.name },
    });

    return reply.send({ data: folder });
  });

  // DELETE /api/sections/folders/:id
  app.delete('/folders/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId as string;
    const { id } = request.params as { id: string };

    const existing = await prisma.sectionFolder.findFirst({ where: { id, userId } });
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Folder not found' } });
    }

    // Move sections to no folder before deleting
    await prisma.capturedSection.updateMany({
      where: { folderId: id },
      data: { folderId: null },
    });

    await prisma.sectionFolder.delete({ where: { id } });
    return reply.send({ data: { success: true } });
  });
}
