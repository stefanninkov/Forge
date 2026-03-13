import { useState, useCallback } from 'react';
import {
  Monitor, Tablet, Smartphone, Code, Eye,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ArrowRight, ArrowDown, WrapText,
  AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd, AlignHorizontalSpaceBetween, AlignHorizontalSpaceAround,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  Undo2, Redo2,
} from 'lucide-react';
import { PropertyGroup } from './property-group';
import { UnitInput } from './unit-input';
import { CompactSelect } from './compact-select';
import { IconButtonGroup } from './icon-button-group';
import { ColorPicker } from './color-picker';
import { HelpTooltip } from './help-tooltip';
import type { CSSUnit } from './unit-input';

export interface CSSStyles {
  // Layout
  display?: string;
  flexDirection?: string;
  flexWrap?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridGap?: string;
  position?: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  overflow?: string;
  zIndex?: string;
  // Sizing
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  aspectRatio?: string;
  // Spacing
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  // Typography
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: string;
  textDecoration?: string;
  textTransform?: string;
  color?: string;
  // Backgrounds
  backgroundColor?: string;
  backgroundImage?: string;
  // Borders
  borderWidth?: string;
  borderStyle?: string;
  borderColor?: string;
  borderRadius?: string;
  boxShadow?: string;
  // Effects
  opacity?: string;
  transform?: string;
  transition?: string;
  filter?: string;
  cursor?: string;
  [key: string]: string | undefined;
}

type Breakpoint = 'desktop' | 'tablet-l' | 'tablet' | 'mobile-l' | 'mobile';

export interface StylePanelProps {
  styles: CSSStyles;
  baseSize?: number;
  onStyleChange: (property: string, value: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const DISPLAY_OPTIONS = [
  { value: 'block', label: 'Block' },
  { value: 'flex', label: 'Flex' },
  { value: 'grid', label: 'Grid' },
  { value: 'inline', label: 'Inline' },
  { value: 'inline-block', label: 'Inline Block' },
  { value: 'inline-flex', label: 'Inline Flex' },
  { value: 'none', label: 'None' },
];

const POSITION_OPTIONS = [
  { value: 'static', label: 'Static' },
  { value: 'relative', label: 'Relative' },
  { value: 'absolute', label: 'Absolute' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'sticky', label: 'Sticky' },
];

const OVERFLOW_OPTIONS = [
  { value: 'visible', label: 'Visible' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'scroll', label: 'Scroll' },
  { value: 'auto', label: 'Auto' },
];

const FONT_WEIGHT_OPTIONS = [
  { value: '100', label: '100 Thin' },
  { value: '200', label: '200 Extra Light' },
  { value: '300', label: '300 Light' },
  { value: '400', label: '400 Regular' },
  { value: '500', label: '500 Medium' },
  { value: '600', label: '600 Semibold' },
  { value: '700', label: '700 Bold' },
  { value: '800', label: '800 Extra Bold' },
  { value: '900', label: '900 Black' },
];

const TEXT_TRANSFORM_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'Uppercase' },
  { value: 'lowercase', label: 'Lowercase' },
  { value: 'capitalize', label: 'Capitalize' },
];

const BORDER_STYLE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
];

const CURSOR_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'pointer', label: 'Pointer' },
  { value: 'default', label: 'Default' },
  { value: 'move', label: 'Move' },
  { value: 'text', label: 'Text' },
  { value: 'not-allowed', label: 'Not Allowed' },
  { value: 'grab', label: 'Grab' },
];

const BREAKPOINT_ICONS: Record<Breakpoint, { icon: typeof Monitor; label: string }> = {
  'desktop': { icon: Monitor, label: 'Desktop' },
  'tablet-l': { icon: Tablet, label: 'Tablet Landscape' },
  'tablet': { icon: Tablet, label: 'Tablet' },
  'mobile-l': { icon: Smartphone, label: 'Mobile Landscape' },
  'mobile': { icon: Smartphone, label: 'Mobile' },
};

function parseValueUnit(str: string | undefined): { value: number; unit: CSSUnit } {
  if (!str) return { value: 0, unit: 'px' };
  const match = str.match(/^(-?[\d.]+)(px|rem|em|%|vw|vh)?$/);
  if (match) {
    return { value: parseFloat(match[1]), unit: (match[2] as CSSUnit) || 'px' };
  }
  return { value: 0, unit: 'px' };
}

