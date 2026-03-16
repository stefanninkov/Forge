import { useMemo } from 'react';
import { Gauge, AlertTriangle, CheckCircle, Info, Zap } from 'lucide-react';

interface AnimationInfo {
  name: string;
  properties: string[];
  duration: number;
  engine: 'css' | 'gsap';
  trigger: 'scroll' | 'hover' | 'click' | 'load';
  elementCount?: number;
}

export interface PerformanceHintsProps {
  animations: AnimationInfo[];
}

type HintSeverity = 'error' | 'warning' | 'info' | 'success';

interface Hint {
  severity: HintSeverity;
  animationName: string;
  message: string;
}

const LAYOUT_PROPS = new Set(['width', 'height', 'top', 'left', 'right', 'bottom', 'margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right', 'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right']);
const PAINT_PROPS = new Set(['background-color', 'background', 'border-color', 'box-shadow', 'border-radius', 'color', 'outline']);
const COMPOSITE_PROPS = new Set(['transform', 'opacity']);

function analyzeAnimation(anim: AnimationInfo): Hint[] {
  const hints: Hint[] = [];
  const hasLayout = anim.properties.some((p) => LAYOUT_PROPS.has(p));
  const hasPaint = anim.properties.some((p) => PAINT_PROPS.has(p));
  const isCompositeOnly = anim.properties.every((p) => COMPOSITE_PROPS.has(p));

  if (hasLayout) {
    hints.push({
      severity: 'error',
      animationName: anim.name,
      message: 'Animating layout properties causes reflow. Use transform instead.',
    });
  }

  if (hasPaint && !hasLayout) {
    hints.push({
      severity: 'warning',
      animationName: anim.name,
      message: 'Animating paint properties. Consider opacity or transform for 60fps.',
    });
  }

  if (isCompositeOnly && anim.properties.length > 0) {
    hints.push({
      severity: 'success',
      animationName: anim.name,
      message: 'GPU-accelerated, optimal performance.',
    });
  }

  if (anim.elementCount && anim.elementCount > 20) {
    hints.push({
      severity: 'warning',
      animationName: anim.name,
      message: `Large stagger group (${anim.elementCount} elements) may cause frame drops on mobile.`,
    });
  }

  if (anim.duration > 2 && (anim.trigger === 'hover' || anim.trigger === 'click')) {
    hints.push({
      severity: 'warning',
      animationName: anim.name,
      message: `${anim.duration}s is long for a user-triggered animation — may feel sluggish.`,
    });
  }

  if (anim.duration < 0.2 && anim.trigger === 'scroll') {
    hints.push({
      severity: 'warning',
      animationName: anim.name,
      message: 'Very short scroll animation may appear jerky.',
    });
  }

  if (anim.engine === 'gsap' && isCompositeOnly && anim.properties.length <= 2) {
    hints.push({
      severity: 'info',
      animationName: anim.name,
      message: 'CSS animations sufficient for this effect — GSAP adds unnecessary bundle size.',
    });
  }

  if (anim.engine === 'css' && anim.properties.length >= 3) {
    hints.push({
      severity: 'info',
      animationName: anim.name,
      message: 'Consider GSAP for complex sequenced animations.',
    });
  }

  return hints;
}

const SEVERITY_ORDER: Record<HintSeverity, number> = { error: 0, warning: 1, info: 2, success: 3 };

const SEVERITY_CONFIG: Record<HintSeverity, { icon: typeof Gauge; color: string; label: string }> = {
  error: { icon: AlertTriangle, color: 'var(--error)', label: 'Error' },
  warning: { icon: AlertTriangle, color: '#f59e0b', label: 'Warning' },
  info: { icon: Info, color: 'var(--text-tertiary)', label: 'Info' },
  success: { icon: CheckCircle, color: 'var(--accent-text)', label: 'Good' },
};

export function PerformanceHints({ animations }: PerformanceHintsProps) {
  const hints = useMemo(() => {
    const all: Hint[] = [];
    for (const anim of animations) {
      all.push(...analyzeAnimation(anim));
    }
    return all.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  }, [animations]);

  const hasErrors = hints.some((h) => h.severity === 'error');
  const hasWarnings = hints.some((h) => h.severity === 'warning');
  const nonSuccessHints = hints.filter((h) => h.severity !== 'success');

  const overallLabel = hasErrors ? 'Needs Attention' : hasWarnings ? 'Good' : 'Excellent';
  const overallColor = hasErrors ? 'var(--error)' : hasWarnings ? '#f59e0b' : 'var(--accent-text)';

  if (animations.length === 0) return null;

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
          borderBottom: nonSuccessHints.length > 0 ? '1px solid var(--border-default)' : 'none',
        }}
      >
        <div className="flex items-center" style={{ gap: 6 }}>
          <Gauge size={13} style={{ color: 'var(--text-tertiary)' }} />
          <span
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            Performance Analysis
          </span>
        </div>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: overallColor,
            backgroundColor: `${overallColor}14`,
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {overallLabel}
        </span>
      </div>

      {/* Hints */}
      {nonSuccessHints.length > 0 ? (
        nonSuccessHints.map((hint, i) => {
          const config = SEVERITY_CONFIG[hint.severity];
          const Icon = config.icon;
          return (
            <div
              key={i}
              className="flex"
              style={{
                padding: '8px 14px',
                gap: 8,
                borderBottom:
                  i < nonSuccessHints.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              <Icon
                size={13}
                style={{ color: config.color, flexShrink: 0, marginTop: 2 }}
              />
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginRight: 6,
                  }}
                >
                  {hint.animationName}
                </span>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                    lineHeight: 'var(--leading-normal)',
                  }}
                >
                  {hint.message}
                </span>
              </div>
            </div>
          );
        })
      ) : (
        <div
          className="flex items-center"
          style={{
            padding: '12px 14px',
            gap: 6,
            fontSize: 'var(--text-sm)',
            color: 'var(--accent-text)',
          }}
        >
          <CheckCircle size={14} />
          All animations are optimized for performance.
        </div>
      )}
    </div>
  );
}
