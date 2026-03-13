import { useState, useCallback, useRef, useEffect } from 'react';
import { Copy, Pencil, Trash2 } from 'lucide-react';
import type { AnimationPreset, AnimationPresetConfig } from '@/types/animation';

export interface PresetCardProps {
  preset: AnimationPreset;
  onSelect: (preset: AnimationPreset) => void;
  onDelete?: (preset: AnimationPreset) => void;
}

/** Renders a single animation preset as a card with live hover preview */
export function PresetCard({ preset, onSelect, onDelete }: PresetCardProps) {
  const [hovered, setHovered] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const isGsap = preset.engine === 'GSAP';

  // Apply animation on hover
  useEffect(() => {
    const el = previewRef.current?.querySelector('[data-preview-el]') as HTMLElement | null;
    if (!el) return;

    if (hovered) {
      applyAnimation(el, preset.config);
    } else {
      resetAnimation(el, preset.config);
    }
  }, [hovered, preset.config]);

  const handleCopyAttributes = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const attrs = buildAttributeString(preset);
      navigator.clipboard.writeText(attrs);
    },
    [preset],
  );

  return (
    <div
      onClick={() => onSelect(preset)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-primary)',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'border-color var(--duration-fast)',
        borderColor: hovered ? 'var(--border-active)' : 'var(--border-default)',
      }}
    >
      {/* Preview area */}
      <div
        ref={previewRef}
        className="flex items-center justify-center"
        style={{
          height: 120,
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-default)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          data-preview-el
          style={{
            width: 64,
            height: 48,
            backgroundColor: isGsap ? 'var(--forge-800, #065f46)' : 'var(--accent)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            fontFamily: 'var(--font-mono)',
            transition: 'none',
          }}
        >
          {preset.config.animationType}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '10px 12px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
          <span
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: 'var(--leading-tight)',
            }}
          >
            {preset.name}
          </span>
          <div className="flex items-center" style={{ gap: 2 }}>
            {/* Engine badge */}
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                padding: '1px 5px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isGsap
                  ? 'rgba(6, 95, 70, 0.12)'
                  : 'rgba(5, 150, 105, 0.12)',
                color: isGsap ? 'var(--forge-800, #065f46)' : 'var(--accent)',
                letterSpacing: '0.02em',
              }}
            >
              {preset.engine}
            </span>
          </div>
        </div>

        {/* Description */}
        {preset.description && (
          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              lineHeight: 'var(--leading-normal)',
              margin: '0 0 8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {preset.description}
          </p>
        )}

        {/* Footer: trigger badge + actions */}
        <div className="flex items-center justify-between">
          <span
            style={{
              fontSize: '10px',
              fontWeight: 500,
              fontFamily: 'var(--font-mono)',
              textTransform: 'lowercase',
              color: 'var(--text-tertiary)',
            }}
          >
            {preset.trigger.toLowerCase()}
          </span>
          <div
            className="flex items-center"
            style={{
              gap: 2,
              opacity: hovered ? 1 : 0,
              transition: 'opacity var(--duration-fast)',
            }}
          >
            <button
              onClick={handleCopyAttributes}
              title="Copy data attributes"
              className="flex items-center justify-center border-none bg-transparent cursor-pointer"
              style={{
                width: 24,
                height: 24,
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-tertiary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }}
            >
              <Copy size={12} />
            </button>
            {!preset.isSystem && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(preset);
                }}
                title="Delete preset"
                className="flex items-center justify-center border-none bg-transparent cursor-pointer"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-tertiary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                  e.currentTarget.style.color = 'var(--error)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-tertiary)';
                }}
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Animation helpers ──

