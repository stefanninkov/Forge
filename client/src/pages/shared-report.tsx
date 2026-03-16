import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  FileText, Calendar, Globe, CheckCircle2, AlertTriangle,
  Gauge, Search, Bot, Loader2, Printer, ExternalLink,
} from 'lucide-react';

interface ReportSection {
  title: string;
  type: string;
  content?: string;
}

interface SharedReport {
  id: string;
  title: string;
  project: { id: string; name: string };
  sections: ReportSection[];
  createdAt: string;
  sharedAt: string;
}

export default function SharedReportPage() {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<SharedReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const apiUrl = import.meta.env.VITE_API_URL || '/api';

    fetch(`${apiUrl}/reports/shared/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error?.message || 'Report not found');
        }
        return res.json();
      })
      .then((data) => {
        setReport(data.data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load report');
        setIsLoading(false);
      });
  }, [token]);

  if (isLoading) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.centered}>
          <Loader2 size={24} className="animate-spin" style={{ color: '#6b7280' }} />
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.centered}>
          <AlertTriangle size={48} style={{ color: '#ef4444', marginBottom: 16 }} strokeWidth={1} />
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: '0 0 8px' }}>
            Report not found
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 360, textAlign: 'center' }}>
            {error || 'This report link may have expired or been removed.'}
          </p>
        </div>
      </div>
    );
  }

  const sectionIcons: Record<string, typeof FileText> = {
    overview: Globe,
    speed: Gauge,
    seo: Search,
    aeo: Bot,
    recommendations: CheckCircle2,
  };

  return (
    <div style={styles.pageContainer}>
      {/* Print-friendly header */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={styles.logoMark}>F</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', fontFamily: "'Geist', sans-serif" }}>
              Forge
            </span>
          </div>
          <button
            onClick={() => window.print()}
            style={styles.printButton}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <Printer size={14} />
            Print
          </button>
        </div>
      </div>

      {/* Report content */}
      <div style={styles.content}>
        {/* Title block */}
        <div style={styles.titleBlock}>
          <h1 style={styles.title}>{report.title}</h1>
          <div style={styles.metaRow}>
            <span style={styles.metaItem}>
              <FileText size={14} />
              {report.project.name}
            </span>
            <span style={styles.metaItem}>
              <Calendar size={14} />
              {new Date(report.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span style={styles.metaItem}>
              <CheckCircle2 size={14} />
              {report.sections.length} sections
            </span>
          </div>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {report.sections.map((section, idx) => {
            const Icon = sectionIcons[section.type] || FileText;
            return (
              <div key={idx} style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <Icon size={18} style={{ color: '#059669' }} />
                  <h2 style={styles.sectionTitle}>{section.title}</h2>
                </div>
                <div style={styles.sectionContent}>
                  {section.content ? (
                    <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0 }}>
                      {section.content}
                    </p>
                  ) : (
                    <p style={{ fontSize: 14, color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
                      No data available for this section. Run the relevant audit to populate this content.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
            Generated by Forge — Webflow Development Accelerator
          </p>
          <a
            href="/"
            style={{ fontSize: 12, color: '#059669', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            Open in Forge
            <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          button { display: none !important; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  header: {
    position: 'sticky',
    top: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid #e5e7eb',
    zIndex: 10,
  },
  headerInner: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoMark: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#059669',
    color: 'white',
    fontSize: 13,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    height: 32,
    padding: '0 12px',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    backgroundColor: 'transparent',
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
    cursor: 'pointer',
    fontFamily: "'Geist', sans-serif",
  },
  content: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '32px 24px 64px',
    animation: 'fadeIn 300ms ease-out',
  },
  titleBlock: {
    marginBottom: 32,
    paddingBottom: 24,
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 12px',
    lineHeight: 1.2,
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 16,
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: '#6b7280',
  },
  sectionCard: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 20px',
    borderBottom: '1px solid #f3f4f6',
    backgroundColor: '#fafafa',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  sectionContent: {
    padding: 20,
  },
  footer: {
    marginTop: 48,
    paddingTop: 24,
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
};
