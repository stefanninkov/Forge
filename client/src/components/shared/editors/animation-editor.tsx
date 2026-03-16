import { useState, useCallback, useMemo } from 'react';
import {
  Play, Pause, RotateCcw, Copy, Check, Layers,
  Timer, Zap, MousePointerClick, ScrollText, Eye,
  ChevronDown, Sliders, Clock,
} from 'lucide-react';
import { PropertyGroup } from './property-group';
import { UnitInput } from './unit-input';
import { CompactSelect } from './compact-select';
import { HelpTooltip } from './help-tooltip';

// ─── Types ───────────────────────────────────────────────────────

export type AnimationEngine = 'css' | 'gsap';
export type AnimationTrigger = 'scroll' | 'hover' | 'click' | 'load';
export type EasePreset =
  | 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'
  | 'power1.in' | 'power1.out' | 'power1.inOut'
  | 'power2.in' | 'power2.out' | 'power2.inOut'
  | 'power3.in' | 'power3.out' | 'power3.inOut'
  | 'power4.in' | 'power4.out' | 'power4.inOut'
  | 'back.in' | 'back.out' | 'back.inOut'
  | 'elastic.out' | 'bounce.out'
  | 'custom';

export interface AnimationPreset {
  id: string;
  name: string;
  category: 'entrance' | 'exit' | 'emphasis' | 'scroll' | 'hover' | 'stagger';
  engine: AnimationEngine;
  trigger: AnimationTrigger;
  description: string;
  defaults: AnimationConfig;
}

export interface AnimationConfig {
  duration: number;
  delay: number;
  ease: EasePreset;
  customEase?: string;
  // Transform
  translateX?: number;
  translateY?: number;
  rotate?: number;
  scale?: number;
  skewX?: number;
  skewY?: number;
  // Visual
  opacity?: number;
  blur?: number;
  // GSAP-specific
  scrub?: boolean | number;
  pin?: boolean;
  stagger?: number;
  splitType?: 'chars' | 'words' | 'lines';
  markers?: boolean;
  // Scroll trigger
  scrollStart?: string;
  scrollEnd?: string;
}

export interface AnimationEditorProps {
  preset?: AnimationPreset;
  config: AnimationConfig;
  engine: AnimationEngine;
  trigger: AnimationTrigger;
  onChange: (config: AnimationConfig) => void;
  onEngineChange: (engine: AnimationEngine) => void;
  onTriggerChange: (trigger: AnimationTrigger) => void;
  onCopyAttributes?: () => void;
  onApply?: () => void;
  onSaveCustom?: () => void;
}

// ─── Presets Library ─────────────────────────────────────────────

