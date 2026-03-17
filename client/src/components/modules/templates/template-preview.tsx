import { useMemo } from 'react';
import { LivePreview } from '@/components/shared/editors';
import type { TemplateNode } from '@/types/template';

interface TemplatePreviewProps {
  structure: TemplateNode;
  styles?: Record<string, unknown> | null;
  height?: number;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function nodeToHtml(node: TemplateNode): string {
  const tag = node.tag || 'div';
  const attrs: string[] = [];

  if (node.className) {
    attrs.push(`class="${escapeHtml(node.className)}"`);
  }

  if (node.attrs) {
    for (const [key, value] of Object.entries(node.attrs)) {
      attrs.push(`${escapeHtml(key)}="${escapeHtml(value)}"`);
    }
  }

  const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
  const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link'];

  if (selfClosingTags.includes(tag)) {
    return `<${tag}${attrStr} />`;
  }

  const textContent = node.text ? escapeHtml(node.text) : '';
  const childrenHtml = node.children
    ? node.children.map(nodeToHtml).join('')
    : '';

  return `<${tag}${attrStr}>${textContent}${childrenHtml}</${tag}>`;
}

const BASE_TEMPLATE_CSS = `
  a { color: inherit; text-decoration: none; }
  h1 { font-size: 2rem; font-weight: 700; }
  h2 { font-size: 1.5rem; font-weight: 600; }
  h3 { font-size: 1.25rem; font-weight: 600; }
  h4 { font-size: 1.125rem; font-weight: 500; }
  h5 { font-size: 1rem; font-weight: 500; }
  h6 { font-size: 0.875rem; font-weight: 500; }
  section, nav, header, footer, main, article, aside { display: block; }
  ul, ol { list-style: none; }
  button { font: inherit; border: none; background: none; cursor: pointer; }
  [class*="wrapper"], [class*="container"], [class*="section"] { width: 100%; max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
  [class*="grid"] { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
  [class*="flex"], [class*="row"] { display: flex; gap: 12px; }
  [class*="col"], [class*="stack"] { display: flex; flex-direction: column; gap: 8px; }
  [class*="heading"], [class*="title"] { font-weight: 600; line-height: 1.2; }
  [class*="text"], [class*="paragraph"], [class*="desc"] { line-height: 1.6; color: #555; }
  [class*="button"], [class*="btn"], [class*="cta"] { display: inline-flex; align-items: center; justify-content: center; padding: 8px 20px; border-radius: 6px; font-weight: 500; font-size: 14px; background: #10b981; color: #fff; }
  [class*="card"] { border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px; }
  [class*="image"], [class*="img"], [class*="photo"], [class*="thumbnail"] { background: #f0f0f0; border-radius: 6px; min-height: 120px; }
  [class*="nav"], [class*="navbar"] { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; }
  [class*="link"] { color: #10b981; }
  [class*="badge"], [class*="tag"], [class*="label"] { display: inline-flex; align-items: center; font-size: 12px; padding: 2px 8px; border-radius: 4px; background: #f0fdf4; color: #059669; }
  [class*="divider"], [class*="separator"] { height: 1px; background: #e5e5e5; width: 100%; }
  [class*="hero"] { padding: 60px 24px; text-align: center; }
  [class*="footer"] { padding: 40px 24px; border-top: 1px solid #e5e5e5; }
  [class*="logo"] { font-weight: 700; font-size: 18px; }
  [class*="icon"] { width: 24px; height: 24px; background: #e5e5e5; border-radius: 4px; }
  [class*="input"], [class*="field"] { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; width: 100%; }
  [class*="form"] { display: flex; flex-direction: column; gap: 12px; }
`;

function stylesToCssBlock(styles: Record<string, unknown> | null | undefined): string {
  if (!styles) return '';
  return Object.entries(styles)
    .map(([selector, props]) => {
      if (typeof props !== 'object' || !props) return '';
      const rules = Object.entries(props as Record<string, string>)
        .map(([k, v]) => `  ${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`)
        .join('\n');
      return `${selector} {\n${rules}\n}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

export function TemplatePreview({ structure, styles, height = 300 }: TemplatePreviewProps) {
  const html = useMemo(() => nodeToHtml(structure), [structure]);

  const css = useMemo(() => {
    return BASE_TEMPLATE_CSS + (styles ? '\n' + stylesToCssBlock(styles) : '');
  }, [styles]);

  return (
    <LivePreview
      html={html}
      css={css}
      showResponsiveControls
      height={height}
    />
  );
}
