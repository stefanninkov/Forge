import { prisma } from '../db/client.js';
import type { ActivityAction, Prisma } from '@prisma/client';

export async function logActivity(params: {
  userId: string;
  projectId?: string | null;
  action: ActivityAction;
  details?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        projectId: params.projectId ?? null,
        action: params.action,
        details: (params.details ?? undefined) as Prisma.InputJsonValue | undefined,
        metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch {
    // Don't let logging failures break the main operation
  }
}
