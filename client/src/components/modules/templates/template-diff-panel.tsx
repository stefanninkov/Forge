import { useState, useMemo } from 'react';
import { X, ArrowLeftRight, Plus, Minus, Equal } from 'lucide-react';
import { useTemplate, useTemplates } from '@/hooks/use-templates';
import type { TemplateNode } from '@/types/template';

interface TemplateDiffPanelProps {
  templateId: string;
  open: boolean;
  onClose: () => void;
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'modified';
  depth: number;
  left?: { tag: string; className: string; text?: string };
  right?: { tag: string; className: string; text?: string };
}

function flattenNode(node: TemplateNode, depth: number): { tag: string; className: string; text?: string; depth: number }[] {
  const result: { tag: string; className: string; text?: string; depth: number }[] = [];
  result.push({ tag: node.tag, className: node.className, text: node.text, depth });
  if (node.children) {
    for (const child of node.children) {
      result.push(...flattenNode(child, depth + 1));
    }
  }
  return result;
}

function computeDiff(a: TemplateNode | undefined, b: TemplateNode | undefined): DiffLine[] {
  if (!a && !b) return [];
  if (!a && b) {
    return flattenNode(b, 0).map((n) => ({
      type: 'added' as const,
      depth: n.depth,
      right: { tag: n.tag, className: n.className, text: n.text },
    }));
  }
  if (a && !b) {
    return flattenNode(a, 0).map((n) => ({
      type: 'removed' as const,
      depth: n.depth,
      left: { tag: n.tag, className: n.className, text: n.text },
    }));
  }

  const leftNodes = flattenNode(a!, 0);
  const rightNodes = flattenNode(b!, 0);
  const lines: DiffLine[] = [];
  const maxLen = Math.max(leftNodes.length, rightNodes.length);

  for (let i = 0; i < maxLen; i++) {
    const l = leftNodes[i];
    const r = rightNodes[i];

    if (l && r) {
      const same = l.tag === r.tag && l.className === r.className && l.text === r.text;
      lines.push({
        type: same ? 'unchanged' : 'modified',
        depth: Math.max(l.depth, r.depth),
        left: { tag: l.tag, className: l.className, text: l.text },
        right: { tag: r.tag, className: r.className, text: r.text },
      });
    } else if (l && !r) {
      lines.push({
        type: 'removed',
        depth: l.depth,
        left: { tag: l.tag, className: l.className, text: l.text },
      });
    } else if (!l && r) {
      lines.push({
        type: 'added',
        depth: r.depth,
        right: { tag: r.tag, className: r.className, text: r.text },
      });
    }
  }

  return lines;
}

