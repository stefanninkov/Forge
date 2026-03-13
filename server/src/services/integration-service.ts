import { prisma } from '../db/client.js';
import { NotFoundError } from '../utils/errors.js';
import type { Prisma } from '@prisma/client';

const SUPPORTED_PROVIDERS = ['figma', 'anthropic', 'webflow'] as const;
type Provider = (typeof SUPPORTED_PROVIDERS)[number];

/** List user's connected integrations (masks tokens) */
export async function listIntegrations(userId: string) {
  const integrations = await prisma.userIntegration.findMany({
    where: { userId },
    select: {
      id: true,
      provider: true,
      expiresAt: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return integrations.map((i) => ({
    ...i,
    isConnected: true,
  }));
}

/** Store or update an integration (provider + token/key) */
export async function upsertIntegration(
  userId: string,
  data: {
    provider: Provider;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    metadata?: Record<string, unknown>;
  },
) {
  return prisma.userIntegration.upsert({
    where: {
      userId_provider: { userId, provider: data.provider },
    },
    create: {
      userId,
      provider: data.provider,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
      metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
    },
    update: {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
      metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
    },
    select: {
      id: true,
      provider: true,
      expiresAt: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/** Disconnect an integration */
export async function deleteIntegration(userId: string, provider: string) {
  const integration = await prisma.userIntegration.findUnique({
    where: { userId_provider: { userId, provider } },
  });
  if (!integration) throw new NotFoundError('Integration');

  await prisma.userIntegration.delete({
    where: { userId_provider: { userId, provider } },
  });
}

/** Get a user's access token for a specific provider (internal use) */
export async function getAccessToken(
  userId: string,
  provider: string,
): Promise<string | null> {
  const integration = await prisma.userIntegration.findUnique({
    where: { userId_provider: { userId, provider } },
    select: { accessToken: true },
  });
  return integration?.accessToken ?? null;
}
