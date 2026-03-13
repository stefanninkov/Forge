import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Copy, Check, RotateCcw, Zap } from 'lucide-react';
import type { AnimationPreset, AnimationPresetConfig } from '@/types/animation';

export interface ConfiguratorPanelProps {
  preset: AnimationPreset | null;
  open: boolean;
  onClose: () => void;
  onSaveCustom?: (config: AnimationPresetConfig) => void;
}

const EASE_OPTIONS = [
  { value: 'ease-out', label: 'ease-out' },
  { value: 'ease-in', label: 'ease-in' },
  { value: 'ease-in-out', label: 'ease-in-out' },
  { value: 'linear', label: 'linear' },
  { value: 'cubic-bezier(0.16, 1, 0.3, 1)', label: 'expo-out' },
  { value: 'cubic-bezier(0.33, 1, 0.68, 1)', label: 'cubic-out' },
  { value: 'power2.out', label: 'power2.out (GSAP)' },
  { value: 'power3.out', label: 'power3.out (GSAP)' },
  { value: 'none', label: 'none' },
];

export function ConfiguratorPanel({ preset, open, onClose, onSaveCustom }: ConfiguratorPanelProps) {
  const [config, setConfig] = useState<AnimationPresetConfig | null>(null);
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sync config when preset changes
  useEffect(() => {
    if (preset) {
      setConfig({ ...preset.config });
    }
  }, [preset]);

  // Replay animation whenever config changes
  useEffect(() => {
    if (!config || !previewRef.current) return;

    const el = previewRef.current.querySelector('[data-configurator-el]') as HTMLElement | null;
    if (!el) return;

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    // Reset
    el.style.transition = 'none';
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.filter = 'none';
    el.style.boxShadow = 'none';

    animFrameRef.current = requestAnimationFrame(() => {
      animFrameRef.current = requestAnimationFrame(() => {
        applyConfiguredAnimation(el, config);
      });
    });
  }, [config]);

  const handleCopy = useCallback(() => {
    if (!preset || !config) return;
    const attrs = buildAttrString(preset, config);
    navigator.clipboard.writeText(attrs);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [preset, config]);

  const handleReplay = useCallback(() => {
    if (!config || !previewRef.current) return;
    const el = previewRef.current.querySelector('[data-configurator-el]') as HTMLElement | null;
    if (!el) return;

    el.style.transition = 'none';
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.filter = 'none';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        applyConfiguredAnimation(el, config);
      });
    });
  }, [config]);

  if (!open || !preset || !config) return null;

  const isGsap = preset.engine === 'GSAP';
  const isRecommendedCSS = !isGsap && (
    config.animationType.startsWith('fade') ||
    config.animationType.startsWith('slide') ||
    config.animationType.startsWith('scale') ||
    config.animationType === 'blur-in' ||
    config.animationType === 'rotate-in'
  );

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          backgroundColor: 'rgba(0,0,0,0.2)',
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '50%',
          minWidth: 480,
          maxWidth: 720,
          zIndex: 50,
          backgroundColor: 'var(--bg-primary)',
          borderLeft: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 200ms ease-out',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 'var(--text-md)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 'var(--leading-tight)',
              }}
            >
              {preset.name}
            </h2>
            <div className="flex items-center" style={{ gap: 6, marginTop: 4 }}>
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
                }}
              >
                {preset.engine}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-tertiary)',
                }}
              >
                {preset.trigger.toLowerCase()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center border-none bg-transparent cursor-pointer"
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-tertiary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: 20 }}>
          {/* Live preview */}
          <div
            ref={previewRef}
            className="flex items-center justify-center"
            style={{
              height: 180,
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 20,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              data-configurator-el
              style={{
                width: 100,
                height: 72,
                backgroundColor: isGsap ? 'var(--forge-800, #065f46)' : 'var(--accent)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {config.animationType}
            </div>

            {/* Replay button */}
            <button
              onClick={handleReplay}
              className="flex items-center justify-center border-none cursor-pointer"
              style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.color = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              title="Replay animation"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Recommendation chip */}
          <div
            className="flex items-center"
            style={{
              gap: 6,
              padding: '8px 10px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 20,
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
            }}
          >
            <Zap size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            {isRecommendedCSS
              ? 'CSS recommended — lightweight, no GSAP dependency needed.'
              : isGsap
                ? 'GSAP required — complex scroll-linked or text-splitting animation.'
                : 'GSAP recommended for advanced control, CSS works for simple cases.'}
          </div>

          {/* Parameter controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Duration */}
            <SliderControl
              label="Duration"
              value={config.duration}
              min={0.1}
              max={3}
              step={0.1}
              unit="s"
              onChange={(v) => setConfig({ ...config, duration: v })}
            />

            {/* Delay */}
            <SliderControl
              label="Delay"
              value={config.delay}
              min={0}
              max={5}
              step={0.1}
              unit="s"
              onChange={(v) => setConfig({ ...config, delay: v })}
            />

            {/* Ease */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                Easing
              </label>
              <select
                value={config.ease}
                onChange={(e) => setConfig({ ...config, ease: e.target.value })}
                style={{
                  width: '100%',
                  height: 32,
                  padding: '0 28px 0 8px',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                }}
              >
                {EASE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Distance (when applicable) */}
            {config.distance !== undefined && (
              <SliderControl
                label="Distance"
                value={config.distance}
                min={0}
                max={200}
                step={4}
                unit="px"
                onChange={(v) => setConfig({ ...config, distance: v })}
              />
            )}

            {/* Threshold */}
            {config.threshold !== undefined && (
              <SliderControl
                label="Threshold"
                value={config.threshold}
                min={0}
                max={1}
                step={0.1}
                unit=""
                onChange={(v) => setConfig({ ...config, threshold: v })}
              />
            )}

            {/* GSAP-specific controls */}
            {isGsap && (
              <>
                {config.gsapStagger !== undefined && (
                  <SliderControl
                    label="Stagger"
                    value={config.gsapStagger}
                    min={0}
                    max={0.5}
                    step={0.01}
                    unit="s"
                    onChange={(v) => setConfig({ ...config, gsapStagger: v })}
                  />
                )}

                {config.gsapStart && (
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: 6,
                      }}
                    >
                      ScrollTrigger Start
                    </label>
                    <input
                      type="text"
                      value={config.gsapStart}
                      onChange={(e) => setConfig({ ...config, gsapStart: e.target.value })}
                      style={{
                        width: '100%',
                        height: 32,
                        padding: '0 8px',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: 'var(--text-xs)',
                        fontFamily: 'var(--font-mono)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}

                {config.gsapEnd && (
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: 6,
                      }}
                    >
                      ScrollTrigger End
                    </label>
                    <input
                      type="text"
                      value={config.gsapEnd}
                      onChange={(e) => setConfig({ ...config, gsapEnd: e.target.value })}
                      style={{
                        width: '100%',
                        height: 32,
                        padding: '0 8px',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: 'var(--text-xs)',
                        fontFamily: 'var(--font-mono)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}

                {config.gsapSplit && (
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: 6,
                      }}
                    >
                      Split Type
                    </label>
                    <select
                      value={config.gsapSplit}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          gsapSplit: e.target.value as 'chars' | 'words' | 'lines',
                        })
                      }
                      style={{
                        width: '100%',
                        height: 32,
                        padding: '0 28px 0 8px',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: 'var(--text-xs)',
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 8px center',
                      }}
                    >
                      <option value="words">Words</option>
                      <option value="chars">Characters</option>
                      <option value="lines">Lines</option>
                    </select>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Generated attributes preview */}
          <div style={{ marginTop: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: 6,
              }}
            >
              Data attributes
            </label>
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--accent)',
                lineHeight: 'var(--leading-relaxed)',
                wordBreak: 'break-all',
              }}
            >
              {buildAttrString(preset, config)}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-default)',
          }}
        >
          <button
            onClick={handleReplay}
            className="flex items-center border-none bg-transparent cursor-pointer"
            style={{
              gap: 6,
              height: 36,
              padding: '0 12px',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <RotateCcw size={14} />
            Replay
          </button>

          <div className="flex items-center" style={{ gap: 8 }}>
            {onSaveCustom && (
              <button
                onClick={() => onSaveCustom(config)}
                style={{
                  height: 36,
                  padding: '0 14px',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Save as Custom
              </button>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center"
              style={{
                gap: 6,
                height: 36,
                padding: '0 14px',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent)';
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy Attributes'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

// ── Slider control component ──

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}

function SliderControl({ label, value, min, max, step, unit, onChange }: SliderControlProps) {
  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <label
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </label>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-primary)',
          }}
        >
          {value.toFixed(step < 1 ? (step < 0.1 ? 2 : 1) : 0)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          height: 4,
          accentColor: 'var(--accent)',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}

// ── Animation helpers ──

function applyConfiguredAnimation(el: HTMLElement, config: AnimationPresetConfig) {
  const dur = config.duration ?? 0.6;
  const ease = config.ease ?? 'ease-out';
  const delay = config.delay ?? 0;
  const dist = config.distance ?? 24;

  el.style.transition = `opacity ${dur}s ${ease} ${delay}s, transform ${dur}s ${ease} ${delay}s, filter ${dur}s ${ease} ${delay}s`;

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
      el.style.opacity = '0';
      el.style.transform = 'scale(0.95)';
      requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'none'; });
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
    default:
      // GSAP presets — show generic reveal
      el.style.opacity = '0';
      el.style.transform = 'scale(0.95)';
      requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'none'; });
      break;
  }
}

