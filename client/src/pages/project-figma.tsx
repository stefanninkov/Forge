import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowRight, ArrowLeft, FileSearch, Layers } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { useProjects } from '@/hooks/use-projects';
import { useAnalyzeFigma } from '@/hooks/use-figma';
import { useWorkflow } from '@/hooks/use-workflow';
import { toast } from 'sonner';

export default function ProjectFigmaPage() {
  usePageTitle('Import from Figma');
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: projects } = useProjects();
  const project = projects?.find((p) => p.id === projectId) ?? null;
  const analyzeMutation = useAnalyzeFigma();
  const { setAnalysis, setAiSuggestions, reset } = useWorkflow();

  const [url, setUrl] = useState('');
  const [selectedPage, setSelectedPage] = useState('');
  const [pages, setPages] = useState<string[]>([]);

  const handleAnalyze = () => {
    if (!url.trim() || !projectId) return;
    reset();
    analyzeMutation.mutate(
      { projectId, figmaUrl: url.trim(), pageName: selectedPage || undefined },
      {
        onSuccess: (result) => {
          setAnalysis(result);
          setAiSuggestions(null);
          if (result.pages?.length) setPages(result.pages);
          toast.success('Figma file analyzed successfully');
          navigate(`/project/${projectId}/structure`);
        },
        onError: (error) => {
          toast.error((error as Error).message || 'Failed to analyze Figma file');
        },
      },
    );
  };

  const analyzeError = analyzeMutation.isError
    ? (analyzeMutation.error as Error).message
    : null;

  if (!project) {
    return (
      <div>
        <PageHeader title="Import from Figma" description="Project not found." />
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
          <Link to="/" style={{ color: 'var(--accent-text)', textDecoration: 'none' }}>
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Import from Figma"
        description={`Step 2 of 5 — ${project.name}`}
        actions={
          <Link
            to={`/project/${projectId}/setup`}
            className="flex items-center"
            style={{
              height: 32,
              padding: '0 12px',
              gap: 6,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              textDecoration: 'none',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <ArrowLeft size={13} />
            Back to Setup
          </Link>
        }
      />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px' }}>
        {/* Figma URL input card */}
        <div
          style={{
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          <div className="flex items-center" style={{ gap: 8, marginBottom: 16 }}>
            <FileSearch size={18} style={{ color: 'var(--accent)' }} />
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Figma File URL
            </h3>
          </div>

          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', margin: '0 0 16px', lineHeight: 'var(--leading-normal)' }}>
            Paste a Figma file or frame URL. Forge will parse the layer structure and generate a Webflow-ready tree.
          </p>

          <div className="flex flex-col" style={{ gap: 12 }}>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.figma.com/design/..."
              style={{
                width: '100%',
                height: 40,
                padding: '0 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-primary)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-subtle)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAnalyze();
              }}
            />

            {/* Page selector (shown after first analysis or if pages available) */}
            {pages.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                  Page (optional)
                </label>
                <select
                  value={selectedPage}
                  onChange={(e) => setSelectedPage(e.target.value)}
                  style={{
                    width: '100%',
                    height: 36,
                    padding: '0 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-primary)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">All pages</option>
                  {pages.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Error display */}
            {analyzeError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'color-mix(in srgb, var(--error) 6%, var(--bg-primary))',
                  border: '1px solid color-mix(in srgb, var(--error) 20%, transparent)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--error)',
                }}
              >
                {analyzeError}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!url.trim() || analyzeMutation.isPending}
              className="flex items-center justify-center border-none cursor-pointer"
              style={{
                height: 40,
                padding: '0 24px',
                gap: 8,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                fontSize: 'var(--text-base)',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
                opacity: !url.trim() || analyzeMutation.isPending ? 0.5 : 1,
                transition: 'all var(--duration-fast)',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                if (url.trim() && !analyzeMutation.isPending) {
                  e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent)';
              }}
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Layers size={16} />
                  Analyze Figma File
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info card */}
        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
            What happens next
          </h4>
          <div className="flex flex-col" style={{ gap: 6 }}>
            {[
              'Forge parses your Figma layers and generates a Webflow-ready structure tree',
              'You can edit class names, HTML tags, and nest elements',
              'AI Assist suggests semantic improvements and Client-First naming',
              'Add styles and animations before pushing to Webflow',
            ].map((text, i) => (
              <div key={i} className="flex items-start" style={{ gap: 8 }}>
                <ArrowRight size={12} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 3 }} />
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', lineHeight: 'var(--leading-normal)' }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
