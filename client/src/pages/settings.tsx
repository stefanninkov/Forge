import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import {
  useIntegrations,
  useConnectIntegration,
  useDisconnectIntegration,
} from '@/hooks/use-integrations';
import { Layers, Brain, Globe, Check, X, Loader2 } from 'lucide-react';
import type { Provider } from '@/types/integration';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

interface ProviderConfig {
  provider: Provider;
  name: string;
  description: string;
  icon: ComponentType<LucideProps>;
  inputLabel: string;
  inputPlaceholder: string;
  helpText: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    provider: 'figma',
    name: 'Figma',
    description: 'Connect your Figma account to import design structures.',
    icon: Layers,
    inputLabel: 'Personal Access Token',
    inputPlaceholder: 'figd_...',
    helpText: 'Generate a token at figma.com → Settings → Personal access tokens',
  },
  {
    provider: 'anthropic',
    name: 'Anthropic (Claude AI)',
    description: 'Enable AI-powered structure suggestions and class naming.',
    icon: Brain,
    inputLabel: 'API Key',
    inputPlaceholder: 'sk-ant-...',
    helpText: 'Get your API key at console.anthropic.com → API Keys',
  },
  {
    provider: 'webflow',
    name: 'Webflow',
    description: 'Push structures and templates directly to your Webflow site.',
    icon: Globe,
    inputLabel: 'API Token',
    inputPlaceholder: 'wf_...',
    helpText: 'Create a token at webflow.com → Site Settings → Integrations → API Access',
  },
];

function IntegrationCard({ config }: { config: ProviderConfig }) {
  const { data: integrations } = useIntegrations();
  const connectMutation = useConnectIntegration();
  const disconnectMutation = useDisconnectIntegration();
  const [tokenInput, setTokenInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  const integration = integrations?.find((i) => i.provider === config.provider);
  const isConnected = !!integration;
  const isLoading = connectMutation.isPending || disconnectMutation.isPending;

  const Icon = config.icon;

  const handleConnect = () => {
    if (!tokenInput.trim()) return;
    connectMutation.mutate(
      { provider: config.provider, accessToken: tokenInput.trim() },
      {
        onSuccess: () => {
          setTokenInput('');
          setShowInput(false);
        },
      },
    );
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate(config.provider);
  };

  return (
    <div
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      <div className="flex items-start justify-between" style={{ marginBottom: 12 }}>
        <div className="flex items-center" style={{ gap: 12 }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--surface-hover)',
              color: 'var(--text-secondary)',
            }}
          >
            <Icon size={18} />
          </div>
          <div>
            <div
              className="font-medium"
              style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}
            >
              {config.name}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
              {config.description}
            </div>
          </div>
        </div>

        {isConnected && (
          <div
            className="flex items-center"
            style={{
              gap: 6,
              fontSize: 'var(--text-xs)',
              color: 'var(--accent)',
              fontWeight: 500,
            }}
          >
            <Check size={14} />
            Connected
          </div>
        )}
      </div>

      {isConnected ? (
        <button
          onClick={handleDisconnect}
          disabled={isLoading}
          className="flex items-center cursor-pointer"
          style={{
            height: 32,
            padding: '0 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            backgroundColor: 'transparent',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            gap: 6,
            opacity: isLoading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--status-error)';
            e.currentTarget.style.color = 'var(--status-error)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
          Disconnect
        </button>
      ) : showInput ? (
        <div className="flex flex-col" style={{ gap: 8 }}>
          <label
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              color: 'var(--text-secondary)',
            }}
          >
            {config.inputLabel}
          </label>
          <div className="flex" style={{ gap: 8 }}>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder={config.inputPlaceholder}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
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
              onClick={handleConnect}
              disabled={!tokenInput.trim() || isLoading}
              className="cursor-pointer"
              style={{
                height: 36,
                padding: '0 16px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: 'var(--accent)',
                color: '#ffffff',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                opacity: !tokenInput.trim() || isLoading ? 0.5 : 1,
              }}
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
            </button>
            <button
              onClick={() => {
                setShowInput(false);
                setTokenInput('');
              }}
              className="cursor-pointer"
              style={{
                height: 36,
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
              }}
            >
              Cancel
            </button>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            {config.helpText}
          </div>
          {connectMutation.isError && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--status-error)' }}>
              {connectMutation.error?.message ?? 'Failed to connect'}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="cursor-pointer"
          style={{
            height: 32,
            padding: '0 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            backgroundColor: 'transparent',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'var(--text-primary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Connect
        </button>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your integrations and preferences."
      />

      <div style={{ padding: '0 24px 24px' }}>
        <div style={{ maxWidth: 640 }}>
          <h3
            className="font-medium"
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--text-primary)',
              marginBottom: 16,
            }}
          >
            Integrations
          </h3>

          <div className="flex flex-col" style={{ gap: 12 }}>
            {PROVIDERS.map((config) => (
              <IntegrationCard key={config.provider} config={config} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
