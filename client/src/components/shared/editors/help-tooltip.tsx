import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

export interface HelpTooltipProps {
  text: string;
  guideLink?: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  size?: number;
}

export function HelpTooltip({
  text,
  guideLink,
  position = 'top',
  size = 12,
}: HelpTooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), 200);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  const positionStyles: Record<string, React.CSSProperties> = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8 },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 8 },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8 },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 8 },
  };

  const arrowStyles: Record<string, React.CSSProperties> = {
    top: {
      bottom: -4,
      left: '50%',
      transform: 'translateX(-50%) rotate(45deg)',
    },
    right: {
      left: -4,
      top: '50%',
      transform: 'translateY(-50%) rotate(45deg)',
    },
    bottom: {
      top: -4,
      left: '50%',
      transform: 'translateX(-50%) rotate(45deg)',
    },
    left: {
      right: -4,
      top: '50%',
      transform: 'translateY(-50%) rotate(45deg)',
    },
  };

  return (
    <span
      ref={triggerRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        cursor: 'help',
      }}
    >
      <HelpCircle
        size={size}
        style={{
          color: 'var(--text-tertiary)',
          transition: 'color var(--duration-fast)',
        }}
        onMouseEnter={(e) => {
          (e.target as SVGElement).style.color = 'var(--text-secondary)';
        }}
        onMouseLeave={(e) => {
          (e.target as SVGElement).style.color = 'var(--text-tertiary)';
        }}
      />
      {visible && (
        <div
          ref={tooltipRef}
          style={{
            position: 'absolute',
            ...positionStyles[position],
            zIndex: 1000,
            width: 'max-content',
            maxWidth: 280,
            padding: '8px 12px',
            backgroundColor: 'var(--gray-900)',
            color: 'var(--gray-50)',
            fontSize: 12,
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.5,
            borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            pointerEvents: 'auto',
            animation: 'fadeIn 100ms ease-out',
          }}
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setVisible(true);
          }}
          onMouseLeave={hide}
        >
          <div
            style={{
              position: 'absolute',
              width: 8,
              height: 8,
              backgroundColor: 'var(--gray-900)',
              ...arrowStyles[position],
            }}
          />
          <span>{text}</span>
          {guideLink && (
            <a
              href={guideLink}
              style={{
                display: 'block',
                marginTop: 6,
                fontSize: 12,
                color: 'var(--forge-400)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              Learn more →
            </a>
          )}
        </div>
      )}
    </span>
  );
}
