import { useState, useCallback } from 'react';
import {
  Plug, Unplug, RefreshCw, CheckCircle2, XCircle, AlertCircle,
  Clock, Globe, Settings, ChevronDown, ChevronRight, Loader2,
  ExternalLink, Shield,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────

export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'connecting';

export interface MCPSite {
  id: string;
  displayName: string;
  shortName: string;
  previewUrl?: string;
  customDomains: string[];
  lastPublishedOn?: string;
}

export interface MCPConnection {
  status: ConnectionStatus;
  token?: string;
  tokenExpiresAt?: string;
  connectedSites: MCPSite[];
  lastChecked?: string;
  error?: string;
}

export interface MCPConnectionPanelProps {
  connection: MCPConnection;
  onConnect: (token: string) => void;
  onDisconnect: () => void;
  onRefresh: () => void;
  onSelectSite: (siteId: string) => void;
  selectedSiteId?: string;
  isRefreshing?: boolean;
}

// ─── Component ───────────────────────────────────────────────────

export function MCPConnectionPanel({
  connection,
  onConnect,
  onDisconnect,
  onRefresh,
  onSelectSite,
  selectedSiteId,
  isRefreshing,
}: MCPConnectionPanelProps) {
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleConnect = useCallback(() => {
    if (!tokenInput.trim()) return;
    onConnect(tokenInput.trim());
    setTokenInput('');
    setShowTokenInput(false);
  }, [tokenInput, onConnect]);

  const statusConfig = STATUS_CONFIG[connection.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Status Card */}
      <div
        style={{
          padding: 16, borderRadius: 8,
          border: `1px solid ${statusConfig.borderColor}`,
          backgroundColor: statusConfig.bgColor,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: statusConfig.iconBg,
            }}
          >
            <StatusIcon size={18} style={{ color: statusConfig.iconColor }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Webflow MCP
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <div
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: statusConfig.dotColor,
                }}
              />
              <span style={{ fontSize: 'var(--text-xs)', color: statusConfig.textColor }}>
                {statusConfig.label}
              </span>
            </div>
          </div>
          {connection.status === 'connected' && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, border: '1px solid var(--border-default)',
                borderRadius: 6, backgroundColor: 'transparent',
                cursor: isRefreshing ? 'wait' : 'pointer',
                color: 'var(--text-tertiary)',
              }}
            >
              {isRefreshing ? (
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <RefreshCw size={14} />
              )}
            </button>
          )}
        </div>

        {/* Error message */}
        {connection.error && (
          <div
            style={{
              marginTop: 10, padding: '8px 10px',
              borderRadius: 4, backgroundColor: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.15)',
              fontSize: 'var(--text-xs)', color: 'var(--status-error)',
              lineHeight: 1.5,
            }}
          >
            {connection.error}
          </div>
        )}

        {/* Last checked */}
        {connection.lastChecked && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            <Clock size={10} />
            <span>Last checked: {formatRelativeTime(connection.lastChecked)}</span>
          </div>
        )}

        {/* Connect/Disconnect Actions */}
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          {connection.status === 'connected' ? (
            <button
              onClick={onDisconnect}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                height: 32, padding: '0 12px',
                border: '1px solid var(--border-default)',
                borderRadius: 6, backgroundColor: 'transparent',
                fontSize: 'var(--text-xs)', fontWeight: 500,
                color: 'var(--text-secondary)', cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <Unplug size={12} />
              Disconnect
            </button>
          ) : (
            <>
              {showTokenInput ? (
                <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleConnect(); }}
                    placeholder="Paste Webflow API token"
                    autoFocus
                    autoComplete="new-password"
                    data-1p-ignore
                    data-lpignore="true"
                    style={{
                      flex: 1, height: 32, padding: '0 10px',
                      border: '1px solid var(--border-default)',
                      borderRadius: 6, fontSize: 'var(--text-xs)',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-primary)', backgroundColor: 'transparent',
                    }}
                  />
                  <button
                    onClick={handleConnect}
                    disabled={!tokenInput.trim()}
                    style={{
                      height: 32, padding: '0 12px',
                      border: 'none', borderRadius: 6,
                      backgroundColor: 'var(--accent)',
                      color: 'var(--text-on-accent)',
                      fontSize: 'var(--text-xs)', fontWeight: 500,
                      cursor: tokenInput.trim() ? 'pointer' : 'not-allowed',
                      fontFamily: 'var(--font-sans)',
                      opacity: tokenInput.trim() ? 1 : 0.5,
                    }}
                  >
                    Connect
                  </button>
                  <button
                    onClick={() => { setShowTokenInput(false); setTokenInput(''); }}
                    style={{
                      height: 32, padding: '0 8px',
                      border: '1px solid var(--border-default)',
                      borderRadius: 6, backgroundColor: 'transparent',
                      fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)',
                      cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTokenInput(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    height: 32, padding: '0 14px',
                    border: 'none', borderRadius: 6,
                    backgroundColor: 'var(--accent)',
                    color: 'var(--text-on-accent)',
                    fontSize: 'var(--text-xs)', fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  }}
                >
                  <Plug size={12} />
                  Connect with API Token
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Connected Sites */}
      {connection.status === 'connected' && connection.connectedSites.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 'var(--text-xs)', fontWeight: 600,
              color: 'var(--text-tertiary)', textTransform: 'uppercase',
              letterSpacing: '0.05em', marginBottom: 8, padding: '0 4px',
            }}
          >
            Available Sites ({connection.connectedSites.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {connection.connectedSites.map((site) => (
              <button
                key={site.id}
                onClick={() => onSelectSite(site.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 6,
                  border: `1px solid ${selectedSiteId === site.id ? 'var(--accent)' : 'var(--border-default)'}`,
                  backgroundColor: selectedSiteId === site.id ? 'var(--accent-subtle)' : 'transparent',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  width: '100%', textAlign: 'left',
                  transition: 'all var(--duration-fast)',
                }}
              >
                <Globe size={14} style={{ color: selectedSiteId === site.id ? 'var(--accent)' : 'var(--text-tertiary)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {site.displayName}
                  </div>
                  {site.customDomains.length > 0 && (
                    <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {site.customDomains[0]}
                    </div>
                  )}
                </div>
                {selectedSiteId === site.id && (
                  <CheckCircle2 size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                )}
                {site.previewUrl && (
                  <a
                    href={site.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced / Token Info */}
      {connection.status === 'connected' && (
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 4px', border: 'none',
            backgroundColor: 'transparent', cursor: 'pointer',
            fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {showAdvanced ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <Shield size={12} />
          Connection Details
        </button>
      )}

      {showAdvanced && connection.status === 'connected' && (
        <div
          style={{
            padding: 12, borderRadius: 6,
            border: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <DetailRow label="Token" value={connection.token ? `•••${connection.token.slice(-8)}` : '—'} mono />
            <DetailRow label="Expires" value={connection.tokenExpiresAt ? new Date(connection.tokenExpiresAt).toLocaleString() : 'Never'} />
            <DetailRow label="Sites" value={String(connection.connectedSites.length)} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{label}</span>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontFamily: mono ? 'var(--font-mono)' : 'inherit' }}>{value}</span>
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const STATUS_CONFIG: Record<ConnectionStatus, {
  label: string; icon: typeof CheckCircle2;
  dotColor: string; textColor: string;
  borderColor: string; bgColor: string;
  iconBg: string; iconColor: string;
}> = {
  connected: {
    label: 'Connected',
    icon: CheckCircle2,
    dotColor: 'var(--status-success, #10b981)',
    textColor: 'var(--status-success, #10b981)',
    borderColor: 'var(--status-success-border, rgba(16,185,129,0.2))',
    bgColor: 'var(--status-success-bg, rgba(16,185,129,0.04))',
    iconBg: 'rgba(16,185,129,0.1)',
    iconColor: 'var(--status-success, #10b981)',
  },
  disconnected: {
    label: 'Disconnected',
    icon: Unplug,
    dotColor: 'var(--text-tertiary)',
    textColor: 'var(--text-tertiary)',
    borderColor: 'var(--border-default)',
    bgColor: 'transparent',
    iconBg: 'var(--bg-tertiary)',
    iconColor: 'var(--text-tertiary)',
  },
  error: {
    label: 'Connection Error',
    icon: XCircle,
    dotColor: 'var(--status-error, #ef4444)',
    textColor: 'var(--status-error, #ef4444)',
    borderColor: 'var(--status-error-border, rgba(239,68,68,0.2))',
    bgColor: 'var(--status-error-bg, rgba(239,68,68,0.04))',
    iconBg: 'rgba(239,68,68,0.1)',
    iconColor: 'var(--status-error, #ef4444)',
  },
  connecting: {
    label: 'Connecting...',
    icon: Loader2,
    dotColor: 'var(--status-warning, #f59e0b)',
    textColor: 'var(--status-warning-text, #d97706)',
    borderColor: 'var(--status-warning-border, rgba(245,158,11,0.2))',
    bgColor: 'var(--status-warning-bg, rgba(245,158,11,0.04))',
    iconBg: 'rgba(245,158,11,0.1)',
    iconColor: 'var(--status-warning, #f59e0b)',
  },
};
