import { useState, useMemo, useCallback } from 'react';
import {
  FileCode, Copy, Check, Download, Upload, RefreshCw,
  AlertCircle, CheckCircle2, Code, ExternalLink,
  ChevronDown, ChevronRight, Zap, FileText,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────

export type ScriptStatus = 'synced' | 'outdated' | 'not-deployed' | 'error';
export type DeployMethod = 'embed' | 'cdn';

export interface ScriptDependency {
  name: string;
  version: string;
  cdn: string;
  required: boolean;
  reason: string;
}

export interface MasterScriptConfig {
  deployMethod: DeployMethod;
  minify: boolean;
  includeGSAP: boolean;
  includeSplitText: boolean;
  includeScrollTrigger: boolean;
  includeLenis: boolean;
  customHead?: string;
  customFoot?: string;
}

export interface AnimationUsage {
  presetId: string;
  presetName: string;
  engine: 'css' | 'gsap';
  count: number;
  pages: string[];
}

export interface MasterScriptPanelProps {
  status: ScriptStatus;
  config: MasterScriptConfig;
  usages: AnimationUsage[];
  generatedCode: string;
  cdnUrl?: string;
  lastDeployed?: string;
  onConfigChange: (config: MasterScriptConfig) => void;
  onGenerate: () => void;
  onDeploy: () => void;
  onCopyCode: () => void;
  isGenerating?: boolean;
  isDeploying?: boolean;
}

// ─── Component ───────────────────────────────────────────────────

export function MasterScriptPanel({
  status,
  config,
  usages,
  generatedCode,
  cdnUrl,
  lastDeployed,
  onConfigChange,
  onGenerate,
  onDeploy,
  onCopyCode,
  isGenerating,
  isDeploying,
}: MasterScriptPanelProps) {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showUsages, setShowUsages] = useState(true);

  const statusMeta = STATUS_META[status];

  const dependencies = useMemo<ScriptDependency[]>(() => {
    const deps: ScriptDependency[] = [];
    const hasGSAP = usages.some((u) => u.engine === 'gsap');
    if (hasGSAP || config.includeGSAP) {
      deps.push({ name: 'GSAP', version: '3.12', cdn: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js', required: hasGSAP, reason: 'Required for GSAP animations.' });
    }
    if (config.includeScrollTrigger || usages.some((u) => u.presetId.includes('scroll') || u.presetId.includes('parallax') || u.presetId.includes('pin'))) {
      deps.push({ name: 'ScrollTrigger', version: '3.12', cdn: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js', required: true, reason: 'Required for scroll-driven animations.' });
    }
    if (config.includeSplitText || usages.some((u) => u.presetId.includes('text'))) {
      deps.push({ name: 'SplitType', version: '0.3', cdn: 'https://unpkg.com/split-type@0.3.4/umd/index.min.js', required: false, reason: 'Required for text splitting animations.' });
    }
    if (config.includeLenis) {
      deps.push({ name: 'Lenis', version: '1.1', cdn: 'https://unpkg.com/lenis@1.1.18/dist/lenis.min.js', required: false, reason: 'Smooth scroll library for enhanced scroll feel.' });
    }
    return deps;
  }, [config, usages]);

  const cssCount = usages.filter((u) => u.engine === 'css').reduce((sum, u) => sum + u.count, 0);
  const gsapCount = usages.filter((u) => u.engine === 'gsap').reduce((sum, u) => sum + u.count, 0);

  const handleCopy = useCallback(() => {
    onCopyCode();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [onCopyCode]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Status Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: 12, borderRadius: 6,
          border: `1px solid ${statusMeta.border}`,
          backgroundColor: statusMeta.bg,
        }}
      >
        <statusMeta.icon size={16} style={{ color: statusMeta.color, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
            {statusMeta.label}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
            {statusMeta.description}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'CSS', value: cssCount, color: 'var(--forge-400)' },
          { label: 'GSAP', value: gsapCount, color: '#60a5fa' },
          { label: 'Total', value: cssCount + gsapCount, color: 'var(--text-primary)' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: '8px 10px', borderRadius: 6,
              border: '1px solid var(--border-default)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Deploy Method */}
      <div>
        <label style={sectionLabelStyle}>Deploy Method</label>
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-default)' }}>
          {([
            { value: 'embed' as const, label: 'Embed in Webflow', desc: 'Add to global custom code' },
            { value: 'cdn' as const, label: 'CDN Hosted', desc: 'External hosted script' },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => onConfigChange({ ...config, deployMethod: opt.value })}
              style={{
                flex: 1, padding: '8px 12px', border: 'none', cursor: 'pointer',
                backgroundColor: config.deployMethod === opt.value ? 'var(--surface-hover)' : 'transparent',
                fontFamily: 'var(--font-sans)', textAlign: 'left',
              }}
            >
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: config.deployMethod === opt.value ? 600 : 400, color: config.deployMethod === opt.value ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {opt.label}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 2 }}>
                {opt.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Dependencies */}
      {dependencies.length > 0 && (
        <div>
          <label style={sectionLabelStyle}>Dependencies</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {dependencies.map((dep) => (
              <div
                key={dep.name}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 10px', borderRadius: 4,
                  border: '1px solid var(--border-default)',
                }}
              >
                <FileCode size={12} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {dep.name}
                </span>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                  v{dep.version}
                </span>
                {dep.required && (
                  <span style={{ fontSize: 9, color: 'var(--status-warning-text)', fontWeight: 500 }}>
                    Required
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Animation Usage */}
      <div>
        <button
          onClick={() => setShowUsages(!showUsages)}
          style={{
            ...sectionLabelStyle,
            display: 'flex', alignItems: 'center', gap: 4,
            border: 'none', backgroundColor: 'transparent',
            cursor: 'pointer', padding: '0 0 4px 0', width: '100%',
          }}
        >
          {showUsages ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          Animation Usage ({usages.length} types)
        </button>
        {showUsages && usages.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {usages.map((usage) => (
              <div
                key={usage.presetId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '4px 8px', borderRadius: 4,
                  fontSize: 'var(--text-xs)',
                }}
              >
                <Zap size={10} style={{ color: usage.engine === 'gsap' ? '#60a5fa' : 'var(--forge-400)', flexShrink: 0 }} />
                <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{usage.presetName}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                  ×{usage.count}
                </span>
                <span
                  style={{
                    padding: '1px 4px', borderRadius: 3,
                    fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600,
                    backgroundColor: usage.engine === 'gsap' ? 'rgba(96,165,250,0.1)' : 'rgba(52,211,153,0.1)',
                    color: usage.engine === 'gsap' ? '#60a5fa' : 'var(--forge-400)',
                  }}
                >
                  {usage.engine.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
        {usages.length === 0 && (
          <div style={{ padding: '12px 0', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            No animations configured in this project yet.
          </div>
        )}
      </div>

      {/* Generated Code */}
      {generatedCode && (
        <div>
          <button
            onClick={() => setShowCode(!showCode)}
            style={{
              ...sectionLabelStyle,
              display: 'flex', alignItems: 'center', gap: 4,
              border: 'none', backgroundColor: 'transparent',
              cursor: 'pointer', padding: '0 0 4px 0', width: '100%',
            }}
          >
            {showCode ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            Generated Code
          </button>
          {showCode && (
            <div style={{ position: 'relative' }}>
              <pre
                style={{
                  padding: 12, borderRadius: 6,
                  backgroundColor: 'var(--bg-inset)',
                  border: '1px solid var(--border-default)',
                  fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)', lineHeight: 1.6,
                  maxHeight: 300, overflowY: 'auto',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                  margin: 0,
                }}
              >
                {generatedCode}
              </pre>
              <button
                onClick={handleCopy}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  display: 'flex', alignItems: 'center', gap: 4,
                  height: 24, padding: '0 8px',
                  border: 'none', borderRadius: 4,
                  backgroundColor: 'var(--bg-tertiary)',
                  fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                {copied ? <Check size={10} /> : <Copy size={10} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* CDN URL */}
      {config.deployMethod === 'cdn' && cdnUrl && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 10px', borderRadius: 4,
            border: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <ExternalLink size={12} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <code style={{ flex: 1, fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cdnUrl}
          </code>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 36, padding: '0 16px', flex: 1,
            border: '1px solid var(--border-default)',
            borderRadius: 6, backgroundColor: 'transparent',
            fontSize: 'var(--text-sm)', fontWeight: 500,
            color: 'var(--text-secondary)', cursor: isGenerating ? 'wait' : 'pointer',
            fontFamily: 'var(--font-sans)',
            justifyContent: 'center',
          }}
        >
          <Code size={14} />
          {isGenerating ? 'Generating...' : 'Generate Script'}
        </button>
        <button
          onClick={onDeploy}
          disabled={isDeploying || !generatedCode}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 36, padding: '0 16px', flex: 1,
            border: 'none', borderRadius: 6,
            backgroundColor: !generatedCode ? 'var(--bg-tertiary)' : 'var(--accent)',
            color: !generatedCode ? 'var(--text-tertiary)' : 'var(--text-on-accent)',
            fontSize: 'var(--text-sm)', fontWeight: 500,
            cursor: isDeploying || !generatedCode ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-sans)',
            justifyContent: 'center',
          }}
        >
          <Upload size={14} />
          {isDeploying ? 'Deploying...' : 'Deploy'}
        </button>
      </div>

      {/* Last deployed */}
      {lastDeployed && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
          Last deployed: {new Date(lastDeployed).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// ─── Constants ───────────────────────────────────────────────────

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)', fontWeight: 600,
  color: 'var(--text-tertiary)', textTransform: 'uppercase',
  letterSpacing: '0.05em', marginBottom: 6,
};

const STATUS_META: Record<ScriptStatus, {
  label: string; description: string; icon: typeof CheckCircle2;
  color: string; border: string; bg: string;
}> = {
  synced: {
    label: 'Script Synced',
    description: 'Deployed script matches current configuration.',
    icon: CheckCircle2,
    color: 'var(--status-success, #10b981)',
    border: 'var(--status-success-border, rgba(16,185,129,0.2))',
    bg: 'var(--status-success-bg, rgba(16,185,129,0.04))',
  },
  outdated: {
    label: 'Script Outdated',
    description: 'Configuration changed since last deploy. Regenerate and redeploy.',
    icon: AlertCircle,
    color: 'var(--status-warning, #f59e0b)',
    border: 'var(--status-warning-border, rgba(245,158,11,0.2))',
    bg: 'var(--status-warning-bg, rgba(245,158,11,0.04))',
  },
  'not-deployed': {
    label: 'Not Deployed',
    description: 'Generate and deploy the animation script to your Webflow site.',
    icon: FileText,
    color: 'var(--text-tertiary)',
    border: 'var(--border-default)',
    bg: 'transparent',
  },
  error: {
    label: 'Deploy Error',
    description: 'Last deployment failed. Check configuration and try again.',
    icon: AlertCircle,
    color: 'var(--status-error, #ef4444)',
    border: 'var(--status-error-border, rgba(239,68,68,0.2))',
    bg: 'var(--status-error-bg, rgba(239,68,68,0.04))',
  },
};
