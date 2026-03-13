import { useMasterScriptStatus } from '@/hooks/use-master-script-status';
import { useMCPConnection } from '@/hooks/use-mcp-connection';
import { useActiveProject } from '@/hooks/use-active-project';
import { Code, Wifi, WifiOff, Ruler, Loader2 } from 'lucide-react';

export function StatusBar() {
  const { activeProjectId } = useActiveProject();
  const { scriptStatus, scalingStatus, isGenerating } = useMasterScriptStatus();
  const { status: mcpStatus } = useMCPConnection();

  if (!activeProjectId) return null;

  const scriptLabel = {
    none: 'No script',
    outdated: 'Script outdated',
    generated: 'Script ready',
    pushed: 'Script deployed',
  }[scriptStatus];

  const scriptColor = {
    none: 'var(--text-tertiary)',
    outdated: 'var(--status-warning)',
    generated: 'var(--accent)',
    pushed: 'var(--status-success)',
  }[scriptStatus];

  const scalingLabel = {
    not_configured: 'Scaling: off',
    configured: 'Scaling: ready',
    pushed: 'Scaling: live',
  }[scalingStatus];

  const scalingColor = {
    not_configured: 'var(--text-tertiary)',
    configured: 'var(--accent)',
    pushed: 'var(--status-success)',
  }[scalingStatus];

  return (
    <div
      className="flex items-center"
      style={{
        height: 28,
        padding: '0 16px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-secondary)',
        gap: 16,
        fontSize: 'var(--text-xs)',
        fontFamily: 'var(--font-mono)',
        flexShrink: 0,
      }}
    >
      {/* MCP status */}
      <div className="flex items-center" style={{ gap: 4, color: mcpStatus === 'connected' ? 'var(--accent)' : 'var(--text-tertiary)' }}>
        {mcpStatus === 'connected' ? <Wifi size={11} /> : <WifiOff size={11} />}
        <span>{mcpStatus === 'connected' ? 'MCP connected' : 'MCP disconnected'}</span>
      </div>

      <div style={{ width: 1, height: 12, backgroundColor: 'var(--border-subtle)' }} />

      {/* Script status */}
      <div className="flex items-center" style={{ gap: 4, color: scriptColor }}>
        {isGenerating ? <Loader2 size={11} className="animate-spin" /> : <Code size={11} />}
        <span>{scriptLabel}</span>
      </div>

      <div style={{ width: 1, height: 12, backgroundColor: 'var(--border-subtle)' }} />

      {/* Scaling status */}
      <div className="flex items-center" style={{ gap: 4, color: scalingColor }}>
        <Ruler size={11} />
        <span>{scalingLabel}</span>
      </div>
    </div>
  );
}
