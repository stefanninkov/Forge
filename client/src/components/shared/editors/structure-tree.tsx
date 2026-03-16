import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  ChevronRight, ChevronDown, AlertTriangle, Circle,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────

export interface TreeNode {
  id: string;
  name: string;
  tag: string;
  className?: string;
  children?: TreeNode[];
  properties?: Record<string, unknown>;
  suggestion?: { tag?: string; className?: string };
}

export interface StructureTreeProps {
  nodes: TreeNode[];
  selectedNodeId?: string;
  onSelectNode?: (nodeId: string) => void;
  onUpdateNode?: (nodeId: string, updates: Partial<TreeNode>) => void;
  showSemanticBadges?: boolean;
  showSuggestions?: boolean;
  readOnly?: boolean;
}

// ─── Tag Classification ─────────────────────────────────────────

type TagCategory = 'semantic' | 'generic' | 'text' | 'interactive' | 'media' | 'deprecated';

const SEMANTIC_TAGS = new Set([
  'section', 'article', 'nav', 'header', 'footer', 'main', 'aside',
  'figure', 'figcaption', 'details', 'summary', 'dialog', 'address',
  'time', 'mark', 'output',
]);

const GENERIC_TAGS = new Set(['div', 'span']);

const TEXT_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'pre', 'code',
  'em', 'strong', 'small', 'sub', 'sup', 'abbr', 'cite', 'q',
]);

const INTERACTIVE_TAGS = new Set([
  'a', 'button', 'input', 'select', 'textarea', 'label', 'form',
  'fieldset', 'legend', 'optgroup', 'option', 'datalist',
]);

const MEDIA_TAGS = new Set([
  'img', 'video', 'audio', 'canvas', 'svg', 'picture', 'source',
  'iframe', 'embed', 'object',
]);

const DEPRECATED_TAGS = new Set([
  'center', 'font', 'marquee', 'blink', 'big', 'strike', 'tt',
  'frame', 'frameset', 'noframes', 'applet', 'basefont', 'dir', 'isindex',
]);

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

function getTagCategory(tag: string): TagCategory {
  const t = tag.toLowerCase();
  if (DEPRECATED_TAGS.has(t)) return 'deprecated';
  if (SEMANTIC_TAGS.has(t)) return 'semantic';
  if (GENERIC_TAGS.has(t)) return 'generic';
  if (TEXT_TAGS.has(t)) return 'text';
  if (INTERACTIVE_TAGS.has(t)) return 'interactive';
  if (MEDIA_TAGS.has(t)) return 'media';
  return 'generic';
}

const TAG_CATEGORY_COLORS: Record<TagCategory, string> = {
  semantic: 'var(--status-success, #10b981)',
  generic: 'var(--text-tertiary)',
  text: 'var(--text-secondary)',
  interactive: 'var(--status-info, #3b82f6)',
  media: 'var(--status-warning, #f59e0b)',
  deprecated: 'var(--status-error, #ef4444)',
};

const TAG_CATEGORY_BG: Record<TagCategory, string> = {
  semantic: 'rgba(16, 185, 129, 0.1)',
  generic: 'var(--surface-hover, rgba(128,128,128,0.06))',
  text: 'rgba(128, 128, 128, 0.08)',
  interactive: 'rgba(59, 130, 246, 0.1)',
  media: 'rgba(245, 158, 11, 0.1)',
  deprecated: 'rgba(239, 68, 68, 0.1)',
};

// ─── Tag Dropdown Groups ────────────────────────────────────────

interface TagGroup {
  label: string;
  tags: string[];
}

