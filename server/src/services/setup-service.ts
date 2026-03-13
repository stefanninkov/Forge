import { prisma } from '../db/client.js';
import { NotFoundError } from '../utils/errors.js';
import { ALL_SETUP_ITEM_KEYS, SETUP_CHECKLIST } from '../config/setup-checklist.js';
import type { SetupStatus } from '@prisma/client';

export async function getSetupProgress(projectId: string, userId: string) {
  // Verify project belongs to user
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!project) throw new NotFoundError('Project');

  const progress = await prisma.setupProgress.findMany({
    where: { projectId },
  });

  // Build a map of completed/skipped items
  const statusMap: Record<string, { status: SetupStatus; completedAt: Date | null }> = {};
  for (const item of progress) {
    statusMap[item.itemKey] = { status: item.status, completedAt: item.completedAt };
  }

  // Build response with all items, filling in PENDING for missing ones
  const categories = SETUP_CHECKLIST.map((cat) => ({
    ...cat,
    items: cat.items.map((item) => ({
      ...item,
      status: statusMap[item.key]?.status ?? 'PENDING',
      completedAt: statusMap[item.key]?.completedAt ?? null,
    })),
  }));

  // Calculate overall progress
  const total = ALL_SETUP_ITEM_KEYS.length;
  const completed = progress.filter((p) => p.status === 'COMPLETED').length;
  const skipped = progress.filter((p) => p.status === 'SKIPPED').length;

  return {
    categories,
    progress: {
      total,
      completed,
      skipped,
      pending: total - completed - skipped,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    },
  };
}

export async function updateSetupItem(
  projectId: string,
  userId: string,
  itemKey: string,
  status: SetupStatus,
) {
  // Verify project belongs to user
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!project) throw new NotFoundError('Project');

  // Validate item key
  if (!ALL_SETUP_ITEM_KEYS.includes(itemKey)) {
    throw new NotFoundError('Setup item');
  }

  const completedAt = status === 'COMPLETED' ? new Date() : null;

  return prisma.setupProgress.upsert({
    where: {
      projectId_itemKey: { projectId, itemKey },
    },
    create: {
      projectId,
      itemKey,
      status,
      completedAt,
    },
    update: {
      status,
      completedAt,
    },
  });
}

export async function resetSetupProgress(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!project) throw new NotFoundError('Project');

  await prisma.setupProgress.deleteMany({ where: { projectId } });
}

// --- Setup Profiles ---

export async function listProfiles(userId: string) {
  return prisma.setupProfile.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      checklistConfig: true,
      createdAt: true,
    },
  });
}

export async function createProfile(
  userId: string,
  name: string,
  checklistConfig: Record<string, boolean>,
) {
  return prisma.setupProfile.create({
    data: {
      userId,
      name,
      checklistConfig,
    },
    select: {
      id: true,
      name: true,
      checklistConfig: true,
      createdAt: true,
    },
  });
}

export async function applyProfile(
  projectId: string,
  userId: string,
  profileId: string,
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!project) throw new NotFoundError('Project');

  const profile = await prisma.setupProfile.findFirst({
    where: { id: profileId, userId },
  });
  if (!profile) throw new NotFoundError('Setup profile');

  // Link profile to project
  await prisma.project.update({
    where: { id: projectId },
    data: { setupProfileId: profileId },
  });

  // Reset existing progress and apply profile's pre-checked items
  await prisma.setupProgress.deleteMany({ where: { projectId } });

  const config = profile.checklistConfig as Record<string, boolean>;
  const itemsToSkip = Object.entries(config)
    .filter(([, checked]) => !checked)
    .map(([key]) => key)
    .filter((key) => ALL_SETUP_ITEM_KEYS.includes(key));

  if (itemsToSkip.length > 0) {
    await prisma.setupProgress.createMany({
      data: itemsToSkip.map((key) => ({
        projectId,
        itemKey: key,
        status: 'SKIPPED' as SetupStatus,
      })),
    });
  }

  return { profileId, applied: true };
}

export async function deleteProfile(profileId: string, userId: string) {
  const profile = await prisma.setupProfile.findFirst({
    where: { id: profileId, userId },
    select: { id: true },
  });
  if (!profile) throw new NotFoundError('Setup profile');

  await prisma.setupProfile.delete({ where: { id: profileId } });
}
