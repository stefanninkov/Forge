import { useState } from 'react';
import { Layers, ListChecks, Gauge, ArrowRight, X } from 'lucide-react';

const STORAGE_KEY = 'forge-onboarded';

interface WelcomeDialogProps {
  onCreateProject: () => void;
}

const steps = [
  {
    icon: Layers,
    title: 'Create a project',
    description: 'Link a Webflow site to start managing it with Forge.',
  },
  {
    icon: ListChecks,
    title: 'Run Setup Wizard',
    description: 'Configure SEO, performance, and design system settings in one pass.',
  },
  {
    icon: Gauge,
    title: 'Audit & optimize',
    description: 'Run speed, SEO, and AEO audits to identify and fix issues.',
  },
];

export function WelcomeDialog({ onCreateProject }: WelcomeDialogProps) {
  const [visible, setVisible] = useState(() => {
    return !localStorage.getItem(STORAGE_KEY);
  });

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  function handleStart() {
    dismiss();
    onCreateProject();
  }

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
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          animation: 'fadeIn 200ms ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 24px 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: 'var(--tracking-tight)',
                marginBottom: 4,
              }}
            >
              Welcome to Forge
            </h2>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
              }}
            >
              Your Webflow development accelerator.
            </p>
          </div>
          <button
            onClick={dismiss}
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
              flexShrink: 0,
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

        {/* Steps */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: 12,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-secondary)',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--accent-subtle)',
                      color: 'var(--accent-text)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 500,
                          color: 'var(--text-tertiary)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {i + 1}
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--text-sm)',
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {step.title}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-secondary)',
                        lineHeight: 'var(--leading-normal)',
                        marginLeft: 20,
                      }}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0 24px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            onClick={dismiss}
            style={{
              height: 36,
              padding: '0 14px',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Skip for now
          </button>
          <button
            onClick={handleStart}
            className="flex items-center"
            style={{
              height: 36,
              padding: '0 14px',
              gap: 6,
              border: 'none',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent)',
              color: '#fff',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'background-color var(--duration-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent)';
            }}
          >
            <span>Create first project</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
