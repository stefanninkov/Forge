import { useState, useMemo } from 'react';
import type { AuditHistoryPoint } from '@/types/audit';

interface ScoreHistoryChartProps {
  data: AuditHistoryPoint[];
  height?: number;
}

function scoreColor(score: number): string {
  if (score >= 90) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

export function ScoreHistoryChart({ data, height = 160 }: ScoreHistoryChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    if (data.length < 2) return null;

    const padding = { top: 20, right: 16, bottom: 28, left: 36 };
    const width = 600;
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    const points = data.map((d, i) => ({
      x: padding.left + (i / (data.length - 1)) * innerW,
      y: padding.top + innerH - (d.score / 100) * innerH,
      score: d.score,
      date: new Date(d.createdAt),
    }));

    // Build SVG path
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    // Y-axis ticks
    const yTicks = [0, 25, 50, 75, 100].map((v) => ({
      value: v,
      y: padding.top + innerH - (v / 100) * innerH,
    }));

    return { points, pathD, yTicks, width, padding, innerW, innerH };
  }, [data, height]);

  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center"
        style={{
          height: 80,
          color: 'var(--text-tertiary)',
          fontSize: 'var(--text-xs)',
        }}
      >
        Run at least 2 audits to see trends.
      </div>
    );
  }

  if (!chartData) return null;

  const hoveredPoint = hoveredIndex !== null ? chartData.points[hoveredIndex] : null;

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${chartData.width} ${height}`}
        style={{ width: '100%', height }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Grid lines */}
        {chartData.yTicks.map((tick) => (
          <g key={tick.value}>
            <line
              x1={chartData.padding.left}
              y1={tick.y}
              x2={chartData.width - chartData.padding.right}
              y2={tick.y}
              stroke="var(--border-default)"
              strokeDasharray="3 3"
              opacity={0.5}
            />
            <text
              x={chartData.padding.left - 6}
              y={tick.y + 4}
              textAnchor="end"
              fill="var(--text-tertiary)"
              fontSize={10}
              fontFamily="var(--font-mono)"
            >
              {tick.value}
            </text>
          </g>
        ))}

        {/* Line */}
        <path
          d={chartData.pathD}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {chartData.points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={hoveredIndex === i ? 5 : 3}
            fill={scoreColor(point.score)}
            stroke="var(--bg-primary)"
            strokeWidth={2}
            style={{ cursor: 'pointer', transition: 'r 100ms ease' }}
            onMouseEnter={() => setHoveredIndex(i)}
          />
        ))}

        {/* Hover hit areas */}
        {chartData.points.map((point, i) => (
          <rect
            key={`hit-${i}`}
            x={point.x - 15}
            y={chartData.padding.top}
            width={30}
            height={chartData.innerH}
            fill="transparent"
            onMouseEnter={() => setHoveredIndex(i)}
          />
        ))}

        {/* X-axis date labels (first and last) */}
        {[chartData.points[0], chartData.points[chartData.points.length - 1]].map(
          (point, i) =>
            point && (
              <text
                key={`date-${i}`}
                x={point.x}
                y={height - 6}
                textAnchor={i === 0 ? 'start' : 'end'}
                fill="var(--text-tertiary)"
                fontSize={10}
                fontFamily="var(--font-mono)"
              >
                {point.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </text>
            ),
        )}
      </svg>

      {/* Tooltip */}
      {hoveredPoint && (
        <div
          style={{
            position: 'absolute',
            left: `${(hoveredPoint.x / chartData.width) * 100}%`,
            top: 0,
            transform: 'translateX(-50%)',
            padding: '4px 8px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          <span style={{ color: scoreColor(hoveredPoint.score), fontWeight: 600 }}>
            {Math.round(hoveredPoint.score)}
          </span>
          <span style={{ color: 'var(--text-tertiary)', marginLeft: 6 }}>
            {hoveredPoint.date.toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
}
