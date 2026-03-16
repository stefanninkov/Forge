import { useState } from 'react';
import { Layers, ListChecks, Gauge, ArrowRight, ArrowLeft, X } from 'lucide-react';

const STORAGE_KEY = 'forge-onboarded';

interface WelcomeDialogProps {
  onCreateProject: () => void;
}

const steps = [
  {
    icon: Layers,
    title: 'Create a Project',
    description:
      'Link a Webflow site to start managing it with Forge. Each project tracks setup, templates, animations, and audits in one place.',
  },
  {
    icon: ListChecks,
    title: 'Run Setup Wizard',
    description:
      'Walk through SEO, performance, and design system settings step by step. Forge auto-configures what it can and guides you through the rest.',
  },
  {
    icon: Gauge,
    title: 'Audit & Optimize',
    description:
      'Run speed, SEO, and AEO audits against your live or staging site. Get prioritized recommendations with one-click fixes where possible.',
  },
] as const;

export function WelcomeDialog({ onCreateProject }: WelcomeDialogProps) {
  const [visible, setVisible] = useState(() => {
    return !localStorage.getItem(STORAGE_KEY);
  });
  const [currentStep, setCurrentStep] = useState(0);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  function handleStart() {
    dismiss();
    onCreateProject();
  }

  function handleNext() {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  }

  function handlePrev() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;

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
          maxWidth: 440,
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
              Get up and running in three steps.
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Close"
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

        {/* Step indicator */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '16px 24px 0',
          }}
        >
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 2,
                borderRadius: 1,
                backgroundColor:
                  i <= currentStep
                    ? 'var(--accent)'
                    : 'var(--border-default)',
                transition: 'background-color 200ms ease',
              }}
            />
          ))}
        </div>

        {/* Step content */}
        <div style={{ padding: '24px 24px 20px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 16,
              minHeight: 160,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={22} />
            </div>
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 500,
                    color: 'var(--accent-text)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Step {currentStep + 1}
                </span>
                <span
                  style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {step.title}
                </span>
              </div>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--leading-normal)',
                  maxWidth: 340,
                  margin: '0 auto',
                }}
              >
                {step.description}
              </p>
            </div>
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
          {/* Left side: skip or back */}
          {currentStep === 0 ? (
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
                transition: 'background-color var(--duration-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Skip
            </button>
          ) : (
            <button
              onClick={handlePrev}
              className="flex items-center"
              style={{
                height: 36,
                padding: '0 14px',
                gap: 6,
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
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
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          )}

          {/* Right side: next or create */}
          {isLastStep ? (
            <button
              onClick={handleStart}
              className="flex items-center"
              style={{
                height: 36,
                padding: '0 16px',
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
              <span>Create Your First Project</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center"
              style={{
                height: 36,
                padding: '0 16px',
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
              <span>Next</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