const TAG_GROUPS: TagGroup[] = [
  {
    label: 'Structural',
    tags: ['div', 'section', 'article', 'aside', 'header', 'footer', 'main', 'nav', 'figure', 'figcaption'],
  },
  {
    label: 'Text',
    tags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'blockquote', 'pre', 'code', 'em', 'strong', 'small'],
  },
  {
    label: 'Interactive',
    tags: ['a', 'button', 'input', 'select', 'textarea', 'label', 'form', 'fieldset', 'details', 'summary', 'dialog'],
  },
  {
    label: 'Media',
    tags: ['img', 'video', 'audio', 'svg', 'picture', 'canvas', 'iframe'],
  },
  {
    label: 'List',
    tags: ['ul', 'ol', 'li', 'dl', 'dt', 'dd'],
  },
  {
    label: 'Table',
    tags: ['table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col'],
  },
];

// ─── Heading Hierarchy Analysis ─────────────────────────────────

function collectHeadingLevels(nodes: TreeNode[]): number[] {
  const levels: number[] = [];
  for (const node of nodes) {
    const tag = node.tag.toLowerCase();
    if (HEADING_TAGS.has(tag)) {
      levels.push(parseInt(tag[1], 10));
    }
    if (node.children) {
      levels.push(...collectHeadingLevels(node.children));
    }
  }
  return levels;
}

function getHeadingWarning(
  currentTag: string,
  allHeadingLevels: number[],
): string | null {
  const tag = currentTag.toLowerCase();
  if (!HEADING_TAGS.has(tag)) return null;

  const currentLevel = parseInt(tag[1], 10);
  const idx = allHeadingLevels.indexOf(currentLevel);
  if (idx <= 0) return null;

  const previousLevel = allHeadingLevels[idx - 1];
  if (currentLevel > previousLevel + 1) {
    return `Heading level skipped: h${previousLevel} to h${currentLevel}. Use h${previousLevel + 1} instead.`;
  }

  return null;
}

// ─── Flat Node Map for Keyboard Nav ─────────────────────────────

interface FlatEntry {
  id: string;
  depth: number;
  node: TreeNode;
}

function flattenVisible(
  nodes: TreeNode[],
  expandedSet: Set<string>,
  depth: number = 0,
): FlatEntry[] {
  const result: FlatEntry[] = [];
  for (const node of nodes) {
    result.push({ id: node.id, depth, node });
    if (node.children && node.children.length > 0 && expandedSet.has(node.id)) {
      result.push(...flattenVisible(node.children, expandedSet, depth + 1));
    }
  }
  return result;
}

// ─── Tag Badge (with dropdown) ──────────────────────────────────

interface TagBadgeProps {
  tag: string;
  showColor: boolean;
  readOnly: boolean;
  onChangeTag: (newTag: string) => void;
}

