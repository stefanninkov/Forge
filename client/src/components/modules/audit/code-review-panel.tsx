import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Code, Loader2, AlertTriangle, AlertCircle, Info, CheckCircle, Shield, Zap, Globe, Eye, Sparkles } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

interface CodeReviewIssue {
  severity: 'error' | 'warning' | 'info';
  category: 'performance' | 'security' | 'compatibility' | 'accessibility' | 'best-practice';
  title: string;
  description: string;
  line?: number;
  suggestion?: string;
}

interface CodeReviewResult {
  issues: CodeReviewIssue[];
  summary: string;
  score: number;
}

const SEVERITY_CONFIG = {
  error: { icon: AlertCircle, color: 'var(--error)', bg: 'rgba(239, 68, 68, 0.08)', label: 'Error' },
  warning: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', label: 'Warning' },
  info: { icon: Info, color: 'var(--text-tertiary)', bg: 'var(--surface-hover)', label: 'Info' },
} as const;

const CATEGORY_ICONS = {
  performance: Zap,
  security: Shield,
  compatibility: Globe,
  accessibility: Eye,
  'best-practice': CheckCircle,
} as const;

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--accent-text)';
  if (score >= 60) return '#f59e0b';
  return 'var(--error)';
}

export function CodeReviewPanel() {
  const [code, setCode] = useState('');
  const [codeType, setCodeType] = useState<'html' | 'css' | 'javascript'>('html');
  const [result, setResult] = useState<CodeReviewResult | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const reviewMutation = useMutation({
    mutationFn: (input: { code: string; codeType: string }) =>
      httpsCallable<typeof input, CodeReviewResult>(functions, 'aiCodeReview')(input).then((r) => r.data),
    onSuccess: (data) => setResult(data),
    onError: (err: Error) => toast.error(err.message || 'Code review failed'),
  });

  const handleReview = useCallback(() => {
    if (!code.trim()) return;
    setResult(null);
    reviewMutation.mutate({ code, codeType });
  }, [code, codeType, reviewMutation]);

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
          padding: '12px 16px',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <div className="flex items-center" style={{ gap: 8 }}>
          <Code size={14} style={{ color: 'var(--accent-text)' }} />
          <span
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            Code Review
          </span>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
            }}
          >
            AI-powered
          </span>
        </div>
      </div>

      {/* Input area */}
      <div style={{ padding: 16 }}>
        <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
          <label
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              color: 'var(--text-secondary)',
            }}
          >
            Language:
          </label>
          {(['html', 'css', 'javascript'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setCodeType(type)}
              className="border-none cursor-pointer"
              style={{
                height: 24,
                padding: '0 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: codeType === type ? 'var(--accent-subtle)' : 'var(--surface-hover)',
                color: codeType === type ? 'var(--accent-text)' : 'var(--text-secondary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                fontFamily: 'var(--font-mono)',
                transition: 'all var(--duration-fast)',
              }}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={`Paste your ${codeType} embed code here...`}
          style={{
            width: '100%',
            height: 160,
            padding: 12,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1.6,
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />

        <div className="flex justify-end" style={{ marginTop: 8 }}>
          <button
            onClick={handleReview}
            disabled={!code.trim() || reviewMutation.isPending}
            className="flex items-center border-none cursor-pointer"
            style={{
              gap: 5,
              height: 28,
              padding: '0 10px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#8b5cf6',
              color: '#fff',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              opacity: !code.trim() || reviewMutation.isPending ? 0.6 : 1,
              cursor: !code.trim() || reviewMutation.isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {reviewMutation.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Sparkles size={12} />
            )}
            {reviewMutation.isPending ? 'Reviewing...' : 'Review Code'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div style={{ borderTop: '1px solid var(--border-default)' }}>
          {/* Score + Summary */}
          <div
            className="flex items-center"
            style={{
              padding: '12px 16px',
              gap: 12,
              backgroundColor: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${getScoreColor(result.score)}`,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: getScoreColor(result.score),
                }}
              >
                {result.score}
              </span>
            </div>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--leading-normal)',
                margin: 0,
              }}
            >
              {result.summary}
            </p>
          </div>

          {/* Issues list */}
          {result.issues.length > 0 ? (
            <div>
              {result.issues.map((issue, idx) => {
                const severity = SEVERITY_CONFIG[issue.severity];
                const SeverityIcon = severity.icon;
                const CategoryIcon = CATEGORY_ICONS[issue.category] ?? CheckCircle;
                const isExpanded = expandedIdx === idx;

                return (
                  <div
                    key={idx}
                    style={{
                      borderBottom: idx < result.issues.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    }}
                  >
                    <button
                      onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                      className="flex items-center w-full border-none bg-transparent cursor-pointer"
                      style={{
                        padding: '10px 16px',
                        gap: 10,
                        textAlign: 'left',
                        fontFamily: 'var(--font-sans)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <SeverityIcon size={14} style={{ color: severity.color, flexShrink: 0 }} />
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 600,
                          color: severity.color,
                          backgroundColor: severity.bg,
                          padding: '1px 5px',
                          borderRadius: 'var(--radius-sm)',
                          flexShrink: 0,
                        }}
                      >
                        {severity.label}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 'var(--text-sm)',
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {issue.title}
                        </div>
                      </div>
                      <CategoryIcon size={12} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                    </button>

                    {isExpanded && (
                      <div
                        style={{
                          padding: '0 16px 12px 44px',
                          animation: 'fadeIn 150ms ease-out',
                        }}
                      >
                        <p
                          style={{
                            fontSize: 'var(--text-sm)',
                            color: 'var(--text-secondary)',
                            lineHeight: 'var(--leading-normal)',
                            margin: '0 0 8px',
                          }}
                        >
                          {issue.description}
                        </p>
                        {issue.line && (
                          <span
                            style={{
                              fontSize: 'var(--text-xs)',
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--text-tertiary)',
                              marginBottom: 8,
                              display: 'block',
                            }}
                          >
                            Line {issue.line}
                          </span>
                        )}
                        {issue.suggestion && (
                          <div
                            style={{
                              padding: '8px 10px',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--accent-subtle)',
                              fontSize: 'var(--text-xs)',
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--accent-text)',
                            }}
                          >
                            <span style={{ fontWeight: 600, fontFamily: 'var(--font-sans)' }}>Fix: </span>
                            {issue.suggestion}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                padding: '20px 16px',
                textAlign: 'center',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-tertiary)',
              }}
            >
              No issues found. Your code looks good.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
