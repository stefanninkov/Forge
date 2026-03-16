import { useState } from 'react';
import { Clock, Plus, Trash2, ToggleLeft, ToggleRight, Calendar } from 'lucide-react';
import {
  useAuditSchedules,
  useCreateAuditSchedule,
  useUpdateAuditSchedule,
  useDeleteAuditSchedule,
} from '@/hooks/use-audit-schedules';
import type { AuditSchedule } from '@/hooks/use-audit-schedules';

interface AuditSchedulePanelProps {
  projectId: string | null;
  auditType: 'SPEED' | 'SEO' | 'AEO';
  defaultUrl?: string;
}

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Every 2 weeks',
  MONTHLY: 'Monthly',
};

const FREQUENCY_OPTIONS = ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'] as const;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function AuditSchedulePanel({ projectId, auditType, defaultUrl }: AuditSchedulePanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newUrl, setNewUrl] = useState(defaultUrl ?? '');
  const [newFrequency, setNewFrequency] = useState<(typeof FREQUENCY_OPTIONS)[number]>('WEEKLY');

  const { data: schedules } = useAuditSchedules(projectId);
  const createMutation = useCreateAuditSchedule();
  const updateMutation = useUpdateAuditSchedule();
  const deleteMutation = useDeleteAuditSchedule();

  const currentSchedule = schedules?.find((s: AuditSchedule) => s.type === auditType);

  const handleCreate = () => {
    if (!projectId || !newUrl.trim()) return;
    createMutation.mutate(
      { projectId, type: auditType, url: newUrl.trim(), frequency: newFrequency },
      { onSuccess: () => setIsCreating(false) },
    );
  };

  const handleToggle = (schedule: AuditSchedule) => {
    updateMutation.mutate({ scheduleId: schedule.id, enabled: !schedule.enabled });
  };

  const handleDelete = (schedule: AuditSchedule) => {
    deleteMutation.mutate(schedule.id);
  };

  return (
    <div
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: currentSchedule || isCreating ? '1px solid var(--border-default)' : 'none',
        }}
      >
        <div className="flex items-center" style={{ gap: 8 }}>
          <Clock size={14} style={{ color: 'var(--accent-text)' }} />
          <span
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            Scheduled Audits
          </span>
        </div>

        {!currentSchedule && !isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            disabled={!projectId}
            className="flex items-center border-none cursor-pointer"
            style={{
              gap: 4,
              height: 28,
              padding: '0 10px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent)',
              color: '#fff',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              opacity: !projectId ? 0.6 : 1,
              cursor: !projectId ? 'not-allowed' : 'pointer',
            }}
          >
            <Plus size={12} />
            Schedule
          </button>
        )}
      </div>

      {/* Create form */}
      {isCreating && (
        <div style={{ padding: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              URL to audit
            </label>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com"
              style={{
                width: '100%',
                height: 32,
                padding: '0 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Frequency
            </label>
            <select
              value={newFrequency}
              onChange={(e) => setNewFrequency(e.target.value as (typeof FREQUENCY_OPTIONS)[number])}
              style={{
                width: '100%',
                height: 32,
                padding: '0 8px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
              }}
            >
              {FREQUENCY_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABELS[f]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex" style={{ gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setIsCreating(false)}
              className="border-none bg-transparent cursor-pointer"
              style={{
                height: 28,
                padding: '0 10px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!newUrl.trim() || createMutation.isPending}
              className="flex items-center border-none cursor-pointer"
              style={{
                gap: 4,
                height: 28,
                padding: '0 10px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
                opacity: !newUrl.trim() || createMutation.isPending ? 0.6 : 1,
              }}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Schedule'}
            </button>
          </div>
        </div>
      )}

      {/* Active schedule */}
      {currentSchedule && (
        <div style={{ padding: 16 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <div className="flex items-center" style={{ gap: 8 }}>
              <Calendar size={12} style={{ color: 'var(--text-tertiary)' }} />
              <span
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                }}
              >
                {FREQUENCY_LABELS[currentSchedule.frequency]}
              </span>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                  color: currentSchedule.enabled ? 'var(--accent-text)' : 'var(--text-tertiary)',
                  backgroundColor: currentSchedule.enabled ? 'var(--accent-subtle)' : 'var(--surface-hover)',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {currentSchedule.enabled ? 'Active' : 'Paused'}
              </span>
            </div>

            <div className="flex items-center" style={{ gap: 4 }}>
              <button
                onClick={() => handleToggle(currentSchedule)}
                className="flex items-center justify-center border-none bg-transparent cursor-pointer"
                title={currentSchedule.enabled ? 'Pause schedule' : 'Resume schedule'}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-md)',
                  color: currentSchedule.enabled ? 'var(--accent-text)' : 'var(--text-tertiary)',
                }}
              >
                {currentSchedule.enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              </button>
              <button
                onClick={() => handleDelete(currentSchedule)}
                className="flex items-center justify-center border-none bg-transparent cursor-pointer"
                title="Delete schedule"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-tertiary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--error)';
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-tertiary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              fontSize: 'var(--text-xs)',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: 2 }}>URL</span>
              <span
                style={{
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  wordBreak: 'break-all',
                }}
              >
                {currentSchedule.url}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: 2 }}>Last run</span>
              <span style={{ color: 'var(--text-secondary)' }}>{formatDate(currentSchedule.lastRunAt)}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: 2 }}>Next run</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {currentSchedule.enabled ? formatDate(currentSchedule.nextRunAt) : 'Paused'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!currentSchedule && !isCreating && (
        <div
          style={{
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-tertiary)',
              margin: 0,
              lineHeight: 'var(--leading-normal)',
            }}
          >
            Schedule recurring {auditType.toLowerCase()} audits to monitor your site automatically.
          </p>
        </div>
      )}
    </div>
  );
}