function TagBadge({ tag, showColor, readOnly, onChangeTag }: TagBadgeProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLButtonElement>(null);

  const category = getTagCategory(tag);
  const color = showColor ? TAG_CATEGORY_COLORS[category] : 'var(--text-tertiary)';
  const bg = showColor ? TAG_CATEGORY_BG[category] : 'transparent';

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        badgeRef.current && !badgeRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSelect = useCallback((newTag: string) => {
    onChangeTag(newTag);
    setOpen(false);
  }, [onChangeTag]);

  return (
    <span style={{ position: 'relative', flexShrink: 0 }}>
      <button
        ref={badgeRef}
        onClick={(e) => {
          e.stopPropagation();
          if (!readOnly) setOpen(!open);
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          height: 20,
          padding: '0 6px',
          border: 'none',
          borderRadius: 3,
          backgroundColor: bg,
          color,
          fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-mono)',
          fontWeight: 500,
          cursor: readOnly ? 'default' : 'pointer',
          lineHeight: 1,
          transition: 'opacity var(--duration-fast, 150ms)',
        }}
        title={readOnly ? tag : `Change HTML tag (${tag})`}
      >
        {tag}
      </button>

      {open && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            zIndex: 100,
            width: 200,
            maxHeight: 320,
            overflowY: 'auto',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            padding: 4,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {TAG_GROUPS.map((group) => (
            <div key={group.label}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '6px 8px 2px',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {group.label}
              </div>
              {group.tags.map((t) => {
                const tCat = getTagCategory(t);
                const isActive = t === tag;
                return (
                  <button
                    key={t}
                    onClick={() => handleSelect(t)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '4px 8px',
                      border: 'none',
                      borderRadius: 3,
                      backgroundColor: isActive ? 'var(--accent-subtle)' : 'transparent',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      color: isActive ? 'var(--accent-text)' : 'var(--text-primary)',
                      textAlign: 'left',
                      transition: 'background-color var(--duration-fast, 150ms)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: showColor ? TAG_CATEGORY_COLORS[tCat] : 'var(--text-tertiary)',
                        flexShrink: 0,
                      }}
                    />
                    {t}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </span>
  );
}

// ─── Tree Row ───────────────────────────────────────────────────

interface TreeRowProps {
  node: TreeNode;
  depth: number;
  isSelected: boolean;
  isFocused: boolean;
  expanded: boolean;
  hasChildren: boolean;
  headingWarning: string | null;
  showSemanticBadges: boolean;
  showSuggestions: boolean;
  readOnly: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onUpdateNode: (updates: Partial<TreeNode>) => void;
  rowRef: (el: HTMLDivElement | null) => void;
}

function TreeRow({
  node,
  depth,
  isSelected,
  isFocused,
  expanded,
  hasChildren,
  headingWarning,
  showSemanticBadges,
  showSuggestions,
  readOnly,
  onToggle,
  onSelect,
  onUpdateNode,
  rowRef,
}: TreeRowProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.className ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleDoubleClick = useCallback(() => {
    if (readOnly) return;
    setEditValue(node.className ?? '');
    setEditing(true);
  }, [readOnly, node.className]);

  const handleEditDone = useCallback(() => {
    setEditing(false);
    const trimmed = editValue.trim();
    if (trimmed !== (node.className ?? '')) {
      onUpdateNode({ className: trimmed || undefined });
    }
  }, [editValue, node.className, onUpdateNode]);

  const hasSuggestion = showSuggestions && node.suggestion &&
    (node.suggestion.tag || node.suggestion.className);

  return (
    <div
      ref={rowRef}
      role="treeitem"
      aria-selected={isSelected}
      aria-expanded={hasChildren ? expanded : undefined}
      aria-level={depth + 1}
      tabIndex={-1}
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 30,
        paddingLeft: depth * 20,
        paddingRight: 8,
        gap: 4,
        fontSize: 'var(--text-sm)',
        borderRadius: 'var(--radius-sm, 4px)',
        backgroundColor: isSelected
          ? 'var(--accent-subtle)'
          : 'transparent',
        outline: isFocused ? '2px solid var(--accent-subtle)' : 'none',
        outlineOffset: -2,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'background-color var(--duration-fast, 150ms)',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {/* Expand/collapse toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (hasChildren) onToggle();
        }}
        aria-label={hasChildren ? (expanded ? 'Collapse' : 'Expand') : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 18,
          height: 18,
          padding: 0,
          border: 'none',
          backgroundColor: 'transparent',
          color: hasChildren ? 'var(--text-tertiary)' : 'transparent',
          cursor: hasChildren ? 'pointer' : 'default',
          flexShrink: 0,
        }}
      >
        {hasChildren && (expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />)}
      </button>

      {/* Tag badge with dropdown */}
      <TagBadge
        tag={node.tag}
        showColor={showSemanticBadges}
        readOnly={readOnly}
        onChangeTag={(newTag) => onUpdateNode({ tag: newTag })}
      />

      {/* Element name */}
      <span
        style={{
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 140,
          flexShrink: 0,
          fontSize: 'var(--text-sm)',
        }}
        title={node.name}
      >
        {node.name}
      </span>

      {/* Class name (editable) */}
      {node.className !== undefined && node.className !== '' && (
        <>
          <span style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>&middot;</span>
          {editing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditDone}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEditDone();
                if (e.key === 'Escape') {
                  setEditing(false);
                  setEditValue(node.className ?? '');
                }
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                flex: 1,
                minWidth: 60,
                height: 22,
                padding: '0 6px',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--radius-sm, 4px)',
                backgroundColor: 'var(--bg-primary)',
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          ) : (
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleDoubleClick();
              }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--accent-text)',
                backgroundColor: 'var(--accent-subtle)',
                padding: '1px 6px',
                borderRadius: 'var(--radius-sm, 4px)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 160,
                cursor: readOnly ? 'default' : 'text',
              }}
              title={readOnly ? node.className : `Double-click to rename: .${node.className}`}
            >
              .{node.className}
            </span>
          )}
        </>
      )}

      {/* Spacer */}
      <span style={{ flex: 1 }} />

      {/* Heading hierarchy warning */}
      {headingWarning && (
        <span
          title={headingWarning}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <AlertTriangle
            size={13}
            style={{ color: 'var(--status-warning, #f59e0b)' }}
          />
        </span>
      )}

      {/* AI suggestion indicator (amber dot) */}
      {hasSuggestion && (
        <span
          title={
            [
              node.suggestion?.tag ? `Suggested tag: <${node.suggestion.tag}>` : '',
              node.suggestion?.className ? `Suggested class: .${node.suggestion.className}` : '',
            ]
              .filter(Boolean)
              .join(' | ')
          }
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Circle
            size={7}
            fill="var(--status-warning, #f59e0b)"
            style={{ color: 'var(--status-warning, #f59e0b)' }}
          />
        </span>
      )}
    </div>
  );
}

