import { useEffect } from 'react';
import { X, Copy, Zap, Loader2, Upload, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import { useTemplate } from '@/hooks/use-templates';
import type { TemplateNode } from '@/types/template';

interface TemplateDetailPanelProps {
  templateId: string | null;
  open: boolean;
  onClose: () => void;
  onDuplicate?: (id: string) => void;
  onCompare?: (id: string) => void;
}

export function TemplateDetailPanel({ templateId, open, onClose, onDuplicate, onCompare }: TemplateDetailPanelProps) {
  const { data: template, isLoading } = useTemplate(templateId);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 90,
            transition: 'opacity 200ms ease',
          }}
        />
      )}

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '50%',
          maxWidth: 640,
          minWidth: 380,
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
          <span
            className="font-medium"
            style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
          >
            {template?.name ?? 'Template Detail'}
          </span>
          <button
            onClick={onClose}
            className="flex items-center justify-center border-none bg-transparent cursor-pointer"
            style={{ width: 28, height: 28, color: 'var(--text-tertiary)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto" style={{ padding: 16 }}>
          {isLoading && (
            <div
              className="flex items-center justify-center"
              style={{ height: 200, color: 'var(--text-tertiary)' }}
            >
              <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
          )}

          {template && (
            <div className="flex flex-col" style={{ gap: 16 }}>
              {/* Meta */}
              <div className="flex flex-col" style={{ gap: 8 }}>
                {template.description && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {template.description}
                  </p>
                )}

                <div className="flex items-center" style={{ gap: 6 }}>
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      color: template.type === 'STYLED' ? '#8b5cf6' : 'var(--text-tertiary)',
                      backgroundColor:
                        template.type === 'STYLED'
                          ? 'rgba(139, 92, 246, 0.1)'
                          : 'var(--surface-hover)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {template.type}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-tertiary)',
                      backgroundColor: 'var(--surface-hover)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {template.category}
                  </span>
                  {template.animationAttrs && Object.keys(template.animationAttrs).length > 0 && (
                    <span
                      className="flex items-center"
                      style={{
                        gap: 3,
                        fontSize: 'var(--text-xs)',
                        color: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <Zap size={10} />
                      Animated
                    </span>
                  )}
                </div>

                {template.tags.length > 0 && (
                  <div className="flex items-center" style={{ gap: 4, flexWrap: 'wrap' }}>
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-tertiary)',
                          border: '1px solid var(--border-default)',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Structure tree */}
              <div
                style={{
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="flex items-center justify-between"
                  style={{
                    height: 36,
                    padding: '0 12px',
                    borderBottom: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-secondary)',
                  }}
                >
                  <span
                    className="font-medium"
                    style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}
                  >
                    Structure
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    {countNodes(template.structure)} elements
                  </span>
                </div>
                <div style={{ padding: '8px 4px', maxHeight: 400, overflow: 'auto' }}>
                  <StructureNode node={template.structure} depth={0} />
                </div>
              </div>

              {/* Animation attributes */}
              {template.animationAttrs && Object.keys(template.animationAttrs).length > 0 && (
                <div
                  style={{
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: 36,
                      padding: '0 12px',
                      borderBottom: '1px solid var(--border-default)',
                      backgroundColor: 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      className="font-medium"
                      style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}
                    >
                      Animation Attributes
                    </span>
                  </div>
                  <div style={{ padding: '8px 12px' }}>
                    {Object.entries(template.animationAttrs).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center"
                        style={{
                          gap: 8,
                          fontSize: 'var(--text-xs)',
                          fontFamily: 'var(--font-mono)',
                          padding: '3px 0',
                        }}
                      >
                        <span style={{ color: '#f59e0b' }}>{key}</span>
                        <span style={{ color: 'var(--text-tertiary)' }}>=</span>
                        <span style={{ color: 'var(--accent-text)' }}>"{value}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {template && (
          <div
            className="flex items-center shrink-0"
            style={{
              height: 52,
              padding: '0 16px',
              borderTop: '1px solid var(--border-default)',
              gap: 8,
            }}
          >
            {onDuplicate && (
              <button
                onClick={() => onDuplicate(template.id)}
                className="flex items-center cursor-pointer"
                style={{
                  gap: 6,
                  height: 32,
                  padding: '0 12px',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'transparent',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <Copy size={13} />
                Duplicate
              </button>
            )}
            <button
              className="flex items-center cursor-pointer"
              onClick={() => {
                toast.info('Connect Webflow Designer to push templates', {
                  description: 'Open your project in the Webflow Designer with the MCP Companion App running, then connect in Settings → Integrations.',
                  duration: 6000,
                });
              }}
              style={{
                gap: 6,
                height: 32,
                padding: '0 12px',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent)',
                color: '#ffffff',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
                marginLeft: 'auto',
                transition: 'background-color var(--duration-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent)';
              }}
            >
              Push to Webflow
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Helper components ──

function StructureNode({ node, depth }: { node: TemplateNode; depth: number }) {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center"
        style={{
          height: 26,
          paddingLeft: depth * 16 + 8,
          gap: 6,
          fontSize: 'var(--text-xs)',
          borderRadius: 'var(--radius-sm)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span style={{ color: 'var(--text-tertiary)', fontWeight: 500, minWidth: 32, flexShrink: 0 }}>
          {node.tag}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-text)',
            backgroundColor: 'var(--accent-subtle)',
            padding: '0 4px',
            borderRadius: 'var(--radius-sm)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          .{node.className}
        </span>
        {node.text && (
          <span
            style={{
              color: 'var(--text-tertiary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontStyle: 'italic',
            }}
          >
            "{node.text}"
          </span>
        )}
      </div>
      {hasChildren &&
        node.children!.map((child, i) => (
          <StructureNode key={`${child.className}-${i}`} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}

function countNodes(node: TemplateNode): number {
  return 1 + (node.children?.reduce((sum, child) => sum + countNodes(child), 0) ?? 0);
}