function buildAttrString(preset: AnimationPreset, config: AnimationPresetConfig): string {
  const parts: string[] = [];

  if (preset.trigger === 'HOVER') {
    parts.push(`data-hover="${config.animationType}"`);
  } else if (preset.trigger === 'LOAD') {
    parts.push(`data-load="${config.animationType}"`);
  } else if (preset.engine === 'GSAP') {
    parts.push(`data-gsap="${config.animationType}"`);
    if (config.gsapStart) parts.push(`data-gsap-start="${config.gsapStart}"`);
    if (config.gsapEnd) parts.push(`data-gsap-end="${config.gsapEnd}"`);
    if (config.gsapScrub !== undefined) parts.push(`data-gsap-scrub="${config.gsapScrub}"`);
    if (config.gsapStagger) parts.push(`data-gsap-stagger="${config.gsapStagger}"`);
    if (config.gsapPin) parts.push(`data-gsap-pin="true"`);
    if (config.gsapSplit) parts.push(`data-gsap-split="${config.gsapSplit}"`);
  } else {
    parts.push(`data-anim="${config.animationType}"`);
  }

  if (config.duration !== undefined && config.duration !== 0.6) {
    parts.push(`data-anim-duration="${config.duration}"`);
  }
  if (config.delay) {
    parts.push(`data-anim-delay="${config.delay}"`);
  }
  if (config.ease && config.ease !== 'ease-out') {
    parts.push(`data-anim-ease="${config.ease}"`);
  }
  if (config.distance && config.distance !== 24) {
    parts.push(`data-anim-distance="${config.distance}"`);
  }

  return parts.join(' ');
}