// ─── StructureTree Component ────────────────────────────────────

export function StructureTree({
  nodes,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  showSemanticBadges = true,
  showSuggestions = false,
  readOnly = false,
}: StructureTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    // Auto-expand first two levels
    const initial = new Set<string>();
    const autoExpand = (items: TreeNode[], depth: number) => {
      for (const node of items) {
        if (depth < 2) {
          initial.add(node.id);
          if (node.children) autoExpand(node.children, depth + 1);
        }
      }
    };
    autoExpand(nodes, 0);
    return initial;
  });

  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Collect all heading levels for hierarchy analysis
  const allHeadingLevels = useMemo(() => collectHeadingLevels(nodes), [nodes]);

  // Flatten visible nodes for keyboard navigation
  const flatNodes = useMemo(
    () => flattenVisible(nodes, expandedNodes),
    [nodes, expandedNodes],
  );

  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (nodeId: string) => {
      onSelectNode?.(nodeId);
      setFocusedNodeId(nodeId);
    },
    [onSelectNode],
  );

  const handleUpdateNode = useCallback(
    (nodeId: string, updates: Partial<TreeNode>) => {
      onUpdateNode?.(nodeId, updates);
    },
    [onUpdateNode],
  );

  // Scroll focused row into view
  useEffect(() => {
    if (focusedNodeId) {
      const el = rowRefs.current.get(focusedNodeId);
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [focusedNodeId]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIdx = flatNodes.findIndex((n) => n.id === (focusedNodeId ?? selectedNodeId));

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const nextIdx = Math.min(currentIdx + 1, flatNodes.length - 1);
          const nextNode = flatNodes[nextIdx];
          if (nextNode) {
            setFocusedNodeId(nextNode.id);
            onSelectNode?.(nextNode.id);
          }
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prevIdx = Math.max(currentIdx - 1, 0);
          const prevNode = flatNodes[prevIdx];
          if (prevNode) {
            setFocusedNodeId(prevNode.id);
            onSelectNode?.(prevNode.id);
          }
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          if (currentIdx >= 0) {
            const current = flatNodes[currentIdx];
            if (current.node.children && current.node.children.length > 0) {
              if (!expandedNodes.has(current.id)) {
                toggleExpand(current.id);
              } else {
                // Move to first child
                const nextIdx = currentIdx + 1;
                if (nextIdx < flatNodes.length) {
                  const child = flatNodes[nextIdx];
                  setFocusedNodeId(child.id);
                  onSelectNode?.(child.id);
                }
              }
            }
          }
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          if (currentIdx >= 0) {
            const current = flatNodes[currentIdx];
            if (expandedNodes.has(current.id) && current.node.children && current.node.children.length > 0) {
              toggleExpand(current.id);
            } else if (current.depth > 0) {
              // Move to parent — find previous node with lower depth
              for (let i = currentIdx - 1; i >= 0; i--) {
                if (flatNodes[i].depth < current.depth) {
                  setFocusedNodeId(flatNodes[i].id);
                  onSelectNode?.(flatNodes[i].id);
                  break;
                }
              }
            }
          }
          break;
        }
        case 'Home': {
          e.preventDefault();
          if (flatNodes.length > 0) {
            setFocusedNodeId(flatNodes[0].id);
            onSelectNode?.(flatNodes[0].id);
          }
          break;
        }
        case 'End': {
          e.preventDefault();
          if (flatNodes.length > 0) {
            const last = flatNodes[flatNodes.length - 1];
            setFocusedNodeId(last.id);
            onSelectNode?.(last.id);
          }
          break;
        }
        case 'Enter':
        case ' ': {
          e.preventDefault();
          if (currentIdx >= 0) {
            const current = flatNodes[currentIdx];
            if (current.node.children && current.node.children.length > 0) {
              toggleExpand(current.id);
            }
          }
          break;
        }
      }
    },
    [flatNodes, focusedNodeId, selectedNodeId, expandedNodes, toggleExpand, onSelectNode],
  );

  const nodeCount = useMemo(() => {
    const count = (items: TreeNode[]): number =>
      items.reduce((sum, n) => sum + 1 + (n.children ? count(n.children) : 0), 0);
    return count(nodes);
  }, [nodes]);

  // Recursive render
  const renderNodes = useCallback(
    (items: TreeNode[], depth: number): React.ReactNode => {
      return items.map((node) => {
        const hasChildren = (node.children?.length ?? 0) > 0;
        const isExpanded = expandedNodes.has(node.id);
        const headingWarning = getHeadingWarning(node.tag, allHeadingLevels);

        return (
          <div key={node.id} role="group">
            <TreeRow
              node={node}
              depth={depth}
              isSelected={selectedNodeId === node.id}
              isFocused={focusedNodeId === node.id}
              expanded={isExpanded}
              hasChildren={hasChildren}
              headingWarning={headingWarning}
              showSemanticBadges={showSemanticBadges}
              showSuggestions={showSuggestions}
              readOnly={readOnly}
              onToggle={() => toggleExpand(node.id)}
              onSelect={() => handleSelect(node.id)}
              onUpdateNode={(updates) => handleUpdateNode(node.id, updates)}
              rowRef={(el) => {
                if (el) {
                  rowRefs.current.set(node.id, el);
                } else {
                  rowRefs.current.delete(node.id);
                }
              }}
            />
            {hasChildren && isExpanded && renderNodes(node.children!, depth + 1)}
          </div>
        );
      });
    },
    [
      expandedNodes, selectedNodeId, focusedNodeId, allHeadingLevels,
      showSemanticBadges, showSuggestions, readOnly,
      toggleExpand, handleSelect, handleUpdateNode,
    ],
  );

  if (nodes.length === 0) {
    return (
      <div
        style={{
          padding: '24px 16px',
          textAlign: 'center',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        No elements to display.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="tree"
      aria-label="Element structure"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-sans)',
        outline: 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 32,
          padding: '0 8px',
          marginBottom: 2,
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Structure
        </span>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-tertiary)',
          }}
        >
          {nodeCount} elements
        </span>
      </div>

      {/* Tree rows */}
      <div style={{ padding: '0 4px 4px' }}>
        {renderNodes(nodes, 0)}
      </div>
    </div>
  );
}
