import { useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Upload, Monitor, Tablet, Smartphone, Check,
  ExternalLink, Zap,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { useProjects } from '@/hooks/use-projects';
import { useWorkflow } from '@/hooks/use-workflow';
import { WebflowPreview } from '@/components/modules/figma/webflow-preview';
import { PrePushReview } from '@/components/modules/figma/pre-push-review';
import { FigmaPushDialog } from '@/components/modules/figma/figma-push-dialog';
import type { ParsedNode } from '@/types/figma';

interface FlatNode {
  id: string;
  name: string;
  type: string;
  className?: string;
  htmlTag?: string;
  children?: FlatNode[];
}

function toFlatNodes(node: ParsedNode): FlatNode[] {
  const convert = (n: ParsedNode): FlatNode => ({
    id: n.id,
    name: n.name,
    type: n.type,
    className: n.suggestedClass || undefined,
    htmlTag: n.type,
    children: n.children.map(convert),
  });
  return [convert(node)];
}

type PreviewSize = 'desktop' | 'tablet' | 'mobile';

const PREVIEW_SIZES: { key: PreviewSize; icon: typeof Monitor; label: string; width: string }[] = [
  { key: 'desktop', icon: Monitor, label: 'Desktop', width: '100%' },
  { key: 'tablet', icon: Tablet, label: 'Tablet', width: '768px' },
  { key: 'mobile', icon: Smartphone, label: 'Mobile', width: '375px' },
];

function collectClassNames(node: ParsedNode): string[] {
  const classes: string[] = [];
  if (node.suggestedClass) classes.push(node.suggestedClass);
  node.children.forEach((c) => classes.push(...collectClassNames(c)));
  return classes;
}

function collectImageNodes(node: ParsedNode): string[] {
  const images: string[] = [];
  const type = node.type.toLowerCase();
  if (type === 'image' || type === 'img' || node.figmaType === 'RECTANGLE') {
    images.push(node.name);
  }
  node.children.forEach((c) => images.push(...collectImageNodes(c)));
  return images;
}

function collectHeadings(node: ParsedNode): { tag: string; name: string }[] {
  const headings: { tag: string; name: string }[] = [];
  const tag = node.type?.toLowerCase();
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
    headings.push({ tag, name: node.name });
  }
  node.children.forEach((c) => headings.push(...collectHeadings(c)));
  return headings;
}

