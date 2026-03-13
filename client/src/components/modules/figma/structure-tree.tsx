import { TreeNode } from './tree-node';
import type { ParsedNode } from '@/types/figma';

interface StructureTreeProps {
  structure: ParsedNode;
  aiSuggestions?: Record<string, { suggestedClass?: string; notes?: string }>;
  onClassChange?: (nodeId: string, newClass: string) => void;
  title: string;
}

export function StructureTree({ structure, aiSuggestions, onClassChange, title }: StructureTreeProps) {
  const nodeCount = countNodes(structure);

  return (
    <div
      className="flex flex-col"
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-primary)',
        overflow: 'hidden',
        flex: 1,
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{
          height: 40,
          padding: '0 16px',
          borderBottom: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <span
          className="font-medium"
          style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
        >
          {title}
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          {nodeCount} elements
        </span>
      </div>

      {/* Tree */}
      <div
        className="flex-1 overflow-auto"
        style={{ padding: '8px 8px' }}
      >
        <TreeNode
          node={structure}
          depth={0}
          aiSuggestions={aiSuggestions}
          onClassChange={onClassChange}
        />
      </div>
    </div>
  );
}

function countNodes(node: ParsedNode): number {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}
