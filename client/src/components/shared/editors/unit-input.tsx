import { useState, useRef, useEffect, useCallback } from 'react';

export type CSSUnit = 'px' | 'rem' | 'em' | '%' | 'vw' | 'vh' | 'auto' | 'none' | 's' | 'ms';

export interface UnitInputProps {
  value: number;
  unit: CSSUnit;
  onChange: (value: number, unit: CSSUnit) => void;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  baseFontSize?: number;
  allowedUnits?: CSSUnit[];
  disabled?: boolean;
}

export function UnitInput({
  value,
  unit,
  onChange,
  label,
  min,
  max,
  step = 1,
  baseFontSize = 16,
  allowedUnits = ['px', 'rem', 'em'],
  disabled = false,
}: UnitInputProps) {
  const [localValue, setLocalValue] = useState(String(value));
  const [unitOpen, setUnitOpen] = useState(false);
  const [showConvert, setShowConvert] = useState<{ from: CSSUnit; to: CSSUnit; converted: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUnitOpen(false);
      }
    }
    if (unitOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [unitOpen]);

  const convertValue = useCallback((val: number, fromUnit: CSSUnit, toUnit: CSSUnit): number => {
    if (fromUnit === toUnit) return val;

    // Convert to px first
    let px = val;
    if (fromUnit === 'rem') px = val * baseFontSize;
    else if (fromUnit === 'em') px = val * baseFontSize;

    // Convert from px to target
    if (toUnit === 'px') return Math.round(px * 100) / 100;
    if (toUnit === 'rem') return Math.round((px / baseFontSize) * 1000) / 1000;
    if (toUnit === 'em') return Math.round((px / baseFontSize) * 1000) / 1000;

    return val;
  }, [baseFontSize]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleInputBlur = () => {
    const num = parseFloat(localValue);
    if (!isNaN(num)) {
      const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, num));
      onChange(clamped, unit);
      setLocalValue(String(clamped));
    } else {
      setLocalValue(String(value));
    }
    setShowConvert(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const num = parseFloat(localValue) || 0;
      const delta = e.key === 'ArrowUp' ? step : -step;
      const multiplier = e.shiftKey ? 10 : 1;
      const newVal = Math.round((num + delta * multiplier) * 1000) / 1000;
      const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, newVal));
      setLocalValue(String(clamped));
      onChange(clamped, unit);
    }
  };

  const handleUnitChange = (newUnit: CSSUnit) => {
    setUnitOpen(false);
    if (newUnit === unit) return;

    const num = parseFloat(localValue);
    if (!isNaN(num) && (unit === 'px' || unit === 'rem' || unit === 'em') && (newUnit === 'px' || newUnit === 'rem' || newUnit === 'em')) {
      const converted = convertValue(num, unit, newUnit);
      setShowConvert({ from: unit, to: newUnit, converted });
    } else {
      onChange(parseFloat(localValue) || 0, newUnit);
    }
  };

  const handleConvert = () => {
    if (showConvert) {
      onChange(showConvert.converted, showConvert.to);
      setLocalValue(String(showConvert.converted));
      setShowConvert(null);
    }
  };

  const handleKeepValue = () => {
    if (showConvert) {
      onChange(parseFloat(localValue) || 0, showConvert.to);
      setShowConvert(null);
    }
  };

  const height = 32;

  return (
    <div style={{ position: 'relative' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            color: 'var(--text-tertiary)',
            marginBottom: 4,
            fontFamily: 'var(--font-sans)',
          }}
        >
          {label}
        </label>
      )}
      <div
        style={{
          display: 'flex',
          height,
          border: '1px solid var(--border-default)',
          borderRadius: 6,
          overflow: 'hidden',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          style={{
            flex: 1,
            minWidth: 0,
            height: '100%',
            padding: '0 8px',
            border: 'none',
            outline: 'none',
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-primary)',
            backgroundColor: 'transparent',
            textAlign: 'right',
          }}
        />
        {allowedUnits.length > 1 ? (
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => !disabled && setUnitOpen(!unitOpen)}
              disabled={disabled}
              style={{
                height: '100%',
                padding: '0 6px',
                minWidth: 32,
                border: 'none',
                borderLeft: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-mono)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                transition: 'color var(--duration-fast)',
              }}
              onMouseEnter={(e) => {
                if (!disabled) e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {unit}
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                <path d="M1 3l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </button>
            {unitOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 4,
                  minWidth: 64,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 6,
                  boxShadow: 'var(--shadow-elevated)',
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                {allowedUnits.map((u) => (
                  <button
                    key={u}
                    onClick={() => handleUnitChange(u)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      height: 28,
                      padding: '0 8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: u === unit ? 'var(--accent-text)' : 'var(--text-secondary)',
                      fontSize: 'var(--text-xs)',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      transition: 'background-color var(--duration-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span>{u}</span>
                    {u === unit && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ color: 'var(--accent-text)' }}>
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              height: '100%',
              padding: '0 6px',
              minWidth: 28,
              borderLeft: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-tertiary)',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unit}
          </div>
        )}
      </div>
      {showConvert && (
        <div
          style={{
            marginTop: 4,
            padding: '6px 10px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 4,
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'fadeIn 150ms ease-out',
          }}
        >
          <span>
            Convert {localValue}{showConvert.from} → {showConvert.converted}{showConvert.to}?
          </span>
          <button
            onClick={handleConvert}
            style={{
              border: 'none',
              background: 'none',
              color: 'var(--accent-text)',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              cursor: 'pointer',
              padding: 0,
              fontFamily: 'var(--font-sans)',
            }}
          >
            Convert
          </button>
          <button
            onClick={handleKeepValue}
            style={{
              border: 'none',
              background: 'none',
              color: 'var(--text-tertiary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              cursor: 'pointer',
              padding: 0,
              fontFamily: 'var(--font-sans)',
            }}
          >
            Keep value
          </button>
        </div>
      )}
    </div>
  );
}
