import { useState, useMemo, useCallback } from 'react';
import { Layers, X, Search, Check } from 'lucide-react';

interface BulkElement {
  id: string;
  name: string;
  type: string;
  hasAnimation?: boolean;
  hasStyles?: boolean;
}

export interface BulkOperationsDialogProps {
  open: boolean;
  onClose: () => void;
  elements: BulkElement[];
  onApplyAnimation: (elementIds: string[], animation: { presetId: string; engine: string; trigger: string }) => void;
  onApplyStyle: (elementIds: string[], styles: Record<string, string>) => void;
  onRemoveAnimations: (elementIds: string[]) => void;
}

type OpTab = 'animation' | 'style' | 'remove';

const PRESET_OPTIONS = [
  { id: 'fade-in', name: 'Fade In' },
  { id: 'fade-up', name: 'Fade Up' },
  { id: 'slide-up', name: 'Slide Up' },
  { id: 'slide-left', name: 'Slide Left' },
  { id: 'scale-in', name: 'Scale In' },
  { id: 'bounce', name: 'Bounce' },
  { id: 'rotate-in', name: 'Rotate In' },
  { id: 'blur-in', name: 'Blur In' },
];

export function BulkOperationsDialog({
  open,
  onClose,
  elements,
  onApplyAnimation,
  onApplyStyle,
  onRemoveAnimations,
}: BulkOperationsDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<OpTab>('animation');

  // Animation options
  const [presetId, setPresetId] = useState('fade-up');
  const [engine, setEngine] = useState('css');
  const [trigger, setTrigger] = useState('scroll');

  // Style options
  const [opacity, setOpacity] = useState('1');
  const [display, setDisplay] = useState('');
  const [visibility, setVisibility] = useState('');

  const filteredElements = useMemo(() => {
    if (!search.trim()) return elements;
    const q = search.toLowerCase();
    return elements.filter((e) => e.name.toLowerCase().includes(q));
  }, [elements, search]);

  const toggleAll = useCallback(() => {
    if (selected.size === filteredElements.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredElements.map((e) => e.id)));
    }
  }, [selected, filteredElements]);

  const toggleElement = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleApply = useCallback(() => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    switch (tab) {
      case 'animation':
        onApplyAnimation(ids, { presetId, engine, trigger });
        break;
      case 'style': {
        const styles: Record<string, string> = {};
        if (opacity !== '1') styles.opacity = opacity;
        if (display) styles.display = display;
        if (visibility) styles.visibility = visibility;
        onApplyStyle(ids, styles);
        break;
      }
      case 'remove':
        onRemoveAnimations(ids);
        break;
    }
    onClose();
  }, [selected, tab, presetId, engine, trigger, opacity, display, visibility, onApplyAnimation, onApplyStyle, onRemoveAnimations, onClose]);

  if (!open) return null;

  const allSelected = selected.size === filteredElements.length && filteredElements.length > 0;

  return (
    <div
      className="flex items-center justify-center"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.5)',
        animation: 'fadeIn 150ms ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 700,
          maxHeight: '80vh',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-default)',
            flexShrink: 0,
          }}
        >
          <div className="flex items-center" style={{ gap: 8 }}>
            <Layers size={16} style={{ color: 'var(--accent-text)' }} />
            <span style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Bulk Operations
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center border-none bg-transparent cursor-pointer"
            style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', color: 'var(--text-tertiary)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Left: Element selector */}
          <div
            style={{
              width: '40%',
              borderRight: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Search */}
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div
                className="flex items-center"
                style={{
                  height: 30,
                  padding: '0 8px',
                  gap: 6,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-primary)',
                }}
              >
                <Search size={12} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter elements..."
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
              </div>
            </div>

            {/* Select all */}
            <button
              onClick={toggleAll}
              className="flex items-center border-none bg-transparent cursor-pointer w-full"
              style={{
                padding: '6px 12px',
                gap: 8,
                borderBottom: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-xs)',
                color: 'var(--accent-text)',
                fontWeight: 500,
              }}
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>

            {/* Element list */}
            <div style={{ overflow: 'auto', flex: 1 }}>
              {filteredElements.map((el) => (
                <label
                  key={el.id}
                  className="flex items-center cursor-pointer"
                  style={{
                    padding: '6px 12px',
                    gap: 8,
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: selected.has(el.id) ? 'var(--accent-subtle)' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(el.id)}
                    onChange={() => toggleElement(el.id)}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}
                  >
                    {el.name}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-tertiary)',
                      flexShrink: 0,
                    }}
                  >
                    {el.type}
                  </span>
                </label>
              ))}
            </div>

            {/* Selected count */}
            <div
              style={{
                padding: '6px 12px',
                borderTop: '1px solid var(--border-default)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                flexShrink: 0,
              }}
            >
              {selected.size} of {elements.length} selected
            </div>
          </div>

          {/* Right: Operation */}
          <div style={{ width: '60%', display: 'flex', flexDirection: 'column' }}>
            {/* Tabs */}
            <div className="flex" style={{ borderBottom: '1px solid var(--border-default)', flexShrink: 0 }}>
              {([
                { key: 'animation' as OpTab, label: 'Animation' },
                { key: 'style' as OpTab, label: 'Style' },
                { key: 'remove' as OpTab, label: 'Remove' },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="border-none cursor-pointer"
                  style={{
                    flex: 1,
                    height: 36,
                    backgroundColor: 'transparent',
                    color: tab === key ? 'var(--accent-text)' : 'var(--text-tertiary)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    fontFamily: 'var(--font-sans)',
                    borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ padding: 16, flex: 1, overflow: 'auto' }}>
              {tab === 'animation' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      Preset
                    </label>
                    <select
                      value={presetId}
                      onChange={(e) => setPresetId(e.target.value)}
                      style={{
                        width: '100%', height: 32, padding: '0 8px', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)', outline: 'none',
                      }}
                    >
                      {PRESET_OPTIONS.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex" style={{ gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Engine</label>
                      <select
                        value={engine} onChange={(e) => setEngine(e.target.value)}
                        style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)', outline: 'none' }}
                      >
                        <option value="css">CSS</option>
                        <option value="gsap">GSAP</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Trigger</label>
                      <select
                        value={trigger} onChange={(e) => setTrigger(e.target.value)}
                        style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)', outline: 'none' }}
                      >
                        <option value="scroll">Scroll</option>
                        <option value="hover">Hover</option>
                        <option value="click">Click</option>
                        <option value="load">Load</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'style' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Opacity</label>
                    <input
                      type="range" min="0" max="1" step="0.1" value={opacity}
                      onChange={(e) => setOpacity(e.target.value)}
                      style={{ width: '100%', accentColor: 'var(--accent)' }}
                    />
                    <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{opacity}</span>
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Display</label>
                    <select
                      value={display} onChange={(e) => setDisplay(e.target.value)}
                      style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)', outline: 'none' }}
                    >
                      <option value="">No change</option>
                      <option value="block">Block</option>
                      <option value="flex">Flex</option>
                      <option value="grid">Grid</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Visibility</label>
                    <select
                      value={visibility} onChange={(e) => setVisibility(e.target.value)}
                      style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)', outline: 'none' }}
                    >
                      <option value="">No change</option>
                      <option value="visible">Visible</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                </div>
              )}

              {tab === 'remove' && (
                <div
                  style={{
                    padding: 16,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(239, 68, 68, 0.06)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                  }}
                >
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--error)', fontWeight: 500, margin: '0 0 6px' }}>
                    Remove all animations
                  </p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)', margin: 0 }}>
                    This will remove all animation attributes from the selected elements. This action can be undone.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end"
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--border-default)',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            className="border-none cursor-pointer"
            style={{
              height: 32, padding: '0 12px', borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--surface-hover)', color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)', fontWeight: 500, fontFamily: 'var(--font-sans)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={selected.size === 0}
            className="flex items-center border-none cursor-pointer"
            style={{
              gap: 4, height: 32, padding: '0 14px', borderRadius: 'var(--radius-md)',
              backgroundColor: tab === 'remove' ? 'var(--error)' : 'var(--accent)',
              color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 500, fontFamily: 'var(--font-sans)',
              opacity: selected.size === 0 ? 0.5 : 1,
              cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <Check size={14} />
            {tab === 'remove' ? `Remove from ${selected.size}` : `Apply to ${selected.size}`} Element{selected.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
