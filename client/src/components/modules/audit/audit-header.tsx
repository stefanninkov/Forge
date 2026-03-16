import { useState, useCallback } from 'react';
import { Play, Loader2, Download } from 'lucide-react';
import { useProjects } from '@/hooks/use-projects';
import type { AuditFinding } from '@/types/audit';

interface AuditHeaderProps {
  projectId: string | null;
  onProjectChange: (id: string) => void;
  onRunAudit: (url: string) => void;
  isRunning: boolean;
  lastAuditedAt?: string;
  defaultUrl?: string;
  findings?: AuditFinding[];
  auditType?: string;
}

export function AuditHeader({
  projectId,
  onProjectChange,
  onRunAudit,
  isRunning,
  lastAuditedAt,
  defaultUrl,
  findings,
  auditType,
}: AuditHeaderProps) {
  const [url, setUrl] = useState(defaultUrl ?? '');
  const { data: projects } = useProjects();

  const handleExportCSV = useCallback(() => {
    if (!findings || findings.length === 0) return;
    const headers = ['Severity', 'Category', 'Title', 'Description', 'Recommendation'];
    const rows = findings.map((f) => [
      f.severity,
      f.category,
      `"${f.title.replace(/"/g, '""')}"`,
      `"${(f.description ?? '').replace(/"/g, '""')}"`,
      `"${(f.recommendation ?? '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${auditType ?? 'audit'}-findings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [findings, auditType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && projectId) {
      onRunAudit(url.trim());
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center"
      style={{
        gap: 8,
        padding: '12px 0',
        flexWrap: 'wrap',
      }}
    >
      {/* Project selector */}
      <select
        value={projectId ?? ''}
        onChange={(e) => onProjectChange(e.target.value)}
        style={{
          height: 36,
          padding: '0 10px',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-sans)',
          minWidth: 160,
        }}
      >
        <option value="">Select project</option>
        {projects?.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {/* URL input */}
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com"
        style={{
          flex: '1 1 200px',
          height: 36,
          padding: '0 10px',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-mono)',
          outline: 'none',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-default)';
        }}
      />

      {/* Run button */}
      <button
        type="submit"
        disabled={isRunning || !url.trim() || !projectId}
        className="flex items-center cursor-pointer"
        style={{
          gap: 6,
          height: 36,
          padding: '0 14px',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--accent)',
          color: '#ffffff',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          fontFamily: 'var(--font-sans)',
          opacity: isRunning || !url.trim() || !projectId ? 0.5 : 1,
        }}
      >
        {isRunning ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Running...
          </>
        ) : (
          <>
            <Play size={14} />
            Run Audit
          </>
        )}
      </button>

      {/* Export findings */}
      {findings && findings.length > 0 && (
        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center cursor-pointer"
          style={{
            gap: 4,
            height: 36,
            padding: '0 10px',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            fontFamily: 'var(--font-sans)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <Download size={12} />
          Export CSV
        </button>
      )}

      {/* Last audited */}
      {lastAuditedAt && (
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            whiteSpace: 'nowrap',
          }}
        >
          Last: {new Date(lastAuditedAt).toLocaleDateString()} {new Date(lastAuditedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </form>
  );
}
