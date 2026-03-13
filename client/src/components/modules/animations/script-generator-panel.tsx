import { useState, useCallback } from 'react';
import { X, Copy, Check, Code, Settings2, Loader2 } from 'lucide-react';
import { useProjects } from '@/hooks/use-projects';
import {
  useProjectAnimationConfig,
  useUpdateProjectAnimationConfig,
  useGenerateMasterScript,
} from '@/hooks/use-animations';

export interface ScriptGeneratorPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ScriptGeneratorPanel({ open, onClose }: ScriptGeneratorPanelProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: projects } = useProjects();
  const { data: animConfig } = useProjectAnimationConfig(selectedProjectId);
  const updateConfig = useUpdateProjectAnimationConfig(selectedProjectId);
  const generateScript = useGenerateMasterScript(selectedProjectId);

  // Auto-select first project
  if (!selectedProjectId && projects && projects.length > 0) {
    setSelectedProjectId(projects[0].id);
  }

  const handleGenerate = useCallback(() => {
    if (!selectedProjectId) return;
    generateScript.mutate();
  }, [selectedProjectId, generateScript]);

  const handleCopy = useCallback(() => {
    if (!generateScript.data) return;
    navigator.clipboard.writeText(generateScript.data.script);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [generateScript.data]);

  const handleToggleLenis = useCallback(() => {
    if (!animConfig) return;
    updateConfig.mutate({
      ...animConfig,
      useLenis: !animConfig.useLenis,
    });
  }, [animConfig, updateConfig]);

  const handleToggleEmbedMode = useCallback(
    (mode: 'inline' | 'cdn') => {
      if (!animConfig) return;
      updateConfig.mutate({
        ...animConfig,
        embedMode: mode,
      });
    },
    [animConfig, updateConfig],
  );

  if (!open) return null;

  const config = animConfig ?? { useLenis: false, embedMode: 'inline' as const };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          backgroundColor: 'rgba(0,0,0,0.2)',
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '55%',
          minWidth: 520,
          maxWidth: 800,
          zIndex: 50,
          backgroundColor: 'var(--bg-primary)',
          borderLeft: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 200ms ease-out',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <div className="flex items-center" style={{ gap: 8 }}>
            <Code size={16} style={{ color: 'var(--accent)' }} />
            <h2
              style={{
                fontSize: 'var(--text-md)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              Master Script Generator
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center border-none bg-transparent cursor-pointer"
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-tertiary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: 20 }}>
          {/* Project selector */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: 6,
              }}
            >
              Project
            </label>
            <select
              value={selectedProjectId ?? ''}
              onChange={(e) => setSelectedProjectId(e.target.value || null)}
              style={{
                width: '100%',
                height: 36,
                padding: '0 28px 0 12px',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-base)',
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
              }}
            >
              {!projects || projects.length === 0 ? (
                <option value="">No projects</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Config options */}
          <div
            style={{
              padding: 16,
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 20,
            }}
          >
            <div className="flex items-center" style={{ gap: 6, marginBottom: 14 }}>
              <Settings2 size={14} style={{ color: 'var(--text-secondary)' }} />
              <span
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                Script Options
              </span>
            </div>

            {/* Lenis toggle */}
            <div
              className="flex items-center justify-between"
              style={{ marginBottom: 12 }}
            >
              <div>
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                  }}
                >
                  Lenis Smooth Scroll
                </span>
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-tertiary)',
                    margin: '2px 0 0',
                  }}
                >
                  Sync Lenis with GSAP ScrollTrigger
                </p>
              </div>
              <button
                onClick={handleToggleLenis}
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: config.useLenis
                    ? 'var(--accent)'
                    : 'var(--border-strong)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background-color var(--duration-fast)',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: config.useLenis ? 18 : 2,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    transition: 'left var(--duration-fast)',
                  }}
                />
              </button>
            </div>

            {/* Embed mode */}
            <div>
              <span
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                }}
              >
                Deployment
              </span>
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)',
                  margin: '2px 0 8px',
                }}
              >
                How the script is added to Webflow
              </p>
              <div className="flex items-center" style={{ gap: 6 }}>
                <button
                  onClick={() => handleToggleEmbedMode('inline')}
                  style={{
                    height: 32,
                    padding: '0 12px',
                    border: '1px solid',
                    borderColor:
                      config.embedMode === 'inline'
                        ? 'var(--accent)'
                        : 'var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor:
                      config.embedMode === 'inline'
                        ? 'var(--accent-subtle)'
                        : 'transparent',
                    color:
                      config.embedMode === 'inline'
                        ? 'var(--accent-text)'
                        : 'var(--text-secondary)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Inline Embed
                </button>
                <button
                  onClick={() => handleToggleEmbedMode('cdn')}
                  style={{
                    height: 32,
                    padding: '0 12px',
                    border: '1px solid',
                    borderColor:
                      config.embedMode === 'cdn'
                        ? 'var(--accent)'
                        : 'var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor:
                      config.embedMode === 'cdn'
                        ? 'var(--accent-subtle)'
                        : 'transparent',
                    color:
                      config.embedMode === 'cdn'
                        ? 'var(--accent-text)'
                        : 'var(--text-secondary)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  CDN Hosted
                </button>
              </div>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!selectedProjectId || generateScript.isPending}
            className="flex items-center justify-center"
            style={{
              gap: 6,
              width: '100%',
              height: 40,
              border: 'none',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent)',
              color: '#fff',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor:
                !selectedProjectId || generateScript.isPending
                  ? 'not-allowed'
                  : 'pointer',
              opacity: !selectedProjectId ? 0.5 : 1,
              fontFamily: 'var(--font-sans)',
              marginBottom: 20,
            }}
            onMouseEnter={(e) => {
              if (selectedProjectId && !generateScript.isPending) {
                e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent)';
            }}
          >
            {generateScript.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Code size={14} />
                Generate Master Script
              </>
            )}
          </button>

          {/* Generated script output */}
          {generateScript.data && (
            <div>
              {/* Stats */}
              <div
                className="flex items-center"
                style={{
                  gap: 16,
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 12,
                }}
              >
                <Stat
                  label="CSS Animations"
                  value={String(generateScript.data.stats.cssAnimations)}
                />
                <Stat
                  label="GSAP Animations"
                  value={String(generateScript.data.stats.gsapAnimations)}
                />
                <Stat label="Size" value={generateScript.data.stats.totalSize} />
              </div>

              {/* Code viewer */}
              <div
                style={{
                  position: 'relative',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="flex items-center justify-between"
                  style={{
                    padding: '6px 12px',
                    borderBottom: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-secondary)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    forge-animations.js
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center border-none bg-transparent cursor-pointer"
                    style={{
                      gap: 4,
                      height: 24,
                      padding: '0 6px',
                      borderRadius: 'var(--radius-sm)',
                      color: copied ? 'var(--success)' : 'var(--text-tertiary)',
                      fontSize: 'var(--text-xs)',
                      fontFamily: 'var(--font-sans)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        'var(--surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: 16,
                    backgroundColor: 'var(--bg-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    lineHeight: 1.6,
                    color: 'var(--text-primary)',
                    overflowX: 'auto',
                    maxHeight: 400,
                    tabSize: 2,
                  }}
                >
                  <code>{generateScript.data.script}</code>
                </pre>
              </div>

              {/* Deployment instruction */}
              <div
                style={{
                  marginTop: 12,
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--leading-normal)',
                }}
              >
                {config.embedMode === 'inline' ? (
                  <>
                    Paste this script into your Webflow project's{' '}
                    <strong>Custom Code → Footer Code</strong> section (Project
                    Settings → Custom Code).
                  </>
                ) : (
                  <>
                    Host this file on your CDN and add a{' '}
                    <code
                      style={{
                        fontFamily: 'var(--font-mono)',
                        backgroundColor: 'var(--bg-tertiary)',
                        padding: '1px 4px',
                        borderRadius: 2,
                      }}
                    >
                      {'<script>'}
                    </code>{' '}
                    tag in your Webflow project's footer.
                  </>
                )}
              </div>
            </div>
          )}

          {/* Error state */}
          {generateScript.error && (
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'rgba(220, 38, 38, 0.06)',
                border: '1px solid rgba(220, 38, 38, 0.2)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-xs)',
                color: 'var(--error)',
              }}
            >
              Failed to generate script. Ensure the server is running.
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

// ── Stat helper ──

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span
        style={{
          display: 'block',
          fontSize: '10px',
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 2,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-primary)',
        }}
      >
        {value}
      </span>
    </div>
  );
}
