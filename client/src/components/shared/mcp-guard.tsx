import type { ReactNode } from 'react';
import { useMCPConnection } from '@/hooks/use-mcp-connection';
import { WifiOff, Loader2, RefreshCw } from 'lucide-react';

interface MCPGuardProps {
  children: ReactNode;
  fallbackMessage?: string;
}

export function MCPGuard({ children, fallbackMessage }: MCPGuardProps) {
  const { status, reconnect } = useMCPConnection();

  if (status === 'connected') {
    return <>{children}</>;
  }

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        padding: 32,
        gap: 16,
        textAlign: 'center',
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 48,
          height: 48,
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--surface-hover)',
          color: 'var(--text-tertiary)',
        }}
      >
        {status === 'reconnecting' ? (
          <Loader2 size={22} className="animate-spin" style={{ color: 'var(--accent)' }} />
        ) : (
          <WifiOff size={22} />
        )}
      </div>
      <div>
        <p
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 500,
            color: 'var(--text-primary)',
            marginBottom: 4,
          }}
        >
          Webflow Designer not connected
        </p>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-tertiary)',
            maxWidth: 360,
            lineHeight: 'var(--leading-normal)',
          }}
        >
          {fallbackMessage || 'Open your project in the Webflow Designer with the MCP Companion App running, then connect in Settings \u2192 Integrations.'}
        </p>
      </div>
      <button
        onClick={() => reconnect()}
        disabled={status === 'reconnecting'}
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
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)',
          opacity: status === 'reconnecting' ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <RefreshCw size={14} />
        {status === 'reconnecting' ? 'Reconnecting...' : 'Try reconnecting'}
      </button>
    </div>
  );
}
