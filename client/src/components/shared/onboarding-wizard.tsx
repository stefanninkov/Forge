import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Check, Layers, Brain, Globe, Loader2, ExternalLink,
} from 'lucide-react';
import { useTokenVault, useAddToken } from '@/hooks/use-integrations';
import { useCreateProject } from '@/hooks/use-projects';
import { useWebflowSites } from '@/hooks/use-webflow-push';
import { updateDocument } from '@/lib/firestore';
import type { Provider, TokenEntry } from '@/types/integration';

/* ─── Step indicator ─── */
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center" style={{ gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === current
              ? 'var(--accent)'
              : i < current
                ? 'var(--accent)'
                : 'var(--border-default)',
            opacity: i < current ? 0.4 : 1,
            transition: 'all 300ms ease',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Step 1: Welcome ─── */
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div
      className="flex flex-col items-center"
      style={{ textAlign: 'center', animation: 'fadeIn 300ms ease-out' }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--accent-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}
      >
        <Layers size={28} style={{ color: 'var(--accent-text)' }} />
      </div>
      <h1
        style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: '0 0 8px',
        }}
      >
        Welcome to Forge
      </h1>
      <p
        style={{
          fontSize: 'var(--text-base)',
          color: 'var(--text-secondary)',
          margin: '0 0 32px',
          maxWidth: 360,
          lineHeight: 'var(--leading-normal)',
        }}
      >
        The fastest way to go from Figma to Webflow.
      </p>
      <button
        onClick={onNext}
        className="flex items-center border-none cursor-pointer"
        style={{
          height: 40,
          padding: '0 24px',
          gap: 8,
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--accent)',
          color: '#fff',
          fontSize: 'var(--text-base)',
          fontWeight: 500,
          fontFamily: 'var(--font-sans)',
          transition: 'background-color var(--duration-fast)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
      >
        Get Started
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

/* ─── Token input row for Step 2 ─── */
interface ProviderRowConfig {
  provider: Provider;
  name: string;
  icon: typeof Layers;
  description: string;
  placeholder: string;
  guideUrl: string;
  required: boolean;
}

const PROVIDER_ROWS: ProviderRowConfig[] = [
  {
    provider: 'figma',
    name: 'Figma',
    icon: Layers,
    description: 'Import your design structures',
    placeholder: 'figd_...',
    guideUrl: 'https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens',
    required: true,
  },
  {
    provider: 'webflow',
    name: 'Webflow',
    icon: Globe,
    description: 'Push elements to your live site',
    placeholder: 'wf_...',
    guideUrl: 'https://developers.webflow.com/data/docs/getting-started-with-apps',
    required: true,
  },
  {
    provider: 'anthropic',
    name: 'Anthropic (Claude AI)',
    icon: Brain,
    description: 'AI-powered class naming and suggestions',
    placeholder: 'sk-ant-...',
    guideUrl: 'https://console.anthropic.com/',
    required: false,
  },
];

function ProviderRow({
  config,
  savedToken,
  onSave,
  isSaving,
}: {
  config: ProviderRowConfig;
  savedToken: TokenEntry | null;
  onSave: (label: string, token: string) => void;
  isSaving: boolean;
}) {
  const [label, setLabel] = useState('');
  const [token, setToken] = useState('');
  const Icon = config.icon;
  const isSaved = !!savedToken;

  const handleSave = () => {
    const trimmedToken = token.trim();
    if (!trimmedToken) return;
    onSave(label.trim() || `My ${config.name}`, trimmedToken);
    setLabel('');
    setToken('');
  };

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${isSaved ? 'var(--accent)' : 'var(--border-default)'}`,
        backgroundColor: isSaved ? 'var(--accent-subtle)' : 'var(--bg-primary)',
        transition: 'all 200ms ease',
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: isSaved ? 0 : 12 }}>
        <div className="flex items-center" style={{ gap: 10 }}>
          <Icon size={18} style={{ color: isSaved ? 'var(--accent-text)' : 'var(--text-secondary)' }} />
          <div>
            <div className="flex items-center" style={{ gap: 8 }}>
              <span
                style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                }}
              >
                {config.name}
              </span>
              {config.required && !isSaved && (
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 500,
                    color: 'var(--error)',
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)',
                  }}
                >
                  Required
                </span>
              )}
            </div>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
              {config.description}
            </span>
          </div>
        </div>

        {isSaved && (
          <div className="flex items-center" style={{ gap: 6, color: 'var(--accent)' }}>
            <Check size={16} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
              {savedToken.label}
            </span>
          </div>
        )}
      </div>

      {!isSaved && (
        <div className="flex flex-col" style={{ gap: 8 }}>
          <div className="flex" style={{ gap: 8 }}>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`My ${config.name}`}
              style={{
                width: 160,
                height: 36,
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-primary)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                flexShrink: 0,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-subtle)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={config.placeholder}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              style={{
                flex: 1,
                height: 36,
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-primary)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-subtle)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={handleSave}
              disabled={!token.trim() || isSaving}
              className="cursor-pointer border-none"
              style={{
                height: 36,
                padding: '0 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
                opacity: !token.trim() || isSaving ? 0.5 : 1,
                flexShrink: 0,
              }}
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
            </button>
          </div>
          <a
            href={config.guideUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center"
            style={{
              gap: 4,
              fontSize: 'var(--text-xs)',
              color: 'var(--accent-text)',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
          >
            How to get this token
            <ExternalLink size={10} />
          </a>
        </div>
      )}
    </div>
  );
}

/* ─── Step 2: Connect Tools ─── */
function ConnectToolsStep({ onNext }: { onNext: () => void }) {
  const { data: vault } = useTokenVault();
  const addToken = useAddToken();

  const figmaToken = vault?.figma?.[0] ?? null;
  const webflowToken = vault?.webflow?.[0] ?? null;
  const anthropicToken = vault?.anthropic?.[0] ?? null;

  const canContinue = !!figmaToken && !!webflowToken;

  const handleSave = useCallback(
    (provider: Provider, label: string, token: string) => {
      addToken.mutate({ provider, label, token });
    },
    [addToken],
  );

  return (
    <div style={{ animation: 'fadeIn 300ms ease-out', width: '100%', maxWidth: 520 }}>
      <h2
        style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: '0 0 4px',
        }}
      >
        Connect your tools
      </h2>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          margin: '0 0 20px',
        }}
      >
        Add API tokens for the services Forge connects to.
      </p>

      <div className="flex flex-col" style={{ gap: 10, marginBottom: 24 }}>
        {PROVIDER_ROWS.map((config) => {
          const saved = config.provider === 'figma'
            ? figmaToken
            : config.provider === 'webflow'
              ? webflowToken
              : anthropicToken;
          return (
            <ProviderRow
              key={config.provider}
              config={config}
              savedToken={saved}
              onSave={(label, token) => handleSave(config.provider, label, token)}
              isSaving={addToken.isPending}
            />
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!canContinue}
          className="flex items-center border-none cursor-pointer"
          style={{
            height: 40,
            padding: '0 24px',
            gap: 8,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--accent)',
            color: '#fff',
            fontSize: 'var(--text-base)',
            fontWeight: 500,
            fontFamily: 'var(--font-sans)',
            opacity: canContinue ? 1 : 0.4,
            transition: 'all var(--duration-fast)',
          }}
          onMouseEnter={(e) => {
            if (canContinue) e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent)';
          }}
        >
          Continue
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* ─── Step 3: Create Project ─── */
function CreateProjectStep({ onComplete }: { onComplete: (projectId: string) => void }) {
  const { data: vault } = useTokenVault();
  const { data: sites, isLoading: sitesLoading } = useWebflowSites();
  const createProject = useCreateProject();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [figmaTokenId, setFigmaTokenId] = useState('');
  const [webflowTokenId, setWebflowTokenId] = useState('');
  const [webflowSiteId, setWebflowSiteId] = useState('');
  const [anthropicTokenId, setAnthropicTokenId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const figmaTokens = vault?.figma ?? [];
  const webflowTokens = vault?.webflow ?? [];
  const anthropicTokens = vault?.anthropic ?? [];

  // Auto-select first token if only one exists
  if (!figmaTokenId && figmaTokens.length === 1) {
    setFigmaTokenId(figmaTokens[0].id);
  }
  if (!webflowTokenId && webflowTokens.length === 1) {
    setWebflowTokenId(webflowTokens[0].id);
  }

  const canCreate = name.trim() && figmaTokenId && webflowTokenId;

  const handleCreate = async () => {
    if (!canCreate || isCreating) return;
    setIsCreating(true);
    createProject.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: async (data) => {
          // Update project with token IDs and site
          const projectId = data.id;
          await updateDocument('projects', projectId, {
            figmaTokenId,
            webflowTokenId,
            anthropicTokenId: anthropicTokenId || null,
            webflowSiteId: webflowSiteId || null,
          });
          setIsCreating(false);
          onComplete(projectId);
        },
        onError: () => {
          setIsCreating(false);
        },
      },
    );
  };

  return (
    <div style={{ animation: 'fadeIn 300ms ease-out', width: '100%', maxWidth: 480 }}>
      <h2
        style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: '0 0 4px',
        }}
      >
        Create your first project
      </h2>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          margin: '0 0 20px',
        }}
      >
        A project groups everything for one Webflow site.
      </p>

      <div className="flex flex-col" style={{ gap: 14 }}>
        {/* Project name */}
        <FormField label="Project name" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Website Redesign"
            style={inputStyle}
            onFocus={inputFocus}
            onBlur={inputBlur}
          />
        </FormField>

        {/* Description */}
        <FormField label="Description">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional project description"
            style={inputStyle}
            onFocus={inputFocus}
            onBlur={inputBlur}
          />
        </FormField>

        {/* Figma token */}
        <FormField label="Figma token" required>
          <select
            value={figmaTokenId}
            onChange={(e) => setFigmaTokenId(e.target.value)}
            style={selectStyle}
          >
            <option value="">Select token...</option>
            {figmaTokens.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </FormField>

        {/* Webflow token */}
        <FormField label="Webflow token" required>
          <select
            value={webflowTokenId}
            onChange={(e) => setWebflowTokenId(e.target.value)}
            style={selectStyle}
          >
            <option value="">Select token...</option>
            {webflowTokens.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </FormField>

        {/* Webflow site (shown after webflow token selected) */}
        {webflowTokenId && (
          <FormField label="Webflow site">
            <select
              value={webflowSiteId}
              onChange={(e) => setWebflowSiteId(e.target.value)}
              style={selectStyle}
              disabled={sitesLoading}
            >
              <option value="">
                {sitesLoading ? 'Loading sites...' : 'Select site (optional)'}
              </option>
              {sites?.map((s) => (
                <option key={s.id} value={s.id}>{s.displayName || s.shortName}</option>
              ))}
            </select>
          </FormField>
        )}

        {/* Anthropic token */}
        <FormField label="Anthropic (AI)" hint="Optional — enables AI suggestions">
          <select
            value={anthropicTokenId}
            onChange={(e) => setAnthropicTokenId(e.target.value)}
            style={selectStyle}
          >
            <option value="">None</option>
            {anthropicTokens.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="flex justify-end" style={{ marginTop: 24 }}>
        <button
          onClick={handleCreate}
          disabled={!canCreate || isCreating}
          className="flex items-center border-none cursor-pointer"
          style={{
            height: 40,
            padding: '0 24px',
            gap: 8,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--accent)',
            color: '#fff',
            fontSize: 'var(--text-base)',
            fontWeight: 500,
            fontFamily: 'var(--font-sans)',
            opacity: canCreate && !isCreating ? 1 : 0.4,
            transition: 'all var(--duration-fast)',
          }}
          onMouseEnter={(e) => {
            if (canCreate && !isCreating) e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent)';
          }}
        >
          {isCreating ? (
            <><Loader2 size={16} className="animate-spin" /> Creating...</>
          ) : (
            <>Create Project</>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── Step 4: Done ─── */
function DoneStep({ projectId }: { projectId: string }) {
  const navigate = useNavigate();

  return (
    <div
      className="flex flex-col items-center"
      style={{ textAlign: 'center', animation: 'fadeIn 300ms ease-out' }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          animation: 'scaleIn 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <Check size={28} style={{ color: '#fff' }} />
      </div>
      <h2
        style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: '0 0 8px',
        }}
      >
        You&apos;re ready to build.
      </h2>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          margin: '0 0 32px',
        }}
      >
        Your project is set up. Start by configuring your setup checklist.
      </p>
      <button
        onClick={() => navigate(`/setup?project=${projectId}`)}
        className="flex items-center border-none cursor-pointer"
        style={{
          height: 40,
          padding: '0 24px',
          gap: 8,
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--accent)',
          color: '#fff',
          fontSize: 'var(--text-base)',
          fontWeight: 500,
          fontFamily: 'var(--font-sans)',
          transition: 'background-color var(--duration-fast)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
      >
        Open Project
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

/* ─── Shared helpers ─── */
function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center" style={{ gap: 6, marginBottom: 4 }}>
        <label
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </label>
        {required && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--error)', fontWeight: 500 }}>*</span>
        )}
        {hint && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 36,
  padding: '0 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)',
  backgroundColor: 'var(--bg-primary)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  height: 36,
  padding: '0 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)',
  backgroundColor: 'var(--bg-primary)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  cursor: 'pointer',
  boxSizing: 'border-box',
};

const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = 'var(--accent)';
  e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-subtle)';
};

const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = 'var(--border-default)';
  e.currentTarget.style.boxShadow = 'none';
};

/* ─── Main Wizard ─── */
export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [createdProjectId, setCreatedProjectId] = useState('');

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        padding: 32,
      }}
    >
      <div
        className="flex flex-col items-center"
        style={{ width: '100%', maxWidth: 560 }}
      >
        {/* Step content */}
        <div style={{ width: '100%', marginBottom: 40 }}>
          {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
          {step === 1 && <ConnectToolsStep onNext={() => setStep(2)} />}
          {step === 2 && (
            <CreateProjectStep
              onComplete={(id) => {
                setCreatedProjectId(id);
                setStep(3);
              }}
            />
          )}
          {step === 3 && <DoneStep projectId={createdProjectId} />}
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} total={4} />
      </div>
    </div>
  );
}