export const ANIMATION_PRESETS: AnimationPreset[] = [
  // Entrance animations
  {
    id: 'fade-in', name: 'Fade In', category: 'entrance', engine: 'css', trigger: 'scroll',
    description: 'Simple opacity fade from 0 to 1.',
    defaults: { duration: 0.6, delay: 0, ease: 'ease-out', opacity: 0 },
  },
  {
    id: 'fade-up', name: 'Fade Up', category: 'entrance', engine: 'css', trigger: 'scroll',
    description: 'Fade in while sliding up from below.',
    defaults: { duration: 0.6, delay: 0, ease: 'ease-out', opacity: 0, translateY: 30 },
  },
  {
    id: 'fade-down', name: 'Fade Down', category: 'entrance', engine: 'css', trigger: 'scroll',
    description: 'Fade in while sliding down from above.',
    defaults: { duration: 0.6, delay: 0, ease: 'ease-out', opacity: 0, translateY: -30 },
  },
  {
    id: 'fade-left', name: 'Fade Left', category: 'entrance', engine: 'css', trigger: 'scroll',
    description: 'Fade in while sliding from the right.',
    defaults: { duration: 0.6, delay: 0, ease: 'ease-out', opacity: 0, translateX: 30 },
  },
  {
    id: 'fade-right', name: 'Fade Right', category: 'entrance', engine: 'css', trigger: 'scroll',
    description: 'Fade in while sliding from the left.',
    defaults: { duration: 0.6, delay: 0, ease: 'ease-out', opacity: 0, translateX: -30 },
  },
  {
    id: 'scale-in', name: 'Scale In', category: 'entrance', engine: 'css', trigger: 'scroll',
    description: 'Grow from smaller size to full scale.',
    defaults: { duration: 0.5, delay: 0, ease: 'ease-out', opacity: 0, scale: 0.9 },
  },
  {
    id: 'slide-up', name: 'Slide Up', category: 'entrance', engine: 'css', trigger: 'scroll',
    description: 'Slide up from below without opacity change.',
    defaults: { duration: 0.5, delay: 0, ease: 'ease-out', translateY: 60 },
  },
  {
    id: 'blur-in', name: 'Blur In', category: 'entrance', engine: 'css', trigger: 'scroll',
    description: 'Fade and unblur into view.',
    defaults: { duration: 0.7, delay: 0, ease: 'ease-out', opacity: 0, blur: 10 },
  },
  // Exit animations
  {
    id: 'fade-out', name: 'Fade Out', category: 'exit', engine: 'css', trigger: 'scroll',
    description: 'Simple opacity fade to 0.',
    defaults: { duration: 0.4, delay: 0, ease: 'ease-in', opacity: 1 },
  },
  {
    id: 'scale-out', name: 'Scale Out', category: 'exit', engine: 'css', trigger: 'scroll',
    description: 'Shrink and fade out.',
    defaults: { duration: 0.4, delay: 0, ease: 'ease-in', opacity: 1, scale: 1 },
  },
  // Emphasis
  {
    id: 'pulse', name: 'Pulse', category: 'emphasis', engine: 'css', trigger: 'hover',
    description: 'Subtle scale pulse on hover.',
    defaults: { duration: 0.3, delay: 0, ease: 'ease-in-out', scale: 1.05 },
  },
  {
    id: 'shake', name: 'Shake', category: 'emphasis', engine: 'css', trigger: 'click',
    description: 'Quick horizontal shake.',
    defaults: { duration: 0.4, delay: 0, ease: 'ease-in-out', translateX: 8 },
  },
  // Scroll-driven
  {
    id: 'parallax', name: 'Parallax', category: 'scroll', engine: 'gsap', trigger: 'scroll',
    description: 'Smooth parallax movement linked to scroll position.',
    defaults: { duration: 1, delay: 0, ease: 'linear', translateY: -100, scrub: true, scrollStart: 'top bottom', scrollEnd: 'bottom top' },
  },
  {
    id: 'reveal-scrub', name: 'Reveal Scrub', category: 'scroll', engine: 'gsap', trigger: 'scroll',
    description: 'Opacity and position scrub tied to scroll.',
    defaults: { duration: 1, delay: 0, ease: 'power2.out', opacity: 0, translateY: 60, scrub: true, scrollStart: 'top 80%', scrollEnd: 'top 30%' },
  },
  {
    id: 'pin-section', name: 'Pin Section', category: 'scroll', engine: 'gsap', trigger: 'scroll',
    description: 'Pin an element during scroll for a set duration.',
    defaults: { duration: 1, delay: 0, ease: 'linear', pin: true, scrub: true, scrollStart: 'top top', scrollEnd: '+=500' },
  },
  // Hover
  {
    id: 'hover-lift', name: 'Hover Lift', category: 'hover', engine: 'css', trigger: 'hover',
    description: 'Lift element up on hover.',
    defaults: { duration: 0.25, delay: 0, ease: 'ease-out', translateY: -4 },
  },
  {
    id: 'hover-scale', name: 'Hover Scale', category: 'hover', engine: 'css', trigger: 'hover',
    description: 'Subtle scale increase on hover.',
    defaults: { duration: 0.25, delay: 0, ease: 'ease-out', scale: 1.03 },
  },
  // Stagger
  {
    id: 'stagger-fade', name: 'Stagger Fade', category: 'stagger', engine: 'gsap', trigger: 'scroll',
    description: 'Fade in child elements sequentially.',
    defaults: { duration: 0.5, delay: 0, ease: 'power2.out', opacity: 0, translateY: 20, stagger: 0.1 },
  },
  {
    id: 'text-reveal', name: 'Text Reveal', category: 'stagger', engine: 'gsap', trigger: 'scroll',
    description: 'Split text and reveal characters or words.',
    defaults: { duration: 0.8, delay: 0, ease: 'power3.out', opacity: 0, translateY: 20, stagger: 0.02, splitType: 'chars' },
  },
];

