import { prisma } from '../db/client.js';
import { NotFoundError } from '../utils/errors.js';
import type { AuditType, ScheduleFrequency } from '@prisma/client';

interface CreateScheduleInput {
  userId: string;
  projectId: string;
  type: AuditType;
  url: string;
  frequency: ScheduleFrequency;
}

function computeNextRun(frequency: ScheduleFrequency, from: Date = new Date()): Date {
  const next = new Date(from);
  switch (frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + 1);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}

export async function createSchedule(input: CreateScheduleInput) {
  const nextRunAt = computeNextRun(input.frequency);

  return prisma.auditSchedule.upsert({
    where: {
      projectId_type: {
        projectId: input.projectId,
        type: input.type,
      },
    },
    update: {
      url: input.url,
      frequency: input.frequency,
      enabled: true,
      nextRunAt,
    },
    create: {
      userId: input.userId,
      projectId: input.projectId,
      type: input.type,
      url: input.url,
      frequency: input.frequency,
      nextRunAt,
    },
  });
}

export async function listSchedules(projectId: string) {
  return prisma.auditSchedule.findMany({
    where: { projectId },
    orderBy: { type: 'asc' },
  });
}

export async function getSchedule(id: string) {
  const schedule = await prisma.auditSchedule.findUnique({ where: { id } });
  if (!schedule) throw new NotFoundError('Schedule not found');
  return schedule;
}

export async function updateSchedule(
  id: string,
  userId: string,
  data: { frequency?: ScheduleFrequency; url?: string; enabled?: boolean },
) {
  const schedule = await prisma.auditSchedule.findUnique({ where: { id } });
  if (!schedule) throw new NotFoundError('Schedule not found');
  if (schedule.userId !== userId) throw new NotFoundError('Schedule not found');

  const updateData: Record<string, unknown> = {};
  if (data.frequency !== undefined) {
    updateData.frequency = data.frequency;
    updateData.nextRunAt = computeNextRun(data.frequency);
  }
  if (data.url !== undefined) updateData.url = data.url;
  if (data.enabled !== undefined) updateData.enabled = data.enabled;

  return prisma.auditSchedule.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteSchedule(id: string, userId: string) {
  const schedule = await prisma.auditSchedule.findUnique({ where: { id } });
  if (!schedule) throw new NotFoundError('Schedule not found');
  if (schedule.userId !== userId) throw new NotFoundError('Schedule not found');

  await prisma.auditSchedule.delete({ where: { id } });
}

export async function markScheduleRun(id: string) {
  const schedule = await prisma.auditSchedule.findUnique({ where: { id } });
  if (!schedule) throw new NotFoundError('Schedule not found');

  return prisma.auditSchedule.update({
    where: { id },
    data: {
      lastRunAt: new Date(),
      nextRunAt: computeNextRun(schedule.frequency),
    },
  });
}

/** Get all schedules that are due to run */
export async function getDueSchedules() {
  return prisma.auditSchedule.findMany({
    where: {
      enabled: true,
      nextRunAt: { lte: new Date() },
    },
  });
}
