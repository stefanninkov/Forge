import { useState, useCallback, useMemo } from 'react';
import { Download, Loader2, Plus, ArrowLeftRight, LayoutGrid, Globe } from 'lucide-react';
import { SkeletonTemplateGrid } from '@/components/shared/skeleton';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { TemplateCard } from '@/components/modules/templates/template-card';
import { TemplateFiltersBar } from '@/components/modules/templates/template-filters';
import { TemplateDetailPanel } from '@/components/modules/templates/template-detail-panel';
import { CreateTemplateDialog } from '@/components/modules/templates/create-template-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { TemplateDiffPanel } from '@/components/modules/templates/template-diff-panel';
import { UrlCaptureDialog } from '@/components/modules/templates/url-capture-dialog';
import { TemplateFolders } from '@/components/modules/templates/template-folders';
import type { TemplateFolder } from '@/components/modules/templates/template-folders';
import {
  useTemplates,
  useCreateTemplate,
  useSeedTemplates,
  useDeleteTemplate,
  useDuplicateTemplate,
} from '@/hooks/use-templates';
import type { TemplateSummary, TemplateFilters } from '@/types/template';

export default function TemplatesPage() {
  usePageTitle('Templates');

  const [filters, setFilters] = useState<TemplateFilters>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TemplateSummary | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const [diffTemplateId, setDiffTemplateId] = useState<string | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);

  // Folder state
  const [folders, setFolders] = useState<TemplateFolder[]>([
    { id: 'uncategorized', name: 'Uncategorized', count: 0 },
  ]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [templateFolderMap, setTemplateFolderMap] = useState<Record<string, string>>({});

  const { data: templates, isLoading, error } = useTemplates(filters);
  const createMutation = useCreateTemplate();
  const seedMutation = useSeedTemplates();
  const deleteMutation = useDeleteTemplate();
  const duplicateMutation = useDuplicateTemplate();

  const templateList = useMemo(() => templates ?? [], [templates]);

  // Compute folder counts from current templates
  const foldersWithCounts = useMemo(() => {
    return folders.map((f) => ({
      ...f,
      count: templateList.filter((t) => templateFolderMap[t.id] === f.id).length,
    }));
  }, [folders, templateList, templateFolderMap]);

  // Filter templates by active folder
  const filteredByFolder = useMemo(() => {
    if (activeFolder === null) return templateList;
    return templateList.filter((t) => templateFolderMap[t.id] === activeFolder);
  }, [templateList, activeFolder, templateFolderMap]);

  const isEmpty = !isLoading && filteredByFolder.length === 0;
  const hasNoTemplates =
    !isLoading &&
    !error &&
    templateList.length === 0 &&
    !filters.category &&
    !filters.type &&
    !filters.search;

  const handleSelect = useCallback((t: TemplateSummary) => {
    setSelectedId(t.id);
    setDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
    setTimeout(() => setSelectedId(null), 200);
  }, []);

  const handleDuplicate = useCallback(
    (t: TemplateSummary) => {
      duplicateMutation.mutate(t.id);
    },
    [duplicateMutation],
  );

  const handleDuplicateFromPanel = useCallback(
    (id: string) => {
      duplicateMutation.mutate(id);
      handleCloseDetail();
    },
    [duplicateMutation, handleCloseDetail],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }, [deleteTarget, deleteMutation]);

  const handleSeed = useCallback(() => {
    seedMutation.mutate();
  }, [seedMutation]);

  const handleCreateFolder = useCallback((name: string) => {
    const id = `folder-${Date.now()}`;
    setFolders((prev) => [...prev, { id, name, count: 0 }]);
  }, []);

  const handleRenameFolder = useCallback((id: string, name: string) => {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
  }, []);

  const handleDeleteFolder = useCallback(
    (id: string) => {
      setFolders((prev) => prev.filter((f) => f.id !== id));
      // Unassign templates from deleted folder
      setTemplateFolderMap((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          if (next[key] === id) {
            delete next[key];
          }
        }
        return next;
      });
      if (activeFolder === id) {
        setActiveFolder(null);
      }
    },
    [activeFolder],
  );

  return (
    <>
      <PageHeader
        title="Templates"
        description="Browse and manage section templates for your projects."
        actions={
          <div className="flex items-center" style={{ gap: 8 }}>
            <button
              onClick={() => setCaptureOpen(true)}
              className="flex items-center"
              style={{
                gap: 6,
                height: 32,
                padding: '0 12px',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Globe size={13} />
              Capture URL
            </button>
            <button
              onClick={handleSeed}
              disabled={seedMutation.isPending}
              className="flex items-center"
              style={{
                gap: 6,
                height: 32,
                padding: '0 12px',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                cursor: seedMutation.isPending ? 'not-allowed' : 'pointer',
                opacity: seedMutation.isPending ? 0.5 : 1,
                fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={(e) => {
                if (!seedMutation.isPending)
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {seedMutation.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
              Seed Presets
            </button>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center border-none cursor-pointer"
              style={{
                height: 32,
                padding: '0 12px',
                gap: 6,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                fontSize: 'var(--text-xs)',
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
              <Plus size={13} />
              New Template
            </button>
          </div>
        }
      />

      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '20px 24px 40px',
          display: 'flex',
          gap: 20,
        }}
      >
        {/* Folders sidebar */}
        <TemplateFolders
          folders={foldersWithCounts}
          activeFolder={activeFolder}
          onFolderSelect={setActiveFolder}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          totalCount={templateList.length}
        />

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
        {/* Filters */}
        <div style={{ marginBottom: 20 }}>
          <TemplateFiltersBar
            filters={filters}
            onChange={setFilters}
            resultCount={filteredByFolder.length}
          />
        </div>

        {/* Loading */}
        {isLoading && <SkeletonTemplateGrid count={8} />}

        {/* Error */}
        {error && (
          <div
            className="flex items-center justify-center"
            style={{
              height: 300,
              color: 'var(--status-error)',
              fontSize: 'var(--text-sm)',
            }}
          >
            Failed to load templates. Check that the server is running.
          </div>
        )}

        {/* Empty — no templates seeded */}
        {hasNoTemplates && (
          <div
            className="flex flex-col items-center justify-center"
            style={{
              padding: '48px 24px',
              border: '1px dashed var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              gap: 6,
            }}
          >
            <LayoutGrid
              size={36}
              style={{ color: 'var(--text-tertiary)', marginBottom: 8 }}
              strokeWidth={1.5}
            />
            <p
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              No templates yet
            </p>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                margin: '0 0 16px',
                maxWidth: 360,
                textAlign: 'center',
                lineHeight: 'var(--leading-normal)',
              }}
            >
              Templates are reusable section structures you can push directly into Webflow. Seed the built-in presets or create your own.
            </p>
            <div className="flex items-center" style={{ gap: 8 }}>
              <button
                onClick={handleSeed}
                disabled={seedMutation.isPending}
                className="flex items-center"
                style={{
                  gap: 6,
                  height: 36,
                  padding: '0 14px',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  cursor: seedMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: seedMutation.isPending ? 0.6 : 1,
                  fontFamily: 'var(--font-sans)',
                  transition: 'background-color var(--duration-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!seedMutation.isPending)
                    e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                }}
              >
                {seedMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                Seed Presets
              </button>
              <button
                onClick={() => setCreateOpen(true)}
                className="flex items-center"
                style={{
                  gap: 6,
                  height: 36,
                  padding: '0 14px',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'background-color var(--duration-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Plus size={14} />
                Create Template
              </button>
            </div>
          </div>
        )}

        {/* Empty — filters returned nothing */}
        {isEmpty && !hasNoTemplates && (
          <div
            className="flex items-center justify-center"
            style={{
              height: 300,
              border: '1px dashed var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text-tertiary)',
              fontSize: 'var(--text-sm)',
            }}
          >
            No templates match the current filters.
          </div>
        )}

        {/* Template grid */}
        {filteredByFolder.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {filteredByFolder.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onSelect={handleSelect}
                onDuplicate={handleDuplicate}
                onDelete={!t.isPreset ? (tpl) => setDeleteTarget(tpl) : undefined}
                onPublish={() => {}}
              />
            ))}
          </div>
        )}
        </div>{/* end main content */}
      </div>

      {/* Detail panel */}
      <TemplateDetailPanel
        templateId={selectedId}
        open={detailOpen}
        onClose={handleCloseDetail}
        onDuplicate={handleDuplicateFromPanel}
      />

      {/* Create template dialog */}
      <CreateTemplateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(data) => {
          createMutation.mutate(data, {
            onSuccess: () => setCreateOpen(false),
          });
        }}
        loading={createMutation.isPending}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete template"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
        destructive
      />

      {/* URL capture dialog */}
      <UrlCaptureDialog
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
      />
    </>
  );
}