// ─── Ease options ────────────────────────────────────────────────

const CSS_EASES: { value: EasePreset; label: string }[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease', label: 'Ease' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In-Out' },
  { value: 'custom', label: 'Custom' },
];

const GSAP_EASES: { value: EasePreset; label: string }[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'power1.out', label: 'Power1 Out' },
  { value: 'power1.inOut', label: 'Power1 InOut' },
  { value: 'power2.in', label: 'Power2 In' },
  { value: 'power2.out', label: 'Power2 Out' },
  { value: 'power2.inOut', label: 'Power2 InOut' },
  { value: 'power3.in', label: 'Power3 In' },
  { value: 'power3.out', label: 'Power3 Out' },
  { value: 'power3.inOut', label: 'Power3 InOut' },
  { value: 'power4.in', label: 'Power4 In' },
  { value: 'power4.out', label: 'Power4 Out' },
  { value: 'power4.inOut', label: 'Power4 InOut' },
  { value: 'back.in', label: 'Back In' },
  { value: 'back.out', label: 'Back Out' },
  { value: 'back.inOut', label: 'Back InOut' },
  { value: 'elastic.out', label: 'Elastic Out' },
  { value: 'bounce.out', label: 'Bounce Out' },
  { value: 'custom', label: 'Custom' },
];

// ─── Attribute Generator ─────────────────────────────────────────

export function generateAttributes(
  config: AnimationConfig,
  engine: AnimationEngine,
  trigger: AnimationTrigger,
  presetId?: string,
): Record<string, string> {
  const attrs: Record<string, string> = {};
  attrs['data-forge-animate'] = presetId || 'custom';
  attrs['data-forge-engine'] = engine;
  attrs['data-forge-trigger'] = trigger;
  attrs['data-forge-duration'] = String(config.duration);
  if (config.delay > 0) attrs['data-forge-delay'] = String(config.delay);
  attrs['data-forge-ease'] = config.ease === 'custom' && config.customEase
    ? config.customEase
    : config.ease;
  if (config.translateX !== undefined && config.translateX !== 0)
    attrs['data-forge-x'] = String(config.translateX);
  if (config.translateY !== undefined && config.translateY !== 0)
    attrs['data-forge-y'] = String(config.translateY);
  if (config.rotate !== undefined && config.rotate !== 0)
    attrs['data-forge-rotate'] = String(config.rotate);
  if (config.scale !== undefined && config.scale !== 1)
    attrs['data-forge-scale'] = String(config.scale);
  if (config.opacity !== undefined)
    attrs['data-forge-opacity'] = String(config.opacity);
  if (config.blur !== undefined && config.blur > 0)
    attrs['data-forge-blur'] = String(config.blur);
  // GSAP scroll-specific
  if (engine === 'gsap') {
    if (config.scrub) attrs['data-forge-scrub'] = typeof config.scrub === 'number' ? String(config.scrub) : 'true';
    if (config.pin) attrs['data-forge-pin'] = 'true';
    if (config.stagger) attrs['data-forge-stagger'] = String(config.stagger);
    if (config.splitType) attrs['data-forge-split'] = config.splitType;
    if (config.scrollStart) attrs['data-forge-scroll-start'] = config.scrollStart;
    if (config.scrollEnd) attrs['data-forge-scroll-end'] = config.scrollEnd;
    if (config.markers) attrs['data-forge-markers'] = 'true';
  }
  return attrs;
}

export function attributesToString(attrs: Record<string, string>): string {
  return Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join('\n');
}

// ─── Component ───────────────────────────────────────────────────

