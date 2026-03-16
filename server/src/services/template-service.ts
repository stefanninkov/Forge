import { prisma } from '../db/client.js';
import { NotFoundError } from '../utils/errors.js';
import { PRESET_TEMPLATES } from '../config/template-presets.js';
import type { TemplateType, Prisma } from '@prisma/client';

interface TemplateFilters {
  category?: string;
  type?: TemplateType;
  search?: string;
  presetOnly?: boolean;
}

/** List all templates (presets + user's custom) with optional filters */
export async function listTemplates(userId: string, filters: TemplateFilters = {}) {
  const where: Prisma.TemplateWhereInput = {
    OR: [{ isPreset: true }, { userId }],
  };

  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.presetOnly) {
    where.isPreset = true;
  }
  if (filters.search) {
    where.AND = [
      {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { tags: { has: filters.search.toLowerCase() } },
        ],
      },
    ];
  }

  return prisma.template.findMany({
    where,
    orderBy: [{ isPreset: 'desc' }, { category: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      type: true,
      isPreset: true,
      tags: true,
      animationAttrs: true,
      createdAt: true,
    },
  });
}

/** Get a single template by ID */
export async function getTemplate(templateId: string, userId: string) {
  const template = await prisma.template.findFirst({
    where: {
      id: templateId,
      OR: [{ isPreset: true }, { userId }],
    },
  });
  if (!template) throw new NotFoundError('Template');
  return template;
}

/** Create a custom user template */
export async function createTemplate(
  userId: string,
  data: {
    name: string;
    description?: string;
    category: string;
    type: TemplateType;
    structure: Record<string, unknown>;
    styles?: Record<string, unknown>;
    animationAttrs?: Record<string, unknown>;
    tags?: string[];
    sourceProjectId?: string;
  },
) {
  const template = await prisma.template.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
      category: data.category,
      type: data.type,
      structure: data.structure as Prisma.InputJsonValue,
      styles: data.styles ? (data.styles as Prisma.InputJsonValue) : undefined,
      animationAttrs: data.animationAttrs ? (data.animationAttrs as Prisma.InputJsonValue) : undefined,
      tags: data.tags ?? [],
      sourceProjectId: data.sourceProjectId,
      isPreset: false,
      isPublished: false,
    },
  });

  prisma.activityLog.create({
    data: { userId, action: 'TEMPLATE_CREATED', details: { name: template.name, category: data.category } },
  }).catch(() => {});

  return template;
}

/** Update a user's custom template */
export async function updateTemplate(
  templateId: string,
  userId: string,
  data: {
    name?: string;
    description?: string;
    category?: string;
    type?: TemplateType;
    structure?: Record<string, unknown>;
    styles?: Record<string, unknown>;
    animationAttrs?: Record<string, unknown>;
    tags?: string[];
  },
) {
  const template = await prisma.template.findFirst({
    where: { id: templateId, userId, isPreset: false },
  });
  if (!template) throw new NotFoundError('Template');

  return prisma.template.update({
    where: { id: templateId },
    data: {
      name: data.name,
      description: data.description,
      category: data.category,
      type: data.type,
      tags: data.tags,
      ...(data.structure !== undefined && { structure: data.structure as Prisma.InputJsonValue }),
      ...(data.styles !== undefined && { styles: data.styles as Prisma.InputJsonValue }),
      ...(data.animationAttrs !== undefined && { animationAttrs: data.animationAttrs as Prisma.InputJsonValue }),
    },
  });
}

/** Delete a user's custom template */
export async function deleteTemplate(templateId: string, userId: string) {
  const template = await prisma.template.findFirst({
    where: { id: templateId, userId, isPreset: false },
  });
  if (!template) throw new NotFoundError('Template');

  await prisma.template.delete({ where: { id: templateId } });
}

/** Duplicate a template (preset or user's own) into user's custom templates */
export async function duplicateTemplate(templateId: string, userId: string) {
  const source = await prisma.template.findFirst({
    where: {
      id: templateId,
      OR: [{ isPreset: true }, { userId }],
    },
  });
  if (!source) throw new NotFoundError('Template');

  return prisma.template.create({
    data: {
      userId,
      name: `${source.name} (Copy)`,
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

/** Seed preset templates into the database (idempotent) */
export async function seedPresetTemplates() {
  const existing = await prisma.template.count({ where: { isPreset: true } });
  if (existing > 0) return { seeded: false, count: existing };

  await prisma.template.createMany({
    data: PRESET_TEMPLATES.map((t) => ({
      name: t.name,
      description: t.description,
      category: t.category,
      type: 'SKELETON' as TemplateType,
      isPreset: true,
      structure: t.structure as unknown as Prisma.InputJsonValue,
      animationAttrs: t.animationAttrs ? (t.animationAttrs as unknown as Prisma.InputJsonValue) : undefined,
      tags: t.tags,
      isPublished: false,
    })),
  });

  return { seeded: true, count: PRESET_TEMPLATES.length };
}
