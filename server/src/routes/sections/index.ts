import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../db/client.js';
import { requireAuth } from '../../middleware/auth.js';
import { logActivity } from '../../utils/activity-logger.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';

// ─── Schemas ────────────────────────────────────────────────────

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
  projectId: z.string().uuid().optional(),
  capturedFrom: z.enum(['url_crawl', 'mcp_capture', 'manual_paste']).optional(),
  folderId: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const listFoldersQuery = z.object({
  projectId: z.string().uuid().optional(),
});

const createFolderSchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().uuid().optional(),
});

const updateFolderSchema = z.object({
  name: z.string().min(1).max(100),
});

const captureUrlSchema = z.object({
  url: z.string().url(),
});

const idParamSchema = z.object({
  id: z.string().uuid(),
});

// ─── Helpers ────────────────────────────────────────────────────

async function verifyProjectOwnership(
  projectId: string,
  userId: string,
): Promise<void> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!project) {
    throw new NotFoundError('Project');
  }
}

// ─── Routes ─────────────────────────────────────────────────────

export async function sectionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/sections
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.userId;
    const query = listSectionsQuery.safeParse(request.query);
    if (!query.success) {
      throw new ValidationError(query.error.flatten().fieldErrors);
    }
    const { projectId, capturedFrom, folderId, search, limit, offset } = query.data;

    if (projectId) {
      await verifyProjectOwnership(projectId, userId);
    }

    const where: Prisma.CapturedSectionWhereInput = { userId };
    if (projectId) where.projectId = projectId;
    if (capturedFrom) where.capturedFrom = capturedFrom;
    if (folderId) where.folderId = folderId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const [sections, total] = await Promise.all([
      prisma.capturedSection.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: { folder: { select: { id: true, name: true } } },
      }),
      prisma.capturedSection.count({ where }),
    ]);

    return reply.send({ data: sections, total });
  });

  // GET /api/sections/folders — must be before /:id to avoid collision
  app.get('/folders', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.userId;
    const query = listFoldersQuery.safeParse(request.query);
    if (!query.success) {
      throw new ValidationError(query.error.flatten().fieldErrors);
    }

    const folders = await prisma.sectionFolder.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { sections: true } } },
    });

    return reply.send({ data: folders });
  });

  // POST /api/sections/folders
  app.post('/folders', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.userId;
    const parsed = createFolderSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.flatten().fieldErrors);
    }

    if (parsed.data.parentId) {
      const parentFolder = await prisma.sectionFolder.findFirst({
        where: { id: parsed.data.parentId, userId },
      });
      if (!parentFolder) {
        throw new NotFoundError('Parent folder');
      }
    }

    const folder = await prisma.sectionFolder.create({
      data: {
        userId,
        name: parsed.data.name,
        parentId: parsed.data.parentId,
      },
    });

    return reply.status(201).send({ data: folder });
  });

  // PUT /api/sections/folders/:id
  app.put('/folders/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.userId;
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      throw new ValidationError(params.error.flatten().fieldErrors);
    }
    const parsed = updateFolderSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.flatten().fieldErrors);
    }

    const existing = await prisma.sectionFolder.findFirst({
      where: { id: params.data.id, userId },
    });
    if (!existing) {
      throw new NotFoundError('Folder');
    }

    const folder = await prisma.sectionFolder.update({
      where: { id: params.data.id },
      data: { name: parsed.data.name },
    });

    return reply.send({ data: folder });
  });

  // DELETE /api/sections/folders/:id
  app.delete('/folders/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.userId;
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      throw new ValidationError(params.error.flatten().fieldErrors);
    }

    const existing = await prisma.sectionFolder.findFirst({
      where: { id: params.data.id, userId },
    });
    if (!existing) {
      throw new NotFoundError('Folder');
    }

    // Move sections out of folder before deleting
    await prisma.capturedSection.updateMany({
      where: { folderId: params.data.id },
      data: { folderId: null },
    });

    await prisma.sectionFolder.delete({ where: { id: params.data.id } });
    return reply.send({ data: { success: true } });
  });

  // POST /api/sections/capture/url — fetch HTML from a URL
  app.post('/capture/url', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.userId;
    const parsed = captureUrlSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.flatten().fieldErrors);
    }

    const { url } = parsed.data;

    let html: string;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        return reply.status(502).send({
          error: {
            code: 'FETCH_FAILED',
            message: `Failed to fetch URL: HTTP ${response.status} ${response.statusText}`,
          },
        });
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_CONTENT_TYPE',
            message: `URL did not return HTML content. Received: ${contentType}`,
          },
        });
      }

      html = await response.text();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown fetch error';
      return reply.status(502).send({
        error: {
          code: 'FETCH_ERROR',
          message: `Could not fetch URL: ${message}`,
        },
      });
    }

    return reply.send({ data: { url, html } });
  });

  // GET /api/sections/:id
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.userId;
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      throw new ValidationError(params.error.flatten().fieldErrors);
    }

    const section = await prisma.capturedSection.findFirst({
      where: { id: params.data.id, userId },
      include: { folder: { select: { id: true, name: true } } },
    });

    if (!section) {
      throw new NotFoundError('Section');
    }

    return reply.send({ data: section });
  });

  // POST /api/sections
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.userId;
    const parsed = createSectionSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.flatten().fieldErrors);
    }

    const body = parsed.data;

    if (body.projectId) {
      await verifyProjectOwnership(body.projectId, userId);
    }

    if (body.folderId) {
      const folder = await prisma.sectionFolder.findFirst({
        where: { id: body.folderId, userId },
      });
      if (!folder) {
        throw new NotFoundError('Folder');
      }
    }

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

    await logActivity({
      userId,
      action: 'SECTION_CAPTURED',
      projectId: body.projectId,
      details: { name: body.name, capturedFrom: body.capturedFrom },
    });

    return reply.status(201).send({ data: section });
  });

  // PUT /api/sections/:id
  app.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.userId;
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      throw new ValidationError(params.error.flatten().fieldErrors);
    }
    const parsed = updateSectionSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.flatten().fieldErrors);
    }

    const existing = await prisma.capturedSection.findFirst({
      where: { id: params.data.id, userId },
    });
    if (!existing) {
      throw new NotFoundError('Section');
    }

    const body = parsed.data;
    const updateData: Prisma.CapturedSectionUpdateInput = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.html !== undefined) updateData.html = body.html;
    if (body.css !== undefined) updateData.css = body.css;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.attributes !== undefined) {
      updateData.attributes = body.attributes as Prisma.InputJsonValue;
    }
    if (body.folderId !== undefined) {
      if (body.folderId === null) {
        updateData.folder = { disconnect: true };
      } else {
        const folder = await prisma.sectionFolder.findFirst({
          where: { id: body.folderId, userId },
        });
        if (!folder) {
          throw new NotFoundError('Folder');
        }
        updateData.folder = { connect: { id: body.folderId } };
      }
    }

    const section = await prisma.capturedSection.update({
      where: { id: params.data.id },
      data: updateData,
    });

    return reply.send({ data: section });
  });

  // DELETE /api/sections/:id
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.userId;
    const params = idParamSchema.safeParse(request.params);
    if (!params.success) {
      throw new ValidationError(params.error.flatten().fieldErrors);
    }

    const existing = await prisma.capturedSection.findFirst({
      where: { id: params.data.id, userId },
    });
    if (!existing) {
      throw new NotFoundError('Section');
    }

    await prisma.capturedSection.delete({ where: { id: params.data.id } });
    return reply.send({ data: { success: true } });
  });
}
