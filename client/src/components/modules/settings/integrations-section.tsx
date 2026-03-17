import { useState } from 'react';
import {
  useTokenVault,
  useAddToken,
  useRemoveToken,
  useUpdateTokenLabel,
} from '@/hooks/use-integrations';
import {
  Layers, Brain, Globe, Plus, Trash2, Pencil, Check, X, Loader2, Key,
} from 'lucide-react';
import type { Provider, TokenEntry } from '@/types/integration';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

/* ─── Provider config ─── */
interface ProviderConfig {
  provider: Provider;
  name: string;
  description: string;
  icon: ComponentType<LucideProps>;
  inputPlaceholder: string;
  helpText: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    provider: 'figma',
    name: 'Figma',
    description: 'Connect Figma accounts to import design structures.',
    icon: Layers,
    inputPlaceholder: 'figd_...',
    helpText: 'Generate at figma.com → Settings → Personal access tokens',
  },
  {
    provider: 'anthropic',
    name: 'Anthropic (Claude AI)',
    description: 'Enable AI-powered structure suggestions and class naming.',
    icon: Brain,
    inputPlaceholder: 'sk-ant-...',
    helpText: 'Get your key at console.anthropic.com → API Keys',
  },
  {
    provider: 'webflow',
    name: 'Webflow',
    description: 'Push structures and templates to your Webflow sites.',
    icon: Globe,
    inputPlaceholder: 'wf_...',
    helpText: 'Create at webflow.com → Site Settings → Integrations → API Access',
  },
];

/* ─── Token Row ─── */
function TokenRow({
  entry,
  provider,
}: {
  entry: TokenEntry;
  provider: Provider;
}) {
  const removeMutation = useRemoveToken();
  const updateLabelMutation = useUpdateTokenLabel();
  const [editing, setEditing] = useState(false);
  const [labelDraft, setLabelDraft] = useState(entry.label);
  const isLoading = removeMutation.isPending || updateLabelMutation.isPending;

  const handleSaveLabel = () => {
    const trimmed = labelDraft.trim();
    if (!trimmed || trimmed === entry.label) {
      setLabelDraft(entry.label);
      setEditing(false);
      return;
    }
    updateLabelMutation.mutate(
      { provider, tokenId: entry.id, label: trimmed },
      { onSuccess: () => setEditing(false) },
    );
  };

  const maskedToken = entry.token.slice(0, 8) + '••••••••';
  const addedDate = new Date(entry.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className="flex items-center"
      style={{
        gap: 10,
        padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--surface-hover)',
      }}
    >
      <Key size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />

      {editing ? (
        <div className="flex items-center" style={{ gap: 6, flex: 1 }}>
          <input
            type="text"
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveLabel();
              if (e.key === 'Escape') { setLabelDraft(entry.label); setEditing(false); }
            }}
            autoFocus
            style={{
              flex: 1,
              height: 28,
              padding: '0 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--accent)',
              backgroundColor: 'var(--bg-primary)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
            }}
          />
          <button
            onClick={handleSaveLabel}
            className="flex items-center justify-center border-none cursor-pointer"
            style={{
              width: 24,
              height: 24,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent)',
              color: '#fff',
            }}
          >
            <Check size={12} />
          </button>
          <button
            onClick={() => { setLabelDraft(entry.label); setEditing(false); }}
            className="flex items-center justify-center border-none cursor-pointer"
            style={{
              width: 24,
              height: 24,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'transparent',
              color: 'var(--text-tertiary)',
            }}
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {entry.label}
            </div>
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {maskedToken}
            </div>
          </div>

          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {addedDate}
          </div>

          <button
            onClick={() => setEditing(true)}
            disabled={isLoading}
            className="flex items-center justify-center border-none bg-transparent cursor-pointer"
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-tertiary)',
              flexShrink: 0,
              opacity: isLoading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.backgroundColor = 'var(--surface-active)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-tertiary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Rename"
          >
            <Pencil size={13} />
          </button>

          <button
            onClick={() => removeMutation.mutate({ provider, tokenId: entry.id })}
            disabled={isLoading}
            className="flex items-center justify-center border-none bg-transparent cursor-pointer"
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-tertiary)',
              flexShrink: 0,
              opacity: isLoading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--error)';
              e.currentTarget.style.backgroundColor = 'var(--surface-active)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-tertiary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Remove"
          >
            {removeMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
        </>
      )}
    </div>
  );
}

