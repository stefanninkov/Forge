import { useState } from 'react';
import { Brain, Loader2, ChevronDown, ChevronRight, Sparkles, ExternalLink } from 'lucide-react';
import { useAiRecommendations } from '@/hooks/use-audits';
import type { AiRecommendation } from '@/hooks/use-audits';

interface AiRecommendationsPanelProps {
  auditId: string | null;
}

const PRIORITY_CONFIG = {
  high: { color: 'var(--error)', bg: 'rgba(239, 68, 68, 0.08)', label: 'High' },
  medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', label: 'Medium' },
  low: { color: 'var(--text-tertiary)', bg: 'var(--surface-hover)', label: 'Low' },
} as const;

export function AiRecommendationsPanel({ auditId }: AiRecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<AiRecommendation[] | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const aiMutation = useAiRecommendations();

  const handleGenerate = () => {
    if (!auditId) return;
    aiMutation.mutate(auditId, {
      onSuccess: (data) => {
        setRecommendations(data);
      },
    });
  };

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
          borderBottom: recommendations ? '1px solid var(--border-default)' : 'none',
        }}
      >
        <div className="flex items-center" style={{ gap: 8 }}>
          <Sparkles size={14} style={{ color: '#8b5cf6' }} />
          <span
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            AI Recommendations
          </span>
          {recommendations && (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-tertiary)',
                backgroundColor: 'var(--surface-hover)',
                padding: '1px 6px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {recommendations.length}
            </span>
          )}
        </div>

        {!recommendations && (
          <button
            onClick={handleGenerate}
            disabled={aiMutation.isPending || !auditId}
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
              opacity: aiMutation.isPending || !auditId ? 0.6 : 1,
              cursor: aiMutation.isPending || !auditId ? 'not-allowed' : 'pointer',
              transition: 'opacity var(--duration-fast)',
            }}
          >
            {aiMutation.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Brain size={12} />
            )}
            {aiMutation.isPending ? 'Analyzing...' : 'Generate'}
          </button>
        )}
      </div>

      {/* Empty state — before generation */}
      {!recommendations && !aiMutation.isPending && (
        <div
          style={{
            padding: '20px 16px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-tertiary)',
              margin: 0,
              lineHeight: 'var(--leading-normal)',
            }}
          >
            Uses AI to analyze your audit results and provide prioritized, actionable recommendations specific to Webflow.
          </p>
          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              margin: '8px 0 0',
              opacity: 0.7,
            }}
          >
            Requires Anthropic API key in Settings → Integrations
          </p>
        </div>
      )}

      {/* Loading state */}
      {aiMutation.isPending && (
        <div
          className="flex flex-col items-center justify-center"
          style={{
            padding: '32px 16px',
            gap: 8,
          }}
        >
          <Loader2 size={20} className="animate-spin" style={{ color: '#8b5cf6' }} />
          <span
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-tertiary)',
            }}
          >
            Analyzing audit findings with AI...
          </span>
        </div>
      )}

      {/* Recommendations list */}
      {recommendations && recommendations.length > 0 && (
        <div>
          {recommendations.map((rec, idx) => {
            const isExpanded = expandedIdx === idx;
            const priority = PRIORITY_CONFIG[rec.priority] ?? PRIORITY_CONFIG.low;

            return (
              <div
                key={idx}
                style={{
                  borderBottom: idx < recommendations.length - 1 ? '1px solid var(--border-subtle)' : 'none',
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
                    transition: 'background-color var(--duration-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown size={12} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                  ) : (
                    <ChevronRight size={12} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                  )}

                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                      color: priority.color,
                      backgroundColor: priority.bg,
                      padding: '1px 5px',
                      borderRadius: 'var(--radius-sm)',
                      flexShrink: 0,
                    }}
                  >
                    {priority.label}
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
                      {rec.title}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-tertiary)',
                      flexShrink: 0,
                    }}
                  >
                    {rec.category}
                  </span>
                </button>

                {isExpanded && (
                  <div
                    style={{
                      padding: '0 16px 12px 42px',
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
                      {rec.description}
                    </p>

                    {rec.suggestedValue && (
                      <div
                        style={{
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--accent-subtle)',
                          fontSize: 'var(--text-xs)',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--accent-text)',
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ fontWeight: 600, fontFamily: 'var(--font-sans)' }}>Suggested: </span>
                        {rec.suggestedValue}
                      </div>
                    )}

                    {rec.affectedUrls && rec.affectedUrls.length > 0 && (
                      <div className="flex items-center" style={{ gap: 6, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-tertiary)',
                            fontWeight: 500,
                          }}
                        >
                          Affected:
                        </span>
                        {rec.affectedUrls.map((url, i) => (
                          <span
                            key={i}
                            className="flex items-center"
                            style={{
                              gap: 3,
                              fontSize: 'var(--text-xs)',
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--text-secondary)',
                              backgroundColor: 'var(--surface-hover)',
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            {url}
                            <ExternalLink size={9} />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* No recommendations */}
      {recommendations && recommendations.length === 0 && (
        <div
          style={{
            padding: '20px 16px',
            textAlign: 'center',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-tertiary)',
          }}
        >
          No additional recommendations found. Your site is well-optimized.
        </div>
      )}
    </div>
  );
}
