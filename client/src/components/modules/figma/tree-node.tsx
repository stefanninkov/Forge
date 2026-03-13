import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { ParsedNode } from '@/types/figma';

interface TreeNodeProps {
  node: ParsedNode;
  depth: number;
  aiSuggestions?: Record<string, { suggestedClass?: string; notes?: string }>;
  onClassChange?: (nodeId: string, newClass: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
  section: 'var(--accent)',
  div: 'var(--text-tertiary)',
  text: '#8b5cf6',
  svg: '#f59e0b',
  hr: 'var(--text-tertiary)',
};

export function TreeNode({ node, depth, aiSuggestions, onClassChange }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.suggestedClass);

  const hasChildren = node.children.length > 0;
  const aiSuggestion = aiSuggestions?.[node.id];
  const typeColor = TYPE_COLORS[node.type] ?? 'var(--text-tertiary)';

  const handleDoubleClick = useCallback(() => {
    setEditing(true);
    setEditValue(node.suggestedClass);
  }, [node.suggestedClass]);

  const handleEditDone = useCallback(() => {
    setEditing(false);
    if (editValue.trim() && editValue !== node.suggestedClass) {
      onClassChange?.(node.id, editValue.trim());
    }
  }, [editValue, node.id, node.suggestedClass, onClassChange]);

  return (
    <div>
      <div
        className="flex items-center"
        style={{
          height: 30,
          paddingLeft: depth * 20,
          gap: 4,
          fontSize: 'var(--text-sm)',
          borderRadius: 'var(--radius-sm)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {/* Expand/collapse toggle */}
        <button
          onClick={() => hasChildren && setExpanded(!expanded)}
          className="flex items-center justify-center border-none bg-transparent cursor-pointer"
          style={{
            width: 18,
            height: 18,
            color: hasChildren ? 'var(--text-tertiary)' : 'transparent',
            padding: 0,
            flexShrink: 0,
          }}
        >
          {hasChildren && (expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />)}
        </button>

        {/* Type badge */}
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: typeColor,
            fontWeight: 500,
            minWidth: 40,
            flexShrink: 0,
          }}
        >
          {node.type}
        </span>

        {/* Node name */}
        <span
          style={{
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 140,
            flexShrink: 0,
          }}
        >
          {node.name}
        </span>

        {/* Arrow separator */}
        <span style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>→</span>

        {/* Class name (editable) */}
        {editing ? (
          <input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditDone}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleEditDone();
              if (e.key === 'Escape') setEditing(false);
            }}
            autoFocus
            style={{
              flex: 1,
              height: 22,
              padding: '0 6px',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-primary)',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        ) : (
          <span
            onDoubleClick={handleDoubleClick}
            className="cursor-text"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--accent-text)',
              backgroundColor: 'var(--accent-subtle)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-sm)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title="Double-click to edit"
          >
            .{node.suggestedClass}
          </span>
        )}

        {/* AI suggestion indicator */}
        {aiSuggestion && (
          <span
            style={{
              fontSize: 9,
              color: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              padding: '1px 5px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            title={aiSuggestion.notes}
          >
            AI
          </span>
        )}
      </div>

      {/* Children */}
      {expanded &&
        hasChildren &&
        node.children.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            aiSuggestions={aiSuggestions}
            onClassChange={onClassChange}
          />
        ))}
    </div>
  );
}
