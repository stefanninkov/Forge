import { prisma } from '../db/client.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import type { TemplateType, AnimationEngine, AnimationTrigger, Prisma } from '@prisma/client';

// ── Template Filters ──

interface TemplateFilters {
  category?: string;
  type?: TemplateType;
  search?: string;
  sort?: 'recent' | 'popular' | 'name';
  skip?: number;
  take?: number;
}

interface PresetFilters {
  category?: string;
  engine?: AnimationEngine;
  trigger?: AnimationTrigger;
  search?: string;
  sort?: 'recent' | 'popular' | 'name';
  skip?: number;
  take?: number;
}

// ── Published Template Browsing ──

/** List all published templates with search, category filtering, and sorting */
export async function listPublishedTemplates(filters: TemplateFilters = {}) {
  const { skip = 0, take = 24 } = filters;

  const where: Prisma.TemplateWhereInput = {
    isPublished: true,
  };

  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { tags: { has: filters.search.toLowerCase() } },
    ];
  }

  const orderBy: Prisma.TemplateOrderByWithRelationInput =
    filters.sort === 'name'
      ? { name: 'asc' }
      : filters.sort === 'popular'
        ? { createdAt: 'desc' } // No download count on Template model; fall back to recent
        : { createdAt: 'desc' };

  const [templates, total] = await Promise.all([
    prisma.template.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        userId: true,
        name: true,
        description: true,
        category: true,
        type: true,
        tags: true,
        animationAttrs: true,
        isPublished: true,
        createdAt: true,
      },
    }),
    prisma.template.count({ where }),
  ]);

  return { templates, total, hasMore: skip + take < total };
}

// ── Published Preset Browsing ──

/** List all published animation presets with search, category filtering, and sorting */
export async function listPublishedPresets(filters: PresetFilters = {}) {
  const { skip = 0, take = 24 } = filters;

  const where: Prisma.AnimationPresetWhereInput = {
    isPublished: true,
  };

  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.engine) {
    where.engine = filters.engine;
  }
  if (filters.trigger) {
    where.trigger = filters.trigger;
  }
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { tags: { has: filters.search.toLowerCase() } },
    ];
  }

  const orderBy: Prisma.AnimationPresetOrderByWithRelationInput =
    filters.sort === 'name'
      ? { name: 'asc' }
      : { createdAt: 'desc' };

  const [presets, total] = await Promise.all([
    prisma.animationPreset.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        userId: true,
        name: true,
        description: true,
        category: true,
        engine: true,
        trigger: true,
        config: true,
        previewHtml: true,
        isPublished: true,
        tags: true,
        createdAt: true,
      },
    }),
    prisma.animationPreset.count({ where }),
  ]);

  return { presets, total, hasMore: skip + take < total };
}

// ── Publish / Unpublish Templates ──

/** Publish a user's template to the community library */
export async function publishTemplate(userId: string, templateId: string) {
  const template = await prisma.template.findFirst({
    where: { id: templateId, userId, isPreset: false },
  });
  if (!template) {
    throw new NotFoundError('Template');
  }
  if (template.isPublished) {
    throw new AppError(409, 'ALREADY_PUBLISHED', 'Template is already published');
  }

  const updated = await prisma.template.update({
    where: { id: templateId },
    data: { isPublished: true },
  });

  await prisma.activityLog.create({
    data: {
      userId,
      action: 'TEMPLATE_CREATED',
      details: { templateId, name: template.name, event: 'published' } as unknown as Prisma.InputJsonValue,
    },
  }).catch(() => {});

  return updated;
}

/** Unpublish a user's template from the community library */
export async function unpublishTemplate(userId: string, templateId: string) {
  const template = await prisma.template.findFirst({
    where: { id: templateId, userId },
  });
  if (!template) {
    throw new NotFoundError('Template');
  }
  if (!template.isPublished) {
    throw new AppError(409, 'NOT_PUBLISHED', 'Template is not currently published');
  }

  return prisma.template.update({
    where: { id: templateId },
    data: { isPublished: false },
  });
}

// ── Publish / Unpublish Presets ──

/** Publish a user's animation preset to the community library */
export async function publishPreset(userId: string, presetId: string) {
  const preset = await prisma.animationPreset.findFirst({
    where: { id: presetId, userId, isSystem: false },
  });
  if (!preset) {
    throw new NotFoundError('Animation preset');
  }
  if (preset.isPublished) {
    throw new AppError(409, 'ALREADY_PUBLISHED', 'Preset is already published');
  }

  return prisma.animationPreset.update({
    where: { id: presetId },
    data: { isPublished: true },
  });
}

/** Unpublish a user's animation preset from the community library */
export async function unpublishPreset(userId: string, presetId: string) {
  const preset = await prisma.animationPreset.findFirst({
    where: { id: presetId, userId },
  });
  if (!preset) {
    throw new NotFoundError('Animation preset');
  }
  if (!preset.isPublished) {
    throw new AppError(409, 'NOT_PUBLISHED', 'Preset is not currently published');
  }

  return prisma.animationPreset.update({
    where: { id: presetId },
    data: { isPublished: false },
  });
}

// ── Install (Clone) ──

