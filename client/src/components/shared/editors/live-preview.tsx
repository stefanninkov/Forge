import { useState, useRef, useEffect, useMemo } from 'react';
import { Monitor, Tablet, Smartphone, Play, Pause, RotateCcw } from 'lucide-react';

export interface PreviewElement {
  tag: string;
  className?: string;
  text?: string;
  children?: PreviewElement[];
  attributes?: Record<string, string>;
}

export interface LivePreviewProps {
  html?: string;
  css?: string;
  js?: string;
  elements?: PreviewElement[];
  styles?: Record<string, Record<string, string>>;
  animationScript?: string;
  showResponsiveControls?: boolean;
  showAnimationToggle?: boolean;
  height?: number | string;
}

type PreviewSize = 'desktop' | 'tablet' | 'mobile';

const PREVIEW_SIZES: Record<PreviewSize, { width: number; label: string; icon: typeof Monitor }> = {
  desktop: { width: 1440, label: 'Desktop', icon: Monitor },
  tablet: { width: 768, label: 'Tablet', icon: Tablet },
  mobile: { width: 375, label: 'Mobile', icon: Smartphone },
};

function elementToHtml(el: PreviewElement, depth = 0): string {
  const indent = '  '.repeat(depth);
  const attrs = el.attributes
    ? Object.entries(el.attributes).map(([k, v]) => ` ${k}="${v}"`).join('')
    : '';
  const cls = el.className ? ` class="${el.className}"` : '';

  if (!el.children?.length && !el.text) {
    if (el.tag === 'img') {
      return `${indent}<${el.tag}${cls}${attrs} />`;
    }
    return `${indent}<${el.tag}${cls}${attrs}></${el.tag}>`;
  }

  const content = el.text || '';
  const children = el.children?.map((c) => elementToHtml(c, depth + 1)).join('\n') || '';
  const inner = content + (children ? '\n' + children + '\n' + indent : '');

  return `${indent}<${el.tag}${cls}${attrs}>${inner}</${el.tag}>`;
}

function stylesToCss(styles: Record<string, Record<string, string>>): string {
  return Object.entries(styles)
    .map(([selector, props]) => {
      const rules = Object.entries(props)
        .map(([k, v]) => `  ${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`)
        .join('\n');
      return `${selector} {\n${rules}\n}`;
    })
    .join('\n\n');
}

export function LivePreview({
  html,
  css,
  js,
  elements,
  styles,
  animationScript,
  showResponsiveControls = true,
  showAnimationToggle = false,
  height = 400,
}: LivePreviewProps) {
  const [size, setSize] = useState<PreviewSize>('desktop');
  const [animationsEnabled, setAnimationsEnabled] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0);

  const resolvedHtml = useMemo(() => {
    if (html) return html;
    if (elements) return elements.map((el) => elementToHtml(el)).join('\n');
    return '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6b7270;font-family:sans-serif;">No content to preview</div>';
  }, [html, elements]);

  const resolvedCss = useMemo(() => {
    if (css) return css;
    if (styles) return stylesToCss(styles);
    return '';
  }, [css, styles]);

  const srcdoc = useMemo(() => {
    const animScript = animationsEnabled && animationScript
      ? `<script>${animationScript}</script>`
      : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      color: #1a1f1e;
      background: #ffffff;
      min-height: 100vh;
    }
    img { max-width: 100%; height: auto; display: block; }
    .forge-image-placeholder {
      background: #f1f5f4;
      border: 1px dashed #cdd5d3;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3a1;
      font-size: 12px;
      min-height: 120px;
    }
    ${resolvedCss}
  </style>
</head>
<body>
  ${resolvedHtml}
  ${js ? `<script>${js}</script>` : ''}
  ${animScript}
</body>
</html>`;
  }, [resolvedHtml, resolvedCss, js, animationsEnabled, animationScript]);

  const previewWidth = PREVIEW_SIZES[size].width;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: typeof height === 'number' ? height : undefined,
        minHeight: typeof height === 'string' ? height : undefined,
        border: '1px solid var(--border-default)',
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      {/* Toolbar */}
      {(showResponsiveControls || showAnimationToggle) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 36,
            padding: '0 12px',
            borderBottom: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          {showResponsiveControls && (
            <div style={{ display: 'flex', gap: 2 }}>
              {(Object.keys(PREVIEW_SIZES) as PreviewSize[]).map((s) => {
                const { icon: Icon, label } = PREVIEW_SIZES[s];
                const isActive = s === size;
                return (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    title={label}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 28, height: 28, border: 'none', borderRadius: 4,
                      backgroundColor: isActive ? 'var(--accent-subtle)' : 'transparent',
                      color: isActive ? 'var(--accent-text)' : 'var(--text-tertiary)',
                      cursor: 'pointer',
                    }}
                  >
                    <Icon size={14} />
                  </button>
                );
              })}
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-tertiary)',
                  alignSelf: 'center',
                }}
              >
                {previewWidth}px
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 4 }}>
            {showAnimationToggle && (
              <button
                onClick={() => setAnimationsEnabled(!animationsEnabled)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  height: 24, padding: '0 8px', border: 'none', borderRadius: 4,
                  backgroundColor: animationsEnabled ? 'var(--accent-subtle)' : 'var(--surface-hover)',
                  color: animationsEnabled ? 'var(--accent-text)' : 'var(--text-secondary)',
                  fontSize: 'var(--text-xs)', fontWeight: 500, cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {animationsEnabled ? <Pause size={12} /> : <Play size={12} />}
                Animations
              </button>
            )}
            <button
              onClick={() => setKey((k) => k + 1)}
              title="Reload preview"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 24, height: 24, border: 'none', borderRadius: 4,
                backgroundColor: 'transparent', color: 'var(--text-tertiary)',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Preview area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: 16,
          overflow: 'auto',
        }}
      >
        <div
          style={{
            width: previewWidth,
            maxWidth: '100%',
            transition: 'width 300ms ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderRadius: 4,
            overflow: 'hidden',
            backgroundColor: '#ffffff',
          }}
        >
          <iframe
            key={key}
            ref={iframeRef}
            srcDoc={srcdoc}
            sandbox="allow-scripts"
            style={{
              width: '100%',
              height: typeof height === 'number' ? height - 70 : 330,
              border: 'none',
              display: 'block',
            }}
            title="Live Preview"
          />
        </div>
      </div>
    </div>
  );
}