export function AnimationEditor({
  preset,
  config,
  engine,
  trigger,
  onChange,
  onEngineChange,
  onTriggerChange,
  onCopyAttributes,
  onApply,
  onSaveCustom,
}: AnimationEditorProps) {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const update = useCallback(
    (patch: Partial<AnimationConfig>) => onChange({ ...config, ...patch }),
    [config, onChange],
  );

  const easeOptions = engine === 'gsap' ? GSAP_EASES : CSS_EASES;

  const recommendation = useMemo(() => {
    if (config.scrub || config.pin || config.stagger || config.splitType) {
      return { engine: 'gsap' as const, reason: 'Scrub, pin, stagger, and text splitting require GSAP ScrollTrigger.' };
    }
    if (trigger === 'scroll' && (config.translateY || config.translateX) && !config.scrub) {
      return { engine: 'css' as const, reason: 'Simple scroll-triggered transforms perform well with CSS transitions and IntersectionObserver.' };
    }
    if (trigger === 'hover' || trigger === 'click') {
      return { engine: 'css' as const, reason: 'Hover and click animations are best handled with CSS transitions for performance.' };
    }
    return { engine: 'css' as const, reason: 'CSS is lighter weight and sufficient for this animation.' };
  }, [config, trigger]);

  const attributes = useMemo(
    () => generateAttributes(config, engine, trigger, preset?.id),
    [config, engine, trigger, preset],
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(attributesToString(attributes));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopyAttributes?.();
  }, [attributes, onCopyAttributes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header with engine recommendation */}
      {recommendation.engine !== engine && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', marginBottom: 8,
            backgroundColor: 'var(--status-warning-bg)',
            border: '1px solid var(--status-warning-border)',
            borderRadius: 6, fontSize: 'var(--text-xs)',
            color: 'var(--status-warning-text)',
          }}
        >
          <Zap size={12} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            Recommended: <strong>{recommendation.engine.toUpperCase()}</strong>
          </span>
          <HelpTooltip text={recommendation.reason} size={12} />
        </div>
      )}

      {/* Engine & Trigger selectors */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Engine</label>
          <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-default)' }}>
            {(['css', 'gsap'] as const).map((eng) => (
              <button
                key={eng}
                onClick={() => onEngineChange(eng)}
                style={{
                  flex: 1, height: 28, border: 'none', cursor: 'pointer',
                  fontSize: 'var(--text-xs)', fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: engine === eng ? 'var(--accent)' : 'transparent',
                  color: engine === eng ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  transition: 'all var(--duration-fast)',
                }}
              >
                {eng.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Trigger</label>
          <CompactSelect
            value={trigger}
            options={[
              { value: 'scroll', label: 'Scroll', icon: ScrollText },
              { value: 'hover', label: 'Hover', icon: MousePointerClick },
              { value: 'click', label: 'Click', icon: MousePointerClick },
              { value: 'load', label: 'Load', icon: Eye },
            ]}
            onChange={(v) => onTriggerChange(v as AnimationTrigger)}
            compact
          />
        </div>
      </div>

      {/* Timing */}
      <PropertyGroup title="Timing" defaultOpen>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Duration</label>
            <SliderInput
              value={config.duration}
              min={0.05}
              max={3}
              step={0.05}
              unit="s"
              onChange={(v) => update({ duration: v })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Delay</label>
            <SliderInput
              value={config.delay}
              min={0}
              max={5}
              step={0.05}
              unit="s"
              onChange={(v) => update({ delay: v })}
            />
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <label style={labelStyle}>
            Easing
            <HelpTooltip
              content="Controls acceleration curve of the animation. 'Ease-out' is most natural for entrances."
              size={10}
            />
          </label>
          <CompactSelect
            value={config.ease}
            options={easeOptions.map((e) => ({ value: e.value, label: e.label }))}
            onChange={(v) => update({ ease: v as EasePreset })}
            compact
            mono
          />
          {config.ease === 'custom' && (
            <input
              type="text"
              value={config.customEase || 'cubic-bezier(0.25, 0.1, 0.25, 1)'}
              onChange={(e) => update({ customEase: e.target.value })}
              placeholder="cubic-bezier(0.25, 0.1, 0.25, 1)"
              style={{
                width: '100%', height: 28, marginTop: 4,
                padding: '0 8px', border: '1px solid var(--border-default)',
                borderRadius: 4, fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)', backgroundColor: 'transparent',
              }}
            />
          )}
        </div>
      </PropertyGroup>

      {/* Transform */}
      <PropertyGroup title="Transform" defaultOpen>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={labelStyle}>Translate X</label>
            <SliderInput
              value={config.translateX ?? 0}
              min={-200}
              max={200}
              step={1}
              unit="px"
              onChange={(v) => update({ translateX: v })}
            />
          </div>
          <div>
            <label style={labelStyle}>Translate Y</label>
            <SliderInput
              value={config.translateY ?? 0}
              min={-200}
              max={200}
              step={1}
              unit="px"
              onChange={(v) => update({ translateY: v })}
            />
          </div>
          <div>
            <label style={labelStyle}>Rotate</label>
            <SliderInput
              value={config.rotate ?? 0}
              min={-360}
              max={360}
              step={1}
              unit="°"
              onChange={(v) => update({ rotate: v })}
            />
          </div>
          <div>
            <label style={labelStyle}>Scale</label>
            <SliderInput
              value={config.scale ?? 1}
              min={0}
              max={3}
              step={0.01}
              onChange={(v) => update({ scale: v })}
            />
          </div>
        </div>
      </PropertyGroup>

      {/* Visual */}
      <PropertyGroup title="Visual" defaultOpen>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={labelStyle}>Opacity</label>
            <SliderInput
              value={config.opacity ?? 1}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => update({ opacity: v })}
            />
          </div>
          <div>
            <label style={labelStyle}>Blur</label>
            <SliderInput
              value={config.blur ?? 0}
              min={0}
              max={30}
              step={0.5}
              unit="px"
              onChange={(v) => update({ blur: v })}
            />
          </div>
        </div>
      </PropertyGroup>

      {/* GSAP-specific controls */}
      {engine === 'gsap' && (
        <PropertyGroup title="ScrollTrigger" defaultOpen={trigger === 'scroll'}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <ToggleSwitch
                label="Scrub"
                checked={!!config.scrub}
                onChange={(v) => update({ scrub: v ? true : false })}
                tooltip="Links animation progress to scroll position instead of playing on trigger."
              />
              <ToggleSwitch
                label="Pin"
                checked={!!config.pin}
                onChange={(v) => update({ pin: v })}
                tooltip="Pins the element in place during the scroll-driven animation."
              />
              <ToggleSwitch
                label="Markers"
                checked={!!config.markers}
                onChange={(v) => update({ markers: v })}
                tooltip="Show debug markers for scroll start/end positions."
              />
            </div>
            {typeof config.scrub === 'number' || config.scrub === true ? (
              <div>
                <label style={labelStyle}>Scrub Smoothing</label>
                <SliderInput
                  value={typeof config.scrub === 'number' ? config.scrub : 1}
                  min={0}
                  max={5}
                  step={0.1}
                  unit="s"
                  onChange={(v) => update({ scrub: v })}
                />
              </div>
            ) : null}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={labelStyle}>
                  Start
                  <HelpTooltip text="When the animation starts. Format: 'element viewport' (e.g., 'top 80%' means when element's top reaches 80% of viewport)." size={10} />
                </label>
                <input
                  type="text"
                  value={config.scrollStart || 'top 80%'}
                  onChange={(e) => update({ scrollStart: e.target.value })}
                  style={textInputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  End
                  <HelpTooltip text="When the animation ends. Format: 'element viewport' (e.g., 'bottom 20%')." size={10} />
                </label>
                <input
                  type="text"
                  value={config.scrollEnd || 'bottom 20%'}
                  onChange={(e) => update({ scrollEnd: e.target.value })}
                  style={textInputStyle}
                />
              </div>
            </div>
          </div>
        </PropertyGroup>
      )}

      {/* Stagger controls */}
      {engine === 'gsap' && (
        <PropertyGroup title="Stagger & Split" defaultOpen={!!config.stagger || !!config.splitType}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <label style={labelStyle}>
                Stagger Delay
                <HelpTooltip text="Delay between each child element's animation start. Creates a cascading effect." size={10} />
              </label>
              <SliderInput
                value={config.stagger ?? 0}
                min={0}
                max={1}
                step={0.01}
                unit="s"
                onChange={(v) => update({ stagger: v })}
              />
            </div>
            <div>
              <label style={labelStyle}>
                Text Split
                <HelpTooltip text="Split text into individual characters, words, or lines for staggered animation." size={10} />
              </label>
              <CompactSelect
                value={config.splitType || ''}
                options={[
                  { value: '', label: 'None' },
                  { value: 'chars', label: 'Characters' },
                  { value: 'words', label: 'Words' },
                  { value: 'lines', label: 'Lines' },
                ]}
                onChange={(v) => update({ splitType: v ? v as 'chars' | 'words' | 'lines' : undefined })}
                compact
              />
            </div>
          </div>
        </PropertyGroup>
      )}

      {/* Generated Attributes */}
      <PropertyGroup title="Generated Attributes" defaultOpen>
        <div
          style={{
            padding: 8, borderRadius: 6,
            backgroundColor: 'var(--bg-inset)',
            border: '1px solid var(--border-default)',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxHeight: 160, overflowY: 'auto',
            whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          }}
        >
          {attributesToString(attributes)}
        </div>
      </PropertyGroup>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex', gap: 6, marginTop: 8,
          padding: '8px 0', borderTop: '1px solid var(--border-default)',
        }}
      >
        <button onClick={handleCopy} style={actionButtonStyle}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? 'Copied' : 'Copy Attrs'}</span>
        </button>
        {onApply && (
          <button onClick={onApply} style={{ ...actionButtonStyle, ...primaryButtonStyle }}>
            <Layers size={14} />
            <span>Apply</span>
          </button>
        )}
        {onSaveCustom && (
          <button onClick={onSaveCustom} style={actionButtonStyle}>
            <Sliders size={14} />
            <span>Save Custom</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

interface SliderInputProps {
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

function SliderInput({ value, min, max, step, unit, onChange }: SliderInputProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          flex: 1, height: 4, cursor: 'pointer',
          accentColor: 'var(--accent)',
        }}
      />
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 2,
          minWidth: 52, height: 24, padding: '0 6px',
          border: '1px solid var(--border-default)',
          borderRadius: 4, backgroundColor: 'transparent',
        }}
      >
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
          }}
          style={{
            width: '100%', border: 'none', outline: 'none',
            backgroundColor: 'transparent',
            fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
            color: 'var(--text-primary)', textAlign: 'right',
          }}
        />
        {unit && (
          <span style={{
            fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)', flexShrink: 0,
          }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  tooltip?: string;
}

function ToggleSwitch({ label, checked, onChange, tooltip }: ToggleSwitchProps) {
  return (
    <label
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        cursor: 'pointer', fontSize: 'var(--text-xs)',
        color: 'var(--text-secondary)',
      }}
    >
      <div
        onClick={(e) => { e.preventDefault(); onChange(!checked); }}
        style={{
          position: 'relative', width: 28, height: 16,
          borderRadius: 8,
          backgroundColor: checked ? 'var(--accent)' : 'var(--bg-tertiary)',
          transition: 'background-color var(--duration-fast)',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            position: 'absolute', top: 2, left: checked ? 14 : 2,
            width: 12, height: 12, borderRadius: '50%',
            backgroundColor: 'white',
            transition: 'left var(--duration-fast)',
          }}
        />
      </div>
      <span>{label}</span>
      {tooltip && <HelpTooltip text={tooltip} size={10} />}
    </label>
  );
}

// ─── Shared Styles ───────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4,
  fontSize: 'var(--text-xs)', fontWeight: 500,
  color: 'var(--text-tertiary)', marginBottom: 4,
};

const textInputStyle: React.CSSProperties = {
  width: '100%', height: 28, padding: '0 8px',
  border: '1px solid var(--border-default)', borderRadius: 4,
  fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
  color: 'var(--text-primary)', backgroundColor: 'transparent',
};

const actionButtonStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  height: 32, padding: '0 12px', border: '1px solid var(--border-default)',
  borderRadius: 6, backgroundColor: 'transparent',
  fontSize: 'var(--text-xs)', fontWeight: 500,
  color: 'var(--text-secondary)', cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  transition: 'all var(--duration-fast)',
};

const primaryButtonStyle: React.CSSProperties = {
  backgroundColor: 'var(--accent)',
  color: 'var(--text-on-accent)',
  borderColor: 'var(--accent)',
};