/* ─── Add Token Form ─── */
function AddTokenForm({
  config,
  onClose,
}: {
  config: ProviderConfig;
  onClose: () => void;
}) {
  const addMutation = useAddToken();
  const [label, setLabel] = useState('');
  const [token, setToken] = useState('');

  const handleSubmit = () => {
    const trimmedLabel = label.trim() || `My ${config.name}`;
    const trimmedToken = token.trim();
    if (!trimmedToken) return;
    addMutation.mutate(
      { provider: config.provider, label: trimmedLabel, token: trimmedToken },
      {
        onSuccess: () => {
          setLabel('');
          setToken('');
          onClose();
        },
      },
    );
  };

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      <div className="flex flex-col" style={{ gap: 8 }}>
        <div className="flex" style={{ gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                color: 'var(--text-tertiary)',
                marginBottom: 4,
              }}
            >
              Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`My ${config.name}`}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              style={{
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
          </div>
          <div style={{ flex: 2 }}>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                color: 'var(--text-tertiary)',
                marginBottom: 4,
              }}
            >
              Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={config.inputPlaceholder}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoComplete="new-password"
              data-1p-ignore
              data-lpignore="true"
              style={{
                width: '100%',
                height: 36,
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-primary)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
                boxSizing: 'border-box',
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
          </div>
        </div>

        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          {config.helpText}
        </div>

        <div className="flex justify-end" style={{ gap: 8 }}>
          <button
            onClick={onClose}
            className="cursor-pointer"
            style={{
              height: 32,
              padding: '0 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              backgroundColor: 'transparent',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!token.trim() || addMutation.isPending}
            className="cursor-pointer"
            style={{
              height: 32,
              padding: '0 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              opacity: !token.trim() || addMutation.isPending ? 0.5 : 1,
            }}
          >
            {addMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Add Token'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Provider Section ─── */
function ProviderSection({ config }: { config: ProviderConfig }) {
  const { data: vault } = useTokenVault();
  const [showAddForm, setShowAddForm] = useState(false);

  const tokens = vault?.[config.provider] ?? [];
  const Icon = config.icon;

  return (
    <div
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between" style={{ marginBottom: tokens.length > 0 || showAddForm ? 14 : 0 }}>
        <div className="flex items-center" style={{ gap: 12 }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              backgroundColor: tokens.length > 0 ? 'var(--accent-subtle)' : 'var(--surface-hover)',
              color: tokens.length > 0 ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
          >
            <Icon size={18} />
          </div>
          <div>
            <div className="flex items-center" style={{ gap: 8 }}>
              <span
                className="font-medium"
                style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}
              >
                {config.name}
              </span>
              {tokens.length > 0 && (
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 500,
                    color: 'var(--accent)',
                    backgroundColor: 'var(--accent-subtle)',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {tokens.length} token{tokens.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
              {config.description}
            </div>
          </div>
        </div>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center cursor-pointer"
            style={{
              height: 30,
              padding: '0 10px',
              gap: 5,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              backgroundColor: 'transparent',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <Plus size={14} />
            Add
          </button>
        )}
      </div>

      {/* Token list */}
      {tokens.length > 0 && (
        <div className="flex flex-col" style={{ gap: 6, marginBottom: showAddForm ? 12 : 0 }}>
          {tokens.map((entry) => (
            <TokenRow key={entry.id} entry={entry} provider={config.provider} />
          ))}
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <AddTokenForm config={config} onClose={() => setShowAddForm(false)} />
      )}
    </div>
  );
}

/* ─── Main Section ─── */
export function IntegrationsSection() {
  return (
    <div className="flex flex-col" style={{ gap: 12 }}>
      {PROVIDERS.map((config) => (
        <ProviderSection key={config.provider} config={config} />
      ))}
    </div>
  );
}
