import { useState, useMemo } from 'react';
import {
  FileText, Plus, ExternalLink, Copy, Trash2, MoreHorizontal,
  Calendar, Lock, Globe, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';

interface HandoffReport {
  id: string;
  title: string;
  projectName: string;
  sections: { title: string; type: string }[];
  isPublic: boolean;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
}

// Demo data for UI rendering — will be replaced with API calls
const DEMO_REPORTS: HandoffReport[] = [];

export default function ReportsPage() {
  usePageTitle('Handoff Reports');
  const [reports] = useState<HandoffReport[]>(DEMO_REPORTS);
  const [createOpen, setCreateOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

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
        {/* Empty state */}
        {reports.length === 0 && (
          <div
            className="flex flex-col items-center justify-center"
            style={{
              height: 400,
              animation: 'fadeIn 200ms ease-out',
            }}
          >
            <FileText
              size={48}
              style={{ color: 'var(--text-tertiary)', marginBottom: 16 }}
              strokeWidth={1}
            />
            <p
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: 4,
              }}
            >
              No reports yet
            </p>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                maxWidth: 360,
                textAlign: 'center',
                marginBottom: 20,
              }}
            >
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
          </div>
        )}

        {/* Reports list */}
        {reports.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              animation: 'fadeIn 200ms ease-out',
            }}
          >
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  setMenuOpenId(null);
                }}
              >
                <div className="flex items-start justify-between">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center" style={{ gap: 8, marginBottom: 4 }}>
                      <FileText size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      <h3
                        style={{
                          fontSize: 'var(--text-base)',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          margin: 0,
                        }}
                      >
                        {report.title}
                      </h3>
                    </div>

                    <div className="flex items-center" style={{ gap: 12, marginTop: 8 }}>
                      <span
                        className="flex items-center"
                        style={{
                          gap: 4,
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        <Calendar size={12} />
                        {new Date(report.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
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
                      <span
                        className="flex items-center"
                        style={{
                          gap: 4,
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-tertiary)',
                        }}
                      >
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
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-tertiary)',
                      }}
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
                        {report.shareToken && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(
                                `${window.location.origin}/report/${report.shareToken}`,
                              );
                              toast.success('Share link copied');
                              setMenuOpenId(null);
                            }}
                            className="flex items-center w-full border-none bg-transparent cursor-pointer"
                            style={{
                              height: 32,
                              padding: '0 12px',
                              gap: 8,
                              fontSize: 'var(--text-sm)',
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
                            <Copy size={14} />
                            <span>Copy link</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(null);
                          }}
                          className="flex items-center w-full border-none bg-transparent cursor-pointer"
                          style={{
                            height: 32,
                            padding: '0 12px',
                            gap: 8,
                            fontSize: 'var(--text-sm)',
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
                          <ExternalLink size={14} />
                          <span>Preview</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(null);
                          }}
                          className="flex items-center w-full border-none bg-transparent cursor-pointer"
                          style={{
                            height: 32,
                            padding: '0 12px',
                            gap: 8,
                            fontSize: 'var(--text-sm)',
                            color: 'var(--error)',
                            fontFamily: 'var(--font-sans)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
