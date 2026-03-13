import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { useAuth } from '@/hooks/use-auth';
import { api, ApiError } from '@/lib/api';
import {
  useIntegrations,
  useConnectIntegration,
  useDisconnectIntegration,
} from '@/hooks/use-integrations';
import { Layers, Brain, Globe, Check, X, Loader2, User, Plug } from 'lucide-react';
import type { Provider } from '@/types/integration';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

/* ─── Tab types ─── */
type SettingsTab = 'account' | 'integrations';

const TABS: { key: SettingsTab; label: string; icon: ComponentType<LucideProps> }[] = [
  { key: 'account', label: 'Account', icon: User },
  { key: 'integrations', label: 'Integrations', icon: Plug },
];

/* ─── Integration config ─── */
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

/* ─── Account Tab ─── */
function AccountSection() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  async function handleUpdateAccount(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/account', { name, email });
      toast.success('Account updated');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update account');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setChangingPw(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  }

  const inputStyle = {
    width: '100%',
    height: 36,
    padding: '0 12px',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-base)',
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-primary)',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
  };

  const labelStyle = {
    display: 'block' as const,
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: 6,
  };

  return (
    <div className="flex flex-col" style={{ gap: 32 }}>
      {/* Profile */}
      <div>
        <h3
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 16,
          }}
        >
          Profile
        </h3>
        <form onSubmit={handleUpdateAccount}>
          <div className="flex flex-col" style={{ gap: 12 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
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
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
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
            <div>
              <button
                type="submit"
                disabled={saving}
                style={{
                  height: 36,
                  padding: '0 16px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

      {/* Change password */}
      <div>
        <h3
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 16,
          }}
        >
          Change password
        </h3>
        <form onSubmit={handleChangePassword}>
          <div className="flex flex-col" style={{ gap: 12 }}>
            <div>
              <label style={labelStyle}>Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={inputStyle}
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
            <div>
              <label style={labelStyle}>New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-subtle)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>
                Must be at least 8 characters.
              </p>
            </div>
            <div>
              <button
                type="submit"
                disabled={changingPw || !currentPassword || newPassword.length < 8}
                style={{
                  height: 36,
                  padding: '0 16px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  cursor: changingPw ? 'not-allowed' : 'pointer',
                  opacity: changingPw || !currentPassword || newPassword.length < 8 ? 0.5 : 1,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {changingPw ? 'Changing...' : 'Change password'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Integration Card ─── */
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
            e.currentTarget.style.borderColor = 'var(--error)';
            e.currentTarget.style.color = 'var(--error)';
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

/* ─── Settings Page ─── */
export default function SettingsPage() {
  usePageTitle('Settings');
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account and integrations."
      />

      <div style={{ padding: '0 24px 24px' }}>
        <div style={{ maxWidth: 640 }}>
          {/* Tabs */}
          <div
            className="flex"
            style={{
              gap: 0,
              borderBottom: '1px solid var(--border-default)',
              marginBottom: 24,
            }}
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center"
                  style={{
                    height: 40,
                    padding: '0 16px',
                    gap: 6,
                    border: 'none',
                    borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: isActive ? 500 : 400,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    transition: 'color var(--duration-fast)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {activeTab === 'account' && <AccountSection />}
          {activeTab === 'integrations' && (
            <div className="flex flex-col" style={{ gap: 12 }}>
              {PROVIDERS.map((config) => (
                <IntegrationCard key={config.provider} config={config} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
