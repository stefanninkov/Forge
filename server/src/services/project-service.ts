import { prisma } from '../db/client.js';
import { NotFoundError } from '../utils/errors.js';
import type { CreateProjectInput, UpdateProjectInput } from '../routes/projects/schemas.js';

export async function listProjects(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      webflowSiteId: true,
      figmaFileKey: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getProject(id: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id, userId },
    include: {
      setupProfile: { select: { id: true, name: true } },
    },
  });

  if (!project) {
    throw new NotFoundError('Project');
  }

  return project;
}

export async function createProject(userId: string, data: CreateProjectInput) {
  const project = await prisma.project.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
      webflowSiteId: data.webflowSiteId,
      figmaFileKey: data.figmaFileKey,
    },
    select: {
      id: true,
      name: true,
      description: true,
      webflowSiteId: true,
      figmaFileKey: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  prisma.activityLog.create({
    data: { userId, projectId: project.id, action: 'PROJECT_CREATED', details: { name: project.name } },
  }).catch(() => {});

  return project;
}

export async function updateProject(id: string, userId: string, data: UpdateProjectInput) {
  const existing = await prisma.project.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new NotFoundError('Project');
  }

  const project = await prisma.project.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      description: true,
      webflowSiteId: true,
      figmaFileKey: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  prisma.activityLog.create({
    data: { userId, projectId: project.id, action: 'PROJECT_UPDATED', details: { name: project.name } },
  }).catch(() => {});

  return project;
}

export async function duplicateProject(id: string, userId: string) {
  const existing = await prisma.project.findFirst({
    where: { id, userId },
    include: {
      setupProgress: true,
      scalingConfigs: true,
      capturedSections: true,
    },
  });
  if (!existing) {
    throw new NotFoundError('Project');
  }

  const project = await prisma.project.create({
    data: {
      userId,
      name: `${existing.name} (Copy)`,
      description: existing.description,
      notes: existing.notes,
      animationConfig: existing.animationConfig ?? undefined,
      scriptConfig: existing.scriptConfig ?? undefined,
    },
    select: {
      id: true,
      name: true,
      description: true,
      webflowSiteId: true,
      figmaFileKey: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Clone setup progress
  if (existing.setupProgress.length > 0) {
    await prisma.setupProgress.createMany({
      data: existing.setupProgress.map((sp) => ({
        projectId: project.id,
        itemKey: sp.itemKey,
        status: sp.status,
        completedAt: sp.completedAt,
      })),
    });
  }

  // Clone scaling configs
  if (existing.scalingConfigs.length > 0) {
    await prisma.scalingConfig.createMany({
      data: existing.scalingConfigs.map((sc) => ({
        userId,
        projectId: project.id,
        name: sc.name,
        config: sc.config as object,
        isDefault: sc.isDefault,
      })),
    });
  }

  // Clone captured sections
  if (existing.capturedSections.length > 0) {
    await prisma.capturedSection.createMany({
      data: existing.capturedSections.map((cs) => ({
        userId,
        projectId: project.id,
        name: cs.name,
        html: cs.html,
        css: cs.css,
        attributes: cs.attributes as object,
        elementCount: cs.elementCount,
        thumbnail: cs.thumbnail,
        capturedFrom: cs.capturedFrom,
        tags: cs.tags,
      })),
    });
  }

  return project;
}

export async function updateProjectNotes(id: string, userId: string, notes: string) {
  const existing = await prisma.project.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new NotFoundError('Project');
  }

  const project = await prisma.project.update({
    where: { id },
    data: { notes },
  });

  return project;
}

export async function deleteProject(id: string, userId: string) {
  const existing = await prisma.project.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new NotFoundError('Project');
  }

  await prisma.project.delete({ where: { id } });

  prisma.activityLog.create({
    data: { userId, action: 'PROJECT_DELETED', details: { name: existing.name } },
  }).catch(() => {});
}
