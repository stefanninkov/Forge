export type TemplateType = 'SKELETON' | 'STYLED';

export interface TemplateNode {
  tag: string;
  className: string;
  text?: string;
  children?: TemplateNode[];
  attrs?: Record<string, string>;
}

export interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  type: TemplateType;
  isPreset: boolean;
  structure: TemplateNode;
  styles: Record<string, unknown> | null;
  animationAttrs: Record<string, string> | null;
  tags: string[];
  createdAt: string;
}

export interface TemplateSummary {
  id: string;
  name: string;
  description: string | null;
  category: string;
  type: TemplateType;
  isPreset: boolean;
  isPublished?: boolean;
  tags: string[];
  animationAttrs: Record<string, string> | null;
  createdAt: string;
}

export interface TemplateFilters {
  category?: string;
  type?: TemplateType;
  search?: string;
}

export const TEMPLATE_CATEGORIES = [
  'navbar',
  'hero',
  'features',
  'testimonials',
  'faq',
  'pricing',
  'cta',
  'footer',
  'contact',
  'logo-strip',
  'team',
  'blog',
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];
