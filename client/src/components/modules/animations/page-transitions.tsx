import { useState, useCallback } from 'react';
import { Copy, Check, Code, ChevronDown, ChevronUp } from 'lucide-react';

interface PageTransition {
  id: string;
  name: string;
  description: string;
  category: 'fade' | 'slide' | 'scale' | 'clip';
  cssCode: string;
  jsCode?: string;
  duration: number;
  easing: string;
}

const TRANSITIONS: PageTransition[] = [
  {
    id: 'fade-in', name: 'Fade In', description: 'Simple opacity fade on page load',
    category: 'fade', duration: 0.4, easing: 'ease-out',
    cssCode: `body {\n  animation: forgePageFadeIn 0.4s ease-out;\n}\n@keyframes forgePageFadeIn {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}`,
  },
  {
    id: 'crossfade', name: 'Crossfade', description: 'Smooth crossfade using View Transitions API',
    category: 'fade', duration: 0.3, easing: 'ease-in-out',
    cssCode: `::view-transition-old(root) {\n  animation: forgeFadeOut 0.3s ease-in-out;\n}\n::view-transition-new(root) {\n  animation: forgeFadeIn 0.3s ease-in-out;\n}\n@keyframes forgeFadeOut { to { opacity: 0; } }\n@keyframes forgeFadeIn { from { opacity: 0; } }`,
    jsCode: `document.querySelectorAll('a[href]').forEach(link => {\n  link.addEventListener('click', e => {\n    if (!document.startViewTransition) return;\n    e.preventDefault();\n    document.startViewTransition(() => {\n      window.location.href = link.href;\n    });\n  });\n});`,
  },
  {
    id: 'fade-up', name: 'Fade Up', description: 'Content fades in while sliding up',
    category: 'fade', duration: 0.5, easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    cssCode: `body {\n  animation: forgeFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1);\n}\n@keyframes forgeFadeUp {\n  from { opacity: 0; transform: translateY(20px); }\n  to { opacity: 1; transform: translateY(0); }\n}`,
  },
  {
    id: 'slide-left', name: 'Slide Left', description: 'Page slides in from the right',
    category: 'slide', duration: 0.4, easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    cssCode: `body {\n  animation: forgeSlideLeft 0.4s cubic-bezier(0.25, 1, 0.5, 1);\n}\n@keyframes forgeSlideLeft {\n  from { transform: translateX(60px); opacity: 0; }\n  to { transform: translateX(0); opacity: 1; }\n}`,
  },
  {
    id: 'slide-right', name: 'Slide Right', description: 'Page slides in from the left',
    category: 'slide', duration: 0.4, easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    cssCode: `body {\n  animation: forgeSlideRight 0.4s cubic-bezier(0.25, 1, 0.5, 1);\n}\n@keyframes forgeSlideRight {\n  from { transform: translateX(-60px); opacity: 0; }\n  to { transform: translateX(0); opacity: 1; }\n}`,
  },
  {
    id: 'slide-up', name: 'Slide Up', description: 'Full page slides up from below',
    category: 'slide', duration: 0.5, easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    cssCode: `body {\n  animation: forgeSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1);\n}\n@keyframes forgeSlideUp {\n  from { transform: translateY(100vh); }\n  to { transform: translateY(0); }\n}`,
  },
  {
    id: 'scale-up', name: 'Scale Up', description: 'Page scales up from smaller size',
    category: 'scale', duration: 0.4, easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    cssCode: `body {\n  animation: forgeScaleUp 0.4s cubic-bezier(0.22, 1, 0.36, 1);\n}\n@keyframes forgeScaleUp {\n  from { transform: scale(0.95); opacity: 0; }\n  to { transform: scale(1); opacity: 1; }\n}`,
  },
  {
    id: 'zoom-fade', name: 'Zoom Fade', description: 'Scale + fade + blur for modern feel',
    category: 'scale', duration: 0.5, easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    cssCode: `body {\n  animation: forgeZoomFade 0.5s cubic-bezier(0.16, 1, 0.3, 1);\n}\n@keyframes forgeZoomFade {\n  from { transform: scale(0.9); opacity: 0; filter: blur(4px); }\n  to { transform: scale(1); opacity: 1; filter: blur(0); }\n}`,
  },
  {
    id: 'clip-reveal', name: 'Clip Reveal', description: 'Circular clip-path reveal',
    category: 'clip', duration: 0.6, easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    cssCode: `body {\n  animation: forgeClipReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1);\n}\n@keyframes forgeClipReveal {\n  from { clip-path: circle(0% at 50% 50%); }\n  to { clip-path: circle(150% at 50% 50%); }\n}`,
  },
  {
    id: 'wipe-left', name: 'Wipe Left', description: 'Content wipes in from the right',
    category: 'clip', duration: 0.5, easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    cssCode: `body {\n  animation: forgeWipeLeft 0.5s cubic-bezier(0.25, 1, 0.5, 1);\n}\n@keyframes forgeWipeLeft {\n  from { clip-path: inset(0 0 0 100%); }\n  to { clip-path: inset(0 0 0 0); }\n}`,
  },
];

