import { useState, useCallback, useRef, useMemo } from 'react';
import {
  Plus, Trash2, Play, Pause, RotateCcw, Copy, GripVertical,
  ChevronRight, Diamond,
} from 'lucide-react';
import { CompactSelect } from './compact-select';
import { HelpTooltip } from './help-tooltip';

// ─── Types ───────────────────────────────────────────────────────

export interface Keyframe {
  id: string;
  offset: number; // 0-1 (percentage of total duration)
  properties: KeyframeProperties;
  ease?: string;
}

export interface KeyframeProperties {
  translateX?: number;
  translateY?: number;
  rotate?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  skewX?: number;
  skewY?: number;
  opacity?: number;
  blur?: number;
  backgroundColor?: string;
  color?: string;
  borderRadius?: number;
  width?: string;
  height?: string;
}

export interface TimelineTrack {
  id: string;
  property: string;
  label: string;
  keyframes: Keyframe[];
  color: string;
}

export interface TimelineEditorProps {
  tracks: TimelineTrack[];
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  onTracksChange: (tracks: TimelineTrack[]) => void;
  onDurationChange: (duration: number) => void;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onReset: () => void;
}

// ─── Constants ───────────────────────────────────────────────────

const TRACK_HEIGHT = 32;
const HEADER_HEIGHT = 28;
const RULER_HEIGHT = 24;
const SIDEBAR_WIDTH = 140;
const MIN_TIMELINE_WIDTH = 400;

const TRACK_COLORS = [
  'var(--forge-400)',
  '#60a5fa',  // blue
  '#f472b6',  // pink
  '#fbbf24',  // yellow
  '#a78bfa',  // purple
  '#fb923c',  // orange
  '#34d399',  // teal
  '#f87171',  // red
];

const PROPERTY_OPTIONS = [
  { value: 'translateX', label: 'Translate X' },
  { value: 'translateY', label: 'Translate Y' },
  { value: 'rotate', label: 'Rotate' },
  { value: 'scale', label: 'Scale' },
  { value: 'opacity', label: 'Opacity' },
  { value: 'blur', label: 'Blur' },
  { value: 'backgroundColor', label: 'Background' },
  { value: 'borderRadius', label: 'Border Radius' },
];

// ─── Component ───────────────────────────────────────────────────