/** Clone a published template into the user's personal library */
export async function installTemplate(userId: string, templateId: string) {
  const source = await prisma.template.findFirst({
    where: { id: templateId, isPublished: true },
  });
  if (!source) {
    throw new NotFoundError('Published template');
  }

  const cloned = await prisma.template.create({
    data: {
      userId,
      name: source.name,
      description: source.description,
      category: source.category,
      type: source.type,
      structure: source.structure as Prisma.InputJsonValue,
      styles: source.styles ? (source.styles as Prisma.InputJsonValue) : undefined,
      animationAttrs: source.animationAttrs ? (source.animationAttrs as Prisma.InputJsonValue) : undefined,
      tags: source.tags,
      isPreset: false,
      isPublished: false,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId,
      action: 'TEMPLATE_CREATED',
      details: {
        templateId: cloned.id,
        sourceTemplateId: templateId,
        name: cloned.name,
        event: 'installed_from_community',
      } as unknown as Prisma.InputJsonValue,
    },
  }).catch(() => {});

  return cloned;
}

/** Clone a published animation preset into the user's personal library */
export async function installPreset(userId: string, presetId: string) {
  const source = await prisma.animationPreset.findFirst({
    where: { id: presetId, isPublished: true },
  });
  if (!source) {
    throw new NotFoundError('Published animation preset');
  }

  return prisma.animationPreset.create({
    data: {
      userId,
      name: source.name,
      description: source.description,
      category: source.category,
      engine: source.engine,
      trigger: source.trigger,
      config: source.config as Prisma.InputJsonValue,
      previewHtml: source.previewHtml,
      tags: source.tags,
      isSystem: false,
      isPublished: false,
    },
  });
}

// ── Legacy Community Template helpers (for CommunityTemplate model) ──

/** Browse community templates from CommunityTemplate model */
export async function browseTemplates(
  filters: { category?: string; type?: TemplateType; search?: string; sort?: 'recent' | 'popular' | 'most-liked'; featured?: boolean } = {},
  skip = 0,
  take = 24,
) {
  const where: Prisma.CommunityTemplateWhereInput = {};

  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.featured) {
    where.featured = true;
  }
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { tags: { has: filters.search.toLowerCase() } },
    ];
  }

  const orderBy: Prisma.CommunityTemplateOrderByWithRelationInput =
    filters.sort === 'popular'
      ? { downloads: 'desc' }
      : filters.sort === 'most-liked'
        ? { likes: 'desc' }
        : { publishedAt: 'desc' };

  const [templates, total] = await Promise.all([
    prisma.communityTemplate.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        type: true,
        tags: true,
        authorName: true,
        downloads: true,
        likes: true,
        featured: true,
        publishedAt: true,
      },
    }),
    prisma.communityTemplate.count({ where }),
  ]);

  return { templates, total, hasMore: skip + take < total };
}

/** Get a single community template with full data */
export async function getCommunityTemplate(id: string) {
  const template = await prisma.communityTemplate.findUnique({ where: { id } });
  if (!template) throw new NotFoundError('Community template');
  return template;
}

/** Fork a community template into user's personal library */
export async function forkTemplate(communityId: string, userId: string) {
  const source = await prisma.communityTemplate.findUnique({
    where: { id: communityId },
  });
  if (!source) throw new NotFoundError('Community template');

  await prisma.communityTemplate.update({
    where: { id: communityId },
    data: { downloads: { increment: 1 } },
  });

  return prisma.template.create({
    data: {
      userId,
      name: source.name,
      description: source.description,
      category: source.category,
      type: source.type,
      structure: source.structure as Prisma.InputJsonValue,
      styles: source.styles ? (source.styles as Prisma.InputJsonValue) : undefined,
      animationAttrs: source.animationAttrs ? (source.animationAttrs as Prisma.InputJsonValue) : undefined,
      tags: source.tags,
      isPreset: false,
      isPublished: false,
    },
  });
}

/** Toggle like on a community template */
export async function toggleLike(communityId: string, userId: string) {
  const existing = await prisma.communityLike.findUnique({
    where: { userId_templateId: { userId, templateId: communityId } },
  });

  if (existing) {
    await prisma.communityLike.delete({ where: { id: existing.id } });
    await prisma.communityTemplate.update({
      where: { id: communityId },
      data: { likes: { decrement: 1 } },
    });
    return { liked: false };
  }

  await prisma.communityLike.create({
    data: { userId, templateId: communityId },
  });
  await prisma.communityTemplate.update({
    where: { id: communityId },
    data: { likes: { increment: 1 } },
  });
  return { liked: true };
}

/** Check if user has liked templates */
export async function getUserLikes(userId: string, templateIds: string[]) {
  if (templateIds.length === 0) return new Set<string>();

  const likes = await prisma.communityLike.findMany({
    where: { userId, templateId: { in: templateIds } },
    select: { templateId: true },
  });
  return new Set(likes.map((l) => l.templateId));
}

/** List templates published by a specific user */
export async function getUserPublished(userId: string) {
  return prisma.communityTemplate.findMany({
    where: { authorId: userId },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      templateId: true,
      name: true,
      category: true,
      downloads: true,
      likes: true,
      publishedAt: true,
    },
  });
}