export function TemplateDiffPanel({ templateId, open, onClose }: TemplateDiffPanelProps) {
  const { data: currentTemplate } = useTemplate(templateId);
  const { data: allTemplates } = useTemplates();
  const [compareId, setCompareId] = useState<string | null>(null);
  const { data: compareTemplate } = useTemplate(compareId);

  const otherTemplates = useMemo(
    () => (allTemplates ?? []).filter((t) => t.id !== templateId),
    [allTemplates, templateId],
  );

  const diffLines = useMemo(
    () => computeDiff(currentTemplate?.structure, compareTemplate?.structure),
    [currentTemplate, compareTemplate],
  );

  const stats = useMemo(() => {
    const added = diffLines.filter((l) => l.type === 'added').length;
    const removed = diffLines.filter((l) => l.type === 'removed').length;
    const modified = diffLines.filter((l) => l.type === 'modified').length;
    return { added, removed, modified };
  }, [diffLines]);

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
          width: '60%',
          maxWidth: 800,
          minWidth: 500,
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
            <ArrowLeftRight size={15} style={{ color: 'var(--text-tertiary)' }} />
            <span
              className="font-medium"
              style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
            >
              Compare Templates
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

        {/* Compare selector */}
        <div
          className="flex items-center shrink-0"
          style={{
            padding: '12px 16px',
            gap: 12,
            borderBottom: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <div
            style={{
              flex: 1,
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            <span style={{ color: 'var(--text-tertiary)' }}>Base: </span>
            {currentTemplate?.name ?? '...'}
          </div>

          <ArrowLeftRight size={12} style={{ color: 'var(--text-tertiary)' }} />

          <select
            value={compareId ?? ''}
            onChange={(e) => setCompareId(e.target.value || null)}
            style={{
              flex: 1,
              height: 32,
              padding: '0 8px',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-primary)',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
            }}
          >
            <option value="">Select template to compare...</option>
            {otherTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stats bar */}
        {compareTemplate && (
          <div
            className="flex items-center shrink-0"
            style={{
              padding: '8px 16px',
              gap: 16,
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span className="flex items-center" style={{ gap: 4, color: 'var(--status-success)' }}>
              <Plus size={11} />
              {stats.added} added
            </span>
            <span className="flex items-center" style={{ gap: 4, color: 'var(--status-error)' }}>
              <Minus size={11} />
              {stats.removed} removed
            </span>
            <span className="flex items-center" style={{ gap: 4, color: 'var(--status-warning)' }}>
              <Equal size={11} />
              {stats.modified} modified
            </span>
          </div>
        )}

        {/* Diff content */}
        <div className="flex-1 overflow-auto" style={{ padding: 0 }}>
          {!compareId && (
            <div
              className="flex items-center justify-center"
              style={{
                height: 200,
                fontSize: 'var(--text-sm)',
                color: 'var(--text-tertiary)',
              }}
            >
              Select a template to compare against.
            </div>
          )}

          {compareTemplate && diffLines.length === 0 && (
            <div
              className="flex items-center justify-center"
              style={{
                height: 200,
                fontSize: 'var(--text-sm)',
                color: 'var(--text-tertiary)',
              }}
            >
              Templates are identical.
            </div>
          )}

          {compareTemplate && diffLines.length > 0 && (
            <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
              {diffLines.map((line, i) => (
                <DiffLineRow key={i} line={line} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function DiffLineRow({ line }: { line: DiffLine }) {
  const bgColor = {
    added: 'rgba(16, 185, 129, 0.08)',
    removed: 'rgba(239, 68, 68, 0.08)',
    modified: 'rgba(245, 158, 11, 0.08)',
    unchanged: 'transparent',
  }[line.type];

  const borderColor = {
    added: 'rgba(16, 185, 129, 0.3)',
    removed: 'rgba(239, 68, 68, 0.3)',
    modified: 'rgba(245, 158, 11, 0.3)',
    unchanged: 'transparent',
  }[line.type];

  const icon = {
    added: <Plus size={10} style={{ color: 'var(--status-success)' }} />,
    removed: <Minus size={10} style={{ color: 'var(--status-error)' }} />,
    modified: <Equal size={10} style={{ color: 'var(--status-warning)' }} />,
    unchanged: <span style={{ width: 10 }} />,
  }[line.type];

  const node = line.right ?? line.left;
  if (!node) return null;

  return (
    <div
      className="flex items-center"
      style={{
        padding: '4px 16px',
        paddingLeft: 16 + line.depth * 16,
        backgroundColor: bgColor,
        borderLeft: `2px solid ${borderColor}`,
        gap: 6,
        minHeight: 24,
      }}
    >
      {icon}
      <span style={{ color: 'var(--text-tertiary)', fontWeight: 500, minWidth: 28 }}>
        {node.tag}
      </span>
      <span style={{ color: 'var(--accent-text)' }}>.{node.className}</span>
      {node.text && (
        <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
          &quot;{node.text}&quot;
        </span>
      )}
      {line.type === 'modified' && line.left && line.right && (
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 9,
            color: 'var(--status-warning)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            padding: '1px 6px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          changed
        </span>
      )}
    </div>
  );
}