export function StylePanel({
  styles,
  baseSize = 16,
  onStyleChange,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: StylePanelProps) {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const [marginLinked, setMarginLinked] = useState(false);
  const [paddingLinked, setPaddingLinked] = useState(false);
  const [borderRadiusLinked, setBorderRadiusLinked] = useState(true);

  const handleValueUnit = useCallback(
    (property: string) => (value: number | string, unit: CSSUnit) => {
      onStyleChange(property, `${value}${unit}`);
    },
    [onStyleChange],
  );

  const handleLinkedSpacing = useCallback(
    (prefix: 'margin' | 'padding', value: number | string, unit: CSSUnit) => {
      const str = `${value}${unit}`;
      onStyleChange(`${prefix}Top`, str);
      onStyleChange(`${prefix}Right`, str);
      onStyleChange(`${prefix}Bottom`, str);
      onStyleChange(`${prefix}Left`, str);
    },
    [onStyleChange],
  );

  const isFlex = styles.display === 'flex' || styles.display === 'inline-flex';
  const isGrid = styles.display === 'grid';
  const isPositioned = styles.position && styles.position !== 'static';

  const generatedCSS = Object.entries(styles)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `  ${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`)
    .join('\n');

  return (
    <div
      style={{
        width: 320,
        height: '100%',
        borderLeft: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        {/* Breakpoint selector */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(Object.keys(BREAKPOINT_ICONS) as Breakpoint[]).map((bp) => {
            const { icon: Icon, label } = BREAKPOINT_ICONS[bp];
            const isActive = bp === breakpoint;
            return (
              <button
                key={bp}
                onClick={() => setBreakpoint(bp)}
                title={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  border: 'none',
                  borderRadius: 4,
                  backgroundColor: 'transparent',
                  color: isActive ? 'var(--accent-text)' : 'var(--text-tertiary)',
                  cursor: 'pointer',
                  borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  transition: 'color var(--duration-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-tertiary)';
                }}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Undo/Redo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (⌘Z)"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 24, height: 24, border: 'none', borderRadius: 4,
              backgroundColor: 'transparent',
              color: canUndo ? 'var(--text-secondary)' : 'var(--text-tertiary)',
              cursor: canUndo ? 'pointer' : 'default', opacity: canUndo ? 1 : 0.4,
            }}
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (⌘⇧Z)"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 24, height: 24, border: 'none', borderRadius: 4,
              backgroundColor: 'transparent',
              color: canRedo ? 'var(--text-secondary)' : 'var(--text-tertiary)',
              cursor: canRedo ? 'pointer' : 'default', opacity: canRedo ? 1 : 0.4,
            }}
          >
            <Redo2 size={14} />
          </button>

          {/* Visual / Code toggle */}
          <div style={{ display: 'flex', gap: 2, marginLeft: 4 }}>
            {[
              { mode: 'visual' as const, icon: Eye, label: 'Visual' },
              { mode: 'code' as const, icon: Code, label: 'Code' },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  height: 24, padding: '0 6px', border: 'none', borderRadius: 4,
                  backgroundColor: viewMode === mode ? 'var(--surface-active)' : 'transparent',
                  color: viewMode === mode ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontSize: 'var(--text-xs)', fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {viewMode === 'code' ? (
          <div style={{ padding: 12 }}>
            <pre
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                margin: 0,
              }}
            >
              {'{\n'}{generatedCSS || '  /* No styles set */'}{'\n}'}
            </pre>
          </div>
        ) : (
          <>
            {/* Layout */}
            <PropertyGroup title="Layout" defaultOpen>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <CompactSelect
                  label="Display"
                  value={styles.display || 'block'}
                  options={DISPLAY_OPTIONS}
                  onChange={(v) => onStyleChange('display', v)}
                />
                <HelpTooltip
                  content="How the element participates in layout flow. 'flex' for flexible rows/columns, 'grid' for two-dimensional layouts."
                  guideLink="/guide/css/layout#display"
                />
              </div>

              {isFlex && (
                <>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <IconButtonGroup
                      label="Direction"
                      value={styles.flexDirection || 'row'}
                      options={[
                        { value: 'row', icon: ArrowRight, tooltip: 'Row' },
                        { value: 'column', icon: ArrowDown, tooltip: 'Column' },
                      ]}
                      onChange={(v) => onStyleChange('flexDirection', v)}
                    />
                    <IconButtonGroup
                      label="Wrap"
                      value={styles.flexWrap || 'nowrap'}
                      options={[
                        { value: 'nowrap', icon: ArrowRight, tooltip: 'No Wrap' },
                        { value: 'wrap', icon: WrapText, tooltip: 'Wrap' },
                      ]}
                      onChange={(v) => onStyleChange('flexWrap', v)}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IconButtonGroup
                      label="Justify"
                      value={styles.justifyContent || 'flex-start'}
                      options={[
                        { value: 'flex-start', icon: AlignHorizontalJustifyStart, tooltip: 'Start' },
                        { value: 'center', icon: AlignHorizontalJustifyCenter, tooltip: 'Center' },
                        { value: 'flex-end', icon: AlignHorizontalJustifyEnd, tooltip: 'End' },
                        { value: 'space-between', icon: AlignHorizontalSpaceBetween, tooltip: 'Space Between' },
                        { value: 'space-around', icon: AlignHorizontalSpaceAround, tooltip: 'Space Around' },
                      ]}
                      onChange={(v) => onStyleChange('justifyContent', v)}
                    />
                    <HelpTooltip content="Controls how children are distributed along the main axis." />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IconButtonGroup
                      label="Align"
                      value={styles.alignItems || 'stretch'}
                      options={[
                        { value: 'flex-start', icon: AlignVerticalJustifyStart, tooltip: 'Start' },
                        { value: 'center', icon: AlignVerticalJustifyCenter, tooltip: 'Center' },
                        { value: 'flex-end', icon: AlignVerticalJustifyEnd, tooltip: 'End' },
                      ]}
                      onChange={(v) => onStyleChange('alignItems', v)}
                    />
                    <HelpTooltip content="How children are aligned on the cross axis — stretch, center, start, end." />
                  </div>
                  <UnitInput
                    label="Gap"
                    {...parseValueUnit(styles.gap)}
                    units={['px', 'rem', '%']}
                    min={0}
                    compact
                    baseSize={baseSize}
                    onChange={handleValueUnit('gap')}
                  />
                </>
              )}

              {isGrid && (
                <>
                  <UnitInput
                    label="Columns"
                    value={styles.gridTemplateColumns || ''}
                    unit="none"
                    units={['none']}
                    compact
                    onChange={() => {}}
                  />
                  <UnitInput
                    label="Gap"
                    {...parseValueUnit(styles.gridGap || styles.gap)}
                    units={['px', 'rem', '%']}
                    min={0}
                    compact
                    baseSize={baseSize}
                    onChange={handleValueUnit('gap')}
                  />
                </>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <CompactSelect
                  label="Position"
                  value={styles.position || 'static'}
                  options={POSITION_OPTIONS}
                  onChange={(v) => onStyleChange('position', v)}
                />
                <HelpTooltip content="How the element is positioned. 'relative' for offset from normal flow, 'absolute' for positioned relative to parent." />
              </div>

              {isPositioned && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <UnitInput label="Top" {...parseValueUnit(styles.top)} compact baseSize={baseSize} onChange={handleValueUnit('top')} />
                  <UnitInput label="Right" {...parseValueUnit(styles.right)} compact baseSize={baseSize} onChange={handleValueUnit('right')} />
                  <UnitInput label="Bottom" {...parseValueUnit(styles.bottom)} compact baseSize={baseSize} onChange={handleValueUnit('bottom')} />
                  <UnitInput label="Left" {...parseValueUnit(styles.left)} compact baseSize={baseSize} onChange={handleValueUnit('left')} />
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <CompactSelect
                  label="Overflow"
                  value={styles.overflow || 'visible'}
                  options={OVERFLOW_OPTIONS}
                  onChange={(v) => onStyleChange('overflow', v)}
                />
                <UnitInput
                  label="Z-Index"
                  value={parseInt(styles.zIndex || '0', 10)}
                  unit="none"
                  units={['none']}
                  step={1}
                  compact
                  onChange={(v) => onStyleChange('zIndex', String(v))}
                />
              </div>
            </PropertyGroup>

            {/* Sizing */}
            <PropertyGroup title="Sizing">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <UnitInput label="Width" {...parseValueUnit(styles.width)} units={['px', 'rem', '%', 'vw', 'auto' as CSSUnit]} compact baseSize={baseSize} onChange={handleValueUnit('width')} />
                <UnitInput label="Height" {...parseValueUnit(styles.height)} units={['px', 'rem', '%', 'vh', 'auto' as CSSUnit]} compact baseSize={baseSize} onChange={handleValueUnit('height')} />
                <UnitInput label="Min W" {...parseValueUnit(styles.minWidth)} units={['px', 'rem', '%']} compact baseSize={baseSize} onChange={handleValueUnit('minWidth')} />
                <UnitInput label="Max W" {...parseValueUnit(styles.maxWidth)} units={['px', 'rem', '%']} compact baseSize={baseSize} onChange={handleValueUnit('maxWidth')} />
                <UnitInput label="Min H" {...parseValueUnit(styles.minHeight)} units={['px', 'rem', '%']} compact baseSize={baseSize} onChange={handleValueUnit('minHeight')} />
                <UnitInput label="Max H" {...parseValueUnit(styles.maxHeight)} units={['px', 'rem', '%']} compact baseSize={baseSize} onChange={handleValueUnit('maxHeight')} />
              </div>
            </PropertyGroup>

            {/* Spacing */}
            <PropertyGroup title="Spacing">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-tertiary)' }}>Margin</span>
                  <button
                    onClick={() => setMarginLinked(!marginLinked)}
                    title={marginLinked ? 'Unlink values' : 'Link all values'}
                    style={{
                      fontSize: 'var(--text-xs)', border: 'none', background: 'none', cursor: 'pointer', padding: 0,
                      color: marginLinked ? 'var(--accent-text)' : 'var(--text-tertiary)',
                    }}
                  >
                    {marginLinked ? '🔗' : '⛓️‍💥'}
                  </button>
                </div>
                {marginLinked ? (
                  <UnitInput
                    {...parseValueUnit(styles.marginTop)}
                    compact
                    baseSize={baseSize}
                    onChange={(v, u) => handleLinkedSpacing('margin', v, u)}
                  />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <UnitInput label="Top" {...parseValueUnit(styles.marginTop)} compact baseSize={baseSize} onChange={handleValueUnit('marginTop')} />
                    <UnitInput label="Right" {...parseValueUnit(styles.marginRight)} compact baseSize={baseSize} onChange={handleValueUnit('marginRight')} />
                    <UnitInput label="Bottom" {...parseValueUnit(styles.marginBottom)} compact baseSize={baseSize} onChange={handleValueUnit('marginBottom')} />
                    <UnitInput label="Left" {...parseValueUnit(styles.marginLeft)} compact baseSize={baseSize} onChange={handleValueUnit('marginLeft')} />
                  </div>
                )}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-tertiary)' }}>Padding</span>
                  <button
                    onClick={() => setPaddingLinked(!paddingLinked)}
                    title={paddingLinked ? 'Unlink values' : 'Link all values'}
                    style={{
                      fontSize: 'var(--text-xs)', border: 'none', background: 'none', cursor: 'pointer', padding: 0,
                      color: paddingLinked ? 'var(--accent-text)' : 'var(--text-tertiary)',
                    }}
                  >
                    {paddingLinked ? '🔗' : '⛓️‍💥'}
                  </button>
                </div>
                {paddingLinked ? (
                  <UnitInput
                    {...parseValueUnit(styles.paddingTop)}
                    compact
                    baseSize={baseSize}
                    onChange={(v, u) => handleLinkedSpacing('padding', v, u)}
                  />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <UnitInput label="Top" {...parseValueUnit(styles.paddingTop)} compact baseSize={baseSize} onChange={handleValueUnit('paddingTop')} />
                    <UnitInput label="Right" {...parseValueUnit(styles.paddingRight)} compact baseSize={baseSize} onChange={handleValueUnit('paddingRight')} />
                    <UnitInput label="Bottom" {...parseValueUnit(styles.paddingBottom)} compact baseSize={baseSize} onChange={handleValueUnit('paddingBottom')} />
                    <UnitInput label="Left" {...parseValueUnit(styles.paddingLeft)} compact baseSize={baseSize} onChange={handleValueUnit('paddingLeft')} />
                  </div>
                )}
              </div>
            </PropertyGroup>

            {/* Typography */}
            <PropertyGroup title="Typography">
              <CompactSelect
                label="Font Family"
                value={styles.fontFamily || 'inherit'}
                options={[
                  { value: 'inherit', label: 'Inherit' },
                  { value: "'Geist', sans-serif", label: 'Geist Sans' },
                  { value: "'Geist Mono', monospace", label: 'Geist Mono' },
                  { value: 'serif', label: 'Serif' },
                  { value: 'sans-serif', label: 'Sans Serif' },
                  { value: 'monospace', label: 'Monospace' },
                ]}
                mono
                onChange={(v) => onStyleChange('fontFamily', v)}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <UnitInput label="Size" {...parseValueUnit(styles.fontSize)} units={['px', 'rem', 'em']} compact baseSize={baseSize} onChange={handleValueUnit('fontSize')} />
                <CompactSelect
                  label="Weight"
                  value={styles.fontWeight || '400'}
                  options={FONT_WEIGHT_OPTIONS}
                  onChange={(v) => onStyleChange('fontWeight', v)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <UnitInput label="Line Height" {...parseValueUnit(styles.lineHeight)} units={['px', 'rem', 'none' as CSSUnit]} compact baseSize={baseSize} onChange={handleValueUnit('lineHeight')} />
                <UnitInput label="Letter Spacing" {...parseValueUnit(styles.letterSpacing)} units={['px', 'em']} compact baseSize={baseSize} onChange={handleValueUnit('letterSpacing')} />
              </div>
              <IconButtonGroup
                label="Text Align"
                value={styles.textAlign || 'left'}
                options={[
                  { value: 'left', icon: AlignLeft, tooltip: 'Left' },
                  { value: 'center', icon: AlignCenter, tooltip: 'Center' },
                  { value: 'right', icon: AlignRight, tooltip: 'Right' },
                  { value: 'justify', icon: AlignJustify, tooltip: 'Justify' },
                ]}
                onChange={(v) => onStyleChange('textAlign', v)}
              />
              <CompactSelect
                label="Text Transform"
                value={styles.textTransform || 'none'}
                options={TEXT_TRANSFORM_OPTIONS}
                onChange={(v) => onStyleChange('textTransform', v)}
              />
              <ColorPicker
                label="Color"
                value={styles.color || '#000000'}
                onChange={(c) => onStyleChange('color', c)}
              />
            </PropertyGroup>

            {/* Backgrounds */}
            <PropertyGroup title="Backgrounds">
              <ColorPicker
                label="Background Color"
                value={styles.backgroundColor || '#ffffff'}
                onChange={(c) => onStyleChange('backgroundColor', c)}
              />
            </PropertyGroup>

            {/* Borders */}
            <PropertyGroup title="Borders">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <UnitInput label="Width" {...parseValueUnit(styles.borderWidth)} units={['px']} compact min={0} onChange={handleValueUnit('borderWidth')} />
                <CompactSelect
                  label="Style"
                  value={styles.borderStyle || 'none'}
                  options={BORDER_STYLE_OPTIONS}
                  onChange={(v) => onStyleChange('borderStyle', v)}
                />
              </div>
              <ColorPicker
                label="Border Color"
                value={styles.borderColor || '#000000'}
                onChange={(c) => onStyleChange('borderColor', c)}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-tertiary)' }}>
                    Border Radius
                  </span>
                  <HelpTooltip content="Rounds the corners of the element. Use one value for all corners or four for individual corners." />
                  <button
                    onClick={() => setBorderRadiusLinked(!borderRadiusLinked)}
                    style={{
                      fontSize: 'var(--text-xs)', border: 'none', background: 'none', cursor: 'pointer', padding: 0,
                      color: borderRadiusLinked ? 'var(--accent-text)' : 'var(--text-tertiary)',
                    }}
                  >
                    {borderRadiusLinked ? '🔗' : '⛓️‍💥'}
                  </button>
                </div>
                <UnitInput
                  {...parseValueUnit(styles.borderRadius)}
                  units={['px', 'rem', '%']}
                  compact
                  min={0}
                  baseSize={baseSize}
                  onChange={handleValueUnit('borderRadius')}
                />
              </div>
            </PropertyGroup>

            {/* Effects */}
            <PropertyGroup title="Effects">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-tertiary)' }}>
                    Opacity
                  </span>
                  <HelpTooltip content="Controls transparency. 1 = fully visible, 0 = fully invisible. Affects the entire element including children." />
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={parseFloat(styles.opacity || '1')}
                  onChange={(e) => onStyleChange('opacity', e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
                <div style={{
                  fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
                  color: 'var(--text-tertiary)', textAlign: 'right',
                }}>
                  {parseFloat(styles.opacity || '1').toFixed(2)}
                </div>
              </div>
              <CompactSelect
                label="Cursor"
                value={styles.cursor || 'auto'}
                options={CURSOR_OPTIONS}
                onChange={(v) => onStyleChange('cursor', v)}
              />
            </PropertyGroup>
          </>
        )}
      </div>
    </div>
  );
}
