import { useState } from 'react';
import { Copy, Trash2, ChevronRight, Zap, Globe } from 'lucide-react';
import type { TemplateSummary } from '@/types/template';

interface TemplateCardProps {
  template: TemplateSummary;
  onSelect: (template: TemplateSummary) => void;
  onDuplicate?: (template: TemplateSummary) => void;
  onDelete?: (template: TemplateSummary) => void;
  onPublish?: (template: TemplateSummary) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  navbar: 'Navbar',
  hero: 'Hero',
  features: 'Features',
  testimonials: 'Testimonials',
  faq: 'FAQ',
  pricing: 'Pricing',
  cta: 'CTA',
  footer: 'Footer',
  contact: 'Contact',
  'logo-strip': 'Logo Strip',
  team: 'Team',
  blog: 'Blog',
};

export function TemplateCard({ template, onSelect, onDuplicate, onDelete, onPublish }: TemplateCardProps) {
  const [hovered, setHovered] = useState(false);

  const hasAnimations = template.animationAttrs && Object.keys(template.animationAttrs).length > 0;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(template)}
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-primary)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        borderColor: hovered ? 'var(--border-hover)' : 'var(--border-default)',
      }}
    >
      {/* Preview area */}
      <div
        style={{
          height: 120,
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        {/* Category icon/label as preview placeholder */}
        <span
          style={{
            fontSize: 'var(--text-xl)',
            color: 'var(--text-tertiary)',
            opacity: 0.4,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 600,
          }}
        >
          {CATEGORY_LABELS[template.category] ?? template.category}
        </span>

        {/* Action buttons on hover */}
        {hovered && (
          <div
            className="flex items-center"
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              gap: 4,
            }}
          >
            {onPublish && !template.isPreset && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPublish(template);
                }}
                className="flex items-center justify-center border-none cursor-pointer"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--accent)',
                }}
                title="Publish to Community"
              >
                <Globe size={13} />
              </button>
            )}
            {onDuplicate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(template);
                }}
                className="flex items-center justify-center border-none cursor-pointer"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                }}
                title="Duplicate"
              >
                <Copy size={13} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(template);
                }}
                className="flex items-center justify-center border-none cursor-pointer"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--status-error)',
                }}
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: 4 }}
        >
          <span
            className="font-medium"
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
            }}
          >
            {template.name}
          </span>
          <ChevronRight
            size={14}
            style={{
              color: 'var(--text-tertiary)',
              flexShrink: 0,
              opacity: hovered ? 1 : 0,
              transition: 'opacity 150ms ease',
            }}
          />
        </div>

        <div className="flex items-center" style={{ gap: 6 }}>
          {/* Type badge */}
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: template.type === 'STYLED' ? '#8b5cf6' : 'var(--text-tertiary)',
              backgroundColor:
                template.type === 'STYLED'
                  ? 'rgba(139, 92, 246, 0.1)'
                  : 'var(--surface-hover)',
              padding: '1px 5px',
              borderRadius: 'var(--radius-sm)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {template.type === 'STYLED' ? 'Styled' : 'Skeleton'}
          </span>

          {/* Preset badge */}
          {template.isPreset && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: 'var(--accent-text)',
                backgroundColor: 'var(--accent-subtle)',
                padding: '1px 5px',
                borderRadius: 'var(--radius-sm)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Preset
            </span>
          )}

          {/* Published badge */}
          {template.isPublished && (
            <Globe
              size={11}
              style={{ color: 'var(--accent)', flexShrink: 0 }}
              title="Published to community"
            />
          )}

          {/* Animation indicator */}
          {hasAnimations && (
            <Zap
              size={11}
              style={{ color: '#f59e0b', flexShrink: 0 }}
              title="Has animation attributes"
            />
          )}
        </div>
      </div>
    </div>
  );
}
