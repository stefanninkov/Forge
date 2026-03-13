import { useState, useRef, useEffect, useCallback } from 'react';

export interface ColorPickerProps {
  value: string;
  opacity?: number;
  label?: string;
  onChange: (color: string, opacity?: number) => void;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function ColorPicker({ value, opacity = 1, label, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [opacityValue, setOpacityValue] = useState(String(Math.round(opacity * 100)));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setInputValue(value); }, [value]);
  useEffect(() => { setOpacityValue(String(Math.round(opacity * 100))); }, [opacity]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      onChange(val, opacity);
    }
  }, [onChange, opacity]);

  const handleOpacityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setOpacityValue(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      onChange(value, num / 100);
    }
  }, [onChange, value]);

  const handleNativeColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setInputValue(newColor);
    onChange(newColor, opacity);
  }, [onChange, opacity]);

  const hsl = hexToHsl(value);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: 'var(--text-xs)',
          fontWeight: 500,
          color: 'var(--text-tertiary)',
          marginBottom: 4,
        }}>
          {label}
        </label>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            width: 20, height: 20, borderRadius: 4,
            border: '1px solid var(--border-default)',
            backgroundColor: value,
            cursor: 'pointer', padding: 0, flexShrink: 0, opacity,
          }}
          aria-label="Pick color"
        />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          style={{
            flex: 1, minWidth: 0, height: 28, padding: '0 8px',
            border: '1px solid var(--border-default)', borderRadius: 4,
            fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)',
            color: 'var(--text-primary)', backgroundColor: 'transparent',
          }}
        />
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4, width: 220,
          backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 8, boxShadow: 'var(--shadow-elevated)', zIndex: 100, padding: 12,
        }}>
          <input
            type="color"
            value={value}
            onChange={handleNativeColorChange}
            style={{
              width: '100%', height: 120, border: 'none', borderRadius: 4,
              cursor: 'pointer', padding: 0, backgroundColor: 'transparent',
            }}
          />
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Hex</label>
              <input
                type="text" value={inputValue} onChange={handleInputChange}
                style={{
                  width: '100%', height: 28, padding: '0 6px',
                  border: '1px solid var(--border-default)', borderRadius: 4,
                  fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)', backgroundColor: 'transparent', marginTop: 2,
                }}
              />
            </div>
            <div style={{ width: 56 }}>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Opacity</label>
              <input
                type="text" value={opacityValue} onChange={handleOpacityChange}
                style={{
                  width: '100%', height: 28, padding: '0 6px',
                  border: '1px solid var(--border-default)', borderRadius: 4,
                  fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)', backgroundColor: 'transparent',
                  textAlign: 'right', marginTop: 2,
                }}
              />
            </div>
          </div>
          <div style={{
            marginTop: 8, fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)',
          }}>
            HSL: {hsl.h}° {hsl.s}% {hsl.l}%
          </div>
        </div>
      )}
    </div>
  );
}