export default function ProjectReviewPage() {
  usePageTitle('Review & Push');
  const { projectId } = useParams<{ projectId: string }>();
  const { data: projects } = useProjects();
  const project = projects?.find((p) => p.id === projectId) ?? null;

  const { analysis, nodeStyleOverrides, nodeAnimations } = useWorkflow();

  const [pushDialogOpen, setPushDialogOpen] = useState(false);
  const [showReview, setShowReview] = useState(true);
  const [previewSize, setPreviewSize] = useState<PreviewSize>('desktop');
  const [pushSuccess] = useState(false);
  const [includeStyles, setIncludeStyles] = useState(true);
  const [includeAnimations, setIncludeAnimations] = useState(true);

  const flatNodes = useMemo(() => {
    if (!analysis) return [];
    return toFlatNodes(analysis.structure);
  }, [analysis]);

  const animationsForReview = useMemo(() => {
    const result: Record<string, { config: Record<string, unknown>; engine: string; trigger: string; presetId?: string }> = {};
    for (const [nodeId, anim] of Object.entries(nodeAnimations)) {
      result[nodeId] = {
        config: anim.config as unknown as Record<string, unknown>,
        engine: anim.engine,
        trigger: anim.trigger,
        presetId: anim.presetId,
      };
    }
    return result;
  }, [nodeAnimations]);

  const allClassNames = useMemo(() => {
    if (!analysis) return [];
    return [...new Set(collectClassNames(analysis.structure))];
  }, [analysis]);

  const imageNodes = useMemo(() => {
    if (!analysis) return [];
    return collectImageNodes(analysis.structure);
  }, [analysis]);

  const headings = useMemo(() => {
    if (!analysis) return [];
    return collectHeadings(analysis.structure);
  }, [analysis]);

  const handlePushFromReview = useCallback(() => {
    setPushDialogOpen(true);
  }, []);

  if (!analysis) {
    return (
      <div>
        <PageHeader title="Review & Push" description="No analysis loaded." />
        <div className="flex flex-col items-center justify-center" style={{ padding: 48, gap: 12, color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
          <span>Import a Figma file first.</span>
          <Link to={`/project/${projectId}/figma`} className="flex items-center" style={{ height: 32, padding: '0 14px', gap: 6, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--accent)', color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-sans)' }}>
            <ArrowLeft size={13} />
            Go to Import
          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div>
        <PageHeader title="Review & Push" description="Project not found." />
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)' }}>
          <Link to="/" style={{ color: 'var(--accent-text)', textDecoration: 'none' }}>Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  // Post-push success state
  if (pushSuccess) {
    return (
      <>
        <PageHeader title="Review & Push" description={`Step 5 of 5 — ${project.name}`} />
        <div
          className="flex flex-col items-center justify-center"
          style={{ padding: '80px 24px', gap: 16, animation: 'fadeIn 300ms ease-out' }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 56, height: 56, borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
            }}
          >
            <Check size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Pushed to Webflow
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', margin: 0, maxWidth: 400, textAlign: 'center', lineHeight: 'var(--leading-normal)' }}>
            Your structure has been pushed to Webflow. Open the Webflow Designer to review and adjust.
          </p>
          <div className="flex items-center" style={{ gap: 8, marginTop: 8 }}>
            <a
              href={`https://webflow.com/design/${project.webflowSiteId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
              style={{
                height: 36, padding: '0 16px', gap: 6,
                borderRadius: 'var(--radius-md)', backgroundColor: 'var(--accent)',
                color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 500,
                textDecoration: 'none', fontFamily: 'var(--font-sans)',
              }}
            >
              <ExternalLink size={14} />
              Open in Webflow
            </a>
            <Link
              to={`/project/${projectId}/setup`}
              className="flex items-center"
              style={{
                height: 36, padding: '0 16px', gap: 6,
                borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)',
                backgroundColor: 'transparent', color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)', fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-sans)',
              }}
            >
              <Zap size={14} />
              Generate Master Script
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Review & Push"
        description={`Step 5 of 5 — ${project.name}`}
        actions={
          <div className="flex items-center" style={{ gap: 8 }}>
            <Link
              to={`/project/${projectId}/style`}
              className="flex items-center"
              style={{
                height: 32, padding: '0 10px', gap: 6,
                borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)',
                backgroundColor: 'transparent', color: 'var(--text-secondary)',
                fontSize: 'var(--text-xs)', fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-sans)',
              }}
            >
              <ArrowLeft size={13} />
              Style
            </Link>

            <button
              onClick={() => setPushDialogOpen(true)}
              className="flex items-center cursor-pointer border-none"
              style={{
                height: 32, padding: '0 14px', gap: 6,
                borderRadius: 'var(--radius-md)', backgroundColor: 'var(--accent)',
                color: '#fff', fontSize: 'var(--text-xs)', fontWeight: 500,
                fontFamily: 'var(--font-sans)', transition: 'background-color var(--duration-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
            >
              <Upload size={13} />
              Push to Webflow
            </button>
          </div>
        }
      />

      <div
        className="flex flex-col"
        style={{ padding: '0 24px 24px', gap: 16, width: '100%' }}
      >
        {/* Responsive preview toggles */}
        <div className="flex items-center justify-center" style={{ gap: 4, padding: '4px 0' }}>
          {PREVIEW_SIZES.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setPreviewSize(key)}
              title={label}
              className="flex items-center justify-center cursor-pointer"
              style={{
                width: 32, height: 32,
                borderRadius: 'var(--radius-md)',
                border: previewSize === key ? '1px solid var(--accent)' : '1px solid var(--border-default)',
                backgroundColor: previewSize === key ? 'var(--accent-subtle)' : 'transparent',
                color: previewSize === key ? 'var(--accent-text)' : 'var(--text-tertiary)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>

        {/* Preview container with responsive width */}
        <div
          className="flex flex-col"
          style={{
            flex: 1,
            minHeight: 300,
            maxHeight: 'calc(100vh - 420px)',
            width: PREVIEW_SIZES.find((s) => s.key === previewSize)?.width ?? '100%',
            maxWidth: '100%',
            margin: '0 auto',
            transition: 'width 200ms ease',
          }}
        >
          <WebflowPreview structure={analysis.structure} title={`Preview — ${previewSize}`} />
        </div>

        {/* Review sections */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          <ReviewCard title="Class Names" count={allClassNames.length}>
            {allClassNames.length === 0 ? (
              <span style={reviewEmptyStyle}>No classes defined.</span>
            ) : (
              <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                {allClassNames.map((cls) => (
                  <div key={cls} style={{ padding: '3px 0', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    .{cls}
                  </div>
                ))}
              </div>
            )}
          </ReviewCard>

          <ReviewCard title="Images" count={imageNodes.length}>
            {imageNodes.length === 0 ? (
              <span style={reviewEmptyStyle}>No images detected.</span>
            ) : (
              <>
                <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                  {imageNodes.map((imgName, i) => (
                    <div key={i} style={{ padding: '3px 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      {imgName}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '8px 0 0', fontStyle: 'italic' }}>
                  Upload these images to Webflow after push.
                </p>
              </>
            )}
          </ReviewCard>

          <ReviewCard title="Accessibility" count={headings.length > 0 ? headings.length : undefined}>
            {headings.length === 0 ? (
              <span style={reviewEmptyStyle}>No heading hierarchy detected.</span>
            ) : (
              <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                {headings.map((h, i) => (
                  <div key={i} className="flex items-center" style={{ padding: '3px 0', gap: 6, fontSize: 'var(--text-xs)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-text)', width: 24 }}>
                      {h.tag.toUpperCase()}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{h.name}</span>
                  </div>
                ))}
              </div>
            )}
          </ReviewCard>
        </div>

        {/* Push options */}
        <div
          style={{
            padding: 16,
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px' }}>
            Push Options
          </h4>
          <div className="flex items-center" style={{ gap: 16 }}>
            <label className="flex items-center cursor-pointer" style={{ gap: 6, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={includeStyles} onChange={(e) => setIncludeStyles(e.target.checked)} />
              Include styles
            </label>
            <label className="flex items-center cursor-pointer" style={{ gap: 6, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={includeAnimations} onChange={(e) => setIncludeAnimations(e.target.checked)} />
              Include animations
            </label>
          </div>
        </div>

        {/* Pre-push review panel */}
        {showReview && (
          <div style={{ flexShrink: 0 }}>
            <PrePushReview
              nodes={flatNodes}
              nodeStyleOverrides={nodeStyleOverrides as Record<string, Record<string, string>>}
              nodeAnimations={animationsForReview}
              onPush={handlePushFromReview}
              onCancel={() => setShowReview(false)}
            />
          </div>
        )}

        {!showReview && (
          <div className="flex justify-center" style={{ padding: '8px 0' }}>
            <button
              onClick={() => setShowReview(true)}
              className="flex items-center cursor-pointer"
              style={{
                height: 32, padding: '0 14px', gap: 6,
                borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)',
                backgroundColor: 'transparent', color: 'var(--text-secondary)',
                fontSize: 'var(--text-xs)', fontWeight: 500, fontFamily: 'var(--font-sans)',
              }}
            >
              Show Pre-Push Review
            </button>
          </div>
        )}
      </div>

      {pushDialogOpen && (
        <FigmaPushDialog
          analysis={analysis}
          project={project}
          onClose={() => setPushDialogOpen(false)}
        />
      )}
    </>
  );
}

function ReviewCard({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </h4>
        {count !== undefined && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

const reviewEmptyStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--text-tertiary)',
};
