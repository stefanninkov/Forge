import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { FirebaseError } from 'firebase/app';
import {
  useIntegrations,
  useConnectIntegration,
  useDisconnectIntegration,
} from '@/hooks/use-integrations';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/use-notification-preferences';
import { useScalingSystem } from '@/hooks/use-scaling-system';
import { ScalingConfigEditor } from '@/components/shared/editors/scaling-config';
import { KeyboardShortcutsPanel } from '@/components/shared/keyboard-shortcuts-panel';
import { DEFAULT_SCALING_CONFIG } from '@/lib/scaling-system';
import type { ScalingConfig as ScalingConfigType } from '@/lib/scaling-system';
import {
  Layers, Brain, Globe, Check, X, Loader2, User, Plug,
  Palette, Bell, Ruler, Keyboard, Database, Moon, Sun, Monitor,
  Download, Trash2, ChevronDown, RotateCcw,
} from 'lucide-react';
import type { Provider } from '@/types/integration';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

/* ─── Tab types ─── */
type SettingsTab = 'account' | 'integrations' | 'appearance' | 'notifications' | 'scaling' | 'shortcuts' | 'data';

const TABS: { key: SettingsTab; label: string; icon: ComponentType<LucideProps> }[] = [
  { key: 'account', label: 'Account', icon: User },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'integrations', label: 'Integrations', icon: Plug },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'scaling', label: 'Scaling', icon: Ruler },
  { key: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  { key: 'data', label: 'Data', icon: Database },
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
  const { user, updateName, updateEmail, updatePassword } = useAuth();
  const [name, setName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  async function handleUpdateAccount(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (name !== user?.displayName) await updateName(name);
      if (email !== user?.email) await updateEmail(email);
      toast.success('Account updated');
    } catch (err) {
      toast.error(err instanceof FirebaseError ? err.message : 'Failed to update account');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setChangingPw(true);
    try {
      await updatePassword(newPassword);
      toast.success('Password changed');
      setNewPassword('');
    } catch (err) {
      toast.error(err instanceof FirebaseError ? err.message : 'Failed to change password');
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
                disabled={changingPw || newPassword.length < 8}
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
                  opacity: changingPw || newPassword.length < 8 ? 0.5 : 1,
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

/* ─── Appearance Section ─── */
function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  const themes: { value: 'light' | 'dark' | 'system'; label: string; icon: ComponentType<LucideProps> }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
  ];

  return (
    <div className="flex flex-col" style={{ gap: 24 }}>
      <div>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
          Theme
        </h3>
        <div className="flex" style={{ gap: 12 }}>
          {themes.map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  width: 120, padding: '16px 12px',
                  border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border-default)'}`,
                  borderRadius: 8, backgroundColor: isActive ? 'var(--accent-subtle)' : 'transparent',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  transition: 'all var(--duration-fast)',
                }}
              >
                <Icon size={20} style={{ color: isActive ? 'var(--accent)' : 'var(--text-tertiary)' }} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

      <div>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          Font Size
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 12 }}>
          Base font size used throughout the interface.
        </p>
        <div className="flex items-center" style={{ gap: 12 }}>
          {[13, 14, 15, 16].map((size) => (
            <button
              key={size}
              style={{
                height: 36, padding: '0 16px',
                border: `1px solid ${size === 14 ? 'var(--accent)' : 'var(--border-default)'}`,
                borderRadius: 6,
                backgroundColor: size === 14 ? 'var(--accent-subtle)' : 'transparent',
                fontSize: 'var(--text-sm)', fontWeight: size === 14 ? 600 : 400,
                color: size === 14 ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer', fontFamily: 'var(--font-mono)',
              }}
            >
              {size}px
            </button>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

      <div>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          Sidebar
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 12 }}>
          Default sidebar behavior on launch.
        </p>
        <SettingToggle label="Start with sidebar collapsed" defaultChecked={false} />
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

      <div>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          Onboarding
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 12 }}>
          Reset the welcome dialog to see the getting-started walkthrough again on your next visit to the dashboard.
        </p>
        <button
          onClick={() => {
            localStorage.removeItem('forge-onboarded');
            toast.success('Welcome dialog will appear on your next dashboard visit.');
          }}
          className="flex items-center cursor-pointer"
          style={{
            gap: 6,
            height: 36,
            padding: '0 16px',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'transparent',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-sans)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <RotateCcw size={14} />
          Reset welcome dialog
        </button>
      </div>
    </div>
  );
}

