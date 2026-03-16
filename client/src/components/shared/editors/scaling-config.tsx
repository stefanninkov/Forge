import { useState, useMemo } from 'react';
import { Monitor, Tablet, Smartphone, Copy, Check, Upload } from 'lucide-react';
import { HelpTooltip } from './help-tooltip';
import type { ScalingConfig, BreakpointConfig } from '@/lib/scaling-system';
import { DEFAULT_SCALING_CONFIG, generateScalingCSS, calculateFontSize } from '@/lib/scaling-system';

export interface ScalingConfigEditorProps {
  config?: ScalingConfig;
  onConfigChange?: (config: ScalingConfig) => void;
  onPushToWebflow?: (css: string) => void;
  isPushed?: boolean;
}

type BreakpointKey = 'desktop' | 'tablet' | 'mobileLandscape' | 'mobilePortrait';

const BREAKPOINT_META: Record<BreakpointKey, { icon: typeof Monitor; label: string }> = {
  desktop: { icon: Monitor, label: 'Desktop' },
  tablet: { icon: Tablet, label: 'Tablet' },
  mobileLandscape: { icon: Smartphone, label: 'Mobile Landscape' },
  mobilePortrait: { icon: Smartphone, label: 'Mobile Portrait' },
};

function BreakpointCard({
  bpKey,
  config,
  isFirst,
  onChange,
}: {
  bpKey: BreakpointKey;
  config: BreakpointConfig;
  isFirst: boolean;
  onChange: (field: keyof BreakpointConfig, value: number) => void;
}) {
  const meta = BREAKPOINT_META[bpKey];
  const Icon = meta.icon;

  const previewIdeal = calculateFontSize(config, config.idealWidth);
  const previewMin = calculateFontSize(config, config.minWidth);

  const fields: { key: keyof BreakpointConfig; label: string; tooltip: string }[] = [
    ...(isFirst
      ? [{ key: 'baseFontSize' as const, label: 'Base font size', tooltip: 'The root font size at the ideal viewport width. All rem values scale from this.' }]
      : []),
    { key: 'idealWidth', label: 'Ideal width', tooltip: 'The viewport width where the base font size is applied without scaling.' },
    { key: 'minWidth', label: 'Min width', tooltip: 'The minimum viewport width for this breakpoint range. The clamp prevents scaling below this.' },
    { key: 'maxWidth', label: 'Max width', tooltip: 'The maximum viewport width for this breakpoint range. The clamp prevents scaling above this.' },
  ];

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-default)',
        borderRadius: 8,
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Icon size={16} style={{ color: 'var(--accent-text)' }} />
        <span style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
          {meta.label}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fields.map(({ key, label, tooltip }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{label}</span>
              <HelpTooltip text={tooltip} size={10} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="number"
                value={config[key]}
                onChange={(e) => onChange(key, parseInt(e.target.value, 10) || 0)}
                style={{
                  width: 80,
                  height: 32,
                  padding: '0 8px',
                  border: '1px solid var(--border-default)',
                  borderRadius: 4,
                  fontSize: 'var(--text-sm)',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                  backgroundColor: 'transparent',
                  textAlign: 'right',
                }}
              />
              <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', width: 16 }}>
                {key === 'baseFontSize' ? '' : 'px'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 12,
          fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
        }}
      >
        At {config.idealWidth}px → {previewIdeal}px, At {config.minWidth}px → {previewMin}px
      </div>
    </div>
  );
}

export function ScalingConfigEditor({
  config: initialConfig,
  onConfigChange,
  onPushToWebflow,
  isPushed = false,
}: ScalingConfigEditorProps) {
  const [config, setConfig] = useState<ScalingConfig>(initialConfig || DEFAULT_SCALING_CONFIG);
  const [copied, setCopied] = useState(false);

  const generatedCSS = useMemo(() => generateScalingCSS(config), [config]);

  const handleBreakpointChange = (
    bpKey: BreakpointKey,
    field: keyof BreakpointConfig,
    value: number,
  ) => {
    const updated = {
      ...config,
      [bpKey]: { ...config[bpKey], [field]: value },
    };
    setConfig(updated);
    onConfigChange?.(updated);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedCSS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Breakpoint cards */}
      {(['desktop', 'tablet', 'mobileLandscape', 'mobilePortrait'] as BreakpointKey[]).map(
        (bpKey, idx) => (
          <div key={bpKey}>
            {idx > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  margin: '-6px 0',
                  position: 'relative',
                  zIndex: 0,
                }}
              >
                <div
                  style={{
                    width: 1,
                    height: 12,
                    backgroundColor: 'var(--border-subtle)',
                  }}
                />
              </div>
            )}
            <BreakpointCard
              bpKey={bpKey}
              config={config[bpKey]}
              isFirst={bpKey === 'desktop'}
              onChange={(field, value) => handleBreakpointChange(bpKey, field, value)}
            />
          </div>
        ),
      )}

      {/* Generated code */}
      <div
        style={{
          position: 'relative',
          backgroundColor: 'var(--gray-900)',
          border: '1px solid var(--border-default)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '8px 8px 0',
          }}
        >
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              height: 24,
              padding: '0 8px',
              border: 'none',
              borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: copied ? 'var(--forge-400)' : 'var(--gray-400)',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre
          style={{
            padding: '8px 16px 16px',
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            lineHeight: 1.6,
            color: 'var(--gray-300)',
            overflowX: 'auto',
            maxHeight: 300,
          }}
        >
          {generatedCSS}
        </pre>
      </div>

      {/* Push button */}
      {onPushToWebflow && (
        <button
          onClick={() => onPushToWebflow(generatedCSS)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            height: 36,
            padding: '0 16px',
            border: 'none',
            borderRadius: 6,
            backgroundColor: isPushed ? 'var(--surface-active)' : 'var(--accent)',
            color: isPushed ? 'var(--text-secondary)' : 'white',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'background-color var(--duration-fast)',
          }}
        >
          {isPushed ? (
            <>
              <Check size={14} />
              Scaling system pushed to Webflow
            </>
          ) : (
            <>
              <Upload size={14} />
              Push Scaling System to Webflow
            </>
          )}
        </button>
      )}
    </div>
  );
}