const CATEGORIES = ['all', 'fade', 'slide', 'scale', 'clip'] as const;
const CATEGORY_COLORS: Record<string, string> = {
  fade: 'var(--accent-text)',
  slide: '#8b5cf6',
  scale: '#f59e0b',
  clip: '#ec4899',
};

export function PageTransitions() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);

  const filtered = activeCategory === 'all'
    ? TRANSITIONS
    : TRANSITIONS.filter((t) => t.category === activeCategory);

  const selected = TRANSITIONS.find((t) => t.id === selectedId) ?? null;

  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* clipboard may fail */ }
  }, []);

  return (
    <div
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: '10px 14px',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <div className="flex items-center" style={{ gap: 6 }}>
          <Code size={13} style={{ color: 'var(--text-tertiary)' }} />
          <span
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            Page Transitions
          </span>
        </div>
        {selected && (
          <button
            onClick={() => setShowCode(!showCode)}
            className="flex items-center border-none bg-transparent cursor-pointer"
            style={{
              gap: 4,
              fontSize: 'var(--text-xs)',
              color: 'var(--accent-text)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {showCode ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showCode ? 'Hide Code' : 'Show Code'}
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div
        className="flex"
        style={{
          padding: '8px 14px',
          gap: 4,
          borderBottom: '1px solid var(--border-subtle)',
          overflowX: 'auto',
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="border-none cursor-pointer"
            style={{
              height: 24,
              padding: '0 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: activeCategory === cat ? 'var(--accent-subtle)' : 'transparent',
              color: activeCategory === cat ? 'var(--accent-text)' : 'var(--text-tertiary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              textTransform: 'capitalize',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Transition grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 8,
          padding: 14,
        }}
      >
        {filtered.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setSelectedId(t.id === selectedId ? null : t.id);
              if (t.id !== selectedId) setShowCode(false);
            }}
            className="border-none cursor-pointer"
            style={{
              padding: 10,
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${t.id === selectedId ? 'var(--accent)' : 'var(--border-default)'}`,
              backgroundColor: t.id === selectedId ? 'var(--accent-subtle)' : 'var(--bg-primary)',
              textAlign: 'left',
              fontFamily: 'var(--font-sans)',
              transition: 'all var(--duration-fast)',
            }}
            onMouseEnter={(e) => {
              if (t.id !== selectedId) e.currentTarget.style.borderColor = 'var(--border-hover)';
            }}
            onMouseLeave={(e) => {
              if (t.id !== selectedId) e.currentTarget.style.borderColor = 'var(--border-default)';
            }}
          >
            <div
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: 4,
              }}
            >
              {t.name}
            </div>
            <div className="flex items-center" style={{ gap: 6 }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  color: CATEGORY_COLORS[t.category] ?? 'var(--text-tertiary)',
                  textTransform: 'capitalize',
                }}
              >
                {t.category}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-tertiary)',
                }}
              >
                {t.duration}s
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Code view */}
      {selected && showCode && (
        <div
          style={{
            borderTop: '1px solid var(--border-default)',
            padding: 14,
            animation: 'fadeIn 150ms ease-out',
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                CSS
              </span>
              <button
                onClick={() => handleCopy(selected.cssCode, `css-${selected.id}`)}
                className="flex items-center border-none bg-transparent cursor-pointer"
                style={{
                  gap: 4,
                  fontSize: 'var(--text-xs)',
                  color: copiedId === `css-${selected.id}` ? 'var(--accent-text)' : 'var(--text-tertiary)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {copiedId === `css-${selected.id}` ? <Check size={11} /> : <Copy size={11} />}
                {copiedId === `css-${selected.id}` ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre
              style={{
                padding: 10,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                margin: 0,
                overflow: 'auto',
                maxHeight: 200,
                whiteSpace: 'pre-wrap',
              }}
            >
              {selected.cssCode}
            </pre>
          </div>

          {selected.jsCode && (
            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  JavaScript
                </span>
                <button
                  onClick={() => handleCopy(selected.jsCode!, `js-${selected.id}`)}
                  className="flex items-center border-none bg-transparent cursor-pointer"
                  style={{
                    gap: 4,
                    fontSize: 'var(--text-xs)',
                    color: copiedId === `js-${selected.id}` ? 'var(--accent-text)' : 'var(--text-tertiary)',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {copiedId === `js-${selected.id}` ? <Check size={11} /> : <Copy size={11} />}
                  {copiedId === `js-${selected.id}` ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre
                style={{
                  padding: 10,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                  margin: 0,
                  overflow: 'auto',
                  maxHeight: 200,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selected.jsCode}
              </pre>
            </div>
          )}

          {/* Copy all button */}
          <div className="flex justify-end" style={{ marginTop: 10 }}>
            <button
              onClick={() => {
                const all = selected.cssCode + (selected.jsCode ? `\n\n/* JavaScript */\n<script>\n${selected.jsCode}\n</script>` : '');
                handleCopy(all, `all-${selected.id}`);
              }}
              className="flex items-center border-none cursor-pointer"
              style={{
                gap: 4,
                height: 28,
                padding: '0 10px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
              }}
            >
              {copiedId === `all-${selected.id}` ? <Check size={12} /> : <Copy size={12} />}
              {copiedId === `all-${selected.id}` ? 'Copied All' : 'Copy All Code'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
