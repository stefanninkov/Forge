import { useState, type FormEvent } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const CATEGORIES = [
  'navbar', 'hero', 'features', 'testimonials', 'faq', 'pricing',
  'cta', 'footer', 'contact', 'logo-strip', 'team', 'blog',
] as const;

interface AnimationAttr {
  key: string;
  value: string;
}

interface CreateTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    category: string;
    type: 'SKELETON' | 'STYLED';
    structure: Record<string, unknown>;
    styles?: Record<string, unknown>;
    animationAttrs?: Record<string, string>;
    tags?: string[];
  }) => void;
  loading?: boolean;
}

export function CreateTemplateDialog({ open, onClose, onSubmit, loading }: CreateTemplateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [type, setType] = useState<'SKELETON' | 'STYLED'>('SKELETON');
  const [tags, setTags] = useState('');
  const [animAttrs, setAnimAttrs] = useState<AnimationAttr[]>([]);

  if (!open) return null;

  function reset() {
    setName('');
    setDescription('');
    setCategory(CATEGORIES[0]);
    setType('SKELETON');
    setTags('');
    setAnimAttrs([]);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const animationAttrs: Record<string, string> = {};
    for (const attr of animAttrs) {
      if (attr.key.trim() && attr.value.trim()) {
        animationAttrs[attr.key.trim()] = attr.value.trim();
      }
    }

    // Default structure: a simple section wrapper
    const structure = {
      tag: 'section',
      className: `section_${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      children: [
        {
          tag: 'div',
          className: 'padding-global',
          children: [
            {
              tag: 'div',
              className: 'container-large',
              children: [
                {
                  tag: 'div',
                  className: 'padding-section-large',
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    };

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      type,
      structure,
      animationAttrs: Object.keys(animationAttrs).length > 0 ? animationAttrs : undefined,
      tags: tags.trim() ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
    });

    reset();
  }

  function addAnimAttr() {
    setAnimAttrs((prev) => [...prev, { key: 'data-animation', value: '' }]);
  }

  function updateAnimAttr(index: number, field: 'key' | 'value', val: string) {
    setAnimAttrs((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: val } : a)));
  }

  function removeAnimAttr(index: number) {
    setAnimAttrs((prev) => prev.filter((_, i) => i !== index));
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 36,
    padding: '0 12px',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-base)',
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-primary)',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: 6,
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-overlay)',
        animation: 'fadeIn 200ms ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '85vh',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 200ms ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            New Template
          </h2>
          <button
            onClick={handleClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              border: 'none',
              background: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ overflow: 'auto', flex: 1 }}>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Name */}
            <div>
              <label htmlFor="tpl-name" style={labelStyle}>Name</label>
              <input
                id="tpl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Hero — Centered"
                required
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-subtle)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="tpl-desc" style={labelStyle}>Description</label>
              <input
                id="tpl-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description (optional)"
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-subtle)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Category + Type row */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="tpl-cat" style={labelStyle}>Category</label>
                <select
                  id="tpl-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    ...inputStyle,
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    paddingRight: 32,
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="tpl-type" style={labelStyle}>Type</label>
                <select
                  id="tpl-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as 'SKELETON' | 'STYLED')}
                  style={{
                    ...inputStyle,
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    paddingRight: 32,
                  }}
                >
                  <option value="SKELETON">Skeleton</option>
                  <option value="STYLED">Styled</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tpl-tags" style={labelStyle}>Tags (comma-separated)</label>
              <input
                id="tpl-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. responsive, dark, minimal"
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-subtle)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Animation Attributes */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Animation Attributes</label>
                <button
                  type="button"
                  onClick={addAnimAttr}
                  className="flex items-center"
                  style={{
                    gap: 4,
                    height: 26,
                    padding: '0 8px',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Plus size={12} />
                  Add
                </button>
              </div>

              {animAttrs.length === 0 && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>
                  No animation attributes. Click "Add" to attach data-attributes for animations.
                </p>
              )}

              {animAttrs.map((attr, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input
                    value={attr.key}
                    onChange={(e) => updateAnimAttr(i, 'key', e.target.value)}
                    placeholder="data-animation"
                    style={{
                      ...inputStyle,
                      height: 32,
                      fontSize: 'var(--text-xs)',
                      fontFamily: 'var(--font-mono)',
                      flex: 1,
                    }}
                  />
                  <input
                    value={attr.value}
                    onChange={(e) => updateAnimAttr(i, 'value', e.target.value)}
                    placeholder="fade-in"
                    style={{
                      ...inputStyle,
                      height: 32,
                      fontSize: 'var(--text-xs)',
                      fontFamily: 'var(--font-mono)',
                      flex: 1,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeAnimAttr(i)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      border: 'none',
                      background: 'none',
                      color: 'var(--text-tertiary)',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--status-error)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-tertiary)';
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border-default)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              style={{
                height: 36,
                padding: '0 14px',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              style={{
                height: 36,
                padding: '0 14px',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !name.trim() ? 0.5 : 1,
                fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={(e) => {
                if (!loading && name.trim()) e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent)';
              }}
            >
              {loading ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