function applyAnimation(el: HTMLElement, config: AnimationPresetConfig) {
  const dur = config.duration ?? 0.6;
  const ease = config.ease ?? 'ease-out';
  const dist = config.distance ?? 24;

  el.style.transition = `opacity ${dur}s ${ease}, transform ${dur}s ${ease}, filter ${dur}s ${ease}, box-shadow ${dur}s ${ease}`;

  switch (config.animationType) {
    case 'fade-in':
      el.style.opacity = '0';
      requestAnimationFrame(() => { el.style.opacity = '1'; });
      break;
    case 'fade-up':
      el.style.opacity = '0';
      el.style.transform = `translateY(${dist}px)`;
      requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'none'; });
      break;
    case 'fade-down':
      el.style.opacity = '0';
      el.style.transform = `translateY(-${dist}px)`;
      requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'none'; });
      break;
    case 'fade-left':
      el.style.opacity = '0';
      el.style.transform = `translateX(${dist}px)`;
      requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'none'; });
      break;
    case 'fade-right':
      el.style.opacity = '0';
      el.style.transform = `translateX(-${dist}px)`;
      requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'none'; });
      break;
    case 'scale-in':
      el.style.opacity = '0';
      el.style.transform = 'scale(0)';
      requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'none'; });
      break;
    case 'scale-up':
      // hover variant: scale up
      el.style.transform = 'scale(1.06)';
      break;
    case 'scale-down':
      el.style.opacity = '0';
      el.style.transform = 'scale(1.05)';
      requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'none'; });
      break;
    case 'slide-up':
      el.style.transform = `translateY(${dist}px)`;
      requestAnimationFrame(() => { el.style.transform = 'none'; });
      break;
    case 'slide-down':
      el.style.transform = `translateY(-${dist}px)`;
      requestAnimationFrame(() => { el.style.transform = 'none'; });
      break;
    case 'slide-left':
      el.style.transform = `translateX(${dist}px)`;
      requestAnimationFrame(() => { el.style.transform = 'none'; });
      break;
    case 'slide-right':
      el.style.transform = `translateX(-${dist}px)`;
      requestAnimationFrame(() => { el.style.transform = 'none'; });
      break;
    case 'rotate-in':
      el.style.opacity = '0';
      el.style.transform = `rotate(${config.rotate ?? -10}deg)`;
      requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'none'; });
      break;
    case 'blur-in':
      el.style.opacity = '0';
      el.style.filter = `blur(${config.blur ?? 8}px)`;
      requestAnimationFrame(() => { el.style.opacity = '1'; el.style.filter = 'none'; });
      break;
    case 'lift':
      el.style.transform = 'translateY(-4px)';
      break;
    case 'glow':
      el.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.3)';
      break;
    case 'parallax':
    case 'split-text':
    case 'stagger':
    case 'scrub':
    case 'pin':
      // GSAP presets — show a subtle pulse to indicate it's a scroll animation
      el.style.transform = 'scale(0.95)';
      el.style.opacity = '0.6';
      requestAnimationFrame(() => { el.style.transform = 'none'; el.style.opacity = '1'; });
      break;
    default:
      break;
  }
}

function resetAnimation(el: HTMLElement, _config: AnimationPresetConfig) {
  el.style.transition = 'opacity 0.2s ease, transform 0.2s ease, filter 0.2s ease, box-shadow 0.2s ease';
  el.style.opacity = '1';
  el.style.transform = 'none';
  el.style.filter = 'none';
  el.style.boxShadow = 'none';
}

function buildAttributeString(preset: AnimationPreset): string {
  const c = preset.config;
  const parts: string[] = [];

  if (preset.trigger === 'HOVER') {
    parts.push(`data-hover="${c.animationType}"`);
  } else if (preset.trigger === 'LOAD') {
    parts.push(`data-load="${c.animationType}"`);
  } else if (preset.engine === 'GSAP') {
    parts.push(`data-gsap="${c.animationType}"`);
    if (c.gsapStart) parts.push(`data-gsap-start="${c.gsapStart}"`);
    if (c.gsapEnd) parts.push(`data-gsap-end="${c.gsapEnd}"`);
    if (c.gsapScrub !== undefined) parts.push(`data-gsap-scrub="${c.gsapScrub}"`);
    if (c.gsapStagger) parts.push(`data-gsap-stagger="${c.gsapStagger}"`);
    if (c.gsapPin) parts.push(`data-gsap-pin="true"`);
    if (c.gsapSplit) parts.push(`data-gsap-split="${c.gsapSplit}"`);
  } else {
    parts.push(`data-anim="${c.animationType}"`);
  }

  if (c.duration !== undefined && c.duration !== 0.6) {
    parts.push(`data-anim-duration="${c.duration}"`);
  }
  if (c.delay) {
    parts.push(`data-anim-delay="${c.delay}"`);
  }
  if (c.ease && c.ease !== 'ease-out') {
    parts.push(`data-anim-ease="${c.ease}"`);
  }
  if (c.distance && c.distance !== 24) {
    parts.push(`data-anim-distance="${c.distance}"`);
  }

  return parts.join(' ');
}
