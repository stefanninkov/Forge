import { useState, useCallback, useMemo } from 'react';
import { Download, Loader2, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { usePageTitle } from '@/hooks/use-page-title';
import { TemplateCard } from '@/components/modules/templates/template-card';
import { TemplateFiltersBar } from '@/components/modules/templates/template-filters';
import { TemplateDetailPanel } from '@/components/modules/templates/template-detail-panel';
import { CreateTemplateDialog } from '@/components/modules/templates/create-template-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
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

  const { data: templates, isLoading, error } = useTemplates(filters);
  const createMutation = useCreateTemplate();
  const seedMutation = useSeedTemplates();
  const deleteMutation = useDeleteTemplate();
  const duplicateMutation = useDuplicateTemplate();

  const templateList = useMemo(() => templates ?? [], [templates]);
  const isEmpty = !isLoading && templateList.length === 0;
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

  return (
    <>
      <PageHeader
        title="Templates"
        description="Browse and manage section templates for your projects."
        actions={
          <div className="flex items-center" style={{ gap: 8 }}>
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
        }}
      >
        {/* Filters */}
        <div style={{ marginBottom: 20 }}>
          <TemplateFiltersBar
            filters={filters}
            onChange={setFilters}
            resultCount={templateList.length}
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div
            className="flex items-center justify-center"
            style={{
              height: 300,
              color: 'var(--text-tertiary)',
              fontSize: 'var(--text-sm)',
            }}
          >
            <Loader2
              size={20}
              className="animate-spin"
              style={{ marginRight: 8, color: 'var(--accent)' }}
            />
            Loading templates...
          </div>
        )}

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
              height: 300,
              border: '1px dashed var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              gap: 12,
            }}
          >
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-tertiary)',
                margin: 0,
              }}
            >
              No templates found. Seed the preset templates to get started.
            </p>
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
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent)';
              }}
            >
              <Download size={14} />
              Seed Preset Templates
            </button>
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
        {templateList.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {templateList.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onSelect={handleSelect}
                onDuplicate={handleDuplicate}
                onDelete={!t.isPreset ? (tpl) => setDeleteTarget(tpl) : undefined}
              />
            ))}
          </div>
        )}
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
    </>
  );
}
