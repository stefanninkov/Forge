import { useState, useMemo } from 'react';
import { X, Layers, Copy, Check, ChevronDown, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useAnimationPresets } from '@/hooks/use-animations';
import type { AnimationPreset } from '@/types/animation';

interface BulkAttributePanelProps {
  open: boolean;
  onClose: () => void;
}

interface AttributeSet {
  preset: AnimationPreset;
  selector: string;
  attrs: Record<string, string>;
}

const COMMON_SELECTORS = [
  { label: 'All sections', value: '[data-anim-type]' },
  { label: 'Fade animations', value: '[data-anim-type^="fade"]' },
  { label: 'Slide animations', value: '[data-anim-type^="slide"]' },
  { label: 'Scale animations', value: '[data-anim-type^="scale"]' },
  { label: 'Headings', value: 'h1, h2, h3, h4, h5, h6' },
  { label: 'Images', value: 'img, picture' },
  { label: 'Buttons', value: 'a.button, button' },
  { label: 'Cards', value: '.card, [class*="card"]' },
  { label: 'Custom selector', value: '' },
];

export function BulkAttributePanel({ open, onClose }: BulkAttributePanelProps) {
  const { data: presets } = useAnimationPresets({});
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [selectorChoice, setSelectorChoice] = useState(0);
  const [customSelector, setCustomSelector] = useState('');
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [copiedAll, setCopiedAll] = useState(false);

  const selectedPreset = useMemo(
    () => (presets ?? []).find((p) => p.id === selectedPresetId),
    [presets, selectedPresetId],
  );

  const baseAttrs = useMemo(() => {
    if (!selectedPreset) return {};
    const config = selectedPreset.config;
    const attrs: Record<string, string> = {
      'data-anim-type': selectedPreset.name.toLowerCase().replace(/\s+/g, '-'),
      'data-anim-duration': `${config.duration ?? 0.6}`,
      'data-anim-delay': `${config.delay ?? 0}`,
      'data-anim-ease': config.ease ?? 'ease-out',
    };
    if (config.distance) attrs['data-anim-distance'] = `${config.distance}`;
    if (config.threshold) attrs['data-anim-threshold'] = `${config.threshold}`;
    if (selectedPreset.engine === 'GSAP') {
      if (config.stagger) attrs['data-anim-stagger'] = `${config.stagger}`;
      if (config.scrub) attrs['data-anim-scrub'] = 'true';
      if (config.pin) attrs['data-anim-pin'] = 'true';
    }
    return attrs;
  }, [selectedPreset]);

  const finalAttrs = useMemo(() => {
    return { ...baseAttrs, ...overrides };
  }, [baseAttrs, overrides]);

  const currentSelector = selectorChoice < COMMON_SELECTORS.length
    ? COMMON_SELECTORS[selectorChoice].value || customSelector
    : customSelector;

  function generateCode(): string {
    if (!currentSelector) return '// Select a CSS selector first';
    const attrStr = Object.entries(finalAttrs)
      .map(([k, v]) => `  el.setAttribute('${k}', '${v}');`)
      .join('\n');
    return `document.querySelectorAll('${currentSelector}').forEach(el => {\n${attrStr}\n});`;
  }

  function generateAttrString(): string {
    return Object.entries(finalAttrs)
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ');
  }

  async function copyAll() {
    const text = generateAttrString();
    await navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.success('Attributes copied to clipboard');
    setTimeout(() => setCopiedAll(false), 2000);
  }

  async function copyScript() {
    const code = generateCode();
    await navigator.clipboard.writeText(code);
    toast.success('Script copied to clipboard');
  }

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 90,
          }}
        />
      )}

      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '50%',
          maxWidth: 640,
          minWidth: 400,
          backgroundColor: 'var(--bg-primary)',
          borderLeft: '1px solid var(--border-default)',
          zIndex: 100,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 200ms ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            height: 48,
            padding: '0 16px',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <div className="flex items-center" style={{ gap: 8 }}>
            <Layers size={15} style={{ color: 'var(--text-tertiary)' }} />
            <span
              className="font-medium"
              style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
            >
              Bulk Apply Attributes
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center border-none bg-transparent cursor-pointer"
            style={{ width: 28, height: 28, color: 'var(--text-tertiary)' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-auto" style={{ padding: 16 }}>
          <div className="flex flex-col" style={{ gap: 20 }}>
            {/* 1. Select preset */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                1. Animation Preset
              </label>
              <select
                value={selectedPresetId ?? ''}
                onChange={(e) => {
                  setSelectedPresetId(e.target.value || null);
                  setOverrides({});
                }}
                style={{
                  width: '100%',
                  height: 36,
                  padding: '0 12px',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-primary)',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                }}
              >
                <option value="">Select animation preset...</option>
                {(presets ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.engine})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Select target */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                2. Target Selector
              </label>
              <div className="flex flex-col" style={{ gap: 6 }}>
                {COMMON_SELECTORS.map((s, i) => (
                  <label
                    key={i}
                    className="flex items-center cursor-pointer"
                    style={{
                      gap: 8,
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: selectorChoice === i ? 'var(--accent-subtle)' : 'transparent',
                      fontSize: 'var(--text-sm)',
                      color: selectorChoice === i ? 'var(--accent-text)' : 'var(--text-secondary)',
                    }}
                  >
                    <input
                      type="radio"
                      name="selector"
                      checked={selectorChoice === i}
                      onChange={() => setSelectorChoice(i)}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span>{s.label}</span>
                    {s.value && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: 'var(--text-xs)',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        {s.value}
                      </span>
                    )}
                  </label>
                ))}
                {COMMON_SELECTORS[selectorChoice]?.value === '' && (
                  <input
                    value={customSelector}
                    onChange={(e) => setCustomSelector(e.target.value)}
                    placeholder=".my-class, [data-section]"
                    style={{
                      width: '100%',
                      height: 36,
                      padding: '0 12px',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--bg-primary)',
                      fontFamily: 'var(--font-mono)',
                      outline: 'none',
                      marginTop: 4,
                    }}
                  />
                )}
              </div>
            </div>

            {/* 3. Preview / Override attributes */}
            {selectedPreset && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  3. Attributes
                </label>
                <div
                  style={{
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                  }}
                >
                  {Object.entries(finalAttrs).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center"
                      style={{
                        padding: '6px 12px',
                        gap: 8,
                        borderBottom: '1px solid var(--border-subtle)',
                        fontSize: 'var(--text-xs)',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: '#f59e0b',
                          minWidth: 140,
                        }}
                      >
                        {key}
                      </span>
                      <span style={{ color: 'var(--text-tertiary)' }}>=</span>
                      <input
                        value={overrides[key] ?? value}
                        onChange={(e) =>
                          setOverrides((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        style={{
                          flex: 1,
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '2px 6px',
                          fontSize: 'var(--text-xs)',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--accent-text)',
                          backgroundColor: 'var(--bg-primary)',
                          outline: 'none',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Generated code */}
            {selectedPreset && currentSelector && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  4. Generated Script
                </label>
                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 12,
                    fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 'var(--leading-relaxed)',
                    maxHeight: 200,
                    overflow: 'auto',
                  }}
                >
                  {generateCode()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {selectedPreset && (
          <div
            className="flex items-center shrink-0"
            style={{
              height: 52,
              padding: '0 16px',
              borderTop: '1px solid var(--border-default)',
              gap: 8,
            }}
          >
            <button
              onClick={copyAll}
              className="flex items-center cursor-pointer"
              style={{
                gap: 6,
                height: 32,
                padding: '0 12px',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'transparent',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {copiedAll ? <Check size={13} /> : <Copy size={13} />}
              {copiedAll ? 'Copied' : 'Copy Attributes'}
            </button>

            {currentSelector && (
              <button
                onClick={copyScript}
                className="flex items-center cursor-pointer"
                style={{
                  gap: 6,
                  height: 32,
                  padding: '0 12px',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent)',
                  color: '#ffffff',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  fontFamily: 'var(--font-sans)',
                  marginLeft: 'auto',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                }}
              >
                <Zap size={13} />
                Copy Script
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