/* ─── Notifications Section ─── */
function NotificationsSection() {
  const { data: prefs } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();

  const notificationEvents = [
    { event: 'audit_complete', label: 'Audit completed', description: 'When a speed, SEO, or AEO audit finishes running.' },
    { event: 'score_drop', label: 'Score drop alert', description: 'When a page score drops below a threshold.' },
    { event: 'deploy_success', label: 'Script deployed', description: 'When animation scripts are deployed to Webflow.' },
    { event: 'template_shared', label: 'Template shared', description: 'When someone shares a template with you.' },
    { event: 'weekly_summary', label: 'Weekly summary', description: 'Weekly digest of project activity and scores.' },
  ];

  function getPrefValue(event: string, channel: 'email' | 'in_app'): boolean {
    const pref = prefs?.find((p) => p.event === event && p.channel === channel);
    if (pref) return pref.enabled;
    return channel === 'in_app'; // Default: in-app on, email off
  }

  function handleToggle(event: string, channel: 'email' | 'in_app', enabled: boolean) {
    const updated = [...(prefs ?? [])];
    const idx = updated.findIndex((p) => p.event === event && p.channel === channel);
    if (idx >= 0) {
      updated[idx] = { ...updated[idx], enabled };
    } else {
      updated.push({ event, channel, enabled });
    }
    updatePrefs.mutate(updated);
  }

  return (
    <div className="flex flex-col" style={{ gap: 24 }}>
      <div>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          Notification Preferences
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 16 }}>
          Control which notifications you receive.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0', alignItems: 'center' }}>
          {/* Header */}
          <div style={{ padding: '8px 0', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event</div>
          <div style={{ padding: '8px 16px', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>In-App</div>
          <div style={{ padding: '8px 16px', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Email</div>

          {notificationEvents.map((n) => (
            <NotificationRow
              key={n.event}
              label={n.label}
              description={n.description}
              inApp={getPrefValue(n.event, 'in_app')}
              email={getPrefValue(n.event, 'email')}
              onToggleInApp={(v) => handleToggle(n.event, 'in_app', v)}
              onToggleEmail={(v) => handleToggle(n.event, 'email', v)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationRow({ label, description, inApp, email, onToggleInApp, onToggleEmail }: {
  label: string;
  description: string;
  inApp: boolean;
  email: boolean;
  onToggleInApp: (v: boolean) => void;
  onToggleEmail: (v: boolean) => void;
}) {
  return (
    <>
      <div style={{ padding: '10px 0', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>{description}</div>
      </div>
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
        <SmallToggle checked={inApp} onChange={onToggleInApp} />
      </div>
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
        <SmallToggle checked={email} onChange={onToggleEmail} />
      </div>
    </>
  );
}

/* ─── Scaling Section ─── */
function ScalingSection() {
  const { config, updateConfig, isUpdating } = useScalingSystem();
  const [defaultUnit, setDefaultUnit] = useState<'px' | 'rem' | 'em'>('px');
  const [isEditing, setIsEditing] = useState(false);

  const handleConfigChange = (newConfig: ScalingConfigType) => {
    updateConfig({
      baseFontSize: newConfig.desktop.baseFontSize,
      breakpoints: [
        { label: 'Desktop', base: newConfig.desktop.baseFontSize, min: newConfig.desktop.minWidth, max: newConfig.desktop.maxWidth },
        { label: 'Tablet', base: newConfig.tablet.baseFontSize, min: newConfig.tablet.minWidth, max: newConfig.tablet.maxWidth },
        { label: 'Mobile L', base: newConfig.mobileLandscape.baseFontSize, min: newConfig.mobileLandscape.minWidth, max: newConfig.mobileLandscape.maxWidth },
        { label: 'Mobile P', base: newConfig.mobilePortrait.baseFontSize, min: newConfig.mobilePortrait.minWidth, max: newConfig.mobilePortrait.maxWidth },
      ],
    });
  };

  const editorConfig: ScalingConfigType = {
    desktop: {
      name: 'Desktop',
      baseFontSize: config.baseFontSize,
      idealWidth: 1440,
      minWidth: config.breakpoints[0]?.min ?? 992,
      maxWidth: config.breakpoints[0]?.max ?? 1920,
    },
    tablet: {
      name: 'Tablet',
      baseFontSize: config.breakpoints[1]?.base ?? 15,
      idealWidth: 834,
      minWidth: config.breakpoints[1]?.min ?? 768,
      maxWidth: config.breakpoints[1]?.max ?? 991,
    },
    mobileLandscape: {
      name: 'Mobile Landscape',
      baseFontSize: config.breakpoints[2]?.base ?? 14,
      idealWidth: 550,
      minWidth: config.breakpoints[2]?.min ?? 480,
      maxWidth: config.breakpoints[2]?.max ?? 767,
    },
    mobilePortrait: {
      name: 'Mobile Portrait',
      baseFontSize: config.breakpoints[3]?.base ?? 13,
      idealWidth: 375,
      minWidth: config.breakpoints[3]?.min ?? 320,
      maxWidth: config.breakpoints[3]?.max ?? 479,
    },
  };

  return (
    <div className="flex flex-col" style={{ gap: 24 }}>
      <div>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          Scaling Configuration
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 16 }}>
          Configure REM fluid scaling breakpoints for your active project. Generated CSS uses clamp() for smooth scaling.
        </p>

        {isEditing ? (
          <div>
            <ScalingConfigEditor
              config={editorConfig}
              onConfigChange={handleConfigChange}
            />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  height: 32, padding: '0 16px',
                  border: '1px solid var(--border-default)',
                  borderRadius: 6, backgroundColor: 'transparent',
                  fontSize: 'var(--text-sm)', fontWeight: 500,
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: 16, borderRadius: 8,
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              {config.breakpoints.map((bp) => (
                <div key={bp.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>{bp.label}</div>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{bp.base}px</div>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginTop: 4 }}>{bp.min}–{bp.max}px</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button
                onClick={() => setIsEditing(true)}
                disabled={isUpdating}
                style={{
                  height: 32, padding: '0 16px',
                  border: '1px solid var(--border-default)',
                  borderRadius: 6, backgroundColor: 'transparent',
                  fontSize: 'var(--text-xs)', fontWeight: 500,
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  opacity: isUpdating ? 0.6 : 1,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {isUpdating ? 'Saving...' : 'Edit Configuration'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

      <div>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          Default Unit
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 12 }}>
          Preferred CSS unit for spacing and sizing inputs.
        </p>
        <div className="flex" style={{ gap: 8 }}>
          {(['px', 'rem', 'em'] as const).map((unit) => (
            <button
              key={unit}
              onClick={() => setDefaultUnit(unit)}
              style={{
                height: 32, padding: '0 14px',
                border: `1px solid ${unit === defaultUnit ? 'var(--accent)' : 'var(--border-default)'}`,
                borderRadius: 6,
                backgroundColor: unit === defaultUnit ? 'var(--accent-subtle)' : 'transparent',
                fontSize: 'var(--text-sm)', fontWeight: unit === defaultUnit ? 600 : 400,
                fontFamily: 'var(--font-mono)',
                color: unit === defaultUnit ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {unit}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Shortcuts Section ─── */
function ShortcutsSection() {
  return <KeyboardShortcutsPanel />;
}

/* ─── Data Section ─── */
function DataSection() {
  return (
    <div className="flex flex-col" style={{ gap: 24 }}>
      <div>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          Export Data
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 12 }}>
          Download a copy of your Forge data.
        </p>
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 36, padding: '0 16px',
            border: '1px solid var(--border-default)',
            borderRadius: 6, backgroundColor: 'transparent',
            fontSize: 'var(--text-sm)', fontWeight: 500,
            color: 'var(--text-secondary)', cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
          onClick={async () => {
            try {
              const res = await api.get<{ data: Record<string, unknown> }>('/export');
              const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `forge-export-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success('Data exported successfully.');
            } catch {
              toast.error('Failed to export data.');
            }
          }}
        >
          <Download size={14} />
          Export all data
        </button>
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

      <div>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          Clear Local Data
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 12 }}>
          Clear locally stored preferences and cache. Your account and project data on the server will not be affected.
        </p>
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 36, padding: '0 16px',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 6, backgroundColor: 'transparent',
            fontSize: 'var(--text-sm)', fontWeight: 500,
            color: 'var(--status-error)', cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
          onClick={() => {
            localStorage.clear();
            toast.success('Local data cleared. Refresh to apply.');
          }}
        >
          <Trash2 size={14} />
          Clear local data
        </button>
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

      <div>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          Delete Account
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 12 }}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 36, padding: '0 16px',
            border: 'none',
            borderRadius: 6, backgroundColor: 'rgba(239,68,68,0.1)',
            fontSize: 'var(--text-sm)', fontWeight: 500,
            color: 'var(--status-error)', cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
          onClick={() => toast.error('Contact support to delete your account.')}
        >
          <Trash2 size={14} />
          Delete account
        </button>
      </div>
    </div>
  );
}

/* ─── Shared components ─── */
function SettingToggle({ label, defaultChecked }: { label: string; defaultChecked: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <SmallToggle checked={checked} onChange={setChecked} />
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{label}</span>
    </label>
  );
}

function SmallToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative', width: 32, height: 18,
        borderRadius: 9,
        backgroundColor: checked ? 'var(--accent)' : 'var(--bg-tertiary)',
        cursor: 'pointer',
        transition: 'background-color var(--duration-fast)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute', top: 2, left: checked ? 16 : 2,
          width: 14, height: 14, borderRadius: '50%',
          backgroundColor: 'white',
          transition: 'left var(--duration-fast)',
        }}
      />
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
        description="Manage your account, appearance, and integrations."
      />

      <div style={{ padding: '0 24px 24px' }}>
        <div style={{ maxWidth: 720 }}>
          {/* Tabs */}
          <div
            className="flex"
            style={{
              gap: 0,
              borderBottom: '1px solid var(--border-default)',
              marginBottom: 24,
              overflowX: 'auto',
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
                    padding: '0 14px',
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
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
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
          {activeTab === 'appearance' && <AppearanceSection />}
          {activeTab === 'integrations' && (
            <div className="flex flex-col" style={{ gap: 12 }}>
              {PROVIDERS.map((config) => (
                <IntegrationCard key={config.provider} config={config} />
              ))}
            </div>
          )}
          {activeTab === 'notifications' && <NotificationsSection />}
          {activeTab === 'scaling' && <ScalingSection />}
          {activeTab === 'shortcuts' && <ShortcutsSection />}
          {activeTab === 'data' && <DataSection />}
        </div>
      </div>
    </div>
  );
}
