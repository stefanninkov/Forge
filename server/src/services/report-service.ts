import { randomBytes } from 'crypto';
import { prisma } from '../db/client.js';
import { NotFoundError } from '../utils/errors.js';
import type { Prisma } from '@prisma/client';

interface ReportSection {
  title: string;
  type: string;
  content?: Record<string, unknown>;
}

interface Branding {
  companyName?: string;
  logoUrl?: string;
  primaryColor?: string;
}

export async function listReports(userId: string) {
  return prisma.handoffReport.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      project: { select: { id: true, name: true } },
    },
  });
}

export async function getReport(id: string, userId: string) {
  const report = await prisma.handoffReport.findFirst({
    where: { id, userId },
    include: {
      project: { select: { id: true, name: true } },
    },
  });
  if (!report) throw new NotFoundError('Report');
  return report;
}

export async function getReportByShareToken(token: string) {
  const report = await prisma.handoffReport.findFirst({
    where: { shareToken: token, isPublic: true },
    include: {
      project: { select: { id: true, name: true } },
    },
  });
  if (!report) throw new NotFoundError('Report');
  return report;
}

export async function createReport(
  userId: string,
  data: {
    projectId: string;
    title: string;
    sections: ReportSection[];
    branding?: Branding;
    isPublic?: boolean;
  },
) {
  // Verify project belongs to user
  const project = await prisma.project.findFirst({
    where: { id: data.projectId, userId },
  });
  if (!project) throw new NotFoundError('Project');

  const shareToken = randomBytes(24).toString('hex');

  const report = await prisma.handoffReport.create({
    data: {
      userId,
      projectId: data.projectId,
      title: data.title,
      sections: data.sections as unknown as Prisma.InputJsonValue,
      branding: data.branding ? (data.branding as unknown as Prisma.InputJsonValue) : undefined,
      isPublic: data.isPublic ?? false,
      shareToken,
    },
    include: {
      project: { select: { id: true, name: true } },
    },
  });

  prisma.activityLog
    .create({
      data: {
        userId,
        projectId: data.projectId,
        action: 'SETTINGS_UPDATED',
        details: { type: 'report_created', title: data.title },
      },
    })
    .catch(() => {});

  return report;
}

export async function updateReport(
  id: string,
  userId: string,
  data: {
    title?: string;
    sections?: ReportSection[];
    branding?: Branding;
    isPublic?: boolean;
  },
) {
  const existing = await prisma.handoffReport.findFirst({ where: { id, userId } });
  if (!existing) throw new NotFoundError('Report');

  return prisma.handoffReport.update({
    where: { id },
    data: {
      title: data.title,
      ...(data.sections !== undefined && {
        sections: data.sections as unknown as Prisma.InputJsonValue,
      }),
      ...(data.branding !== undefined && {
        branding: data.branding as unknown as Prisma.InputJsonValue,
      }),
      isPublic: data.isPublic,
    },
    include: {
      project: { select: { id: true, name: true } },
    },
  });
}

export async function deleteReport(id: string, userId: string) {
  const existing = await prisma.handoffReport.findFirst({ where: { id, userId } });
  if (!existing) throw new NotFoundError('Report');

  await prisma.handoffReport.delete({ where: { id } });
}

export async function generateShareToken(id: string, userId: string) {
  const existing = await prisma.handoffReport.findFirst({ where: { id, userId } });
  if (!existing) throw new NotFoundError('Report');

  const shareToken = randomBytes(24).toString('hex');

  return prisma.handoffReport.update({
    where: { id },
    data: { shareToken, isPublic: true },
    include: {
      project: { select: { id: true, name: true } },
    },
  });
}
