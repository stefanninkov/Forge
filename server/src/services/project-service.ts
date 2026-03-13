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
  return prisma.project.create({
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
}

export async function updateProject(id: string, userId: string, data: UpdateProjectInput) {
  const existing = await prisma.project.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new NotFoundError('Project');
  }

  return prisma.project.update({
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
}

export async function deleteProject(id: string, userId: string) {
  const existing = await prisma.project.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new NotFoundError('Project');
  }

  await prisma.project.delete({ where: { id } });
}
