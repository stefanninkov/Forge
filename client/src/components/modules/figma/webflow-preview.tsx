import { useMemo } from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { useState } from 'react';
import type { ParsedNode } from '@/types/figma';

interface WebflowPreviewProps {
  structure: ParsedNode;
  title?: string;
}

type Breakpoint = 'desktop' | 'tablet' | 'mobile';

const BREAKPOINT_WIDTHS: Record<Breakpoint, number> = {
  desktop: 960,
  tablet: 768,
  mobile: 375,
};

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

export function WebflowPreview({ structure, title }: WebflowPreviewProps) {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');

  const previewHtml = useMemo(() => {
    const html = nodeToPreviewHtml(structure);
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #ffffff;
      overflow-x: hidden;
    }
    img { max-width: 100%; height: auto; display: block; }
    h1, h2, h3, h4, h5, h6 { font-weight: inherit; }
    section, div { position: relative; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
  }, [structure]);

  const iframeWidth = BREAKPOINT_WIDTHS[breakpoint];

  return (
    <div
      className="flex flex-col"
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-primary)',
        overflow: 'hidden',
        flex: 1,
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{
          height: 40,
          padding: '0 16px',
          borderBottom: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <span
          className="font-medium"
          style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
        >
          {title ?? 'Webflow Preview'}
        </span>

        {/* Breakpoint toggles */}
        <div className="flex items-center" style={{ gap: 2 }}>
          {([
            { key: 'desktop' as Breakpoint, icon: Monitor, label: 'Desktop' },
            { key: 'tablet' as Breakpoint, icon: Tablet, label: 'Tablet' },
            { key: 'mobile' as Breakpoint, icon: Smartphone, label: 'Mobile' },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setBreakpoint(key)}
              title={label}
              className="flex items-center justify-center border-none cursor-pointer"
              style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: breakpoint === key ? 'var(--accent-subtle)' : 'transparent',
                color: breakpoint === key ? 'var(--accent-text)' : 'var(--text-tertiary)',
              }}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Preview area */}
      <div
        className="flex-1 overflow-auto"
        style={{
          backgroundColor: '#e5e5e5',
          display: 'flex',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          style={{
            width: iframeWidth,
            maxWidth: '100%',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            borderRadius: 4,
            overflow: 'hidden',
            transition: 'width 200ms ease',
          }}
        >
          <iframe
            srcDoc={previewHtml}
            title="Webflow Preview"
            sandbox="allow-same-origin"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              minHeight: 400,
              display: 'block',
            }}
          />
        </div>
      </div>
    </div>
  );
}
