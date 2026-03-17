import { useMemo } from 'react';
import { LivePreview } from '@/components/shared/editors';
import type { ParsedNode } from '@/types/figma';

interface WebflowPreviewProps {
  structure: ParsedNode;
  title?: string;
  animationScript?: string;
}

function nodeToPreviewHtml(node: ParsedNode, depth = 0): string {
  const styles = (node.properties._styles as Record<string, string>) ?? {};
  const text = node.properties.text as string | undefined;

  // Build inline style string
  const styleEntries = Object.entries(styles);
  const styleStr = styleEntries
    .map(([k, v]) => {
      // Convert camelCase to kebab-case
      const kebab = k.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${kebab}: ${v}`;
    })
    .join('; ');

  const className = node.suggestedClass;

  // Determine HTML tag
  let tag = 'div';
  if (node.type === 'section') tag = 'section';
  else if (node.type === 'text') {
    // Try to detect heading-like text nodes
    const fontSize = node.properties.fontSize as number | undefined;
    const fontWeight = node.properties.fontWeight as number | undefined;
    if (fontSize && fontSize >= 32) tag = 'h1';
    else if (fontSize && fontSize >= 24) tag = 'h2';
    else if (fontSize && fontSize >= 20) tag = 'h3';
    else if (fontWeight && fontWeight >= 600 && fontSize && fontSize >= 16) tag = 'h4';
    else tag = 'p';
  } else if (node.type === 'svg') tag = 'div';
  else if (node.type === 'hr') tag = 'hr';

  if (tag === 'hr') {
    return `<hr class="${className}" style="${styleStr}" />`;
  }

  const childrenHtml = node.children
    .map((child) => nodeToPreviewHtml(child, depth + 1))
    .join('\n');

  const content = text
    ? escapeHtml(text)
    : childrenHtml;

  // For image placeholder nodes
  if (node.properties.backgroundImage) {
    return `<div class="${className}" style="${styleStr}; display: flex; align-items: center; justify-content: center; color: #888; font-size: 11px; background-color: #f0f0f0;">
      <span>Image</span>
    </div>`;
  }

  return `<${tag} class="${className}" style="${styleStr}">${content}</${tag}>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function WebflowPreview({ structure, title, animationScript }: WebflowPreviewProps) {
  const previewHtml = useMemo(() => nodeToPreviewHtml(structure), [structure]);

  const previewCss = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    img { max-width: 100%; height: auto; display: block; }
    h1, h2, h3, h4, h5, h6 { font-weight: inherit; }
    section, div { position: relative; }
  `;

  return (
    <LivePreview
      html={previewHtml}
      css={previewCss}
      animationScript={animationScript}
      showResponsiveControls
      showAnimationToggle={!!animationScript}
      height="100%"
    />
  );
}
