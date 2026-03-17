import { useState, useCallback, useRef, useEffect } from 'react';
import { Copy, Trash2 } from 'lucide-react';
import type { AnimationPreset, AnimationPresetConfig } from '@/types/animation';

export interface PresetCardProps {
  preset: AnimationPreset;
  onSelect: (preset: AnimationPreset) => void;
  onDelete?: (preset: AnimationPreset) => void;
}

/** Renders a single animation preset as a card with looping hover preview */
export function PresetCard({ preset, onSelect, onDelete }: PresetCardProps) {
  const [hovered, setHovered] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isGsap = preset.engine === 'GSAP';

  // Looping animation on hover
  useEffect(() => {
    const el = previewRef.current?.querySelector('[data-preview-el]') as HTMLElement | null;
    if (!el) return;

    if (hovered) {
      runAnimationLoop(el, preset.config, loopRef, timeoutRef);
    } else {
      cancelLoop(loopRef, timeoutRef);
      resetToResting(el);
    }

    return () => cancelLoop(loopRef, timeoutRef);
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
        {/* Preview element */}
        <div
          data-preview-el
          style={{
            width: 72,
            height: 48,
            backgroundColor: isGsap ? 'var(--forge-800, #065f46)' : 'var(--accent)',
            borderRadius: 'var(--radius-md)',
            opacity: 1,
            transform: 'none',
            filter: 'none',
            boxShadow: 'none',
            willChange: hovered ? 'transform, opacity, filter' : 'auto',
          }}
        />
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

// ── Animation loop engine ──

function cancelLoop(
  loopRef: React.MutableRefObject<number | null>,
  timeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
) {
  if (loopRef.current !== null) {
    cancelAnimationFrame(loopRef.current);
    loopRef.current = null;
  }
  if (timeoutRef.current !== null) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
}

function resetToResting(el: HTMLElement) {
  el.style.transition = 'opacity 0.2s ease, transform 0.2s ease, filter 0.2s ease, box-shadow 0.2s ease, clip-path 0.2s ease, outline 0.2s ease';
  el.style.opacity = '1';
  el.style.transform = 'none';
  el.style.filter = 'none';
  el.style.boxShadow = 'none';
  el.style.clipPath = 'none';
  el.style.outline = 'none';
  el.style.transformOrigin = '';
}

/**
 * Continuously loops the animation while hovered:
 *  1. Snap to "before" state (no transition)
 *  2. Wait a frame, apply transition + animate to "after" state
 *  3. Hold at end, then repeat
 */
function runAnimationLoop(
  el: HTMLElement,
  config: AnimationPresetConfig,
  loopRef: React.MutableRefObject<number | null>,
  timeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
) {
  const dur = config.duration ?? 0.6;
  const delay = config.delay ?? 0;
  const ease = config.ease ?? 'ease-out';
  const dist = config.distance ?? 24;
  const totalMs = (dur + delay) * 1000;
  const holdMs = 900;

  function playOnce() {
    // 1. Snap to "before" state instantly
    el.style.transition = 'none';
    setBeforeState(el, config, dist);

    // 2. Next frame: apply transition and animate to end state
    loopRef.current = requestAnimationFrame(() => {
      loopRef.current = requestAnimationFrame(() => {
        el.style.transition = [
          `opacity ${dur}s ${ease} ${delay}s`,
          `transform ${dur}s ${ease} ${delay}s`,
          `filter ${dur}s ${ease} ${delay}s`,
          `box-shadow ${dur}s ${ease} ${delay}s`,
          `clip-path ${dur}s ${ease} ${delay}s`,
          `outline ${dur}s ${ease} ${delay}s`,
        ].join(', ');
        setAfterState(el, config);
      });
    });

    // 3. After complete, loop
    timeoutRef.current = setTimeout(playOnce, totalMs + holdMs);
  }

  playOnce();
}

/** Set element to its initial (pre-animation) state */
function setBeforeState(el: HTMLElement, config: AnimationPresetConfig, dist: number) {
  el.style.opacity = '1';
  el.style.transform = 'none';
  el.style.filter = 'none';
  el.style.boxShadow = 'none';
  el.style.clipPath = 'none';
  el.style.outline = 'none';
  el.style.transformOrigin = '';

  switch (config.animationType) {
    case 'fade-in':
      el.style.opacity = '0';
      break;
    case 'fade-up':
      el.style.opacity = '0';
      el.style.transform = `translateY(${dist}px)`;
      break;
    case 'fade-down':
      el.style.opacity = '0';
      el.style.transform = `translateY(-${dist}px)`;
      break;
    case 'fade-left':
      el.style.opacity = '0';
      el.style.transform = `translateX(${dist}px)`;
      break;
    case 'fade-right':
      el.style.opacity = '0';
      el.style.transform = `translateX(-${dist}px)`;
      break;
    case 'scale-in':
      el.style.opacity = '0';
      el.style.transform = 'scale(0.3)';
      break;
    case 'scale-up':
      el.style.transform = 'scale(0.85)';
      el.style.opacity = '0.6';
      break;
    case 'scale-down':
      el.style.opacity = '0';
      el.style.transform = 'scale(1.15)';
      break;
    case 'slide-up':
      el.style.transform = `translateY(${dist}px)`;
      break;
    case 'slide-down':
      el.style.transform = `translateY(-${dist}px)`;
      break;
    case 'slide-left':
      el.style.transform = `translateX(${dist}px)`;
      break;
    case 'slide-right':
      el.style.transform = `translateX(-${dist}px)`;
      break;
    case 'rotate-in':
      el.style.opacity = '0';
      el.style.transform = `rotate(${config.rotate ?? -10}deg) scale(0.9)`;
      break;
    case 'blur-in':
      el.style.opacity = '0';
      el.style.filter = `blur(${config.blur ?? 8}px)`;
      break;
    case 'lift':
      el.style.transform = 'translateY(0)';
      el.style.boxShadow = 'none';
      break;
    case 'glow':
      el.style.boxShadow = 'none';
      break;
    // GSAP presets — CSS approximations of each concept
    case 'parallax':
      el.style.transform = `translateY(-${dist * 0.6}px)`;
      el.style.opacity = '1';
      break;
    case 'split-text':
    case 'stagger':
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.clipPath = 'inset(0 100% 0 0)';
      break;
    case 'scrub':
      el.style.transform = 'scaleX(0.3)';
      el.style.transformOrigin = 'left center';
      el.style.opacity = '1';
      break;
    case 'pin':
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.outline = 'none';
      break;
    default:
      el.style.opacity = '0';
      break;
  }
}

/** Set element to its final (post-animation) state */
function setAfterState(el: HTMLElement, config: AnimationPresetConfig) {
  switch (config.animationType) {
    case 'lift':
      el.style.transform = 'translateY(-6px)';
      el.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.12)';
      break;
    case 'glow':
      el.style.boxShadow = '0 0 24px rgba(16, 185, 129, 0.35)';
      break;
    case 'scale-up':
      el.style.transform = 'scale(1.08)';
      el.style.opacity = '1';
      break;
    case 'parallax':
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      break;
    case 'split-text':
    case 'stagger':
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.clipPath = 'none';
      break;
    case 'scrub':
      el.style.transform = 'scaleX(1)';
      break;
    case 'pin':
      el.style.outline = '2px solid var(--accent)';
      break;
    default:
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.filter = 'none';
      el.style.boxShadow = 'none';
      break;
  }
}

// ── Attribute string builder ──

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