export function TimelineEditor({
  tracks,
  duration,
  currentTime,
  isPlaying,
  onTracksChange,
  onDurationChange,
  onPlayPause,
  onSeek,
  onReset,
}: TimelineEditorProps) {
  const [selectedKeyframe, setSelectedKeyframe] = useState<{ trackId: string; keyframeId: string } | null>(null);
  const [draggingKeyframe, setDraggingKeyframe] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Add a new track
  const addTrack = useCallback(() => {
    const usedProperties = tracks.map((t) => t.property);
    const available = PROPERTY_OPTIONS.find((p) => !usedProperties.includes(p.value));
    if (!available) return;

    const newTrack: TimelineTrack = {
      id: `track-${Date.now()}`,
      property: available.value,
      label: available.label,
      color: TRACK_COLORS[tracks.length % TRACK_COLORS.length],
      keyframes: [
        { id: `kf-${Date.now()}-0`, offset: 0, properties: { [available.value]: getDefaultValue(available.value, 'start') } },
        { id: `kf-${Date.now()}-1`, offset: 1, properties: { [available.value]: getDefaultValue(available.value, 'end') } },
      ],
    };
    onTracksChange([...tracks, newTrack]);
  }, [tracks, onTracksChange]);

  // Remove a track
  const removeTrack = useCallback((trackId: string) => {
    onTracksChange(tracks.filter((t) => t.id !== trackId));
    if (selectedKeyframe?.trackId === trackId) setSelectedKeyframe(null);
  }, [tracks, onTracksChange, selectedKeyframe]);

  // Add keyframe to a track
  const addKeyframe = useCallback((trackId: string) => {
    onTracksChange(
      tracks.map((t) => {
        if (t.id !== trackId) return t;
        const offset = currentTime / duration;
        const newKf: Keyframe = {
          id: `kf-${Date.now()}`,
          offset: Math.max(0, Math.min(1, offset)),
          properties: { [t.property]: getInterpolatedValue(t, offset) },
        };
        const sorted = [...t.keyframes, newKf].sort((a, b) => a.offset - b.offset);
        return { ...t, keyframes: sorted };
      }),
    );
  }, [tracks, onTracksChange, currentTime, duration]);

  // Update keyframe offset (drag)
  const updateKeyframeOffset = useCallback((trackId: string, keyframeId: string, newOffset: number) => {
    onTracksChange(
      tracks.map((t) => {
        if (t.id !== trackId) return t;
        return {
          ...t,
          keyframes: t.keyframes
            .map((kf) => kf.id === keyframeId ? { ...kf, offset: Math.max(0, Math.min(1, newOffset)) } : kf)
            .sort((a, b) => a.offset - b.offset),
        };
      }),
    );
  }, [tracks, onTracksChange]);

  // Update keyframe property value
  const updateKeyframeValue = useCallback((trackId: string, keyframeId: string, value: number | string) => {
    onTracksChange(
      tracks.map((t) => {
        if (t.id !== trackId) return t;
        return {
          ...t,
          keyframes: t.keyframes.map((kf) =>
            kf.id === keyframeId ? { ...kf, properties: { ...kf.properties, [t.property]: value } } : kf,
          ),
        };
      }),
    );
  }, [tracks, onTracksChange]);

  // Delete selected keyframe
  const deleteKeyframe = useCallback(() => {
    if (!selectedKeyframe) return;
    onTracksChange(
      tracks.map((t) => {
        if (t.id !== selectedKeyframe.trackId) return t;
        if (t.keyframes.length <= 2) return t; // keep at least 2
        return { ...t, keyframes: t.keyframes.filter((kf) => kf.id !== selectedKeyframe.keyframeId) };
      }),
    );
    setSelectedKeyframe(null);
  }, [selectedKeyframe, tracks, onTracksChange]);

  // Handle click on timeline to seek
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    onSeek(Math.max(0, Math.min(duration, ratio * duration)));
  }, [duration, onSeek]);

  // Handle keyframe drag
  const handleKeyframeDrag = useCallback((e: React.MouseEvent, trackId: string, keyframeId: string) => {
    e.stopPropagation();
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();

    const handleMove = (me: MouseEvent) => {
      const x = me.clientX - rect.left;
      const ratio = x / rect.width;
      updateKeyframeOffset(trackId, keyframeId, ratio);
    };

    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      setDraggingKeyframe(null);
    };

    setDraggingKeyframe(keyframeId);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [updateKeyframeOffset]);

  // Generate time markers
  const timeMarkers = useMemo(() => {
    const markers: number[] = [];
    const interval = duration <= 1 ? 0.1 : duration <= 3 ? 0.25 : 0.5;
    for (let t = 0; t <= duration; t += interval) {
      markers.push(Math.round(t * 1000) / 1000);
    }
    return markers;
  }, [duration]);

  const playheadPosition = (currentTime / duration) * 100;

  // Selected keyframe details
  const selectedKfData = useMemo(() => {
    if (!selectedKeyframe) return null;
    const track = tracks.find((t) => t.id === selectedKeyframe.trackId);
    if (!track) return null;
    const kf = track.keyframes.find((k) => k.id === selectedKeyframe.keyframeId);
    if (!kf) return null;
    return { track, keyframe: kf };
  }, [selectedKeyframe, tracks]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden', backgroundColor: 'var(--bg-secondary)' }}>
      {/* Transport Controls */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px', borderBottom: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-elevated)',
        }}
      >
        <button onClick={onReset} style={transportBtnStyle} title="Reset">
          <RotateCcw size={14} />
        </button>
        <button onClick={onPlayPause} style={{ ...transportBtnStyle, backgroundColor: isPlaying ? 'var(--accent)' : 'transparent', color: isPlaying ? 'var(--text-on-accent)' : 'var(--text-secondary)' }}>
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
          <span>{currentTime.toFixed(2)}</span>
          <span style={{ color: 'var(--text-tertiary)' }}>/</span>
          <span style={{ color: 'var(--text-tertiary)' }}>{duration.toFixed(2)}s</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Duration</label>
          <input
            type="number"
            value={duration}
            min={0.1}
            max={10}
            step={0.1}
            onChange={(e) => onDurationChange(parseFloat(e.target.value) || 1)}
            style={{
              width: 52, height: 24, padding: '0 4px', textAlign: 'right',
              border: '1px solid var(--border-default)', borderRadius: 4,
              fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)', backgroundColor: 'transparent',
            }}
          />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>s</span>
        </div>
        <button onClick={addTrack} style={{ ...transportBtnStyle, gap: 4 }} title="Add Track">
          <Plus size={12} />
          <span style={{ fontSize: 'var(--text-xs)' }}>Track</span>
        </button>
      </div>

      {/* Timeline Body */}
      <div style={{ display: 'flex', minHeight: tracks.length * TRACK_HEIGHT + RULER_HEIGHT + 16 }}>
        {/* Track Labels Sidebar */}
        <div style={{ width: SIDEBAR_WIDTH, flexShrink: 0, borderRight: '1px solid var(--border-default)' }}>
          {/* Ruler spacer */}
          <div style={{ height: RULER_HEIGHT, borderBottom: '1px solid var(--border-default)' }} />
          {/* Track labels */}
          {tracks.map((track) => (
            <div
              key={track.id}
              style={{
                display: 'flex', alignItems: 'center', height: TRACK_HEIGHT,
                padding: '0 8px', gap: 6,
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: track.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {track.label}
              </span>
              <button
                onClick={() => removeTrack(track.id)}
                style={{ ...transportBtnStyle, width: 20, height: 20, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>

        {/* Timeline Area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }} ref={timelineRef}>
          {/* Time Ruler */}
          <div
            style={{
              height: RULER_HEIGHT, borderBottom: '1px solid var(--border-default)',
              position: 'relative', cursor: 'pointer',
            }}
            onClick={handleTimelineClick}
          >
            {timeMarkers.map((t) => {
              const left = (t / duration) * 100;
              return (
                <div
                  key={t}
                  style={{
                    position: 'absolute', left: `${left}%`,
                    top: 0, height: '100%', display: 'flex', flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ width: 1, height: 6, backgroundColor: 'var(--border-default)' }} />
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginTop: 1 }}>
                    {t.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Tracks */}
          {tracks.map((track) => (
            <div
              key={track.id}
              style={{
                height: TRACK_HEIGHT, position: 'relative',
                borderBottom: '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
              onClick={(e) => {
                // clicking empty space on track = add keyframe at this position
              }}
              onDoubleClick={(e) => {
                addKeyframe(track.id);
              }}
            >
              {/* Track line */}
              <div
                style={{
                  position: 'absolute', top: '50%', left: 0, right: 0,
                  height: 2, backgroundColor: track.color, opacity: 0.3,
                  transform: 'translateY(-50%)',
                }}
              />
              {/* Keyframes */}
              {track.keyframes.map((kf) => {
                const left = kf.offset * 100;
                const isSelected = selectedKeyframe?.keyframeId === kf.id;
                return (
                  <div
                    key={kf.id}
                    style={{
                      position: 'absolute',
                      left: `${left}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%) rotate(45deg)',
                      width: isSelected ? 12 : 10,
                      height: isSelected ? 12 : 10,
                      backgroundColor: isSelected ? track.color : 'var(--bg-elevated)',
                      border: `2px solid ${track.color}`,
                      borderRadius: 2,
                      cursor: draggingKeyframe === kf.id ? 'grabbing' : 'grab',
                      zIndex: isSelected ? 10 : 1,
                      transition: draggingKeyframe === kf.id ? 'none' : 'all var(--duration-fast)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedKeyframe({ trackId: track.id, keyframeId: kf.id });
                    }}
                    onMouseDown={(e) => handleKeyframeDrag(e, track.id, kf.id)}
                  />
                );
              })}
            </div>
          ))}

          {/* Playhead */}
          <div
            style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${playheadPosition}%`,
              width: 1, backgroundColor: 'var(--accent)',
              zIndex: 20, pointerEvents: 'none',
            }}
          >
            {/* Playhead handle */}
            <div
              style={{
                position: 'absolute', top: 0, left: -4,
                width: 0, height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '6px solid var(--accent)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Keyframe Inspector */}
      {selectedKfData && (
        <div
          style={{
            borderTop: '1px solid var(--border-default)',
            padding: '8px 12px', backgroundColor: 'var(--bg-elevated)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}
        >
          <Diamond size={12} style={{ color: selectedKfData.track.color, transform: 'rotate(45deg)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Offset</label>
            <input
              type="number"
              value={Math.round(selectedKfData.keyframe.offset * 100)}
              min={0}
              max={100}
              step={1}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) updateKeyframeOffset(selectedKfData.track.id, selectedKfData.keyframe.id, v / 100);
              }}
              style={{
                width: 44, height: 24, padding: '0 4px', textAlign: 'right',
                border: '1px solid var(--border-default)', borderRadius: 4,
                fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)', backgroundColor: 'transparent',
              }}
            />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{selectedKfData.track.label}</label>
            <input
              type="number"
              value={selectedKfData.keyframe.properties[selectedKfData.track.property as keyof KeyframeProperties] as number ?? 0}
              step={selectedKfData.track.property === 'opacity' ? 0.01 : selectedKfData.track.property === 'scale' ? 0.01 : 1}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) updateKeyframeValue(selectedKfData.track.id, selectedKfData.keyframe.id, v);
              }}
              style={{
                width: 56, height: 24, padding: '0 4px', textAlign: 'right',
                border: '1px solid var(--border-default)', borderRadius: 4,
                fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)', backgroundColor: 'transparent',
              }}
            />
          </div>
          <div style={{ flex: 1 }} />
          <button
            onClick={deleteKeyframe}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              height: 24, padding: '0 8px', border: 'none',
              borderRadius: 4, backgroundColor: 'transparent',
              fontSize: 'var(--text-xs)', color: 'var(--status-error)',
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}
          >
            <Trash2 size={10} />
            Delete
          </button>
        </div>
      )}

      {/* Empty state */}
      {tracks.length === 0 && (
        <div
          style={{
            padding: '24px 16px', textAlign: 'center',
            fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)',
          }}
        >
          No tracks yet. Click "+ Track" to add an animated property.
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────

function getDefaultValue(property: string, position: 'start' | 'end'): number {
  const defaults: Record<string, { start: number; end: number }> = {
    translateX: { start: -30, end: 0 },
    translateY: { start: 30, end: 0 },
    rotate: { start: -10, end: 0 },
    scale: { start: 0.9, end: 1 },
    opacity: { start: 0, end: 1 },
    blur: { start: 10, end: 0 },
    borderRadius: { start: 0, end: 8 },
  };
  return defaults[property]?.[position] ?? 0;
}

function getInterpolatedValue(track: TimelineTrack, offset: number): number {
  const kfs = track.keyframes;
  if (kfs.length === 0) return 0;
  if (kfs.length === 1) return kfs[0].properties[track.property as keyof KeyframeProperties] as number ?? 0;

  let before = kfs[0];
  let after = kfs[kfs.length - 1];

  for (let i = 0; i < kfs.length - 1; i++) {
    if (offset >= kfs[i].offset && offset <= kfs[i + 1].offset) {
      before = kfs[i];
      after = kfs[i + 1];
      break;
    }
  }

  const range = after.offset - before.offset;
  if (range === 0) return before.properties[track.property as keyof KeyframeProperties] as number ?? 0;

  const t = (offset - before.offset) / range;
  const startVal = before.properties[track.property as keyof KeyframeProperties] as number ?? 0;
  const endVal = after.properties[track.property as keyof KeyframeProperties] as number ?? 0;

  return startVal + (endVal - startVal) * t;
}

// ─── Shared Styles ───────────────────────────────────────────────

const transportBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4,
  height: 28, padding: '0 8px', border: 'none',
  borderRadius: 4, backgroundColor: 'transparent',
  color: 'var(--text-secondary)', cursor: 'pointer',
  fontSize: 'var(--text-xs)', fontFamily: 'var(--font-sans)',
  transition: 'all var(--duration-fast)',
};
