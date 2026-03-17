import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams, Link } from 'react-router-dom';
import {
  Check, X, ArrowRight, Loader2, Trash2, Archive,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useProjects, useUpdateProject, useDeleteProject } from '@/hooks/use-projects';
import { useTokenVault } from '@/hooks/use-integrations';
import { useWebflowSites } from '@/hooks/use-webflow-push';
import { ScalingConfigEditor } from '@/components/shared/editors/scaling-config';
import { updateDocument } from '@/lib/firestore';
import { toast } from 'sonner';
import type { ScalingConfig } from '@/lib/scaling-system';

export default function SetupPage() {
  usePageTitle('Setup');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams<{ projectId: string }>();
  const queryProjectId = params.projectId ?? searchParams.get('project');
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: vault } = useTokenVault();
  const { data: sites, isLoading: sitesLoading } = useWebflowSites(webflowTokenId || undefined);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

  // Project selection
  const projectId = queryProjectId ?? projects?.[0]?.id ?? null;
  const project = projects?.find((p) => p.id === projectId) ?? null;

  // Local state for editable fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultUnit, setDefaultUnit] = useState<string>('px');
  const [figmaTokenId, setFigmaTokenId] = useState('');
  const [webflowTokenId, setWebflowTokenId] = useState('');
  const [webflowSiteId, setWebflowSiteId] = useState('');
  const [anthropicTokenId, setAnthropicTokenId] = useState('');
  const [scalingConfig, setScalingConfig] = useState<ScalingConfig | undefined>(undefined);

  // Sync from project data
  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description ?? '');
      setDefaultUnit((project as unknown as Record<string, unknown>).defaultUnit as string ?? 'px');
      setFigmaTokenId(project.figmaTokenId ?? '');
      setWebflowTokenId(project.webflowTokenId ?? '');
      setWebflowSiteId(project.webflowSiteId ?? '');
      setAnthropicTokenId(project.anthropicTokenId ?? '');
      setScalingConfig((project as unknown as Record<string, unknown>).scalingConfig as ScalingConfig | undefined);
    }
  }, [project]);

  const figmaTokens = vault?.figma ?? [];
  const webflowTokens = vault?.webflow ?? [];
  const anthropicTokens = vault?.anthropic ?? [];

  const canContinue = !!figmaTokenId && !!webflowTokenId && !!webflowSiteId;

  // Auto-save connection changes
  const handleConnectionChange = async (field: string, value: string) => {
    if (!projectId) return;
    await updateDocument('projects', projectId, { [field]: value || null });
    toast.success('Connection updated');
  };

  const handleSaveInfo = () => {
    if (!projectId) return;
    updateProject.mutate({
      id: projectId,
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  const handleArchive = async () => {
    if (!projectId) return;
    await updateDocument('projects', projectId, { isArchived: true });
    setArchiveConfirmOpen(false);
    toast.success('Project archived');
    navigate('/');
  };

  const handleDelete = () => {
    if (!projectId) return;
    deleteProject.mutate(projectId, {
      onSuccess: () => {
        setDeleteConfirmOpen(false);
        navigate('/');
      },
    });
  };

  const handleScalingChange = async (config: ScalingConfig) => {
    setScalingConfig(config);
    if (!projectId) return;
    await updateDocument('projects', projectId, { scalingConfig: config });
  };

  const handleDefaultUnitChange = async (unit: string) => {
    setDefaultUnit(unit);
    if (!projectId) return;
    await updateDocument('projects', projectId, { defaultUnit: unit });
    toast.success('Default unit updated');
  };

  if (projectsLoading) {
    return (
      <div>
        <PageHeader title="Project Setup" description="Loading..." />
        <div style={{ padding: 24 }}>
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div>
        <PageHeader title="Project Setup" description="Select a project." />
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
          No project selected. Go to the dashboard and select a project.
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Project Setup"
        description={`Configure ${project.name}`}
      />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px 48px' }}>
        {/* ── Section A: Connections ── */}
        <SectionCard title="Connections" description="Link your project to external services.">
          <div className="flex flex-col" style={{ gap: 12 }}>
            <ConnectionRow
              label="Figma"
              required
              value={figmaTokenId}
              options={figmaTokens.map((t) => ({ value: t.id, label: t.label }))}
              connected={!!figmaTokenId}
              onChange={(v) => { setFigmaTokenId(v); handleConnectionChange('figmaTokenId', v); }}
              emptyLabel="No Figma tokens"
            />
            <ConnectionRow
              label="Webflow"
              required
              value={webflowTokenId}
              options={webflowTokens.map((t) => ({ value: t.id, label: t.label }))}
              connected={!!webflowTokenId}
              onChange={(v) => { setWebflowTokenId(v); handleConnectionChange('webflowTokenId', v); }}
              emptyLabel="No Webflow tokens"
            />
            {webflowTokenId && (
              <ConnectionRow
                label="Webflow Site"
                required
                value={webflowSiteId}
                options={(sites ?? []).map((s) => ({ value: s.id, label: s.displayName || s.shortName }))}
                connected={!!webflowSiteId}
                onChange={(v) => { setWebflowSiteId(v); handleConnectionChange('webflowSiteId', v); }}
                emptyLabel={sitesLoading ? 'Loading sites...' : 'No sites found'}
                loading={sitesLoading}
              />
            )}
            <ConnectionRow
              label="Anthropic (AI)"
              value={anthropicTokenId}
              options={anthropicTokens.map((t) => ({ value: t.id, label: t.label }))}
              connected={!!anthropicTokenId}
              onChange={(v) => { setAnthropicTokenId(v); handleConnectionChange('anthropicTokenId', v); }}
              emptyLabel="No Anthropic tokens"
              hint="Optional"
            />
          </div>
          <Link
            to="/settings"
            style={{
              display: 'inline-block',
              marginTop: 12,
              fontSize: 'var(--text-xs)',
              color: 'var(--accent-text)',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
          >
            Manage tokens in Settings → Integrations
          </Link>
        </SectionCard>

        {/* ── Section B: Scaling System ── */}
        <SectionCard title="Scaling System" description="Configure REM-based responsive scaling.">
          <ScalingConfigEditor
            config={scalingConfig}
            onConfigChange={handleScalingChange}
          />
        </SectionCard>

        {/* ── Section C: Project Info ── */}
        <SectionCard title="Project Info" description="Basic project details.">
          <div className="flex flex-col" style={{ gap: 12 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleSaveInfo}
                style={inputStyle}
                onFocus={inputFocus}
              />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSaveInfo}
                placeholder="Optional"
                style={inputStyle}
                onFocus={inputFocus}
              />
            </div>
            <div>
              <label style={labelStyle}>Default Unit</label>
              <select
                value={defaultUnit}
                onChange={(e) => handleDefaultUnitChange(e.target.value)}
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
                <option value="px">px</option>
                <option value="rem">rem</option>
                <option value="em">em</option>
              </select>
            </div>
          </div>
        </SectionCard>

        {/* ── Continue button ── */}
        <div style={{ marginTop: 24 }}>
          <button
            onClick={() => navigate(params.projectId ? `/project/${projectId}/figma` : `/figma?project=${projectId}`)}
            disabled={!canContinue}
            className="flex items-center border-none cursor-pointer"
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
              opacity: canContinue ? 1 : 0.4,
              transition: 'all var(--duration-fast)',
              width: '100%',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              if (canContinue) e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent)';
            }}
          >
            {canContinue ? (
              <>Continue to Import <ArrowRight size={16} /></>
            ) : (
              'Connect Figma and Webflow to continue'
            )}
          </button>
        </div>

        {/* ── Section D: Danger Zone ── */}
        <div
          style={{
            marginTop: 40,
            padding: 20,
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--error)',
            backgroundColor: 'color-mix(in srgb, var(--error) 4%, var(--bg-primary))',
          }}
        >
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--error)', margin: '0 0 12px' }}>
            Danger Zone
          </h3>
          <div className="flex" style={{ gap: 8 }}>
            <button
              onClick={() => setArchiveConfirmOpen(true)}
              className="flex items-center cursor-pointer"
              style={{
                height: 32,
                padding: '0 12px',
                gap: 6,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Archive size={14} />
              Archive project
            </button>
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="flex items-center cursor-pointer"
              style={{
                height: 32,
                padding: '0 12px',
                gap: 6,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--error)',
                backgroundColor: 'transparent',
                color: 'var(--error)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--error)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--error)';
              }}
            >
              <Trash2 size={14} />
              Delete project
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={archiveConfirmOpen}
        title="Archive project"
        description={`Archive "${project.name}"? It will be hidden from the dashboard but can be restored later.`}
        confirmLabel="Archive"
        onConfirm={handleArchive}
        onCancel={() => setArchiveConfirmOpen(false)}
      />
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete project"
        description={`Are you sure you want to delete "${project.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
        loading={deleteProject.isPending}
        destructive
      />
    </>
  );
}

/* ─── Section wrapper ─── */
function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginTop: 24,
        padding: 20,
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px' }}>
        {title}
      </h3>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', margin: '0 0 16px' }}>
        {description}
      </p>
      {children}
    </div>
  );
}

/* ─── Connection row ─── */
function ConnectionRow({
  label,
  required,
  hint,
  value,
  options,
  connected,
  onChange,
  emptyLabel,
  loading,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  value: string;
  options: { value: string; label: string }[];
  connected: boolean;
  onChange: (value: string) => void;
  emptyLabel: string;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center" style={{ gap: 12 }}>
      <div style={{ width: 120, flexShrink: 0 }}>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
          {label}
        </span>
        {required && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--error)', marginLeft: 4 }}>*</span>
        )}
        {hint && (
          <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            {hint}
          </span>
        )}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        style={{
          flex: 1,
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
          opacity: loading ? 0.6 : 1,
        }}
      >
        <option value="">{options.length === 0 ? emptyLabel : 'Select...'}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div style={{ width: 20, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        {connected ? (
          <Check size={16} style={{ color: 'var(--accent)' }} />
        ) : required ? (
          <X size={14} style={{ color: 'var(--text-tertiary)' }} />
        ) : null}
      </div>
    </div>
  );
}

/* ─── Shared styles ─── */
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--text-sm)',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
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
  boxSizing: 'border-box',
};

const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = 'var(--accent)';
  e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-subtle)';
};
