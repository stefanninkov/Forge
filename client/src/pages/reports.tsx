import { useState, useCallback } from 'react';
import {
  FileText, Plus, ExternalLink, Copy, Trash2, MoreHorizontal,
  Calendar, Lock, Globe, CheckCircle2, Share2, Loader2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { useReports, useCreateReport, useDeleteReport, useShareReport } from '@/hooks/use-reports';
import { useProjects } from '@/hooks/use-projects';
import type { HandoffReport } from '@/hooks/use-reports';

const SECTION_OPTIONS = [
  { type: 'overview' as const, title: 'Project Overview', description: 'Project summary and setup status' },
  { type: 'speed' as const, title: 'Speed Audit', description: 'Performance scores and recommendations' },
  { type: 'seo' as const, title: 'SEO Audit', description: 'SEO analysis and findings' },
  { type: 'aeo' as const, title: 'AEO Audit', description: 'AI engine optimization results' },
  { type: 'recommendations' as const, title: 'Recommendations', description: 'Prioritized action items' },
];

export default function ReportsPage() {
  usePageTitle('Handoff Reports');
  const { data: reports, isLoading, error } = useReports();
  const deleteReport = useDeleteReport();
  const shareReport = useShareReport();
  const [createOpen, setCreateOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = useCallback((id: string) => {
    deleteReport.mutate(id, {
      onSuccess: () => {
        setDeleteConfirmId(null);
        setMenuOpenId(null);
      },
    });
  }, [deleteReport]);

  const handleShare = useCallback((id: string) => {
    shareReport.mutate(id);
    setMenuOpenId(null);
  }, [shareReport]);

  const handleCopyLink = useCallback((report: HandoffReport) => {
    if (report.shareToken) {
      navigator.clipboard.writeText(
        `${window.location.origin}/report/${report.shareToken}`,
      );
      toast.success('Share link copied');
    }
    setMenuOpenId(null);
  }, []);

  return (
    <>
      <PageHeader
        title="Handoff Reports"
        description="Client-ready reports for project deliveries."
        actions={
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center border-none cursor-pointer"
            style={{
              height: 36,
              padding: '0 14px',
              gap: 6,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent)',
              color: '#fff',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              transition: 'background-color var(--duration-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent)';
            }}
          >
            <Plus size={16} />
            <span>New report</span>
          </button>
        }
      />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
        {/* Loading state */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeIn 200ms ease-out' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  padding: 16,
                  backgroundColor: 'var(--bg-primary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: 'var(--surface-hover)', animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
                  <div style={{ width: 200, height: 16, borderRadius: 6, backgroundColor: 'var(--surface-hover)', animation: 'skeletonPulse 1.5s ease-in-out infinite', animationDelay: '0.1s' }} />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 80, height: 12, borderRadius: 4, backgroundColor: 'var(--surface-hover)', animation: 'skeletonPulse 1.5s ease-in-out infinite', animationDelay: '0.2s' }} />
                  <div style={{ width: 60, height: 12, borderRadius: 4, backgroundColor: 'var(--surface-hover)', animation: 'skeletonPulse 1.5s ease-in-out infinite', animationDelay: '0.3s' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center" style={{ height: 400 }}>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--error)', marginBottom: 4 }}>
              Failed to load reports
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && reports && reports.length === 0 && (
          <div
            className="flex flex-col items-center justify-center"
            style={{ height: 400, animation: 'fadeIn 200ms ease-out' }}
          >
            <FileText size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 16 }} strokeWidth={1} />
            <p style={{ fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
              No reports yet
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', maxWidth: 360, textAlign: 'center', marginBottom: 20 }}>
              Create a handoff report to share project details, audit results, and recommendations with clients.
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center border-none cursor-pointer"
              style={{
                height: 36,
                padding: '0 14px',
                gap: 6,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
            >
              <Plus size={16} />
              <span>New report</span>
            </button>
          </div>
        )}

        {/* Reports list */}
        {!isLoading && !error && reports && reports.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeIn 200ms ease-out' }}>
            {reports.map((report) => (
              <div
                key={report.id}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 16,
                  transition: 'border-color var(--duration-fast)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  setMenuOpenId(null);
                }}
              >
                <div className="flex items-start justify-between">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center" style={{ gap: 8, marginBottom: 4 }}>
                      <FileText size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                        {report.title}
                      </h3>
                    </div>

                    {report.project && (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '2px 0 0 24px' }}>
                        {report.project.name}
                      </p>
                    )}

                    <div className="flex items-center" style={{ gap: 12, marginTop: 8 }}>
                      <span className="flex items-center" style={{ gap: 4, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        <Calendar size={12} />
                        {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span
                        className="flex items-center"
                        style={{
                          gap: 4,
                          fontSize: 'var(--text-xs)',
                          color: report.isPublic ? 'var(--accent-text)' : 'var(--text-tertiary)',
                        }}
                      >
                        {report.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                        {report.isPublic ? 'Public' : 'Private'}
                      </span>
                      <span className="flex items-center" style={{ gap: 4, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        <CheckCircle2 size={12} />
                        {report.sections.length} sections
                      </span>
                    </div>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === report.id ? null : report.id);
                      }}
                      className="flex items-center justify-center border-none bg-transparent cursor-pointer"
                      style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--surface-active)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-tertiary)';
                      }}
                    >
                      <MoreHorizontal size={16} />
                    </button>

                    {menuOpenId === report.id && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 32,
                          right: 0,
                          width: 160,
                          backgroundColor: 'var(--bg-elevated)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-md)',
                          boxShadow: 'var(--shadow-elevated)',
                          zIndex: 50,
                          overflow: 'hidden',
                          padding: '4px 0',
                        }}
                      >
                        {report.shareToken ? (
                          <MenuButton icon={Copy} label="Copy link" onClick={() => handleCopyLink(report)} />
                        ) : (
                          <MenuButton icon={Share2} label="Generate link" onClick={() => handleShare(report.id)} />
                        )}
                        <MenuButton icon={ExternalLink} label="Preview" onClick={() => setMenuOpenId(null)} />
                        <MenuButton
                          icon={Trash2}
                          label="Delete"
                          danger
                          onClick={() => {
                            setDeleteConfirmId(report.id);
                            setMenuOpenId(null);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Report Dialog */}
      {createOpen && (
        <CreateReportDialog onClose={() => setCreateOpen(false)} />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div
          className="flex items-center justify-center"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 100,
          }}
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              width: 400,
              maxWidth: '90vw',
            }}
          >
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px' }}>
              Delete report
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '0 0 20px' }}>
              This report and its share link will be permanently deleted. This action cannot be undone.
            </p>
            <div className="flex justify-end" style={{ gap: 8 }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="border-none cursor-pointer"
                style={{
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface-hover)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleteReport.isPending}
                className="flex items-center border-none cursor-pointer"
                style={{
                  height: 36,
                  padding: '0 14px',
                  gap: 6,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--error)',
                  color: '#fff',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  fontFamily: 'var(--font-sans)',
                  opacity: deleteReport.isPending ? 0.7 : 1,
                }}
              >
                {deleteReport.isPending && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MenuButton({ icon: Icon, label, danger, onClick }: {
  icon: React.ComponentType<{ size: number }>;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center w-full border-none bg-transparent cursor-pointer"
      style={{
        height: 32,
        padding: '0 12px',
        gap: 8,
        fontSize: 'var(--text-sm)',
        color: danger ? 'var(--error)' : 'var(--text-secondary)',
        fontFamily: 'var(--font-sans)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <Icon size={14} />
      <span>{label}</span>
    </button>
  );
}

function CreateReportDialog({ onClose }: { onClose: () => void }) {
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const createReport = useCreateReport();
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(['overview', 'speed', 'seo', 'recommendations']),
  );

  const handleToggleSection = (type: string) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleCreate = () => {
    if (!projectId || !title.trim()) return;
    createReport.mutate(
      {
        projectId,
        title: title.trim(),
        sections: SECTION_OPTIONS
          .filter((s) => selectedSections.has(s.type))
          .map((s) => ({ title: s.title, type: s.type })),
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <div
      className="flex items-center justify-center"
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          width: 480,
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)' }}>
          <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            New Handoff Report
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center border-none bg-transparent cursor-pointer"
            style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
              Report title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q1 2026 Launch Report"
              style={{
                width: '100%',
                height: 36,
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
            />
          </div>

          {/* Project selector */}
          <div>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
              Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              style={{
                width: '100%',
                height: 36,
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-primary)',
                color: projectId ? 'var(--text-primary)' : 'var(--text-tertiary)',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                boxSizing: 'border-box',
                cursor: 'pointer',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
            >
              <option value="">Select a project</option>
              {loadingProjects && <option disabled>Loading projects...</option>}
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Sections */}
          <div>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
              Sections to include
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SECTION_OPTIONS.map((section) => (
                <label
                  key={section.type}
                  className="flex items-center cursor-pointer"
                  style={{
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: selectedSections.has(section.type) ? 'var(--accent-subtle)' : 'transparent',
                    transition: 'background-color var(--duration-fast)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedSections.has(section.type)}
                    onChange={() => handleToggleSection(section.type)}
                    style={{
                      width: 16,
                      height: 16,
                      accentColor: 'var(--accent)',
                      cursor: 'pointer',
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {section.title}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                      {section.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end" style={{ padding: '12px 20px', borderTop: '1px solid var(--border-default)', gap: 8 }}>
          <button
            onClick={onClose}
            className="border-none cursor-pointer"
            style={{
              height: 36,
              padding: '0 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--surface-hover)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!projectId || !title.trim() || selectedSections.size === 0 || createReport.isPending}
            className="flex items-center border-none cursor-pointer"
            style={{
              height: 36,
              padding: '0 14px',
              gap: 6,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent)',
              color: '#fff',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              opacity: (!projectId || !title.trim() || selectedSections.size === 0 || createReport.isPending) ? 0.5 : 1,
            }}
          >
            {createReport.isPending && <Loader2 size={14} className="animate-spin" />}
            Create report
          </button>
        </div>
      </div>
    </div>
  );
}
