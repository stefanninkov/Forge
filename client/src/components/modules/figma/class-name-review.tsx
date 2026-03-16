import { useState, useCallback, useMemo } from 'react';
import { Sparkles, Check, X, CheckCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAiClassNames } from '@/hooks/use-class-names';
import type { ClassNameSuggestion } from '@/hooks/use-class-names';

interface ClassNameReviewProps {
  nodes: Array<{ id: string; name: string; type: string; parentName?: string }>;
  onApply: (nodeId: string, className: string) => void;
  onApplyAll: (mappings: Array<{ nodeId: string; className: string }>) => void;
}

export function ClassNameReview({ nodes, onApply, onApplyAll }: ClassNameReviewProps) {
  const [suggestions, setSuggestions] = useState<ClassNameSuggestion[]>([]);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [rejected, setRejected] = useState<Set<string>>(new Set());
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const mutation = useAiClassNames();

  const handleGenerate = useCallback(() => {
    const elements = nodes.slice(0, 50).map((n) => ({
      name: n.name,
      type: n.type,
      context: n.parentName ?? '',
    }));
    mutation.mutate({ elements }, {
      onSuccess: (data) => {
        setSuggestions(data);
        setApplied(new Set());
        setRejected(new Set());
      },
    });
  }, [nodes, mutation]);

  const handleApply = useCallback(
    (suggestion: ClassNameSuggestion, idx: number) => {
      const node = nodes.find((n) => n.name === suggestion.originalName);
      if (node) {
        onApply(node.id, suggestion.suggestedClass);
        setApplied((prev) => new Set(prev).add(String(idx)));
        setRejected((prev) => {
          const next = new Set(prev);
          next.delete(String(idx));
          return next;
        });
      }
    },
    [nodes, onApply],
  );

  const handleReject = useCallback((idx: number) => {
    setRejected((prev) => new Set(prev).add(String(idx)));
    setApplied((prev) => {
      const next = new Set(prev);
      next.delete(String(idx));
      return next;
    });
  }, []);

  const pendingSuggestions = useMemo(
    () =>
      suggestions.filter(
        (_, i) => !applied.has(String(i)) && !rejected.has(String(i)),
      ),
    [suggestions, applied, rejected],
  );

  const handleApplyAll = useCallback(() => {
    const mappings: Array<{ nodeId: string; className: string }> = [];
    suggestions.forEach((s, i) => {
      if (applied.has(String(i)) || rejected.has(String(i))) return;
      const node = nodes.find((n) => n.name === s.originalName);
      if (node) {
        mappings.push({ nodeId: node.id, className: s.suggestedClass });
        setApplied((prev) => new Set(prev).add(String(i)));
      }
    });
    if (mappings.length > 0) {
      onApplyAll(mappings);
    }
  }, [suggestions, nodes, applied, rejected, onApplyAll]);

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
          borderBottom: suggestions.length > 0 ? '1px solid var(--border-default)' : 'none',
        }}
      >
        <div className="flex items-center" style={{ gap: 6 }}>
          <Sparkles size={13} style={{ color: '#8b5cf6' }} />
          <span
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            AI Class Names
          </span>
        </div>

        <button
          onClick={handleGenerate}
          disabled={mutation.isPending || nodes.length === 0}
          className="flex items-center border-none cursor-pointer"
          style={{
            gap: 4,
            height: 26,
            padding: '0 10px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#8b5cf6',
            color: '#fff',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            fontFamily: 'var(--font-sans)',
            opacity: mutation.isPending || nodes.length === 0 ? 0.6 : 1,
            cursor: mutation.isPending ? 'not-allowed' : 'pointer',
          }}
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={11} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            'Generate'
          )}
        </button>
      </div>

      {/* Suggestions list */}
      {suggestions.length > 0 && (
        <>
          {suggestions.map((s, i) => {
            const isApplied = applied.has(String(i));
            const isRejected = rejected.has(String(i));
            const isExpanded = expandedIdx === i;

            return (
              <div
                key={i}
                style={{
                  borderBottom:
                    i < suggestions.length - 1
                      ? '1px solid var(--border-subtle)'
                      : 'none',
                  opacity: isRejected ? 0.4 : 1,
                }}
              >
                <div
                  className="flex items-center"
                  style={{
                    padding: '8px 14px',
                    gap: 8,
                  }}
                >
                  {/* Original name → Suggested class */}
                  <button
                    onClick={() => setExpandedIdx(isExpanded ? null : i)}
                    className="flex items-center border-none bg-transparent cursor-pointer"
                    style={{
                      flex: 1,
                      gap: 6,
                      padding: 0,
                      fontFamily: 'var(--font-sans)',
                      textAlign: 'left',
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-tertiary)',
                        fontFamily: 'var(--font-mono)',
                        textDecoration: isRejected ? 'line-through' : 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 120,
                        flexShrink: 0,
                      }}
                    >
                      {s.originalName}
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      →
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        fontFamily: 'var(--font-mono)',
                        color: isApplied ? 'var(--accent-text)' : 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.suggestedClass}
                    </span>
                    {s.htmlTag && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--accent-text)',
                          backgroundColor: 'var(--accent-subtle)',
                          padding: '0 4px',
                          borderRadius: 'var(--radius-sm)',
                          flexShrink: 0,
                        }}
                      >
                        {s.htmlTag}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp size={10} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                    ) : (
                      <ChevronDown size={10} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                    )}
                  </button>

                  {/* Action buttons */}
                  {!isApplied && !isRejected && (
                    <div className="flex items-center" style={{ gap: 2, flexShrink: 0 }}>
                      <button
                        onClick={() => handleApply(s, i)}
                        className="flex items-center justify-center border-none cursor-pointer"
                        title="Accept"
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'transparent',
                          color: 'var(--accent-text)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--accent-subtle)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Check size={13} />
                      </button>
                      <button
                        onClick={() => handleReject(i)}
                        className="flex items-center justify-center border-none cursor-pointer"
                        title="Reject"
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'transparent',
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
                        <X size={13} />
                      </button>
                    </div>
                  )}

                  {isApplied && (
                    <CheckCircle size={14} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
                  )}
                </div>

                {/* Expanded reasoning */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '0 14px 8px 14px',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-secondary)',
                      lineHeight: 'var(--leading-normal)',
                      animation: 'fadeIn 150ms ease-out',
                    }}
                  >
                    {s.reasoning}
                  </div>
                )}
              </div>
            );
          })}

          {/* Accept All footer */}
          {pendingSuggestions.length > 0 && (
            <div
              className="flex justify-end"
              style={{
                padding: '8px 14px',
                borderTop: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <button
                onClick={handleApplyAll}
                className="flex items-center border-none cursor-pointer"
                style={{
                  gap: 4,
                  height: 26,
                  padding: '0 10px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <Check size={11} />
                Accept All ({pendingSuggestions.length})
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {suggestions.length === 0 && !mutation.isPending && (
        <div
          style={{
            padding: '12px 14px',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            lineHeight: 'var(--leading-normal)',
          }}
        >
          Generate AI-suggested class names following Client-First naming methodology.
        </div>
      )}
    </div>
  );
}
