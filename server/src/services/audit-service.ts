import { prisma } from '../db/client.js';
import { NotFoundError } from '../utils/errors.js';
import type { AuditType } from '@prisma/client';

export async function listAudits(projectId: string, type?: AuditType) {
  const where: { projectId: string; type?: AuditType } = { projectId };
  if (type) where.type = type;

  return prisma.audit.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getAudit(id: string) {
  const audit = await prisma.audit.findUnique({ where: { id } });
  if (!audit) throw new NotFoundError('Audit not found');
  return audit;
}

export async function deleteAudit(id: string, userId: string) {
  const audit = await prisma.audit.findUnique({
    where: { id },
    include: { project: { select: { userId: true } } },
  });
  if (!audit) throw new NotFoundError('Audit not found');
  if (audit.project.userId !== userId) throw new NotFoundError('Audit not found');

  await prisma.audit.delete({ where: { id } });
}

export async function getAuditHistory(projectId: string, type: AuditType) {
  const audits = await prisma.audit.findMany({
    where: { projectId, type },
    orderBy: { createdAt: 'asc' },
    take: 20,
    select: { score: true, createdAt: true },
  });
  return audits;
}

export async function listAlerts(projectId: string) {
  return prisma.auditAlert.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function markAlertRead(id: string) {
  const alert = await prisma.auditAlert.findUnique({ where: { id } });
  if (!alert) throw new NotFoundError('Alert not found');

  return prisma.auditAlert.update({
    where: { id },
    data: { read: true },
  });
}

export async function checkScoreDrop(projectId: string, type: AuditType, newScore: number, auditId: string) {
  const previous = await prisma.audit.findFirst({
    where: { projectId, type, id: { not: auditId } },
    orderBy: { createdAt: 'desc' },
    select: { score: true },
  });

  if (previous && previous.score - newScore > 10) {
    await prisma.auditAlert.create({
      data: {
        auditId,
        projectId,
        type: 'SCORE_DROP',
        message: `${type} score dropped from ${Math.round(previous.score)} to ${Math.round(newScore)} (−${Math.round(previous.score - newScore)} points)`,
        severity: newScore < 50 ? 'CRITICAL' : 'WARNING',
      },
    });
  }
}
